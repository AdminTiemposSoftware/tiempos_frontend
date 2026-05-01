<script lang="ts">
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import PayModal from '$lib/components/ganadores/PayModal.svelte';

    const rows = [
        {
            id: 1,
            date: '16/02/2026',
            name: 'NICA 3',
            time: '15:00',
            winner: '68',
            // sale: 0,
            // commission: 0,
            // prize: 0,
            // net: 0
        },
        {
            id: 2,
            date: '16/02/2026',
            name: 'NICA 9',
            time: '16:00',
            winner: '*',
            // sale: 0,
            // commission: 0,
            // prize: 0,
            // net: 0
        }
    ];

    let editingWinner: Record<number, string> = rows.reduce(
        (acc, row) => ({ ...acc, [row.id]: row.winner }),
        {}
    );

    type Row = (typeof rows)[number];

    let assignedWinner: Record<number, boolean> = rows.reduce(
        (acc, row) => ({ ...acc, [row.id]: false }),
        {}
    );

    let winnerErrors: Record<number, string | null> = rows.reduce(
        (acc, row) => ({ ...acc, [row.id]: null }),
        {}
    );

    let showAssignConfirm = false;
    let pendingAssignRow: Row | null = null;
    let pendingAssignValue = '';

    let showPayModal = false;
    let pendingPayRow: Row | null = null;
    let payTicketNumber = '';

    const assignWinner = (id: number) => {
        //TODO UPDATE WINNER IN DB
        assignedWinner = { ...assignedWinner, [id]: true };
    };

    const clearWinnerError = (id: number) => {
        if (!winnerErrors[id]) {
            return;
        }
        winnerErrors = { ...winnerErrors, [id]: null };
    };

    const requestAssignWinner = (row: Row) => {
        const rawValue = editingWinner[row.id] ?? '';
        const normalizedValue = rawValue.trim();
        const isNumeric = /^\d+$/.test(normalizedValue);

        if (!isNumeric) {
            winnerErrors = {
                ...winnerErrors,
                [row.id]: 'Ingresa un numero valido.'
            };
            return;
        }

        editingWinner = { ...editingWinner, [row.id]: normalizedValue };
        winnerErrors = { ...winnerErrors, [row.id]: null };
        pendingAssignRow = row;
        pendingAssignValue = normalizedValue;
        showAssignConfirm = true;
    };

    const confirmAssignWinner = () => {
        if (!pendingAssignRow) {
            return;
        }
        assignWinner(pendingAssignRow.id);
        winnerErrors = { ...winnerErrors, [pendingAssignRow.id]: null };
        pendingAssignRow = null;
        pendingAssignValue = '';
    };

    const openPayModal = (row: Row) => {
        pendingPayRow = row;
        payTicketNumber = '';
        showPayModal = true;
    };

    const resetPayModal = () => {
        pendingPayRow = null;
    };

    const handlePaySubmit = () => {
        if (!pendingPayRow) {
            return;
        }
        // TODO: Enviar pago a backend con el numero de tiquete ganador.
        pendingPayRow = null;
    };

    const totals = rows.reduce(
        (acc, row) => ({
            // sale: acc.sale + row.sale,
            // commission: acc.commission + row.commission,
            // prize: acc.prize + row.prize,
            // net: acc.net + row.net
        }),
        { sale: 0, commission: 0, prize: 0, net: 0 }
    );
</script>

<ConfirmModal
    bind:showModal={showAssignConfirm}
    message={
        pendingAssignRow
            ? `Asignar ganador ${pendingAssignValue} para ${pendingAssignRow.name}?`
            : 'Asignar ganador?'
    }
    confirmText="Asignar"
    cancelText="Cancelar"
    confirm={confirmAssignWinner}
/>

<PayModal
    bind:showModal={showPayModal}
    bind:ticketNumber={payTicketNumber}
    name={pendingPayRow?.name ?? ''}
    time={pendingPayRow?.time ?? ''}
    onPay={handlePaySubmit}
    onClose={resetPayModal}
/>

<svelte:head>
	<title>Ganadores</title>
</svelte:head>

<section class="ganadores">
    <div class="header-contained">
        <div class="header-title">
            <div>
                <h1>Ganadores</h1>
                <p>Asigna el numero ganador por sorteo.</p>
            </div>
        </div>
        <div class="filters">
            <div class="field">
                <label for="desde">Fecha</label>
                <input id="desde" type="date" value="2026-02-16" />
            </div>
            <div class="field">
                <label for="filtrar">Filtrar</label>
                <button class="wide neutral">Sorteos</button>
            </div>
        </div>
    </div>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Nombre</th>
                    <th>Hora</th>
                    <th>Ganador</th>
                    <!-- <th>Venta</th> -->
                    <!-- <th>Comision</th>
                    <th>Premios</th>
                    <th>Neto</th> -->
                    <th>Opciones</th>
                </tr>
            </thead>
            <tbody>
                {#each rows as row}
                    <tr>
                        <td>{row.date}</td>
                        <td>{row.name}</td>
                        <td>{row.time}</td>
                        <td>
                            <div class="winner-input">
                                <input
                                    type="text"
                                    inputmode="numeric"
                                    placeholder="Ej: 68"
                                    bind:value={editingWinner[row.id]}
                                    disabled={assignedWinner[row.id]}
                                    on:input={() => clearWinnerError(row.id)}
                                />
                                {#if !assignedWinner[row.id]}
                                    <button
                                        on:click={() => requestAssignWinner(row)}
                                    >
                                        Asignar
                                    </button>
                                {/if}
                            </div>
                            {#if winnerErrors[row.id]}
                                <div class="winner-error">{winnerErrors[row.id]}</div>
                            {/if}
                        </td>
                        <td>
                            <div class="options-buttons">
                                <button>Imprimir</button>
                                <button class="negative" on:click={() => openPayModal(row)}>
                                    Pagar
                                </button>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</section>

<style>
    .ganadores {
        flex-direction: column;
        align-items: stretch;
        justify-content: start;
        gap: 1rem;
        padding: 1rem;
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

    .header-title p {
        margin: 0.25rem 0 0;
        color: rgba(0, 0, 0, 0.6);
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

    .winner-error {
        margin-top: 0.25rem;
        color: var(--color-negative, #c0392b);
        font-size: 0.75rem;
    }

</style>