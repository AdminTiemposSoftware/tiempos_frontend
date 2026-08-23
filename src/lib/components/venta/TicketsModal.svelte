<script lang="ts">
    import { auth } from '../../stores/auth';
    import { onMount, tick } from "svelte";
    import { acts } from '@tadashi/svelte-notification';
    import ConfirmModal from "../ConfirmModal.svelte";
    import ReceiptPreview from "../../printing/ReceiptPreview.svelte";
    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { total } from "../../stores/UpdateSellMatrix";

    type Ticket = {
        id: number;
        relative_id: number;
        username: string;
        serial: number;
        date: string;
        time: string;
        scheduleName: string;
        scheduleTime: string;
        drawName: string;
        branchName: string;
        total: number;
        details: string;
        printed_at: string;
        multiplier: string;
        status?: boolean;
    };

    let {
        showTicketModal = $bindable(false),
        getSoldNumbersForTicket,
        tickets = $bindable(),
        numbersSold=$bindable()
    } = $props();

    let lastTicketsRef = tickets;
    let showDeleteConfirm = $state(false);
    let ticketToDelete = $state<Ticket | null>(null);
    let selectedTicket = $state<Ticket | null>(null);
    let soldNumbersForSelectedTicket = $state<{number: string, price: number}[]>([]);
    let qrData = $state<string>('');
    let selectedRowIndex = $state(0);
    let rowRefs: Array<HTMLTableRowElement | null> = [];
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
	const today = utcMinus6Date.toISOString().split('T')[0];

    $effect(() => {
        if (tickets !== lastTicketsRef) {
            lastTicketsRef = tickets;
        }
    });

    let soldNumbersTotal = $derived(soldNumbersForSelectedTicket.reduce((sum, sold) => sum + (Number(sold.price) || 0), 0));

    $effect(() => {
        if (tickets.length === 0) {
            selectedRowIndex = 0;
            return;
        }
        if (selectedRowIndex >= tickets.length) {
            selectedRowIndex = 0;
        }
        void focusSelectedRow();
    });

    onMount(() => {
        void focusSelectedRow();
    });

    async function handleDelete(ticket: Ticket) {
        ticketToDelete = ticket;
        soldNumbersForSelectedTicket = getSoldNumbersForTicket(ticket.id);
        showDeleteConfirm = true;
    }

    function handleView(ticket: Ticket) {
        soldNumbersForSelectedTicket = getSoldNumbersForTicket(ticket.id);
        qrData = serializeData(soldNumbersForSelectedTicket);
        selectedTicket = ticket;
    }

    async function focusSelectedRow() {
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLInputElement) {
            return;
        }
        await tick();
        const row = rowRefs[selectedRowIndex];
        row?.focus();
    }

    function handleRowKeydown(event: KeyboardEvent) {
        if (tickets.length === 0) {
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            selectedRowIndex = (selectedRowIndex + 1) % tickets.length;
            void focusSelectedRow();
            const ticket = tickets[selectedRowIndex];
            if (ticket) {
                handleView(ticket);
            }
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            selectedRowIndex = (selectedRowIndex - 1 + tickets.length) % tickets.length;
            void focusSelectedRow();
            const ticket = tickets[selectedRowIndex];
            if (ticket) {
                handleView(ticket);
            }
        }
        if (event.key === "Enter") {
            event.preventDefault();
        }
    }

    async function confirmDelete() {
        if (!ticketToDelete) return;

        try {
            const response = await fetch(`/puesto/venta/tickets/${ticketToDelete.serial}`, { method: 'DELETE', });
            if (!response.ok) {
                acts.add({
                    message: "Error al eliminar el tiquete.",
                    mode: 'error',
                    lifetime: 3
                })
                return;
            }

            tickets = tickets.map(item =>
                item.id === ticketToDelete?.id
                    ? { ...item, status: false }
                    : item
            );
            if (ticketToDelete.date === today) {
                sellingMatrix.update((matrix) => {
                    for (const soldNumber of soldNumbersForSelectedTicket) {
                        matrix[soldNumber.number] = (matrix[soldNumber.number] || 0) - soldNumber.price;
                    }
                    return matrix;
                });
                total.update((n) => n - Object.values(soldNumbersForSelectedTicket).reduce((sum, item) => sum + item.price, 0));
            }
            ticketToDelete = null;
        } catch (error) {
            acts.add({
                message: "Error al eliminar el tiquete.",
                mode: 'error',
                lifetime: 3 });
            console.error(error);
        }
    }

    function loadSoldNumbers() {
        numbersSold = soldNumbersForSelectedTicket.reduce<Record<string, { price: number }>>(
            (accumulator, sold) => {
                accumulator[sold.number] = { price: sold.price };
                return accumulator;
            },
            {}
        );
        onClose();
    }

    function serializeData(data: {number: string, price: number}[]): string {
        const serialHex = selectedTicket?.serial
            ? BigInt(selectedTicket.serial).toString(16).toUpperCase()
            : '';
        const count = data.length;

        if (count >= 25) return '';
        return Object.entries(data)
            .sort(([leftNumber], [rightNumber]) => Number(leftNumber) - Number(rightNumber))
            .map(([number, item]) => {
                const numberHex = Number(item.number).toString(16).toUpperCase().padStart(2, '0');
                const priceHex = Number(item.price).toString(16).toUpperCase().padStart(6, '0');

                return `${numberHex}${priceHex}`;
            })
            .join('') + serialHex;
    }

    function handleKeyInput(event: KeyboardEvent) {
        switch (event.key) {
            case "Enter":
                if (!showTicketModal) {
                    return;
                }
                if (selectedTicket) {
                    loadSoldNumbers();
                } else {
                    const ticket = tickets[selectedRowIndex];
                    if (ticket) {
                        handleView(ticket);
                    }
                }
                break;
        }
    }

    function onClose() {
        showTicketModal = false;
        selectedTicket = null;
    }
