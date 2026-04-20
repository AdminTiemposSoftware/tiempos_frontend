<script lang="ts">
    const rows = [
        {
            id: 1,
            date: '16/02/2026',
            group: 'NICA 3',
            winner: '68',
            sale: 0,
            commission: 0,
            prize: 0,
            net: 0
        },
        {
            id: 2,
            date: '16/02/2026',
            group: 'NICA 9',
            winner: '*',
            sale: 0,
            commission: 0,
            prize: 0,
            net: 0
        }
    ];

    let editingWinner: Record<number, string> = rows.reduce(
        (acc, row) => ({ ...acc, [row.id]: row.winner }),
        {}
    );

    const totals = rows.reduce(
        (acc, row) => ({
            sale: acc.sale + row.sale,
            commission: acc.commission + row.commission,
            prize: acc.prize + row.prize,
            net: acc.net + row.net
        }),
        { sale: 0, commission: 0, prize: 0, net: 0 }
    );
</script>

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
        <button>Guardar cambios</button>
    </div>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Grupo</th>
                    <th>Ganador</th>
                    <th>Venta</th>
                    <th>Comision</th>
                    <th>Premios</th>
                    <th>Neto</th>
                    <th>Opciones</th>
                </tr>
            </thead>
            <tbody>
                {#each rows as row}
                    <tr>
                        <td>{row.date}</td>
                        <td>{row.group}</td>
                        <td>
                            <div class="winner-input">
                                <input
                                    type="text"
                                    inputmode="numeric"
                                    placeholder="Ej: 68"
                                    bind:value={editingWinner[row.id]}
                                />
                                <button class="neutral">Asignar</button>
                            </div>
                        </td>
                        <td>{row.sale.toFixed(2)}</td>
                        <td>{row.commission.toFixed(2)}</td>
                        <td>{row.prize.toFixed(2)}</td>
                        <td>{row.net.toFixed(2)}</td>
                        <td>
                            <div class="options-buttons">
                                <button>Imprimir</button>
                                <button class="negative">Pagar</button>
                            </div>
                        </td>
                    </tr>
                {/each}
                <tr class="total-row">
                    <td colspan="3">-- TOTAL --</td>
                    <td>{totals.sale.toFixed(2)}</td>
                    <td>{totals.commission.toFixed(2)}</td>
                    <td>{totals.prize.toFixed(2)}</td>
                    <td>{totals.net.toFixed(2)}</td>
                    <td>*** *** *** ***</td>
                </tr>
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
        width: 100%;
        min-width: 50px;
    }
</style>