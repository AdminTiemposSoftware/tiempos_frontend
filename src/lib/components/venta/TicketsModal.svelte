<script lang="ts">
    import { onMount, tick } from "svelte";
    import { TrashBinSolid } from "flowbite-svelte-icons";
    import ConfirmModal from "../ConfirmModal.svelte";

    type Ticket = {
        id: number;
        total: number;
        details: string;
        status?: boolean;
        date?: string;
        serial?: string;
        time?: string;
    };

    let {getSoldNumbersForTicket, tickets = $bindable(), numbersSold=$bindable(), onClose, onPDFPrint} = $props();

    let localTickets: Ticket[] = [...tickets];
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
            localTickets = [...tickets];
            lastTicketsRef = tickets;
        }
    });

    let normalizedSearch = $derived(searchTerm.trim().toLowerCase());
    
    let filteredTickets = $derived(
        normalizedSearch
        ? localTickets.filter((ticket) => {
            const haystack = `${ticket.id} ${ticket.serial ?? ''} ${ticket.total} ${ticket.details}`.toLowerCase();
            return haystack.includes(normalizedSearch);
            })
        : localTickets
    );

    let soldNumbersTotal = $derived(
        soldNumbersForSelectedTicket.reduce((sum, sold) => sum + (Number(sold.price) || 0), 0)
    );

    let groupedSoldNumbers = $derived(() => {
        const groups = new Map<number, string[]>();
        for (const sold of soldNumbersForSelectedTicket) {
            const price = Number(sold.price) || 0;
            if (!groups.has(price)) {
                groups.set(price, []);
            }
            groups.get(price)?.push(String(sold.number));
        }

        return Array.from(groups.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([price, numbers]) => ({
                price,
                numbersText: numbers.join(" x ") + " x"
            }));
    });

    function formatMoney(value: number) {
        if (!Number.isFinite(value)) {
            return '0.00';
        }
        return value.toFixed(2);
    }

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
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            selectedRowIndex =
                (selectedRowIndex - 1 + filteredTickets.length) % filteredTickets.length;
            void focusSelectedRow();
        }
        if (event.key === "Enter") {
            event.preventDefault();
            const ticket = filteredTickets[selectedRowIndex];
            if (ticket) {
                handleView(ticket);
            }
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
        numbersSold = soldNumbersForSelectedTicket;
        onClose();
    }

    function getTicketPosition(ticket: Ticket) {
        const index = localTickets.findIndex((item) => item.id === ticket.id);
        return index >= 0 ? index + 1 : null;
    }

    function handlePDFPrint() {
        if (!selectedTicket || !onPDFPrint) {
            return;
        }
        onPDFPrint(selectedTicket, soldNumbersForSelectedTicket, getTicketPosition(selectedTicket));
    }
</script>

<ConfirmModal
    bind:showModal={showDeleteConfirm}
    message={ticketToDelete ? `Eliminar ticket ${ticketToDelete.id}?` : "Eliminar ticket?"}
    confirmText="Eliminar"
    confirm={confirmDelete}
/>

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
        <header>
            <h1 class="title">Tiquetes</h1>
            <button onclick={onClose} aria-label="Cerrar">Buscar en otros sorteos (Jalar papel)</button>
        </header>

        <div class="modal-body">
            <section class="tickets-panel">
                <div class="search-row">
                    <label for="ticket-search">Buscar</label>
                    <input
                        id="ticket-search"
                        type="text"
                        placeholder="ID, serial, total o detalle"
                        bind:value={searchTerm}
                    />
                </div>

                {#if filteredTickets.length === 0}
                    <p class="empty-state">No hay tiquetes para mostrar.</p>
                {:else}
                    <div 
                        class="table-wrap table-scroll table-scroll--rows" 
                        onkeydown={handleRowKeydown} 
                        tabindex="0"
                        role="button"
                    >
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Hora</th>
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
                                        <td title={`ID ${ticket.id}`}>{filteredTickets.length - index}</td>
                                        <td>{ticket.time ?? 'Sin hora'}</td>
                                        <td>₡{formatMoney(Number(ticket.total) || 0)}</td>
                                        <td>{ticket.details || 'Sin detalle'}</td>
                                        <td>
                                            {#if ticket.status !== false}
                                                <button
                                                    class="negative"
                                                    onclick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(ticket);
                                                    }}
                                                    aria-label="Eliminar ticket"
                                                >
                                                    <TrashBinSolid class="shrink-0 h-4 w-4" />
                                                </button>
                                            {/if}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </section>

            <section class="ticket-sold-numbers">
                <div class="details-header">
                    {#if selectedTicket}
                        <h3>
                            Tiquete {selectedTicket.id}
                            {selectedTicket.serial ? `${selectedTicket.serial}` : ''}
                    </h3>
                        {:else}
                        <h3 class="no-selection">Selecciona un tiquete</h3>
                        {/if}
                </div>
                <ul class="sold-list" aria-label="Numeros vendidos">
                    {#if selectedTicket}
                        {#each groupedSoldNumbers() as group}
                            <li class="sold-row">
                                <span class="sold-number">{group.numbersText}</span>
                                <span class="sold-dots" aria-hidden="true"></span>
                                <span class="sold-price">₡{formatMoney(group.price)}</span>
                            </li>
                        {/each}
                    {/if}
                </ul>
                {#if selectedTicket}
                    <div class="sold-total">
                        <span>Total</span>
                        <span>₡{formatMoney(soldNumbersTotal)}</span>
                    </div>
                    
                <button
                    onclick={handlePDFPrint}
                    disabled={soldNumbersForSelectedTicket.length === 0}
                >
                    Imprimir PDF
                </button>
                <button
                    onclick={loadSoldNumbers}
                    disabled={soldNumbersForSelectedTicket.length === 0}
                >
                    Cargar
                </button>
                {/if}
            </section>
        </div>
    </div>
</div>

<style>
    .modal {
        display: flex;
        flex-direction: column;
        max-width: 920px;
        min-height: 500px;
        width: 100%;
        gap: 1.5rem;
    }

    .modal-body {
        display: flex;
        flex: 1;
        gap: 1.5rem;
        flex-direction: row;
    }

    .tickets-panel,
    .ticket-sold-numbers {
        background: rgba(255, 255, 255, 0.75);
        border: 1px solid rgba(0, 0, 0, 0.08);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    
    .tickets-panel {
        align-items: start;
        justify-content: start;
        flex: 2;
    }
    .ticket-sold-numbers {
        flex: 1;
        align-items: stretch;
    }

    .search-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
    }

    .table-wrap {
        border: none;
    }

    .search-row input {
        flex: 1;
    }

    .table-wrap {
        max-height: 360px;
    }

    .selected-row {
        outline: 2px solid var(--color-theme-1);
        outline-offset: -2px;
    }

    .details-header h3 {
        margin: 0.25rem 0 0;
        font-size: 1.25rem;
    }

    .sold-list {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        max-height: 250px;
        overflow: auto;
    }

    .sold-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.5rem;
    }

    .sold-number,
    .sold-price {
        font-weight: 600;
    }

    .sold-dots {
        border-bottom: 2px dotted rgba(0, 0, 0, 0.2);
        height: 0;
    }

    .sold-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(0, 0, 0, 0.08);
        font-weight: 600;
    }

    .no-selection {
        text-align: center;
        color: #aaa;
    }

    .empty-state {
        color: #ccc;
        margin: 0.5rem 0;
    }

    .inactive {
        background-color: #fdecec;
        color: #7a1e1e;
    }
</style>
