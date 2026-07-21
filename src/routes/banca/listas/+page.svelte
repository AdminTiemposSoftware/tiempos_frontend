<script lang="ts">
    import MatrixInput from "$lib/components/listas/MatrixInput.svelte";
    import SelectModal from "$lib/components/SelectModal.svelte";
    import { auth } from '$lib/stores/auth';

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

<svelte:head>
	<title>Venta</title>
</svelte:head>

{#if ['banking', 'branch'].includes($auth.user?.role ?? '')}
<section class="container">
    <MatrixInput mode="20x5" />
</section>
{/if}

<style>
    .container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        justify-content: start;
        flex: 1;
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
