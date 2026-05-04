<script lang="ts">
	let {
		showModal = $bindable(),
		schedule = $bindable({
			name: '',
			time: ''
		}),
		sorteoId = $bindable(0),
        addSchedule
	} = $props();

	function onClose() {
		showModal = false;
	}

	function handleSubmit() {
		const payload = {
			sorteoId,
			name: schedule.name?.trim(),
			time: schedule.time?.trim()
		};

		if (!payload.name || !payload.time || !sorteoId) {
			return;
		}

		// TODO Send data to backend
		console.log('Submitting schedule:', payload);

		addSchedule(payload);
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
			<h2 class="modal-title">{schedule?.id ? 'Editar Horario' : 'Agregar Horario'}</h2>
			<form class="modal-form"
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<label class="modal-label" for="schedule-name">Nombre</label>
				<input class="modal-input" id="schedule-name" type="text" bind:value={schedule.name} required />

				<label class="modal-label" for="schedule-time">Hora</label>
				<input
					class="modal-input"
					id="schedule-time"
					type="time"
					bind:value={schedule.time}
					required
				/>

				<div class="modal-actions">
					<button type="button" onclick={onClose}>Cancelar</button>
					<button type="submit">Guardar</button>
				</div>
			</form>
		</div>
	</div>
{/if}
