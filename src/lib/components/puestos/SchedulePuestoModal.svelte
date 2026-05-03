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
		addSchedulePuesto = $bindable(),
		updateSchedulePuesto = $bindable(),
		deleteSchedulePuesto = $bindable()
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

		if (payload?.id && updateSchedulePuesto) {
			updateSchedulePuesto(payload);
		} else {
			addSchedulePuesto(payload);
		}
		onClose();
	}

	function handleDelete() {
		if (!deleteSchedulePuesto || !puesto?.id || !sorteoId || !scheduleId) {
			return;
		}
		deleteSchedulePuesto({
			puestoId: puesto.id,
			sorteoId,
			scheduleId
		});
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
			<h2 class="modal-title">{puesto?.id ? 'Editar Puesto' : 'Agregar Puesto'}</h2>
			<form class="modal-form"
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<label class="modal-label" for="puesto-name">Puesto</label>
				<select class="modal-input" id="puesto-name" bind:value={puesto.merchantName} required>
					<option value="" disabled>Selecciona un puesto</option>
					{#each options as option}
						<option value={option}>{option}</option>
					{/each}
				</select>

				<label class="modal-label" for="puesto-commission">Comision</label>
				<input
					class="modal-input"
					id="puesto-commission"
					type="number"
					min="0"
					bind:value={puesto.commission}
				/>

				<label class="modal-label" for="puesto-normal">Pago normal</label>
				<input
					class="modal-input"
					id="puesto-normal"
					type="number"
					min="0"
					bind:value={puesto.normalPayment}
				/>

				<label class="modal-label" for="puesto-extra">Pago extra</label>
				<input
					class="modal-input"
					id="puesto-extra"
					type="number"
					min="0"
					bind:value={puesto.extraPayment}
				/>

				<div class="modal-actions modal-actions--form">
					<button type="button" onclick={onClose}>Cancelar</button>
					{#if puesto?.id}
						<button type="button" class="negative" onclick={handleDelete}>
							Eliminar
						</button>
					{/if}
					<button type="submit">Guardar</button>
				</div>
			</form>
		</div>
	</div>
{/if}
