<script lang="ts">
	type PuestoOption = {
		id: number;
		name: string;
	};

	let {
		showModal = $bindable(),
		puesto = $bindable({
			id: -1,
			name: '',
			commission: 0,
		}),
		options = $bindable([] as PuestoOption[]),
		sorteoId = $bindable(0),
		scheduleId = $bindable(0),
		addSchedulePuesto = $bindable(),
		updateSchedulePuesto = $bindable(),
		deleteSchedulePuesto = $bindable()
	} = $props();

	function onClose() {
		showModal = false;
	}

	async function handleSubmit() {
		const branchId = Number(puesto?.id ?? 0);
		const commission = Number(puesto?.commission ?? 0);
		const selectedOption = options.find((option) => option.id === branchId);

		if (!branchId || !scheduleId || !sorteoId || !selectedOption?.name) {
			return;
		}

		const payload = {
			branch_id: branchId,
			draw_schedule_id: scheduleId,
			comission: commission
		};

		try {
			const res = await fetch('/sorteos/draw-schedule-branch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const responsePayload = await res.json().catch(() => null);
			if (!res.ok) {
				console.error('Failed to assign schedule to branch', responsePayload);
				return;
			}

			if (addSchedulePuesto) {
				addSchedulePuesto({
					id: branchId,
					name: selectedOption.name,
					commission
				});
			}
			onClose();
		} catch (error) {
			console.error('Failed to assign schedule to branch', error);
		}
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
				<select class="modal-input" id="puesto-name" bind:value={puesto.id} required>
					<option value="" disabled>Selecciona un puesto</option>
					{#each options as option}
						<option value={option.id}>{option.name}</option>
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

				<div class="modal-actions">
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
