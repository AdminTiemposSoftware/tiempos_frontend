<script lang="ts">
	import { untrack } from 'svelte';

	type Puesto = {
		id?: number;
		name: string;
		location: string;
		prohibited_percentage: number | '';
		comission: number | '' | null;
		buy: number | '' | null;
		buy_first_place: number | '' | null;
	};

	let {
		showModal = $bindable(),
		puesto = $bindable({ id: -1, banking_id: null, name: '', location: '', prohibited_percentage: 0, comission: null, buy: null, buy_first_place: null, users: [] }),
		updatePuesto = $bindable(),
		addPuesto = $bindable()
	} = $props();
	let buyEnabled = $state(false);
	let prohibitedEnabled = $state(false);

	$effect(() => {
		if (showModal) {
			buyEnabled = untrack(() =>
				(puesto?.buy !== null && puesto?.buy !== undefined) ||
				(puesto?.buy_first_place !== null && puesto?.buy_first_place !== undefined)
			);
			if (puesto?.buy !== null && puesto?.buy !== undefined && puesto?.buy !== '') {
				puesto.buy = Number(puesto.buy);
			}
			if (puesto?.buy_first_place !== null && puesto?.buy_first_place !== undefined && puesto?.buy_first_place !== '') {
				puesto.buy_first_place = Number(puesto.buy_first_place);
			}
			prohibitedEnabled = untrack(() => puesto?.prohibited_percentage !== null && puesto?.prohibited_percentage !== undefined);
		}
	});

	function onClose() {
		showModal = false;
	}

	async function handleSubmit() {
		if (!puesto) {
			return;
		}

		const buy = buyEnabled && puesto.buy !== '' && puesto.buy !== null && puesto.buy !== undefined
			? Number(puesto.buy)
			: null;

		const buy_first_place = buyEnabled && puesto.buy_first_place !== '' && puesto.buy_first_place !== null && puesto.buy_first_place !== undefined
			? Number(puesto.buy_first_place)
			: null;

		const payload: Puesto = {
			id: puesto.id,
			name: puesto.name.trim(),
			comission: Number(puesto.comission || 0),
			location: puesto.location.trim(),
			prohibited_percentage: Number(puesto.prohibited_percentage || 0),
			buy,
			buy_first_place
		};

		if (!payload.name || !payload.location) {
			return;
		}

		if (puesto.id && puesto.id > 0)
			await updatePuesto(payload);
		else
			await addPuesto(payload);
	}
</script>

{#if showModal}
	<div
		class="modal-backdrop"
		role="button"
		onclick={onClose}
		onkeydown={(e) => e.key === "Escape" && onClose()}
		tabindex="0"
	>
		{#if puesto}
			<div
				class="modal"
				onclick={(e) => e.stopPropagation()}
				role="presentation"
			>
				<h2 class="modal-title">{puesto?.id ? 'Editar Puesto' : 'Agregar Nuevo Puesto'}</h2>
				<form class="modal-form"
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
				>
					<label class="modal-label" for="name">Nombre</label>
					<input class="modal-input" id="name" type="text" bind:value={puesto.name} required />

					<label class="modal-label" for="location">Ubicacion</label>
					<input class="modal-input" id="location" type="text" bind:value={puesto.location} required />

					<label class="modal-label" for="comission">Comision</label>
					<input
						class="modal-input"
						id="comission"
						type="number"
						min="0"
						max="100"
						step="0.01"
						bind:value={puesto.comission}
					/>

					<label class="modal-label checkbox-label row" for="prohibited-enabled">
						<input
							id="prohibited-enabled"
							type="checkbox"
							bind:checked={prohibitedEnabled}
							onchange={() => {puesto.prohibited_percentage = prohibitedEnabled ? (puesto.prohibited_percentage ?? 0) : null;}}
						/>
						Porcentaje prohibido
					</label>
					<input
						class="modal-input"
						id="prohibited-percentage"
						type="number"
						min="0"
						max="100"
						step="0.01"
						bind:value={puesto.prohibited_percentage}
					/>

					<label class="modal-label checkbox-label row" for="buy-enabled">
						<input
							id="buy-enabled"
							type="checkbox"
							bind:checked={buyEnabled}
							onchange={() => {
								puesto.buy = buyEnabled ? (puesto.buy ?? 0) : null;
								puesto.buy_first_place = buyEnabled ? (puesto.buy_first_place ?? 0) : null;
							}}
						/>
						Compra
					</label>

					{#if buyEnabled}
					<div class="row">
					<div>
						<label class="modal-label" for="buy">Comision</label>
						<input
							class="modal-input"
							id="buy"
							type="number"
							min="0"
							step="1"
							bind:value={puesto.buy}
							oninput={() => {
								if (puesto.buy === '') {
									puesto.buy = 0;
								}
							}}
							required
						/>
					</div>
					<div>
						<label class="modal-label" for="buy-first-place">Ganador</label>
						<input
							class="modal-input"
							id="buy-first-place"
							type="number"
							min="0"
							step="1"
							bind:value={puesto.buy_first_place}
							oninput={() => {
								if (puesto.buy_first_place === '') {
									puesto.buy_first_place = 0;
								}
							}}
							required
						/>
					</div>
					</div>
					{/if}

					<div class="modal-actions">
						<button type="button" onclick={onClose} >Cancelar</button>
						<button type="submit">Guardar</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
{/if}

<style>
	.modal-input {
	    width: 100%;
	}
</style>
