<script lang="ts">
	let {
		showModal = $bindable(),
		puesto = $bindable({
			merchantName: '',
			commission: 0,
			normalPayment: 0,
			extraPayment: 0
		}),
		options = $bindable([]),
		sorteoId = $bindable(0),
		scheduleId = $bindable(0),
        addSchedulePuesto = $bindable()
	} = $props();

	function onClose() {
		showModal = false;
	}

	function handleSubmit() {
		const payload = {
			...puesto,
			merchantName: puesto.merchantName?.trim()
		};

		if (!payload.merchantName || !sorteoId || !scheduleId) {
			return;
		}

		addSchedulePuesto(payload);
		onClose();
	}
</script>

{#if showModal}
	<div
		class="modal-backdrop"
		role="button"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		tabindex="0"
	>
		<div class="modal" onclick={(e) => e.stopPropagation()} role="presentation">
			<h2>Agregar Puesto</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<label for="puesto-name">Puesto</label>
				<select id="puesto-name" bind:value={puesto.merchantName} required>
					<option value="" disabled>Selecciona un puesto</option>
					{#each options as option}
						<option value={option}>{option}</option>
					{/each}
				</select>

				<label for="puesto-commission">Comision</label>
				<input id="puesto-commission" type="number" min="0" bind:value={puesto.commission} />

				<label for="puesto-normal">Pago normal</label>
				<input id="puesto-normal" type="number" min="0" bind:value={puesto.normalPayment} />

				<label for="puesto-extra">Pago extra</label>
				<input id="puesto-extra" type="number" min="0" bind:value={puesto.extraPayment} />

				<div class="modal-actions">
					<button type="button" onclick={onClose}>Cancelar</button>
					<button type="submit">Guardar</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
