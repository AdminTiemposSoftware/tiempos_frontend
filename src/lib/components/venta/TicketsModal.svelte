<script lang="ts">
    import { auth } from '../../stores/auth';
    import { onMount, tick } from "svelte";
    import ConfirmModal from "../ConfirmModal.svelte";
    import ReceiptPreview from "../../printing/ReceiptPreview.svelte";

    type Ticket = {
        id: number;
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
        numbersSold=$bindable(), 
        onClose
    } = $props();

    let localTickets: Ticket[] = $state([]);
    let lastTicketsRef = tickets;
    let showDeleteConfirm = $state(false);
    let ticketToDelete = $state<Ticket | null>(null);
    let searchTerm = $state("");
    let selectedTicket = $state<Ticket | null>(null);
    let soldNumbersForSelectedTicket = $state<{number: string, price: number}[]>([]);
    let selectedRowIndex = $state(0);
    let rowRefs: Array<HTMLTableRowElement | null> = [];

    $effect(() => {
        if (tickets !== lastTicketsRef) {
            localTickets = tickets;
            lastTicketsRef = tickets;
        }
    });

    let normalizedSearch = $derived(searchTerm.trim().toLowerCase());
    
    let filteredTickets = $derived(
        normalizedSearch
        ? localTickets.filter((ticket) => {
            const haystack = `${ticket.id} ${ticket.total} ${ticket.details}`.toLowerCase();
            return haystack.includes(normalizedSearch);
            })
        : localTickets
    );

    let soldNumbersTotal = $derived(soldNumbersForSelectedTicket.reduce((sum, sold) => sum + (Number(sold.price) || 0), 0));

    $effect(() => {
        if (filteredTickets.length === 0) {
            selectedRowIndex = 0;
            return;
        }
        if (selectedRowIndex >= filteredTickets.length) {
            selectedRowIndex = 0;
        }
        void focusSelectedRow();
    });

    onMount(() => {
        void focusSelectedRow();
    });

    function handleDelete(ticket: Ticket) {
        ticketToDelete = ticket;
        showDeleteConfirm = true;
    }

    function handleView(ticket: Ticket) {
        soldNumbersForSelectedTicket = getSoldNumbersForTicket(ticket.id);
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
        if (filteredTickets.length === 0) {
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            selectedRowIndex = (selectedRowIndex + 1) % filteredTickets.length;
            void focusSelectedRow();
            const ticket = filteredTickets[selectedRowIndex];
            if (ticket) {
                handleView(ticket);
            }
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            selectedRowIndex = (selectedRowIndex - 1 + filteredTickets.length) % filteredTickets.length;
            void focusSelectedRow();
            const ticket = filteredTickets[selectedRowIndex];
            if (ticket) {
                handleView(ticket);
            }
        }
        if (event.key === "Enter") {
            event.preventDefault();
        }
    }

    function confirmDelete() {
        if (!ticketToDelete) {
            return;
        }
        localTickets = localTickets.map((ticket) =>
            ticket.id === ticketToDelete?.id
                ? { ...ticket, status: false }
                : ticket
        );
        ticketToDelete = null;
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

        return Object.entries(data)
            .sort(([leftNumber], [rightNumber]) => Number(leftNumber) - Number(rightNumber))
            .map(([number, item]) => {
                const numberHex = Number(item.number).toString(16).toUpperCase().padStart(2, '0');
                const priceHex = Number(item.price).toString(16).toUpperCase().padStart(6, '0');

                return `${numberHex}${priceHex}`;
            })
            .join('') + serialHex;
    }

</script>

<ConfirmModal
    bind:showModal={showDeleteConfirm}
    message={ticketToDelete ? `Eliminar ticket ${ticketToDelete.id}?` : "Eliminar ticket?"}
    confirmText="Eliminar"
    confirm={confirmDelete}
/>
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

            {#if filteredTickets.length === 0}
                <p>No hay tiquetes para mostrar.</p>
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
                        {#each filteredTickets as ticket, index}
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
                                <td>{filteredTickets.length - index}</td>
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
                    <ReceiptPreview 
                        receipt={{
                            serial: `${selectedTicket.serial.toString()}`,
                            title: "",
                            subtitles: [
                                `${selectedTicket.drawName} ${selectedTicket.scheduleName}`, 
                                selectedTicket.branchName, `Fecha: ${selectedTicket.date}`, 
                                `Hora: ${selectedTicket.printed_at.slice(0, 8)}` 
                            ],
                            items: soldNumbersForSelectedTicket.map((sold) => ({
                                number: sold.number,
                                amount: sold.price
                            })),
                            total: soldNumbersTotal,
                            footer: [
                                "----------ATENCION----------", 
                                selectedTicket.multiplier ? `El primero paga al: ${selectedTicket.multiplier}` : '',
                                "----------------------------",
                                '* * Gracias por su compra * *',
                                '¡Buena suerte!'
                            ],
                            ticket_number: selectedTicket.id.toString().padStart(3, '0')
                        }}
                        groupedItems={true}
                        qrData={serializeData(soldNumbersForSelectedTicket)}
                        details={selectedTicket.details}
                    />
                </div>
                <button onclick={loadSoldNumbers}>Cargar números vendidos</button>
            {:else}
                <p>Seleccione un tiquete para ver los números vendidos.</p>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .tickets-table {
        margin: 1rem 0;
        background-color: white;
    }

    .tickets-table th {
        background-color: #efefef;
    }

    .tickets-table td {
        padding: 4px 8px;
    }

    .search-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0 1rem;
    }

    .search-row input {
        flex: 1;
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
