<script lang="ts">    
	import {Notifications, acts} from '@tadashi/svelte-notification'
    import type { Receipt } from '$lib/printing/types';
    import { auth } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    import GetWinnerModal from '$lib/components/ganadores/GetWinnerModal.svelte';
    
    let { data } = $props();
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let selectedDate = $state(utcMinus6Date.toISOString().split('T')[0]);
    let showTicketsModal = $state(false);
    let winners = $state<Winner[]>([]);
    let ticketWinner = $state<Receipt | null>(null);
    let serial = $state('');
    
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

    function showGetWinnerModal() {
        showTicketsModal = true;
    }

    async function getWinnerTicket() {
        if (serial.trim() === '') {
            acts.add({
                message: 'Por favor ingrese un serial de tiquete válido',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        try {
            const response = await fetch(`/puesto/ganadores/${serial}`);
            if (!response.ok) {
                const errorData = await response.json();
                acts.add({
                    message: errorData.message || 'El tiquete consultado no es ganador',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }
            const data = await response.json();
            const items = Array.isArray(data?.items) ? data.items : [];
            if (items.length === 0) {
                acts.add({
                    message: 'El tiquete consultado no es ganador',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }
            ticketWinner = Object.values(items.reduce((acc, item) => {
                if (!acc[item.serial]) {
                    acc[item.serial] = {
                        ...item,
                        items: []
                    };
                }

                acc[item.serial].items.push({
                    number: item.number,
                    amount: Number(item.amount),
                    is_reventado: item.is_reventado,
                    is_megareventado: item.is_megareventado
                });

                return acc;
            }, {} as Record<string, any>))[0] as Receipt;
        } catch (error) {
            console.error('Error fetching ticket:', error);
            acts.add({
                message: 'Error al consultar el tiquete',
                mode: 'error',
                lifetime: 3
            });
        }
    }
    
    async function handleKeyInput(event: KeyboardEvent) {
        switch (event.key) {
            case "C":
            case "c":
                showGetWinnerModal();
                break;
        }
    }
</script>

<svelte:head>
	<title>Ganadores</title>
</svelte:head>

<GetWinnerModal
    bind:showModal={showTicketsModal}
    bind:input={serial}
    bind:ticketWinner={ticketWinner}
    confirm={getWinnerTicket}
    message="Ingrese el serial del tiquete a cobrar"
    confirmText="Consultar (Enter)"
/>

<svelte:window onkeydown={handleKeyInput} />
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
                </tr>
            </thead>
            <tbody>
                {#each winners as winner}
                    <tr>
                        <td>
                            {winner.date ? winner.date.split('T')[0].split('-').reverse().join('/') : ''}
                        </td>                        
                        <td>{winner.draw_schedule_name} {winner.position_number === 2 ? "reventado" : ""}{winner.position_number === 3 ? "megareventado" : ""} ({winner.schedule_time})</td>
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
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <button
        class="cobrar-button"
        onclick={showGetWinnerModal}
    >
        <div class="button-name"><p>C</p>obrar tiquete</div>
    </button>
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
        position: relative; 
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

    .cobrar-button {
        margin-top: auto;
        bottom: 1rem;
        width: 100%;
    }


</style>