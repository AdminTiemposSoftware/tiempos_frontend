<script lang="ts">
	let {
		showModal = $bindable(),
		schedule = $bindable<schedule>({
			id: null,
			name: '',
			time: '',
			is_reventado: false,
			is_megareventado: false
		}),
		sorteoId = $bindable(0),
        addSchedule
	} = $props();
	
	type schedule = {
		id: number | null;
		name: string;
		time: string;
		is_reventado: boolean;
		is_megareventado: boolean;
	};

	function onClose() {
		showModal = false;
	}

	async function handleSubmit() {
		const name = schedule.name?.trim();
		const time = schedule.time?.trim();
		const payload = {
			name,
			time,
			draw_id: sorteoId
		};

		if (!payload.name || !payload.time || !sorteoId) {
			return;
		}

		try {
			const res = await fetch('/banca/sorteos/draw-schedule', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const responsePayload = await res.json().catch(() => null);
			if (!res.ok) {
				console.error('Failed to create schedule', responsePayload);
				return;
			}
			const createdId = Array.isArray(responsePayload?.items)
				? responsePayload.items[0]?.id
				: null;
			addSchedule({ sorteoId, name, time, id: createdId ?? undefined });
			onClose();
		} catch (error) {
			console.error('Failed to create schedule', error);
		}
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
