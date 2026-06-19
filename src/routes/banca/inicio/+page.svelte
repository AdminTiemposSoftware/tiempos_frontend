<script lang="ts">
    import { auth } from '$lib/stores/auth';
	import ProhibitedNumberModal from '$lib/components/ProhibitedNumberModal.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import Matrix from '../../../lib/components/venta/Matrix.svelte';
	import Select from 'svelte-select';

	let prohibitedNumberToDelete = $state<number | null>(null);
	let prohibitedNumbers = $state<prohibitedNumber[]>([]);
	let showDeleteProhibitedModal = $state(false);
	let showAddProhibitedModal = $state(false);
	let showUpdateProhibitedModal = $state(false);
	let selectedProhibitedNumber = $state<prohibitedNumber | null>(null);
	let puestoOptions = $state<string[]>([]);
	
    let { data } = $props();

	type prohibitedNumber = {
		id?: number;
		number: number;
		amount: number;
		starter: number;
		can_sell_after_amount: boolean;
		by_amount: boolean;
		by_percentage: boolean;
	};

    function handleConfirmDeleteProhibitedNumber() {
		if (prohibitedNumberToDelete == null) {
			return;
		}
		prohibitedNumbers = prohibitedNumbers.filter((item) => item.number !== prohibitedNumberToDelete);
		prohibitedNumberToDelete = null;
	}

	function openAddProhibitedModal() {
		showAddProhibitedModal = true;
	}

	async function handleAddProhibitedNumber(payload: { number: string; amount: string, starter: string, canSellAfterAmount: boolean, byAmount: boolean, byPercentage: boolean }) {
		if (prohibitedNumbers.some((item) => item.number === Number(payload.number))) {
			// TODO el numero ya esta en la lista, mostrar mensaje de error
			return;
		}
		
		const value = Number(payload.number);
		const amount = Number(payload.amount);
		const starter = Number(payload.starter);
		const canSellAfterAmount = payload.canSellAfterAmount;
		const byAmount = payload.byAmount;
		const byPercentage = payload.byPercentage;
		if (!Number.isFinite(amount)) {
			return;
		}
		const response = await fetch('/number/prohibited', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ 
				number: value, 
				amount, starter, 
				can_sell_after_amount: canSellAfterAmount, 
				by_amount: byAmount,
				by_percentage: byPercentage })
		});
		if (!response.ok) {
			return;
		}
		prohibitedNumbers = prohibitedNumbers.some((item) => item.number === value)
			? prohibitedNumbers
			: [...prohibitedNumbers, { 
				number: value, 
				amount, 
				starter, 
				can_sell_after_amount: canSellAfterAmount, 
				by_amount: byAmount, 
				by_percentage: byPercentage }].sort((a, b) => a.number - b.number);
		showAddProhibitedModal = false;
	}

	const handleUpdateProhibitedNumber = async (payload: 
	{ 
		id: number; 
		number: string; 
		amount: string, 
		starter: string, 
		can_sell_after_amount: boolean, 
		by_amount: boolean, 
		by_percentage: boolean 
	}) => {

		const response = await fetch(`/number/prohibited/${payload.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!response.ok) {
			//TODO send notification of error
			return;
		}
		prohibitedNumbers = prohibitedNumbers.map((item) => 
			item.id === payload.id 
			? { 
				...item, 
				amount: Number(payload.amount), 
				starter: Number(payload.starter), 
				can_sell_after_amount: Boolean(payload.can_sell_after_amount), 
				by_amount: Boolean(payload.by_amount), 
				by_percentage: Boolean(payload.by_percentage) 
			} : item
		);
		showUpdateProhibitedModal = false;
	}

    const prohibitedItems = Array.isArray(data?.prohibitedItems)
		? (data.prohibitedItems as prohibitedNumber[])
		: [];
		prohibitedNumbers = prohibitedItems
			.map((item) => ({
				id: item.id,
				number: Number(item.number),
				amount: Number(item.amount),
				starter: Number(item.starter),
				can_sell_after_amount: Boolean(item.can_sell_after_amount),
				by_amount: Boolean(item.by_amount),
				by_percentage: Boolean(item.by_percentage)
			}))
			.filter((item) => Number.isFinite(item.number) && Number.isFinite(item.amount))
			.sort((a, b) => a.number - b.number);


	function showDeleteProhibitedNumber(value: number) {
		prohibitedNumberToDelete = value;
		showDeleteProhibitedModal = true;
	}

	function openUpdateProhibitedModal(prohibitedNumber: prohibitedNumber) {
		selectedProhibitedNumber = prohibitedNumber;
		showUpdateProhibitedModal = true;
	}
</script>

<svelte:head>
    <title>En desarrollo</title>
</svelte:head>

<ConfirmModal
	bind:showModal={showDeleteProhibitedModal}
	message={
		prohibitedNumberToDelete == null
			? 'Eliminar numero restringido?'
			: `Eliminar el numero ${prohibitedNumberToDelete}?`
	}
	confirmText="Eliminar"
	cancelText="Cancelar"
	confirm={handleConfirmDeleteProhibitedNumber}
/>

<ProhibitedNumberModal
	bind:showModal={showUpdateProhibitedModal}
	bind:prohibited={selectedProhibitedNumber}
	title="Actualizar numero restringido"
	confirmText="Guardar"
	cancelText="Cancelar"
	handleUpdateProhibitedNumber={handleUpdateProhibitedNumber}
/>

<ProhibitedNumberModal
	bind:showModal={showAddProhibitedModal}
	title="Agregar numero restringido"
	confirmText="Guardar"
	cancelText="Cancelar"
	handleAddProhibitedNumber={handleAddProhibitedNumber}
/>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="inicio">
    <div class="ganadores">
        <h2>Aun tienes pendiente de asignar los ganadores de los sorteos:</h2>
        
    </div>
    <div class="content">
        <div class="left">
            <div class="filters">
                <div class="field">
                    <label for="desde">Fecha</label>
                    <input id="desde" type="date" value="2026-02-16" />
                </div>
                <div class="field">
                    <label for="puesto">Puesto</label>
                    <!-- <Select items={puestoOptions} /> -->
                    <input id="puesto" type="text" value="" />
                </div>
                <div class="field">
                    <label for="sorteo">Sorteo</label>
                    <input id="sorteo" type="text" value="" />
                </div>
            </div>
            <Matrix />
        </div>
        <div class="right">
            <h2>Opciones</h2>
			<button type="button" class="option-button" disabled>
				Exportar xlsx
			</button>
			<button type="button" class="option-button" disabled>
				Ver QR
			</button>

        </div>
    </div>
    <header>
        <div class="prohibited">
            <span class="label">Restringidos:</span>
            <div class="prohibited-list">
				<button
					class={`prohibited-badge`}
					onclick={() => {}}
					aria-label={`Actualizar numero restringido}`}
				>
					<span class="prohibited-number">Numero</span>
					
					<span class="prohibited-amount">Monto</span>
					<span class="prohibited-starter">Arranque</span>

				</button>
                {#if prohibitedNumbers?.length}
                    {#each prohibitedNumbers as prohibitedNumber}
                        <button
                            class={`prohibited-badge ${!prohibitedNumber.can_sell_after_amount ? 'can-sell-after-amount' : ''}`}
                            onclick={() => {openUpdateProhibitedModal(prohibitedNumber);}}
                            aria-label={`Actualizar numero restringido ${prohibitedNumber.number}`}
                        >
							<span class="prohibited-number">{prohibitedNumber.number}</span>
							
							<span class="prohibited-amount">{prohibitedNumber.amount}</span>
							<span class="prohibited-starter">{prohibitedNumber.starter}</span>

						</button>
                    {/each}
                {:else}
                    <span class="prohibited-empty">-</span>
                {/if}
                <button
                    type="button"
                    class="prohibited-badge prohibited-add"
                    onclick={openAddProhibitedModal}
                    aria-label="Agregar numero restringido"
                >
                    +
                </button>
            </div>
        </div> 
    </header>
</section>
{/if}

<style>
    .inicio {
        flex: 1;
		justify-content: space-between;
        flex-direction: column;
    }

    .left {
		border: 1px solid var(--color-border);
		display: flex;
		padding: 1rem;
		flex-direction: column;
        flex: 3;
		gap: 1rem;
    }
    .right {
        flex: 1;
		border: 1px solid var(--color-border);
		padding: 1rem;
		gap: 1rem;
		display: flex;
		flex-direction: column;
    }

	.option-button {
		width: 100%;
	}

    .content {
		padding: 1rem;
		background-color: var(--color-box-background);
		border: 1px solid var(--color-border);
        display: flex;
        gap: 1rem;
    }

	.ganadores {
		padding: 1rem;
		background-color: var(--color-box-background);
		border: 1px solid var(--color-border);
		margin-bottom: 1rem;
		display: flex;
		width: 100%;
	}
	.prohibited {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: start;
	}
	.prohibited-badge {
		display: flex;
		flex-direction: column;
		font-size: 1.1rem;
		border-radius: 0;
		padding: 0rem;
		min-width: 50px;
		border: 2px solid var(--color-border);
		color: var(--color-text);
		width: fit-content;
		height: 100%;
		gap: 0;
	}
	
	.prohibited-badge *{
		padding: 0.35rem;
	}

	.prohibited-badge:hover {
		background-color: white;
		color: var(--color-theme-1);
	}
/* 
	.can-sell-after-amount {
		background-color: black;
	}
    */
	.prohibited-add {
		border-style: dashed;
		color: var(--color-theme-2);
		border-color: var(--color-theme-2);
		font-weight: 600;
	}

	.prohibited-list{
		gap: 0;
		display: flex;
		flex-direction: row;
	}

	.prohibited-amount, .prohibited-starter {
		font-size: 0.85rem;
		border-top: 2px solid var(--color-border);
		width: 100%;
		font-weight: 500;
	}
</style>
