<script lang="ts">    
	import {Notifications, acts} from '@tadashi/svelte-notification'
    import { auth } from '$lib/stores/auth';
    import SorteoWinnerCard from '$lib/components/ganadores/SorteoWinnerCard.svelte';
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
    
    type Position = {
        id: number;
        multiplier: number;
    };

    type Winner = {
        date: string;
        draw_id: number;
        draw_is_megareventado: boolean;
        draw_is_reventado: boolean;
        draw_schedule_name: string;
        positions: Record<number, Position>;
        schedule_id: number;
        schedule_time: string;
    };
        
    $effect(() => {
        const items = Array.isArray(data?.items) ? data.items : [];
        winners = Object.values(items.reduce((acc, item) => {
            if (!acc[item.schedule_id]) {
                acc[item.schedule_id] = {
                    draw_id: item.draw_id,
                    draw_is_megareventado: item.draw_is_megareventado,
                    draw_is_reventado: item.draw_is_reventado,
                    draw_schedule_name: `${item.draw_name} ${item.schedule_name}`,
                    positions: {},
                    schedule_id: item.schedule_id,
                    schedule_time: item.schedule_time
                };
            }
            acc[item.schedule_id].positions[item.position_number] = {
                id: item.position_id,
                multiplier: item.position_multiplier
            };

            return acc;
        }, {} as Record<string, Winner>));
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
    {#each winners as winner}
        <SorteoWinnerCard {winner} />
    {/each}
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