<script lang="ts">
	import { PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';
	import { acts, Notifications} from '@tadashi/svelte-notification'

	let {
		sorteo,
		puestoOptions = [],
		expanded = false,
		selectedSchedule = null,
		onToggle,
		onToggleSchedule,
		onUpdateSchedule,
		onEditSorteo,
		onDeleteSorteo,
		onAddSchedule,
		onDeleteSchedule,
		onSaveScheduleSettings
	} = $props();

	type Puesto = {
		id: number;
		name: string;
		enabled: boolean;
		comission: number;
	};

	type ScheduleChanges = {
		name?: string;
		time?: string;
		is_reventado?: boolean;
		is_megareventado?: boolean;
		puestos?: Puesto[];
		days?: string[];
	};

	const dayOptions = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

	function handleToggle() {
		onToggle?.();
	}

	function handleToggleSchedule(scheduleId: number) {
		onToggleSchedule?.(scheduleId);
	}

	function handleDeleteSchedule(scheduleId: number, event: Event) {
		event.stopPropagation();
		if (scheduleId != null) {
			onDeleteSchedule?.(scheduleId);
		}
	}

	function updateSelectedSchedule(changes: ScheduleChanges) {
		if (selectedSchedule?.id != null) {
			onUpdateSchedule?.(selectedSchedule.id, changes);
		}
	}

	function handlePuestoChange(field: 'enabled' | 'comission', puesto: Puesto, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const currentPuestos = selectedSchedule?.puestos ?? [];
		const currentPuesto = currentPuestos.find((item) => item.id === puesto.id);
		const value = field === 'enabled' ? input.checked : (input.value === '' ? 0 : Number(input.value));
		const updatedPuestos = currentPuesto
			? currentPuestos.map((item) => item.id === puesto.id ? { ...item, [field]: value } : item)
			: [...currentPuestos, { ...puesto, enabled: field === 'enabled' ? Boolean(value) : true, comission: field === 'comission' ? Number(value) : 0 }];

		updateSelectedSchedule({ puestos: updatedPuestos });
	}

	function handleReventadosFlagChange(flag: 'is_reventado' | 'is_megareventado', event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		updateSelectedSchedule({ [flag]: input.checked });
	}

	function handleScheduleTimeChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		updateSelectedSchedule({ time: input.value });
	}

	function handleNameChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		updateSelectedSchedule({ name: input.value });
	}

	function handleDayChange(event: Event, day: string) {
		const input = event.currentTarget as HTMLInputElement;
		updateSelectedSchedule({ days: input.checked ? [...selectedSchedule.days, day] : selectedSchedule.days.filter((d) => d !== day) });
	}

	const hasPuestoOptions = Array.isArray(puestoOptions) && puestoOptions.length > 0;

	function handleSaveSettings() {
		if (selectedSchedule?.id == null) return;
		if ((selectedSchedule.puestos ?? []).some((p) => p.enabled && (p.comission <= 0 || isNaN(p.comission)))) {
			acts.add({
				message: 'Asigne una comisión válida',
				mode: 'error',
				lifetime: 3
			});
			return;
		}
		onSaveScheduleSettings?.(selectedSchedule.id, selectedSchedule);
	}

	function handleEditSorteo (event: Event) {
		event.stopPropagation();
		onEditSorteo?.();
	}

	function handleDeleteSorteo (event: Event) {
		event.stopPropagation();
		onDeleteSorteo?.();
	}

