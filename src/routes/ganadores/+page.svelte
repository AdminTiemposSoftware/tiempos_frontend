<script lang="ts">
    const rows = [
        {
            date: '16/02/2026',
            group: 'NICA 3',
            winner: '68',
            sale: 0,
            commission: 0,
            prize: 0,
            net: 0
        },
        {
            date: '16/02/2026',
            group: 'NICA 9',
            winner: '*',
            sale: 0,
            commission: 0,
            prize: 0,
            net: 0
        }
    ];

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
    <header class="ganadores-header">
        <h1>Vendedor</h1>
        <div class="filters">
            <div class="field">
                <label for="desde">Desde</label>
                <input id="desde" type="date" value="2026-02-16" />
            </div>
            <div class="field">
                <label for="hasta">Hasta</label>
                <input id="hasta" type="date" value="2026-02-16" />
            </div>
            <div class="field">
                <label>&nbsp;</label>
                <button class="wide">Aplicar</button>
            </div>
            <div class="field">
                <label>Filtrar</label>
                <button class="wide neutral">Sorteos</button>
            </div>
            <div class="field">
                <label>Tipo</label>
                <button class="wide">Vendedor</button>
            </div>
            <div class="field">
                <label>&nbsp;</label>
                <button class="wide success">Ver</button>
            </div>
        </div>
    </header>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Grupo</th>
                    <th># Ganador</th>
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
                        <td>{row.winner}</td>
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

    .ganadores-header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .ganadores-header h1 {
        text-align: left;
        margin: 0;
    }

    .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.75rem 1rem;
        align-items: end;
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

    .wide {
        width: 100%;
    }

    .success {
        background-color: #51b84a;
    }

    .success:hover {
        background-color: #3f9a3a;
    }
</style>