</script>

<ConfirmModal
    bind:showModal={showDeleteConfirm}
    message={ticketToDelete ? `Eliminar tiquete ${ticketToDelete.serial}?` : "Eliminar ticket?"}
    confirmText="Eliminar"
    confirm={confirmDelete}
/>


<svelte:window onkeydown={handleKeyInput} />
{#if showTicketModal}
<div
    class="modal-backdrop"
    role="button"
    onclick={onClose}
    onkeydown={(e) => e.key === "Escape" && onClose()}
    tabindex="0"
>
    <div
        class="modal"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
    >
        <div class="tickets-list">

            {#if tickets.length === 0}
                <p class="no-tickets">No hay tiquetes para mostrar.</p>
            {:else}
            <div class="ticket-scroll scroll-thin">
                <table class="tickets-table" onkeydown={handleRowKeydown} role="grid"
                tabindex="0"
                >
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Total</th>
                            <th>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each tickets as ticket, index}
                            <tr
                                bind:this={rowRefs[index]}
                                tabindex="0"
                                class:inactive={ticket.status === false}
                                class:selected-row={index === selectedRowIndex}
                                onclick={() => {
                                    selectedRowIndex = index;
                                    handleView(ticket);
                                }}
                            >
                                <td>{ticket.relative_id}</td>
                                <td>₡{ticket.total}</td>
                                <td>{ticket.details}</td>
                                <td>
                                    {#if ticket.status === false}
                                        <span class="annulled">Anulado</span>
                                    {:else}
                                        <div class="options-buttons">
                                            <button class="negative" onclick={(e) => {
                                                e.stopPropagation();handleDelete(ticket)}}>
                                                X
                                            </button>
                                        </div>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            {/if}
        </div>
        <div class="ticket-sold-numbers">
            {#if selectedTicket}
                <div class="receipt-container scroll-thin">
                    <!-- TODO: This component doesnt render the QR code correctly as it leaves the QR from the first ticket for all tickets -->
                    <ReceiptPreview
                        receipt={{
                            serial: `${selectedTicket.serial.toString()}`,
                            title: "",
                            subtitles: [
                                `${selectedTicket.drawName} ${selectedTicket.scheduleName}`,
                                selectedTicket.branchName,
                                selectedTicket.username,
                                `Fecha: ${selectedTicket.date}`,
                                `Hora: ${selectedTicket.time.slice(0, 8)}`
                            ],
                            items: soldNumbersForSelectedTicket.map((sold) => ({
                                number: sold.number,
                                amount: sold.price
                            })),
                            total: soldNumbersTotal,
                            footer: [
                                "------- ATENCION -------",
                                selectedTicket.multiplier ? `El primero paga al: ${selectedTicket.multiplier}` : '',
                                "------------------------",
                                'Gracias por su compra',
                                '¡Buena suerte!'
                            ],
                            ticket_number: (selectedTicket.relative_id).toString().padStart(3, '0')
                        }}
                        groupedItems={true}
                        bind:qrData={qrData}
                        details={selectedTicket.details}
                    />
                </div>
                <button onclick={loadSoldNumbers}>Cargar tiquete (Enter)</button>
            {:else}
                <p>Seleccione un tiquete para ver los números vendidos.</p>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .tickets-table {
        margin: 1rem 0 3rem 0;
        background-color: white;
    }

    .no-tickets {
        text-align: center;
        font-size: 1.2rem;
    }

    .tickets-table th {
        background-color: #efefef;
    }

    .tickets-table td {
        padding: 4px 8px;
    }

    .modal {
        display: flex;
        flex-direction: row;
        max-width: 800px;
        max-height: 490vh;
        width: 100%;
    }

    .ticket-sold-numbers {
        display: flex;
        border: 1px dashed var(--color-border);
        padding: 1rem;
        flex-direction: column;
        margin-left: 2rem;
        flex: 1;
        align-items: center;
    }

    .ticket-sold-numbers button{
        margin-top: auto;
        width: 100%;
        margin-top: 1rem;
    }

    .ticket-scroll{
        max-height: 380px;
        overflow-y: auto;
    }

    .tickets-list {
        flex: 2;
        position: relative;
    }

    .inactive {
        background-color: #fdecec;
        color: #7a1e1e;
    }

    .selected-row {
        outline: 2px solid #2563eb;
        outline-offset: -2px;
    }

    .annulled {
        font-weight: 600;
    }

    .options-buttons button{

        width: 100%;
    }

</style>
