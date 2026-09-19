<script lang="ts">
	import { acts } from '@tadashi/svelte-notification'
    import { auth } from '$lib/stores/auth';
    import { PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';
    import { goto } from '$app/navigation';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import SelectModal from '$lib/components/SelectModal.svelte';
    import WinnerTicketList from '../../../lib/components/ganadores/WinnerTicketList.svelte';
    import { formatAmount } from '$lib/printing/printing';

    let { data } = $props();
    let winnerTickets: WinnerTicketRow[] = $state([]);
    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const yesterday = new Date(utcMinus6Date);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    let selectedDate = $state(utcMinus6Date.toISOString().split('T')[0]);
    let from = $state(yesterday.toISOString().split('T')[0]);
    let to = $state(utcMinus6Date.toISOString().split('T')[0]);
    let selectedDrawSchedule = $state<number[]>([]);
    let drawScheduleNames: { value: number; label: string }[] = $state([]);
    let hasLoadedDefaultFilters = $state(false);
    let isLoadingTickets = $state(false);
    let totalWinnerTickets = $state(0);
    let totalWon = $state(0);
    let totalPaid = $state(0);
    let totalPending = $state(0);
    let winners = $state<Winner[]>([]);
    let editingWinner = $state<Record<number, number | null>>({});
    let assignedWinner = $state<Record<number, boolean>>({});
    let editingMultiplierMode = $state<Record<number, boolean>>({});
    let originalMultiplier = $state<Record<number, number>>({});
    let editingMultiplier = $state<Record<number, number>>({});
    let showWinnerTicketsModal = $state(false);
    let showAssignWinnerModal = $state(false);
    let showDeleteWinnerModal = $state(false);
    let winnerToAssign = $state<Winner | null>(null);
    let winnerToDelete = $state<Winner | null>(null);

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
        winner_id: number | null;
        winner_number: number | null;
    };

    type WinnerTicketRow = {
        date: string;
        details: string;
        paid_by: string;
        amount: number;
        branch_name: string;
        number: number;
        draw_name: string;
        draw_schedule_name: string;
        enabled: boolean;
        is_megareventado: boolean;
        is_reventado: boolean;
        multiplier: number;
        numbersSold: Record<number, number>;
        numberFlags: Record<number, {
            is_reventado: boolean;
            is_megareventado: boolean;
        }>;
        paid: boolean;
        printed_at: string;
        relative_id: number;
        serial: string;
        time: string;
        username: string;
        winner_number: number | null;
        total: number;
        status?: boolean;
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

   	$effect(() => {
        const scheduleNamesItems = Array.isArray(data?.scheduleNames) ? (data.scheduleNames as any[]) : [];
        const schedules = scheduleNamesItems.map((item) => ({
			value: Number(item.draw_schedule_id),
			label: `${String(item.draw_name)} - ${String(item.draw_schedule_name)}`
 		}));
  		drawScheduleNames = schedules;

        if (!hasLoadedDefaultFilters && schedules.length > 0) {
            selectedDrawSchedule = schedules.map((schedule) => schedule.value);
            hasLoadedDefaultFilters = true;
            void fetchWinnerTickets();
        }
   	});


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

    async function requestAssignWinner(winnerToAssign: Winner) {
        const numberToAssign = editingWinner[winnerToAssign.position_id];
        if (numberToAssign === undefined || numberToAssign === null) {
            acts.add({
                message: 'Por favor, ingrese un número antes de asignar.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        try {
            const response = await fetch('/banca/ganadores/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    position_id: winnerToAssign.position_id,
                    number: numberToAssign,
                    date: winnerToAssign.date
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
            const data = await response.json();
            const winnerId = data.items[0].winner_id;
            winners = winners.map(winner => {
                if (winner.position_id === winnerToAssign.position_id) {
                    return { ...winner, winner_id: winnerId, winner_number: numberToAssign };
                }
                return winner;
            });
            assignedWinner[winnerToAssign.position_id] = true;

            acts.add({
                message: 'Ganador asignado correctamente.',
                mode: 'success',
                lifetime: 3
            });
        } catch (error) {
            acts.add({
                message: 'Error al asignar el ganador. Por favor, inténtelo de nuevo.',
                mode: 'error',
                lifetime: 3
            });
        }
    }

    function confirmAssignWinner(winner: Winner) {
        const numberToAssign = editingWinner[winner.position_id];

        if (
            numberToAssign === undefined ||
            numberToAssign === null ||
            !Number.isInteger(numberToAssign) ||
            numberToAssign < 0 ||
            numberToAssign > 99
        ) {
            acts.add({
                message: 'Ingrese un número ganador válido entre 0 y 99.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        winnerToAssign = winner;
        showAssignWinnerModal = true;
    }

    function confirmDeleteWinner(winner: Winner) {
        if (winner.winner_id === null) {
            acts.add({
                message: 'No hay un ganador asignado para eliminar.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        winnerToDelete = winner;
        showDeleteWinnerModal = true;
    }

    function sanitizeWinnerNumber(event: Event, positionId: number) {
        const input = event.currentTarget as HTMLInputElement;
        const sanitizedValue = input.value.replace(/\D/g, '').slice(0, 2);

        if (input.value !== sanitizedValue) {
            input.value = sanitizedValue;
        }

        editingWinner[positionId] = sanitizedValue === '' ? null : Number(sanitizedValue);
    }

    function handleWinnerNumberKeydown(event: KeyboardEvent) {
        const input = event.currentTarget as HTMLInputElement;

        if (
            !/^\d$/.test(event.key) &&
            !['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'Home', 'End', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) &&
            !(event.ctrlKey || event.metaKey)
        ) {
            event.preventDefault();
            return;
        }

        if (
            /^\d$/.test(event.key) &&
            input.value.length >= 2 &&
            input.selectionStart === input.selectionEnd
        ) {
            event.preventDefault();
        }
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

    function parseNumbersSold(value: unknown): Record<number, number> {
        if (typeof value === 'string') {
            try {
                value = JSON.parse(value);
            } catch {
                return {};
            }
        }

        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {};
        }

        return Object.entries(value).reduce<Record<number, number>>((numbers, [number, amount]) => {
            const parsedNumber = Number(number);
            const parsedAmount = Number(amount);
            if (Number.isFinite(parsedNumber) && Number.isFinite(parsedAmount)) {
                numbers[parsedNumber] = parsedAmount;
            }
            return numbers;
        }, {});
    }

    function getWinningAmount(ticket: WinnerTicketRow): number {
        if (ticket.winner_number === null) {
            return 0;
        }
        return Number(ticket.numbersSold[ticket.winner_number] ?? 0);
    }

    function getWinningTotal(ticket: WinnerTicketRow): number {
        return getWinningAmount(ticket) * Number(ticket.multiplier || 0);
    }

    function updateWinnerStatistics() {
        totalWon = winnerTickets.reduce((total, ticket) => total + getWinningTotal(ticket), 0);
        totalPaid = winnerTickets
            .filter((ticket) => ticket.paid)
            .reduce((total, ticket) => total + getWinningTotal(ticket), 0);
        totalPending = totalWon - totalPaid;
    }

    async function fetchWinnerTickets() {
        if (!from || !to) {
            acts.add({
                message: 'Seleccione un rango de fechas.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        if (selectedDrawSchedule.length === 0) {
            acts.add({
                message: 'Seleccione al menos un sorteo.',
                mode: 'error',
                lifetime: 3
            });
            return;
        }

        isLoadingTickets = true;
        try {
            const params = new URLSearchParams({
                date_from: from,
                date_to: to,
                draw_schedules: selectedDrawSchedule.join(',')
            });
            const response = await fetch(`/banca/ganadores/ticket/filtered?${params}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Unable to fetch winner tickets');
            }

            const payload = await response.json();
            const items = Array.isArray(payload?.items) ? payload.items : [];
            const groupedTickets = new Map<string, WinnerTicketRow>();
            for (const item of items) {
                const serial = String(item.serial ?? '');
                const number = item.number === undefined || item.number === null
                    ? null
                    : Number(item.number);
                const amount = Number(item.amount);
                const initialNumbersSold = parseNumbersSold(item.numbersSold ?? item.numbers_sold);
                let ticket = groupedTickets.get(serial);

                if (!ticket) {
                    ticket = {
                        date: String(item.date ?? ''),
                        details: String(item.details ?? item.detail ?? ''),
                        branch_name: String(item.branch_name ?? ''),
                        draw_name: String(item.draw_name ?? ''),
                        draw_schedule_name: String(item.draw_schedule_name ?? ''),
                        enabled: item.enabled !== false,
                        is_megareventado: false,
                        is_reventado: false,
                        multiplier: Number(item.position_multiplier ?? 0),
                        numbersSold: initialNumbersSold,
                        numberFlags: {},
                        paid: Boolean(item.paid),
                        paid_by: String(item.paid_by ?? ''),
                        printed_at: String(item.printed_at ?? ''),
                        relative_id: Number(item.relative_id ?? 0),
                        serial,
                        time: String(item.time ?? item.printed_at ?? ''),
                        username: String(item.username ?? ''),
                        winner_number: item.winner_number == null ? null : Number(item.winner_number),
                        total: Object.values(initialNumbersSold).reduce((total, value) => total + value, 0)
                            || (number === null ? Number(item.total ?? 0) : 0),
                        status: item.status ?? item.enabled
                    };
                    groupedTickets.set(serial, ticket);
                }

                if (number !== null && Number.isFinite(number) && Number.isFinite(amount)) {
                    ticket.numbersSold[number] = (ticket.numbersSold[number] ?? 0) + amount;
                    ticket.numberFlags[number] = {
                        is_reventado: Boolean(item.is_reventado),
                        is_megareventado: Boolean(item.is_megareventado)
                    };
                    ticket.total += amount;
                }
            }

            winnerTickets = [...groupedTickets.values()];
            totalWinnerTickets = winnerTickets.reduce((total, ticket) => total + ticket.total, 0);
            updateWinnerStatistics();
        } catch {
            winnerTickets = [];
            totalWinnerTickets = 0;
            totalWon = 0;
            totalPaid = 0;
            totalPending = 0;
            acts.add({
                message: 'Error al cargar los tiquetes ganadores.',
                mode: 'error',
                lifetime: 3
            });
        } finally {
            isLoadingTickets = false;
        }
    }


    async function requestDeleteWinner(winnerToDelete: Winner) {
        try {
            const response = await fetch(`/banca/ganadores/${winnerToDelete.winner_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
            if (!response.ok) {
                acts.add({
                    message: 'Error al eliminar el ganador.',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }
            acts.add({
                message: 'Ganador eliminado correctamente.',
                mode: 'success',
                lifetime: 3
            });

            winners = winners.map(winner => {
                if (winner.position_id === winnerToDelete.position_id) {
                    return { ...winner, winner_id: null, winner_number: null };
                }
                return winner;
            });

            assignedWinner[winnerToDelete.position_id] = false;
            editingWinner[winnerToDelete.position_id] = null;
        } catch (error) {
            acts.add({
                message: 'Error al eliminar el ganador.',
                mode: 'error',
                lifetime: 3
            });
            console.error(error);
        }
    }
</script>

<svelte:head>
	<title>Ganadores</title>
</svelte:head>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="ganadores">
    <div class="table-wrap right">
        <h2>Asignar número ganador</h2>
        <div class="filters">
            <div class="field">
                <label for="desde">Fecha</label>
                <input id="desde" type="date" bind:value={selectedDate} />
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Sorteo</th>
                    <th>Multiplicador</th>
                    <th>Ganador</th>
                    <!-- <th>Cayó bola</th> TODO -->
                </tr>
            </thead>
            <tbody>
            {#each winners as winner}
                <tr>
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
                                inputmode="numeric"
                                min="0"
                                max="99"
                                maxlength="2"
                                onkeydown={handleWinnerNumberKeydown}
                                oninput={(event) => sanitizeWinnerNumber(event, winner.position_id)}
                                disabled={assignedWinner[winner.position_id]}
                                class="winner-input"
                            />
                            {#if !assignedWinner[winner.position_id]}
                                <button
                                    onclick={() => confirmAssignWinner(winner)}
                                    disabled={editingWinner[winner.position_id] === undefined || editingWinner[winner.position_id] === null}
                                >
                                    ✓
                                </button>
                            {/if}
                            {#if winner.winner_id}
                                <button
                                    class="negative"
                                    onclick={() => confirmDeleteWinner(winner)}
                                >
                                    <TrashBinSolid class="shrink-0 h-4 w-4" />
                                </button>
                            {/if}
                        {/if}
                    </div>
                </td>
                <!-- { <td>
                    #if winner.position_number === 2}
                        <div class= "horizontal-cell">
                            <button class="ball red">Roja</button>
                            <button class="ball white">Blanca</button>
                        </div>
                    {/if}
                    </td>-->
                </tr>
                {/each}
            </tbody>
        </table>
    </div>
    <div class="left">
        <h2>Tiquetes ganadores</h2>
        <div class="filters">
            <div class="field">
                <label for="from">Desde</label>
                <input id="from" type="date" bind:value={from}/>
            </div>
            <div class="field">
                <label for="to">Hasta</label>
                <input id="to" type="date" bind:value={to}/>
            </div>
            <div class="field">
                <label for="sorteo">Sorteo</label>
    			<SelectModal
    				options={drawScheduleNames}
    				bind:selected={selectedDrawSchedule}
    				placeholder="Seleccione un sorteo"
    			/>
            </div>
            <button type="button" onclick={fetchWinnerTickets} disabled={isLoadingTickets}>
                {isLoadingTickets ? 'Cargando...' : 'Filtrar'}
            </button>
        </div>
        <WinnerTicketList
            tickets={winnerTickets}
        />
        <div class="total-amount">
            <div class="statistic">
                <p class="total-label">Venta</p>
                <p>₡{formatAmount(totalWinnerTickets)}</p>
            </div>
            <div class="statistic">
                <p class="total-label">Total ganado</p>
                <p>₡{formatAmount(totalWon)}</p>
            </div>
            <div class="statistic">
                <p class="total-label">Total pagado</p>
                <p>₡{formatAmount(totalPaid)}</p>
            </div>
            <div class="statistic">
                <p class="total-label">Falta por pagar</p>
                <p>₡{formatAmount(totalPending)}</p>
            </div>
        </div>
    </div>
</section>
{/if}

<ConfirmModal
    bind:showModal={showAssignWinnerModal}
    message={winnerToAssign
        ? `¿Está seguro de asignar el número ${editingWinner[winnerToAssign.position_id]} como ganador?`
        : '¿Está seguro de asignar este ganador?'}
    confirmText="Asignar"
    confirm={() => winnerToAssign && requestAssignWinner(winnerToAssign)}
/>

<ConfirmModal
    bind:showModal={showDeleteWinnerModal}
    message={winnerToDelete
        ? `¿Está seguro de eliminar el ganador ${winnerToDelete.winner_number}?`
        : '¿Está seguro de eliminar este ganador?'}
    confirmText="Eliminar"
    confirm={() => winnerToDelete && requestDeleteWinner(winnerToDelete)}
/>

<style>
    .ganadores {
        flex-direction: row;
        align-items: stretch;
        justify-content: start;
        gap: 1rem;
        width: 100%;
        box-sizing: border-box;
    }

    .right, .left {
        display: flex;
        flex-direction: column;
        padding: 1rem;
        flex: 1;
        gap: 1rem;
        background-color: var(--color-box-background);
		border: 1px solid var(--color-border);
		max-height: 96vh;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    .field label {
        font-size: 1rem;
        color: var(--color-text);
    }

    tr {
        background-color: white;
    }

    h2 {
        font-size: 1.5rem;
        border-bottom: 1px solid var(--color-border);
        padding-bottom: 0.5rem;
    }

    .total-amount {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.75rem;
    }

    .statistic {
        padding: 0.75rem;
        border: 1px solid var(--color-border);
        background-color: white;
    }

    .statistic p {
        margin: 0;
    }

    .statistic > p:last-child {
        margin-top: 0.35rem;
        font-size: 1.1rem;
        font-weight: 600;
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