</script>
<Notifications/>
<div class="panel-card">
	<div
		class="panel-toggle"
		onclick={handleToggle}
		onkeydown={(e) => e.key === "Enter" && handleToggle()}
		role="button"
		tabindex="0"
	>
		<div class="panel-main">
			<span class="panel-title">{sorteo.name}</span>
			<div class="chip-row">
				{#if sorteo.is_reventado}
					<span class="chip">Reventado</span>
				{/if}
				{#if sorteo.is_megareventado}
					<span class="chip">Megareventado</span>
				{/if}
				{#if sorteo.days && sorteo.days.length > 0}
					{#each sorteo.days as day}
						<span class="chip chip--muted">{day}</span>
					{/each}
				{/if}
			</div>
		</div>
		<div class="options-buttons">
			<button class="neutral" onclick={handleEditSorteo}>
				<PenSolid class="shrink-0 h-4 w-4" />
			</button>
			<button class="negative" onclick={handleDeleteSorteo}>
				<TrashBinSolid class="shrink-0 h-4 w-4" />
			</button>
		</div>
	</div>
	{#if expanded}
		<div class="panel-content sorteo-content">
			<div class="schedule-split">
				<div class="schedule-list-panel">
					<div class="schedule-list-header">
						<h3>Horarios</h3>
						<button onclick={onAddSchedule}>
							Agregar horario
						</button>
					</div>
					{#if sorteo.schedules?.length === 0}
						<p class="empty-state">Sin horarios creados.</p>
					{:else}
						<div class="schedule-items scroll-thin">
							{#each sorteo.schedules as schedule}
								<div
									class="schedule-item"
									class:schedule-item--active={selectedSchedule && selectedSchedule.id === schedule.id}
									onkeydown={(e) => e.key === "Enter" && handleToggleSchedule(schedule.id)}
									onclick={() => handleToggleSchedule(schedule.id)}
									role="button"
									tabindex="0"
								>
									<div class="schedule-main">
										<span class="schedule-name">{schedule.name}</span>
										<span class="schedule-time">{schedule.time}</span>
									</div>
									<div class="options-buttons">
										<button class="negative" onclick={(event) => handleDeleteSchedule(schedule.id, event)}>
											<TrashBinSolid class="shrink-0 h-4 w-4" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
				<div class="schedule-detail-panel">
					{#if selectedSchedule}
                   	    <div class="schedule-days">
             			{#each dayOptions as day}
            				<div class="schedule-day flag-switch">
               					<input
                                    type="checkbox"
                                    checked={selectedSchedule.days.includes(day)}
                                    onchange={(e) => handleDayChange(e, day)}
     							/>
               					{day}
            				</div>
             			{/each}
                  		</div>
						<div class="schedule-detail-configuration">
							<div class="schedule-detail-title">
								<div class="question">
									<label for="schedule-name">Nombre del horario</label>
									<input
										class="modal-input"
										id="schedule-name"
										type="text"
										value={selectedSchedule.name}
										oninput={handleNameChange}
										required
									/>
								</div>
								<div class="question">
									<label for="schedule-time">Hora de cierre</label>
									<input
										class="modal-input"
										id="schedule-time"
										type="time"
										value={selectedSchedule.time}
										oninput={handleScheduleTimeChange}
										required
									/>
								</div>

								<div class="schedule-flag-group">
									<label class="flag-switch">
										<span>Reventado</span>
										<input
											class="switch-input"
											type="checkbox"
											checked={selectedSchedule.is_reventado}
											onchange={(e) => handleReventadosFlagChange('is_reventado', e)}
										/>
									</label>
									<label class="flag-switch">
										<span>Megareventado</span>
										<input
											class="switch-input"
											type="checkbox"
											checked={Boolean(selectedSchedule.is_megareventado)}
											onchange={(e) => handleReventadosFlagChange('is_megareventado', e)}
											disabled={Boolean(!selectedSchedule.is_reventado)}
										/>
									</label>
								</div>
							</div>
							{#if hasPuestoOptions}
								<div class="puesto-list scroll-thin">
									<h3>Puestos del horario</h3>
									{#each puestoOptions as puesto}
										<div class="puesto-item" >
											<label class="puesto-check">
												<input
													type="checkbox"
													checked={(selectedSchedule.puestos ?? []).some((p) => p.id === puesto.id && p.enabled !== false)}
													onchange={(e) => handlePuestoChange("enabled", puesto, e)}
												/>
												<span>{puesto.name}</span>
											</label>
											<label class="puesto-comission">
												<span>Comision</span>
												<input
													type="number"
													min="0"
													step="0.01"
													value={(selectedSchedule.puestos ?? []).find((p) => p.id === puesto.id)?.comission || ''}
													oninput={(e) => handlePuestoChange("comission", puesto, e)}
												/>
											</label>
										</div>
									{/each}
								</div>
							{:else}
								<p class="empty-state">No hay puestos disponibles.</p>
							{/if}
						</div>

						<button type="button" onclick={handleSaveSettings} class="save-button">
							Guardar cambios
						</button>
					{:else}
						<p class="empty-state">Selecciona un horario para ver sus configuraciones.</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.sorteo-content {
		gap: 1.25rem;
	}
	.schedule-split {
		display: flex;
		flex-direction: row;
		gap: 1rem;
	}
	.schedule-list-panel {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: #fff;
		padding: 0.75rem;
	}
	.schedule-list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.schedule-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 320px;
		overflow-y: auto;
		padding-right: 0.25rem;
	}
	.schedule-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		border: 1px solid transparent;
		border-radius: 0.45rem;
		padding: 0.55rem 0.65rem;
		background: var(--color-bg-2);
		cursor: pointer;
		text-align: left;
	}
	.schedule-item:hover {
		background: #f0f0f0;
	}
	.schedule-item--active {
		border-color: var(--color-theme-1);
		background: #fff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}
	.schedule-detail-panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex: 3;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: #fff;
		padding: 0.75rem;
		min-height: 200px;
	}
	.schedule-detail-configuration {
		display: flex;
		flex-direction: row;
		align-items: start;
		gap: 0.75rem;
	}
	.schedule-detail-title {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
	.schedule-flag-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.puesto-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		max-height: 360px;
		overflow-y: auto;
		padding-right: 0.25rem;
		flex: 1
	}
	.puesto-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 0.55rem;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.65rem;
		background: var(--color-bg-2);
	}
	.puesto-check {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
	}
	.puesto-comission {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.9rem;}
	.schedule-main {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.schedule-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #000000;
	}
	.schedule-time {
		font-size: 0.8rem;
		color: rgba(0, 0, 0, 0.6);
	}
	.empty-state {
		text-align: center;
		margin-top: auto;
		margin-bottom: auto;
	}
	.save-button {
		margin-top: auto;
	}
	.question {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.schedule-days {
	    gap:0;
		width: 100%;
		display: flex;
		flex-direction: row;
	}
	.schedule-day {
		display: flex;
		width: 100%;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 600;
		border-radius: 0;
		border: 1px solid var(--color-border);
	}
</style>
