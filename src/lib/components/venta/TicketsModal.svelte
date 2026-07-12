<script lang="ts">
    import { onMount, tick } from "svelte";
    import { PenSolid, TrashBinSolid, EyeSolid } from "flowbite-svelte-icons";
    import ConfirmModal from "../ConfirmModal.svelte";
    import ReceiptPreview from "../../printing/ReceiptPreview.svelte";

    type Ticket = {
        id: number;
        serial: number;
        total: number;
        details: string;
        status?: boolean;
    };

    let {getSoldNumbersForTicket, tickets = $bindable(), numbersSold=$bindable(), onClose} = $props();

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
            const haystack = `${ticket.id} ${ticket.total} ${ticket.details}`.toLowerCase();
            return haystack.includes(normalizedSearch);
            })
        : localTickets
    );

    let soldNumbersTotal = $derived(
        soldNumbersForSelectedTicket.reduce((sum, sold) => sum + (Number(sold.price) || 0), 0)
    );

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
        <div class="tickets-list">
            <h2 class="modal-title">Tiquetes</h2>
            <div class="search-row">
                <label for="ticket-search">Buscar:</label>
                <input
                    id="ticket-search"
                    type="text"
                    placeholder="ID, total o detalle"
                    bind:value={searchTerm}
                />
            </div>

            {#if filteredTickets.length === 0}
                <p>No hay tiquetes para mostrar.</p>
            {:else}
                <table class="tickets-table" onkeydown={handleRowKeydown} role="grid"
                tabindex="0"
                >
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Total</th>
                            <th>Detalle</th>
                            <th>Opciones</th>
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
                                <td>{ticket.id}</td>
                                <td>₡{ticket.total}</td>
                                <td>{ticket.details}</td>
                                <td>
                                    {#if ticket.status === false}
                                        <span class="annulled">Anulado</span>
                                    {:else}
                                        <div class="options-buttons">
                                            <button class="negative" onclick={(e) => {
                                                e.stopPropagation();handleDelete(ticket)}}>
                                                <TrashBinSolid class="shrink-0 h-4 w-4" />
                                            </button>
                                        </div>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
            <button onclick={onClose}>Cerrar</button>
        </div>
        <div class="ticket-sold-numbers">
            {#if selectedTicket}
                <h2 class="modal-title">Tiquete {selectedTicket.id}</h2>
                <ReceiptPreview 
                    receipt={{
                        serial: selectedTicket.serial.toString(),
                        title: "",
                        items: soldNumbersForSelectedTicket.map((sold) => ({
                            number: sold.number,
                            amount: sold.price
                        })),
                        total: soldNumbersTotal,
                        footer: ['* * Gracias por su compra * *', '¡Buena suerte!']
                    }}
                    groupedItems={true}
                    qrData={null}
                    details={selectedTicket.details}
                />
                <button onclick={loadSoldNumbers}>Cargar números vendidos</button>
            {:else}
                <p>Seleccione un tiquete para ver los números vendidos.</p>
            {/if}
    </div>
</div>
</div>

<style>
    .tickets-table {
        margin: 1rem 0;
        background-color: white;
    }

    .tickets-table th {
        background-color: #efefef;
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
        width: 100%;
    }

    .ticket-sold-numbers {
        display: flex;
        border: 1px dashed var(--color-border);
        padding: 1rem;
        flex-direction: column;
        margin-left: 2rem;
        flex: 1;
    }
    
    .ticket-sold-numbers button{
        margin-top: auto;
    }

    .tickets-list {
        flex: 3;
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

</style>
