<script lang="ts">    
	import {Notifications, acts} from '@tadashi/svelte-notification'

    import { auth } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import TicketsWinnerModal from '$lib/components/venta/TicketsWinnerModal.svelte';
    
    let { data } = $props();
    
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let selectedDate = $state(utcMinus6Date.toISOString().split('T')[0]);
    let showTicketsModal = $state(false);
    let ticketHeaders = $state<TicketHeader[]>([]);
    let ticketDetails = $state<TicketDetail[]>([]);
    let winners = $state<Winner[]>([]);
    let selectedWinner = $state<Winner | null>(null);
    
    type Winner = {
        date: string;
        draw_id: number;
        draw_is_megareventado: boolean;
        draw_is_reventado: boolean;
        draw_schedule_name: string;
        position_id: number;
        position_number: number;
        position_multiplier: number;
        schedule_id: number;
        schedule_time: string;
        winner_id: number;
        winner_number: number;
    };

    type TicketHeader = {
        id: number;
        serial: string;
        amount: string | number;
        time: string;
        date: string;
        detail: string | null;
        enabled: boolean;
    };

    type TicketDetail = {
        ticket_header_serial: string;
        number: number;
        amount: string | number;
        is_reventado: boolean;
        is_megareventado: boolean;
    };

    $effect(() => {
        void goto(`?date=${selectedDate}`, {
            replaceState: true,
            noScroll: true,
            keepFocus: true
        });
    });
        
    $effect(() => {
        const items = Array.isArray(data?.items) ? data.items : [];
        winners = items.map((item: any) => ({
            date: item.date,
            draw_id: item.draw_id,
            draw_is_megareventado: item.draw_is_megareventado,
            draw_is_reventado: item.draw_is_reventado,
            draw_schedule_name: `${item.draw_name} ${item.schedule_name}`,
            position_id: item.position_id,
            position_number: item.position_number,
            position_multiplier: item.position_multiplier,
            schedule_id: item.schedule_id,
            schedule_time: item.schedule_time,
            winner_id: item.winner_id,
            winner_number: item.winner_number
        }));
    });

    function isValidTime(winner: Winner){
        if (winner.date === utcMinus6Date.toISOString().split('T')[0]) {
            if (winner.schedule_time > utcMinus6Date.toISOString().split('T')[1].split('.')[0]) {
                return false;
            }
            return true;
        } else if (winner.date < utcMinus6Date.toISOString().split('T')[0]) {
            return true;
        }
        return false;
    }

    async function viewTickets(winner: Winner) {
        selectedWinner = winner;
        ticketHeaders = await getTickets(winner);
        showTicketsModal = true;
    }

    async function getTickets(winner: Winner): Promise<TicketHeader[]> {
        const url = new URL('/puesto/venta/tickets/winner', window.location.origin);
        url.searchParams.set('winner_id', String(winner.winner_id));

        const response = await fetch(url.toString(), { method: 'GET' });
        if (!response.ok) {
            ticketHeaders = [];
            ticketDetails = [];
            return ticketHeaders;
        }

        const payload = await response.json().catch(() => null);
        const items = Array.isArray(payload?.items) ? (payload.items as TicketHeader[]) : [];
        const details = Array.isArray(payload?.details) ? (payload.details as TicketDetail[]) : [];

        ticketHeaders = items.map((item) => ({
            id: item.id,
            serial: item.serial,
            amount: Number(item.amount) || 0,
            detail: item.detail ?? '',
            time: item.time ?? '',
            date: item.date ?? '',
            enabled: item.enabled
        }));
        ticketDetails = details;

        return ticketHeaders;
    }

    function getSoldNumbersForTicket(ticketId: number) {
        const ticket = ticketHeaders.find((item) => item.id === ticketId);
        if (!ticket) {
            return [];
        }

        return ticketDetails
            .filter((detail) => detail.ticket_header_serial === ticket.serial)
            .map((detail) => ({
                number: String(detail.number).padStart(2, '0'),
                price: Number(detail.amount) || 0
            }));
    }

    function closeTicketsModal() {
        showTicketsModal = false;
        ticketHeaders = [];
        ticketDetails = [];
    }
</script>

<svelte:head>
	<title>Ganadores</title>
</svelte:head>

{#if showTicketsModal}
    <TicketsWinnerModal 
        ticketHeaders={ticketHeaders} 
        ticketDetails={ticketDetails}
        onClose={closeTicketsModal} 
        getSoldNumbersForTicket={getSoldNumbersForTicket}
        winner={selectedWinner}
    />
{/if}
{#if ['branch'].includes($auth.user?.role ?? '')}
<section class="ganadores">
    <header class="header-banking">
        <div class="header-title">
            <div>
                <h1 class="title">Ganadores</h1>
                <p class="subtitle">Asigna el numero ganador por sorteo.</p>
            </div>
        </div>
        <div class="filters">
            <div class="field">
                <label for="desde">Fecha</label>
                <input id="desde" type="date" bind:value={selectedDate} />
            </div>
        </div>
    </header>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Sorteo</th>
                    <th>Multiplicador</th>
                    <th>Ganador</th>
                    <th>Tiquetes</th>
                </tr>
            </thead>
            <tbody>
                {#each winners as winner}
                    <tr>
                        <td>
                            {winner.date ? winner.date.split('T')[0].split('-').reverse().join('/') : ''}
                        </td>                        
                        <td>{winner.draw_schedule_name} {winner.position_number === 2 ? "reventado" : ""} ({winner.schedule_time})</td>
                        <td>{winner.position_multiplier} </td>
                        <td>
                            {#if winner.position_multiplier !== null}
                                {#if winner.winner_number !== null}
                                    {winner.winner_number}
                                {:else}
                                    {#if isValidTime(winner)}
                                        <span class="text-gray-500">No asignado</span>
                                    {:else}
                                        <span class="text-gray-500">No se ha jugado</span>
                                    {/if}
                                {/if}
                            {/if}
                        </td>
                        <td>
                            {#if winner.winner_id !== null}
                                <button onclick={() => viewTickets(winner)} class="text-blue-500 hover:underline">Ver</button>
                            {:else}
                                <span class="text-gray-500">No disponible</span>
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
<Notifications/>
</section>
{/if}

<style>
    .ganadores {
        flex-direction: column;
        align-items: stretch;
        justify-content: start;
        gap: 1rem;
        width: 100%;
        box-sizing: border-box;
    }

    .header-title {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
    }
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .field label {
        font-size: 0.85rem;
        color: var(--color-text);
    }

    .winner-input {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        width: 50px;
    }

    .horizontal-cell {
        display: flex;
        gap: 0.5rem;
    }
</style>