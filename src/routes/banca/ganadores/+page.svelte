<script lang="ts">    
	import {Notifications, acts} from '@tadashi/svelte-notification'
    import { auth } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    
    let { data } = $props();
    
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let selectedDate = $state(utcMinus6Date.toISOString().split('T')[0]);
    let winners = $state<Winner[]>([]);
    let editingWinner = $state<Record<number, number>>({});
    let assignedWinner = $state<Record<number, boolean>>({});
    
    type Winner = {
        date: string;
        draw_id: number;
        draw_is_megareventado: boolean;
        draw_is_reventado: boolean;
        draw_schedule_name: string;
        position_id: number;
        position_number: number;
        schedule_id: number;
        schedule_time: string;
        winner_id: number;
        winner_number: number;
    };

    // $effect(() => {
        
    //     void goto(`?date=${selectedDate}`, {
    //         replaceState: true,
    //         noScroll: true,
    //         keepFocus: true
    //     });
    // });
        
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
            schedule_id: item.schedule_id,
            schedule_time: item.schedule_time,
            winner_id: item.winner_id,
            winner_number: item.winner_number
        }));

        editingWinner = items.reduce((acc: Record<number, number>, item: any) => {
            acc[item.position_id] = item.winner_number;
            return acc;
        }, {});
        assignedWinner = items.reduce((acc: Record<number, boolean>, item: any) => {
            acc[item.position_id] = item.winner_number !== null;
            return acc;
        }, {});
    });

    async function requestAssignWinner(winner: Winner) {
        const numberToAssign = editingWinner[winner.position_id];
        if (numberToAssign === undefined || numberToAssign === null) {
            acts.add({
                message: 'Por favor, ingrese un número antes de asignar.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        
        const response = await fetch('/banca/ganadores/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                position_id: winner.position_id,
                number: numberToAssign,
                date: winner.date
            })
        });

        if (!response.ok) {
            acts.add({
                message: 'Error al asignar el ganador. Por favor, inténtelo de nuevo.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        assignedWinner[winner.position_id] = true;

    }
</script>

<svelte:head>
	<title>Ganadores</title>
</svelte:head>

{#if ['banking'].includes($auth.user?.role ?? '')}
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
                <input id="desde" type="date" value="2026-02-16" />
            </div>
        </div>
    </header>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Sorteo</th>
                    <th>Ganador</th>
                </tr>
            </thead>
            <tbody>
                {#each winners as winner}
                    <tr>
                        <td>{winner.date}</td>
                        <td>{winner.draw_schedule_name} ({winner.schedule_time})</td>
                        <td>
                            <div class="winner-input">
                                <input
                                    type="number"
                                    bind:value={editingWinner[winner.position_id]}
                                    disabled={assignedWinner[winner.position_id]}
                                />
                                {#if !assignedWinner[winner.position_id]}
                                    <button
                                        onclick={() => requestAssignWinner(winner)}
                                    >
                                        Asignar
                                    </button>
                                {/if}
                            </div>
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
    }

    .winner-input input {
        width: 50px;
    }
</style>