<script lang="ts">
    import Matrix from "$lib/components/venta/Matrix.svelte";
    import SelectModal from "$lib/components/SelectModal.svelte";

    let dateFrom = "02/16/2";
    let dateTo = "02/16/2";
    let selectedLottery = "";
    let showAdditionalMatrices = false;
    let testingTable1Data = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)));
    let testingTable2Data = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)));
    let testingTable3Data = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)));
    let selectedBancos = [true];
    let selectedLocales = new Array(7).fill(true);
    let selectedSorteos = [];

    const bancos = ["Banco 1", "Banco 2", "Banco 3"];
    const locales = Array.from({ length: 7 }, (_, i) => `Local ${i + 1}`);
    const sorteos = Array.from({ length: 51 }, (_, i) => `Sorteo ${i + 1}`);

    const handleExportExcel = () => {
        console.log("Exportar a Excel");
    };

    const handleConfirm = () => {
        showAdditionalMatrices = true;
    };

    const handleViewQR = () => {
        console.log("Ver QR");
    };
</script>

<section class="container">
    <header>
        <div class="filters">
            <div class="date">
                <label for="desde">Desde</label>
                <input type="date" id="desde" bind:value={dateFrom} placeholder="DD/MM/YYYY" />
            </div>

            <div class="date">
                <label for="hasta">Hasta</label>
                <input type="date" id="hasta" bind:value={dateTo} placeholder="DD/MM/YYYY" />
            </div>

            <SelectModal title="Bancos" items={bancos} bind:selected={selectedBancos} />
            <SelectModal title="Locales" items={locales} bind:selected={selectedLocales} />
            <SelectModal title="Sorteos" items={sorteos} bind:selected={selectedSorteos} />
        </div>
        <button onclick={handleConfirm}>Confirmar</button>

    </header>

    <section class="content">
        {#if !selectedLottery}
            
            {#if showAdditionalMatrices}
                <h1>Tabla 1</h1>
                <div class="matrix-exportable">  
                    <Matrix 
                        rows={10}
                        columns={10}
                        data={testingTable1Data}
                    />
                    <div class="actions">
                        <button onclick={handleViewQR}>Ver QR</button>
                        <button onclick={handleExportExcel}>Exportar XLSX</button>
                    </div>
                </div>
                <h1>Tabla 2</h1>
                <div class="matrix-exportable">  
                    <Matrix 
                        rows={10}
                        columns={10}
                        data={testingTable2Data}
                    />
                    <div class="actions">
                        <button onclick={handleViewQR}>Ver QR</button>
                        <button onclick={handleExportExcel}>Exportar XLSX</button>
                    </div>
                </div>
                <h1>Tabla 3</h1>
                <div class="matrix-exportable">  
                    <Matrix 
                        rows={10}
                        columns={10}
                        data={testingTable3Data}
                    />
                    <div class="actions">
                        <button onclick={handleViewQR}>Ver QR</button>
                        <button onclick={handleExportExcel}>Exportar XLSX</button>
                    </div>
                </div>
            {/if}
        {/if}
    </section>
</section>

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        justify-content: start;
        flex: 1;
    }

    .filters {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        width: 100%;
    }   

    .content {
        display: flex;
        gap: 1rem;
        flex-direction: column;
        background: white;
        padding: 2rem;
        flex: 1;
        width: 100%;
        justify-content: space-around;
    }

    .matrix-exportable {
        display: flex;
        flex-direction: row;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-left: 1rem;
    }
</style>
