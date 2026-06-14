<script lang="ts">
    import { auth } from '$lib/stores/auth';
	import ProhibitedNumberModal from '$lib/components/ProhibitedNumberModal.svelte';
    import ConfirmModal from '$lib/components/ConfirmModal.svelte';
    import Matrix from '../../../lib/components/venta/Matrix.svelte';
	import Select from 'svelte-select';

	let prohibitedNumberToDelete = $state<number | null>(null);
	let newProhibitedNumber = $state('');
	let newProhibitedAmount = $state('');
	let newProhibitedStarter = $state('');
	let newProhibitedCanSellAfterAmount = $state(true);
	let prohibitedNumbers = $state<prohibitedNumber[]>([]);
	let showDeleteProhibitedModal = $state(false);
	let showAddProhibitedModal = $state(false);
	let puestoOptions = $state<string[]>([]);
	
    let { data } = $props();

	type prohibitedNumber = {
		number: number;
		amount: number;
		starter: number;
		canSellAfterAmount: boolean;
	};

    function handleConfirmDeleteProhibitedNumber() {
		if (prohibitedNumberToDelete == null) {
			return;
		}
		prohibitedNumbers = prohibitedNumbers.filter((item) => item.number !== prohibitedNumberToDelete);
		prohibitedNumberToDelete = null;
	}

	function openAddProhibitedModal() {
		newProhibitedNumber = '';
		newProhibitedAmount = '';
		newProhibitedStarter = '';
		newProhibitedCanSellAfterAmount = true;
		showAddProhibitedModal = true;
	}

    
	async function handleAddProhibitedNumber(payload: { number: string; amount: string, starter: string, canSellAfterAmount: boolean }) {
		if (prohibitedNumbers.some((item) => item.number === Number(payload.number))) {
			// TODO el numero ya esta en la lista, mostrar mensaje de error
			return;
		}
		
		const value = Number(payload.number);
		const amount = Number(payload.amount);
		const starter = Number(payload.starter);
		const canSellAfterAmount = payload.canSellAfterAmount;
		if (!Number.isFinite(amount)) {
			return;
		}
		const response = await fetch('/number/prohibited', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ number: value, amount, starter, canSellAfterAmount })
		});
		if (!response.ok) {
			return;
		}
		prohibitedNumbers = prohibitedNumbers.some((item) => item.number === value)
			? prohibitedNumbers
			: [...prohibitedNumbers, { number: value, amount, starter, canSellAfterAmount }].sort((a, b) => a.number - b.number);
		newProhibitedNumber = '';
		newProhibitedAmount = '';
		newProhibitedStarter = '';
		newProhibitedCanSellAfterAmount = true;
		showAddProhibitedModal = false;
	}


    const prohibitedItems = Array.isArray(data?.prohibitedItems)
			? (data.prohibitedItems as prohibitedNumber[])
			: [];
		prohibitedNumbers = prohibitedItems
			.map((item) => ({
				number: Number(item.number),
				amount: Number(item.amount),
				starter: Number(item.starter),
				canSellAfterAmount: Boolean(item.canSellAfterAmount)
			}))
			.filter((item) => Number.isFinite(item.number) && Number.isFinite(item.amount))
			.sort((a, b) => a.number - b.number);


	function showDeleteProhibitedNumber(value: number) {
		prohibitedNumberToDelete = value;
		showDeleteProhibitedModal = true;
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
	bind:showModal={showAddProhibitedModal}
	bind:number={newProhibitedNumber}
	bind:amount={newProhibitedAmount}
	bind:starter={newProhibitedStarter}
	bind:canSellAfterAmount={newProhibitedCanSellAfterAmount}
	title="Agregar numero restringido"
	confirmText="Guardar"
	cancelText="Cancelar"
	onConfirm={handleAddProhibitedNumber}
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
                {#if prohibitedNumbers?.length}
                    {#each prohibitedNumbers as prohibitedNumber}
                        <div
                            class={`prohibited-badge test ${prohibitedNumber.canSellAfterAmount ? 'can-sell-after-amount' : ''}`}
                            onclick={() => showDeleteProhibitedNumber(prohibitedNumber.number)}
                            aria-label={`Eliminar numero restringido ${prohibitedNumber.number}`}
                        >
							<span class="prohibited-number">{prohibitedNumber.number}</span>
							<span class="prohibited-amount">{prohibitedNumber.amount}</span>
							<span class="prohibited-starter">{prohibitedNumber.starter}</span>

                        </div>

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

	.test {
		display: flex;
		flex-direction: column;
		font-size: 0.75rem;
		border-radius: 0.5rem;
		padding: 0.25rem 0.5rem;
		height: fit-content;
	}

	.can-sell-after-amount {
		background-color: black;
	}
   
	.prohibited-add {
		border-style: dashed;
		color: var(--color-theme-2);
		border-color: var(--color-theme-2);
		font-weight: 600;
	}
</style>