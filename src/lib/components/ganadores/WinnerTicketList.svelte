<script lang="ts">
    import { onMount, tick } from "svelte";
    import { formatAmount } from '../../printing/printing';
    import TicketPreviewModal from '../venta/TicketPreviewModal.svelte';

    let {
        tickets = $bindable()
    } = $props();


    type WinnerTicketRow = {
        date: string;
        details: string;
        branch_name: string;
        draw_name: string;
        draw_schedule_name: string;
        enabled: boolean;
        is_megareventado: boolean;
        is_reventado: boolean;
        multiplier: number;
        numbersSold: Record<number, number>;
        numberFlags: Record<number, {
            is_reventado: boolean;
            is_megareventado: boolean;
        }>;
        paid: boolean;
        paid_by: string;
        printed_at: string;
        relative_id: number;
        serial: string;
        time: string;
        username: string;
        winner_number: number | null;
        total: number;
        status?: boolean;
    };

    let lastTicketsRef = tickets;
    let selectedTicket = $state<WinnerTicketRow | null>(null);
    let showTicketPreviewModal = $state(false);
    let selectedRowIndex = $state(0);
    let rowRefs: Array<HTMLTableRowElement | null> = [];

    $effect(() => {
        if (tickets !== lastTicketsRef) {
            lastTicketsRef = tickets;
        }
    });

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
        selectedTicket = ticket;
        showTicketPreviewModal = true;
    }

    function getWinningAmount(ticket: WinnerTicketRow): number {
        if (ticket.winner_number === null) {
            return 0;
        }
        return Number(ticket.numbersSold[ticket.winner_number] ?? 0);
    }

    function getWinningTotal(ticket: WinnerTicketRow): number {
        return getWinningAmount(ticket) * Number(ticket.multiplier || 0);
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
                const ticket = tickets[selectedRowIndex];
                if (ticket) {
                    handleView(ticket);
                }
                break;
        }
    }
</script>

<svelte:window onkeydown={handleKeyInput} />

<div class="tickets-list">

    {#if tickets?.length === 0}
        <p class="no-tickets">No hubieron tiquetes ganadores segun los filtros seleccionados.</p>
    {:else}
    <div class="ticket-scroll scroll-thin">
        <table class="tickets-table" onkeydown={handleRowKeydown} role="grid" tabindex="0">
            <thead>
            <tr>
                <th>Serial</th>
                <th>Detalle</th>
                <th>Pagado</th>
                <th>Por</th>
                <th>Número ganador</th>
                <th>Monto</th>
                <th>x</th>
                <th>Monto a pagar</th>
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
                    <td>{ticket.serial}</td>
                    <td>{ticket.details}</td>
                    <td>{ticket.paid ? 'Sí' : 'No'}</td>
                    <td>{ticket.paid_by ? ticket.paid_by : 'N/A'}</td>
                    <td>{ticket.winner_number ?? 'N/A'}</td>
                    <td>{formatAmount(getWinningAmount(ticket))}</td>
                    <td>x{ticket.multiplier}</td>
                    <td>{formatAmount(getWinningTotal(ticket))}</td>
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
    {/if}
</div>
<TicketPreviewModal
    bind:showTicketPreviewModal={showTicketPreviewModal}
    winnerTicket={selectedTicket}
    showPrintButton={false}
/>

<style>
    .no-tickets {
        margin: auto;
        text-align: center;
        font-size: 1.2rem;
    }

    td {
        background-color: white;
    }

    .ticket-scroll{
        max-height: 60vh;
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

</style>
