<script lang="ts">
    import { PenSolid, TrashBinSolid, EyeSolid } from "flowbite-svelte-icons";
    import ConfirmModal from "../ConfirmModal.svelte";

    type Ticket = {
        id: number;
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

    function handleEdit(ticket: Ticket) {
        // TODO Implement edit functionality
        alert(`Editar ticket ${ticket.id}`);
    }

    function handleDelete(ticket: Ticket) {
        ticketToDelete = ticket;
        showDeleteConfirm = true;
    }

    function handleView(ticket: Ticket) {
        soldNumbersForSelectedTicket = getSoldNumbersForTicket(ticket.id);
        selectedTicket = ticket;
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
            <h2>Tiquetes</h2>
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
                <table class="tickets-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Total</th>
                            <th>Detalle</th>
                            <th>Opciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each filteredTickets as ticket}
                            <tr class:inactive={ticket.status === false}>
                                <td>{ticket.id}</td>
                                <td>₡{ticket.total}</td>
                                <td>{ticket.details}</td>
                                <td>
                                    {#if ticket.status === false}
                                        <span class="annulled">Anulado</span>
                                    {:else}
                                        <div class="options-buttons">
                                            <!-- TODO : This function shouldnt be necesary
                                            <button class="neutral" onclick={() => handleEdit(ticket)}>
                                                <PenSolid class="shrink-0 h-4 w-4" />
                                            </button> -->
                                            <button class="negative" onclick={() => handleDelete(ticket)}>
                                                <TrashBinSolid class="shrink-0 h-4 w-4" />
                                            </button>
                                            <button onclick={() => handleView(ticket)}>
                                                <EyeSolid class="shrink-0 h-4 w-4" />
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
            <h2>
                Numeros vendidos del tiquete
                {#if selectedTicket}
                    {selectedTicket.id}
                {/if}
            </h2>
            <table class="tickets-table">
                <thead>
                    <tr>
                        <th>Numero</th>
                        <th>Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {#if selectedTicket}
                        {#each soldNumbersForSelectedTicket as sold}
                            <tr>
                                <td>{sold.number}</td>
                                <td>₡{sold.price}</td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
            <button 
                onclick={loadSoldNumbers}
                disabled={soldNumbersForSelectedTicket.length === 0}
            >
                Cargar Numeros Vendidos
            </button>
        </div>
    </div>
</div>

<style>
    h2 {
        
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        margin-right: auto;
    }

    .tickets-table {
        margin: 1rem 0;
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
        margin-left: 2rem;
        flex: 1;
    }

    .tickets-list {
        flex: 3;
    }

    .inactive {
        background-color: #fdecec;
        color: #7a1e1e;
    }

    .annulled {
        font-weight: 600;
    }

</style>
