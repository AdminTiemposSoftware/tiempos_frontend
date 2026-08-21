<script lang="ts">
	import {Notifications, acts} from '@tadashi/svelte-notification'
    import { auth } from '$lib/stores/auth';
    import AssignWinner from '$lib/components/ganadores/AssignWinner.svelte';
    import UpdateMultiplierModal from '$lib/components/ganadores/UpdateMultiplierModal.svelte';
    import PositionCard from '../../../lib/components/ganadores/PositionCard.svelte';

    let { data } = $props();
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let selectedDate = $state(utcMinus6Date.toISOString().split('T')[0]);
    let winners = $state<Winner[]>([]);
    let positions = $state<PositionItem[]>([]);
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
        position_id: number;
        position_number: number;
        position_multiplier: number;
        date: string;
        draw_id: number;
        draw_is_megareventado: boolean;
        draw_is_reventado: boolean;
        draw_schedule_name: string;
        positions: Record<number, Position>;
        schedule_id: number;
        schedule_time: string;
        winner_id: number;
        winner_number: number;
    };

    $effect(() => {
        const items = Array.isArray(data?.items) ? data.items : [];
        console.log(items);
        positions = Object.values(items.reduce((acc, item) => {
            if (!acc[item.schedule_id]) {
                acc[item.schedule_id] = {
                    draw_id: item.draw_id,
                    position_id: item.position_id,
                    position_number: item.position_number,
                    position_multiplier: item.position_multiplier,
                    draw_is_megareventado: item.draw_is_megareventado,
                    draw_is_reventado: item.draw_is_reventado,
                    draw_schedule_name: `${item.draw_name} ${item.schedule_name}`,
                    positions: {},
                    schedule_id: item.schedule_id,
                    schedule_time: item.schedule_time,
                    winner_id: item.winner_id,
                    winner_number: item.winner_number,
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

    async function requestAssignWinner(winner: Winner, number: number, reventadoColor: string, megareventadoNumber: number) {
        if (number === undefined || number === null) {
            acts.add({
                message: 'Por favor, ingrese un número antes de asignar.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        console.log(winner, number, reventadoColor, megareventadoNumber);
        try {
            const response = await fetch('/banca/ganadores/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    position_id: winner.position_id,
                    number: number,
                    date: selectedDate
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

            positions = positions.map(pos => pos.position_id === winner.position_id ? { ...pos, winner_number: number } : pos);
        } catch (error) {
            acts.add({
                message: 'Error al asignar el ganador. Por favor, inténtelo de nuevo.',
                mode: 'error',
                lifetime: 3
            });
        }
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

    function formatDisplayDate(date: string): string {
		const [year, month, day] = date.split('-');
		const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
		return `${Number(day)} de ${monthNames[Number(month) - 1]} del ${year}`;
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
        <div class="filters">
            <div class="field">
                <label for="desde">Fecha</label>
                <input id="desde" type="date" bind:value={selectedDate} />
            </div>
        </div>
    </header>
    <div class="position-content">
        {#each positions as position}
            <PositionCard
                position={position}
                onSelect={() => selectWinner(position.schedule_id)}
                handleEditMultiplier={() => handleEditMultiplier(position)}
                selectedWinner={selectedWinner?.schedule_id}
                handleAssignWinner={requestAssignWinner}
            />
        {/each}
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

    .position-content {
        display: flex;
        gap: 0.5rem;
        flex-direction: column;
        flex: 1;
    }

    .header-title {
        display: flex;
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
    }
</style>
