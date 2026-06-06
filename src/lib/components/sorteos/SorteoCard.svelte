<script lang="ts">
	import { PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';

	let {
		sorteo,
		puestoOptions = [],
		puestoBySchedule = [],
		expanded = false,
		selectedSlot = null,
		onToggle,
		onToggleSchedule,
		onEditSorteo,
		onDeleteSorteo,
		onAddSchedule,
		onEditSchedule,
		onDeleteSchedule,
		onAddPuesto,
		onEditPuesto,
		onSaveScheduleSettings
	} = $props();

	type Puesto = {
		id: number;
		name: string;
		comission: number;
	};

	type DraftPuesto = {
		enabled: boolean;
		comission: number;
	};

	type ScheduleSettingsDraft = {
		is_reventado: boolean;
		is_megareventado: boolean;
		puestos: Record<number, DraftPuesto>;
	};

	const emptyDraft = (): ScheduleSettingsDraft => ({
		is_reventado: false,
		is_megareventado: false,
		puestos: {}
	});

	let draft = $state<ScheduleSettingsDraft>(emptyDraft());
	let draftScheduleId = $state<number | null>(null);
	let isDirty = $state(false);

	function buildDraftFromSelectedSlot() {
		const puestos = (selectedSlot?.puestos ?? []) as Puesto[];
		const nextDraft: ScheduleSettingsDraft = {
			is_reventado: Boolean(selectedSlot?.is_reventado),
			is_megareventado: Boolean(selectedSlot?.is_megareventado),
			puestos: {}
		};

		for (const puesto of puestoOptions) {
			const existing = puestos.find((item) => item.id === puesto.id);
			nextDraft.puestos[puesto.id] = {
				enabled: Boolean(existing),
				comission: Number(existing?.comission ?? puesto.comission ?? 0)
			};
		}

		return nextDraft;
	}

	$effect(() => {
		if (selectedSlot?.id == null) {
			draftScheduleId = null;
			draft = emptyDraft();
			isDirty = false;
			return;
		}

		if (draftScheduleId !== selectedSlot.id) {
			draftScheduleId = selectedSlot.id;
			draft = buildDraftFromSelectedSlot();
			isDirty = false;
		}
	});

	function handleToggle() {
		onToggle?.();
	}

	function handleToggleSchedule(scheduleId : number) {
		console.log(puestoOptions);
		console.log(puestoBySchedule);
		onToggleSchedule?.(scheduleId);
	}

	function handleEditSchedule() {
		if (selectedSlot?.id != null) {
			onEditSchedule?.(selectedSlot.id);
		}
	}

	function handleDeleteSchedule() {
		if (selectedSlot?.id != null) {
			onDeleteSchedule?.(selectedSlot.id);
		}
	}

	function handleAddPuesto() {
		if (selectedSlot?.id != null) {
			onAddPuesto?.(selectedSlot.id);
		}
	}

	function handleEditPuesto(puesto: any) {
		if (selectedSlot?.id != null) {
			onEditPuesto?.(puesto, selectedSlot.id);
		}
	}

	function getSelectedPuesto(puestoId: number): Puesto | null {
		if (!selectedSlot?.id) return null;
		const current = draft.puestos[puestoId];
		if (!current?.enabled) return null;
		const base = (sorteo.puestos as Puesto[]).find((item) => item.id === puestoId);
		return base
			? {
				id: base.id,
				name: base.name,
				comission: current.comission
			}
			: null;
	}

	function isPuestoEnabled(puestoId: number) {
		return Boolean(draft.puestos[puestoId]?.enabled);
	}

	function getPuestoCommission(puesto: Puesto) {
		return draft.puestos[puesto.id]?.comission ?? puesto.comission ?? 0;
	}

	function handleTogglePuestoEnabled(puesto: Puesto, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		draft = {
			...draft,
			puestos: {
				...draft.puestos,
				[puesto.id]: {
					enabled: input.checked,
					comission: draft.puestos[puesto.id]?.comission ?? Number(puesto.comission ?? 0)
				}
			}
		};
		isDirty = true;
	}

	function handleCommissionChange(puesto: Puesto, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		draft = {
			...draft,
			puestos: {
				...draft.puestos,
				[puesto.id]: {
					enabled: true,
					comission: Number(input.value || 0)
				}
			}
		};
		isDirty = true;
	}

	function handleToggleScheduleFlag(flag: 'is_reventado' | 'is_megareventado', event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		draft = {
			...draft,
			[flag]: input.checked
		};
		isDirty = true;
	}

	const hasPuestoOptions = () => Array.isArray(puestoOptions) && puestoOptions.length > 0;

	function handleSaveSettings() {
		if (selectedSlot?.id == null || !isDirty) return;
		onSaveScheduleSettings?.(selectedSlot.id, draft);
		isDirty = false;
	}

</script>

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
				<span class="chip chip--muted">{sorteo.days}</span>
			</div>
		</div>
		<div class="options-buttons">
			<button class="neutral" onclick={onEditSorteo}>
				<PenSolid class="shrink-0 h-4 w-4" />
			</button>
			<button class="negative" onclick={onDeleteSorteo}>
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
					{#if sorteo.schedule?.length === 0}
						<p class="empty-state">Sin horarios creados.</p>
					{:else}
						<div class="schedule-items scroll-thin">
							{#each sorteo.schedule as slot}
								<div
									class="schedule-item"
									class:schedule-item--active={selectedSlot && selectedSlot.id === slot.id}
									onkeydown={(e) => e.key === "Enter" && handleToggleSchedule(slot.id)}
									onclick={() => handleToggleSchedule(slot.id)}
									role="button"
									tabindex="0"
								>
									<div class="schedule-main">
										<span class="schedule-name">{slot.name}</span>
										<span class="schedule-time">{slot.time}</span>
									</div>
									<div class="options-buttons">
										<button class="negative" onclick={handleDeleteSchedule}>
											<TrashBinSolid class="shrink-0 h-4 w-4" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
				<div class="schedule-detail-panel">
					{#if selectedSlot}
						<div class="schedule-detail-configuration">
							<div class="schedule-detail-title">
								<label for="schedule-time">Hora de cierre</label>
								<input
									class="modal-input"
									id="schedule-time"
									type="time"
									bind:value={selectedSlot.time}
									required
								/>
								<div class="schedule-flag-group">
									<label class="flag-switch">
										<span>Reventado</span>
										<input
											class="switch-input"
											type="checkbox"
											checked={Boolean(selectedSlot.is_reventado)}
											onchange={(e) => handleToggleScheduleFlag('is_reventado', e)}
										/>
									</label>
									<label class="flag-switch">
										<span>Megareventado</span>
										<input
											class="switch-input"
											type="checkbox"
											checked={Boolean(selectedSlot.is_megareventado)}
											onchange={(e) => handleToggleScheduleFlag('is_megareventado', e)}
										/>
									</label>
								</div>
							</div>
							{#if hasPuestoOptions()}
								<div class="puesto-list scroll-thin">
									<h3>Puestos del horario</h3>
									{#each puestoOptions as puesto}
										{@const enabled = isPuestoEnabled(puesto.id)}
										<div class="puesto-item" >
											<label class="puesto-check">
												<input
													type="checkbox"
													checked={puestoBySchedule.some((p : { id: number }) => p.id === puesto.id)}
													onchange={(e) => handleTogglePuestoEnabled(puesto, e)}
												/>
												<span>{puesto.name}</span>
											</label>
											<label class="puesto-comission">
												<span>Comision</span>
												<input
													type="number"
													min="0"
													step="0.01"
													value={puestoBySchedule.find((p) => p.id === puesto.id)?.comission ?? '0'}
													disabled={!enabled}
													oninput={(e) => handleCommissionChange(puesto, e)}
												/>
											</label>
										</div>
									{/each}
								</div>
							{:else}
								<p class="empty-state">No hay puestos disponibles.</p>
							{/if}
						</div>

						<button type="button" disabled={!isDirty} onclick={handleSaveSettings} class="save-button">
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
		flex: 2;
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
	.flag-switch {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.45rem 0.65rem;
		border-radius: 0.6rem;
		background: var(--color-bg-2);
		font-size: 0.9rem;
		font-weight: 500;
	}
	.switch-input {
		appearance: none;
		width: 44px;
		height: 24px;
		border-radius: 999px;
		background: #d1d5db;
		position: relative;
		cursor: pointer;
		transition: background 160ms ease;
		border: 1px solid #cbd5f5;
	}
	.switch-input::after {
		content: '';
		position: absolute;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #fff;
		top: 2px;
		left: 2px;
		transition: transform 160ms ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}
	.switch-input:checked {
		background: var(--color-theme-1);
	}
	.switch-input:checked::after {
		transform: translateX(20px);
	}
	.switch-input:focus-visible {
		outline: 2px solid var(--color-theme-1);
		outline-offset: 2px;
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
</style>
