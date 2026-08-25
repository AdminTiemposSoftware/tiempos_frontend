<script lang="ts">
    import { onMount, tick } from "svelte";
    import ReceiptPreview from "../../printing/ReceiptPreview.svelte";
    import { serializeData, formatAmount } from '../../printing/printing';

    let {
        showTicketModal = $bindable(false),
        tickets = $bindable(),
        numbersSold=$bindable()
    } = $props();


    type WinnerTicketRow = {
        date: string;
        detail: string;
        branch_name: string;
        draw_name: string;
        draw_schedule_name: string;
        enabled: boolean;
        is_megareventado: boolean;
        is_reventado: boolean;
        multiplier: number;
        numbersSold: Record<number, number>;
        paid: boolean;
        paid_by: string;
        printed_at: string;
        relative_id: number;
        serial: string;
        time: string;
        username: string;
        winner_number: number;
        total: number;
    };

    let lastTicketsRef = tickets;
    let selectedTicket = $state<WinnerTicketRow | null>(null);
    let soldNumbersForSelectedTicket = $state<Record<number, number>>({});
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

    let soldNumbersTotal = $derived(Object.values(soldNumbersForSelectedTicket).reduce((sum, sold) => sum + (Number(sold) || 0), 0));

    $effect(() => {
        if (tickets?.length === 0) {
            selectedRowIndex = 0;
            return;
        }
        if (selectedRowIndex >= tickets?.length) {
            selectedRowIndex = 0;
        }
        void focusSelectedRow();
    });

    onMount(() => {
        void focusSelectedRow();
    });

    function handleView(ticket: WinnerTicketRow) {
        soldNumbersForSelectedTicket = ticket.numbersSold;
        qrData = serializeData(soldNumbersForSelectedTicket, ticket.serial);
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

    function handleKeyInput(event: KeyboardEvent) {
        switch (event.key) {
            case "Enter":
                if (!showTicketModal) {
                    return;
                }
                const ticket = tickets[selectedRowIndex];
                if (ticket) {
                    handleView(ticket);
                }
                break;
        }
    }

    function onClose() {
        showTicketModal = false;
        selectedTicket = null;
    }
</script>

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

            {#if tickets?.length === 0}
                <p class="no-tickets">No hubieron tiquetes ganadores en este sorteo.</p>
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
                            <th>Pagado</th>
                            <th>Por</th>
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
                                class={ticket.paid ? 'paid' : ''}
                            >
                                <td>{ticket.relative_id}</td>
                                <td>₡{ticket.total}</td>
                                <td>{ticket.details}</td>
                                <td>{ticket.paid ? 'Sí' : 'No'}</td>
                                <td>{ticket.paid_by ? ticket.paid_by : 'N/A'}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            {#if selectedTicket}
            <div class="winner-information">
					<div class="information-item">
						<span>Número ganador</span>
						<strong>{selectedTicket?.winner_number}</strong>
					</div>

					<div class="information-item">
						<span>Monto</span>
						<strong>
							{formatAmount(
								selectedTicket?.numbersSold[selectedTicket?.winner_number] || 0
							)}
						</strong>
					</div>

					<div class="information-item">
						<span>Multiplicador</span>
						<strong>x{selectedTicket?.multiplier}</strong>
					</div>

					<div class="information-item total">
						<span>Total a pagar</span>
						<strong>
							{formatAmount(
								(selectedTicket?.numbersSold[selectedTicket?.winner_number] || 0) * selectedTicket?.multiplier
							)}
						</strong>
					</div>
				</div>
				{/if}
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
                                `${selectedTicket.draw_name} ${selectedTicket.draw_schedule_name}`,
                                selectedTicket.branch_name,
                                selectedTicket.username,
                                `Fecha: ${selectedTicket.date}`,
                                `Hora: ${selectedTicket.time.slice(0, 8)}`
                            ],
                            items: Object.entries(soldNumbersForSelectedTicket).map(([number, price]) => ({
                                number,
                                amount: price
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
                        details={selectedTicket.detail}
                    />
                </div>

            {:else}
                <p>Seleccione un tiquete para ver los números vendidos.</p>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>

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
        max-height: 490vh;
        width: 50vw;
        margin-left: 15vw;
    }

    .ticket-sold-numbers {
        display: flex;
        border: 1px dashed var(--color-border);
        padding: 1rem;
        flex-direction: row;
        gap: 2rem;
        margin-left: 2rem;
        flex: 1;
        align-items: center;
        justify-content: center;
    }

    .ticket-scroll{
        max-height: 40vh;
        overflow-y: auto;
    }

    .tickets-list {
        display: flex;
        flex-direction: column;
        flex: 1;
        justify-content: space-between;
        position: relative;
    }

    .paid {
        background-color: #fdecec;
        color: #7a1e1e;
    }

    .selected-row {
        outline: 2px solid #2563eb;
        outline-offset: -2px;
    }

	.winner-information {
		display: flex;
		flex-direction: column;
		bottom: 0;
		width: 100%;
	}

	.information-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
	}

	.information-item span {
		font-size: 0.9rem;
		opacity: 0.75;
	}

	.information-item strong {
		font-size: 0.9rem;
	}
</style>
