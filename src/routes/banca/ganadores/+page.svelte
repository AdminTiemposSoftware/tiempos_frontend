<script lang="ts">
	import {Notifications, acts} from '@tadashi/svelte-notification'
    import { auth } from '$lib/stores/auth';
    import SorteoWinnerCard from '$lib/components/ganadores/SorteoWinnerCard.svelte';
    import CalendarRow from '$lib/components/ganadores/CalendarRow.svelte';
    import AssignWinner from '$lib/components/ganadores/AssignWinner.svelte';
    import UpdateMultiplierModal from '$lib/components/ganadores/UpdateMultiplierModal.svelte';

    let { data } = $props();
    const
    utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let selectedDate = $state(utcMinus6Date.toISOString().split('T')[0]);
    let winners = $state<Winner[]>([]);
    let editingWinner = $state<Record<number, number>>({});
    let assignedWinner = $state<Record<number, boolean>>({});
    let selectedWinner = $state<Winner>();
    let showUpdateModal = $state(false);
    let winnerMultiplier = $state();
    let reventadoMultiplier = $state();
    let megareventadoMultiplier = $state();
    let winnerReventadoMultiplier = $state();

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
        const itemsPositions = Array.isArray(data?.itemsPositions) ? data.itemsPositions : [];
        const itemsWinners = Array.isArray(data?.itemsWinners) ? data.itemsWinners : [];
        winners = Object.values(itemsPositions.reduce((acc, item) => {
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

        if (selectedWinner === undefined && winners.length > 0) {
            selectedWinner = winners[0];
        }
    });

    async function selectWinner(winnerId: number) {
        selectedWinner = winners.find(winner => winner.schedule_id === winnerId);
    }

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

    async function requestUpdateMultiplier(positionId: number, newMultiplier: number) {
        try {
            console.log(positionId, newMultiplier);
            const response = await fetch('/banca/ganadores/position', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: positionId,
                    multiplier: newMultiplier
                })
            });

            if (!response.ok) {
                acts.add({
                    message: 'Error al actualizar el multiplicador. Por favor, inténtelo de nuevo.',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }

            winners = winners.map((winner) => {
                if (winner.schedule_id !== selectedWinner?.schedule_id)  return winner;
                return {
                    ...winner,
                    positions: Object.fromEntries(
                        Object.entries(winner.positions).map(([key, position]) => [
                            key,
                            position.id === positionId
                                ? { ...position, multiplier: newMultiplier }
                                : position
                        ])
                    )
                };
            });

        } catch (error) {
            acts.add({
                message: 'Error al actualizar el multiplicador. Por favor, inténtelo de nuevo.',
                mode: 'error',
                lifetime: 3
            });
            console.error(error);
        }
    }

    function updateMultiplier() {
        requestUpdateMultiplier(selectedWinner.positions[1]?.id, winnerMultiplier);

        if (selectedWinner?.draw_is_reventado) {
            requestUpdateMultiplier(selectedWinner.positions[2]?.id, reventadoMultiplier);
            requestUpdateMultiplier(selectedWinner.positions[4]?.id, winnerReventadoMultiplier);
        }
        if (selectedWinner?.draw_is_megareventado) {
            requestUpdateMultiplier(selectedWinner.positions[3]?.id, megareventadoMultiplier);
        }

        showUpdateModal = false;

        acts.add({
            message: 'Multiplicador actualizado correctamente.',
            mode: 'success',
            lifetime: 3
        });

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

    function closeUpdateModal() {
        showUpdateModal = false;
    }

    function handleEditMultiplier(winner: Winner) {
        winnerMultiplier = winner.positions[1]?.multiplier;
        reventadoMultiplier = winner.positions[2]?.multiplier;
        megareventadoMultiplier = winner.positions[3]?.multiplier;
        winnerReventadoMultiplier = winner.positions[4]?.multiplier;
        selectedWinner = winner;
        showUpdateModal = true;
    }
</script>

<svelte:head>
	<title>Ganadores</title>
</svelte:head>

<UpdateMultiplierModal
    bind:showModal={showUpdateModal}
    selectedWinner={selectedWinner}
    bind:winnerMultiplier={winnerMultiplier}
    bind:reventadoMultiplier={reventadoMultiplier}
    bind:megareventadoMultiplier={megareventadoMultiplier}
    bind:winnerReventadoMultiplier={winnerReventadoMultiplier}
    onClose={closeUpdateModal}
    onSubmit={updateMultiplier}
/>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="ganadores">
    <header class="header-banking">
        <div class="header-title">
            <div>
                <h1 class="title">Ganadores</h1>
                <p class="subtitle">Asigna el numero ganador por sorteo.</p>
            </div>
        </div>
    </header>
    <div class="winners-content">
        <div class="winners-list left">
            {#each winners as winner}
                <SorteoWinnerCard
                    winner={winner}
                    onSelect={() => selectWinner(winner.schedule_id)}
                    handleEditMultiplier={() => handleEditMultiplier(winner)}
                    selectedWinner={selectedWinner?.schedule_id}
                />
            {/each}
        </div>
        <div class="questions right">
            <CalendarRow
                existingDates={[]}
                bind:selectedDateString={selectedDate}
                />
            <AssignWinner
                selectedWinner={selectedWinner}
            />
        </div>
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

    .winners-content {
        display: flex;
        gap: 1rem;
        flex-direction: row;
    }

    .winners-list {
        gap: 0.5rem;
    }

    .header-title {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
    }

    .questions {
        background-color: var(--color-box-background);
        border: 1px solid var(--color-border);
        padding: 1rem;
        border-radius: 0.5rem;
        max-height: 20rem;
    }

    .right, .left {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.right {
		gap: 1rem;
	}
</style>
