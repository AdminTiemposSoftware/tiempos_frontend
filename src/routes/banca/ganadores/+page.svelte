<script lang="ts">    
	import {Notifications, acts} from '@tadashi/svelte-notification'
    import { auth } from '$lib/stores/auth';
    import { PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { goto } from '$app/navigation';
    
    let { data } = $props();
    
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let selectedDate = $state(utcMinus6Date.toISOString().split('T')[0]);
    let winners = $state<Winner[]>([]);
    let editingWinner = $state<Record<number, number>>({});
    let assignedWinner = $state<Record<number, boolean>>({});
    let editingMultiplierMode = $state<Record<number, boolean>>({});
    let originalMultiplier = $state<Record<number, number>>({});
    let editingMultiplier = $state<Record<number, number>>({});
    
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

        editingWinner = items.reduce((acc: Record<number, number>, item: any) => {
            acc[item.position_id] = item.winner_number;
            return acc;
        }, {});
        assignedWinner = items.reduce((acc: Record<number, boolean>, item: any) => {
            acc[item.position_id] = item.winner_number !== null;
            return acc;
        }, {});

        editingMultiplierMode = items.reduce((acc: Record<number, boolean>, item: any) => {
            acc[item.position_id] = false;
            return acc;
        }, {});
        
        originalMultiplier = items.reduce((acc: Record<number, number>, item: any) => {
            acc[item.position_id] = item.position_multiplier;
            return acc;
        }, {});

        editingMultiplier = items.reduce((acc: Record<number, number>, item: any) => {
            acc[item.position_id] = item.position_multiplier;
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
    
        acts.add({
            message: 'Ganador asignado correctamente.',
            mode: 'success',
            lifetime: 3
        });

        assignedWinner[winner.position_id] = true;
    }

    function requestUpdateMultiplier(winner: Winner) {
        const newMultiplier = editingMultiplier[winner.position_id];
        if (newMultiplier === undefined || newMultiplier === null) {
            acts.add({
                message: 'Por favor, ingrese un multiplicador antes de guardar.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }
        console.log(winners)

        fetch('/banca/ganadores/position', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: winner.position_id,
                multiplier: newMultiplier
            })
        }).then(response => {
            if (!response.ok) {
                acts.add({
                    message: 'Error al actualizar el multiplicador. Por favor, inténtelo de nuevo.',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }

            originalMultiplier[winner.position_id] = newMultiplier;
            editingMultiplierMode[winner.position_id] = false;

            acts.add({
                message: 'Multiplicador actualizado correctamente.',
                mode: 'success',
                lifetime: 3
            });
        }).catch(() => {
            acts.add({
                message: 'Error al actualizar el multiplicador. Por favor, inténtelo de nuevo.',
                mode: 'error',
                lifetime: 3
            });
        });
    }

    function enableMultiplierEdit(positionId: number) {
        editingMultiplierMode[positionId] = true;
    }

    function cancelMultiplierEdit(positionId: number) {
        editingMultiplierMode[positionId] = false;
        editingMultiplier[positionId] = originalMultiplier[positionId];
    }

    function canAssignWinner(winner: Winner): boolean {
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
                    <!-- <th>Cayó bola</th> TODO -->
                </tr>
            </thead>
            <tbody>
                {#each winners as winner}
                    <tr>
                        <td>
                            {winner.date ? winner.date.split('T')[0].split('-').reverse().join('/') : ''}
                        </td>                        
                        <td>{winner.draw_schedule_name} {winner.position_number === 2 ? "reventado" : ""} {winner.position_number === 3 ? "megareventado" : ""} ({winner.schedule_time})</td>
                        <td>
                            <div class="horizontal-cell">
                                <input 
                                    type="text" 
                                    bind:value={editingMultiplier[winner.position_id]} 
                                    class="winner-input"
                                    disabled={!editingMultiplierMode[winner.position_id]}
                                />
                                {#if !editingMultiplierMode[winner.position_id]}
                                    <button
                                        type="button"
                                        class="neutral"
                                        onclick={() => enableMultiplierEdit(winner.position_id)}
                                    >
                                        <PenSolid class="shrink-0 h-4 w-4" />
                                    </button>
                                {:else}
                                    <button
                                        type="button"
                                        onclick={() => requestUpdateMultiplier(winner)}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        type="button"
                                        onclick={() => cancelMultiplierEdit(winner.position_id)}
                                    >
                                        X
                                    </button>
                                {/if}
                            </div>
                        </td>
                        <td>
                            <div class="horizontal-cell">
                                {#if winner.position_multiplier !== null && canAssignWinner(winner)}
                                    <input
                                        type="number"
                                        bind:value={editingWinner[winner.position_id]}
                                        disabled={assignedWinner[winner.position_id]}
                                        class="winner-input" 
                                    />
                                    {#if !assignedWinner[winner.position_id]}
                                        <button
                                            onclick={() => requestAssignWinner(winner)}
                                            disabled={editingWinner[winner.position_id] === undefined || editingWinner[winner.position_id] === null}
                                        >
                                            ✓
                                        </button>
                                    {/if}
                                {/if}
                            </div>
                        </td>
                        <td>
                            <!-- {#if winner.position_number === 2}
                                <div class= "horizontal-cell">
                                    <button class="ball red">Roja</button>
                                    <button class="ball white">Blanca</button>
                                </div>
                            {/if} -->
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

    .ball {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-theme-4);
        color: white;
        font-size: 0.75rem;
        border: 1px solid black;
        /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); */
    }

    .ball.white {
        background-color: white;
        color: black;
    }
</style>