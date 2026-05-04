<script lang="ts">
	import { PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';

	let {
		sorteo,
		expanded = false,
		selectedSlot = null,
		puestosHeadersLength = 0,
		onToggle,
		onSelectSchedule,
		onEditSorteo,
		onDeleteSorteo,
		onAddSchedule,
		onEditSchedule,
		onDeleteSchedule,
		onAddPuesto,
		onEditPuesto
	} = $props();

	function handleToggle() {
		onToggle?.();
	}

	function handleSelectSchedule(scheduleId) {
		onSelectSchedule?.(scheduleId);
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

	function handleEditPuesto(puesto) {
		if (selectedSlot?.id != null) {
			onEditPuesto?.(puesto, selectedSlot.id);
		}
	}

    function handleaaa() {
        alert('aaa');
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
					{#if sorteo.schedule.length === 0}
						<p class="empty-state">Sin horarios creados.</p>
					{:else}
						<div class="schedule-items scroll-thin">
							{#each sorteo.schedule as slot}
								<div
									class="schedule-item"
									class:schedule-item--active={selectedSlot && selectedSlot.id === slot.id}
									onkeydown={(e) => e.key === "Enter" && handleSelectSchedule(slot.id)}
									onclick={() => handleSelectSchedule(slot.id)}
									role="button"
									tabindex="0"
								>
									<div class="schedule-main">
										<span class="schedule-name">{slot.name}</span>
										<span class="schedule-time">{slot.time}</span>
									</div>
									<div class="options-buttons">
										<button class="neutral" onclick={handleEditSchedule}>
											<PenSolid class="shrink-0 h-4 w-4" />
										</button>
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
						<div class="schedule-detail-header">
							<h3>Puestos del horario</h3>
							<button onclick={handleAddPuesto}>
								Agregar puesto
							</button>
						</div>
						<div class="table-scroll table-scroll--rows">
							<table>
								<thead>
									<tr>
										<th>Puesto</th>
										<th>Comision</th>
									</tr>
								</thead>
								<tbody>
									{#if selectedSlot.puestos.length === 0}
										<tr>
											<td colspan={puestosHeadersLength} class="empty-state">
												Sin puestos en este horario
											</td>
										</tr>
									{:else}
										{#each selectedSlot.puestos as puesto}
											<tr
												class="row-action"
												tabindex="0"
												role="button"
												onclick={() => handleEditPuesto(puesto)}
												onkeydown={(e) => e.key === 'Enter' && handleEditPuesto(puesto)}
											>
												<td>{puesto.name}</td>
												<td>{puesto.commission}%</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					{:else}
						<p class="empty-state">Selecciona un horario para ver sus puestos.</p>
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
	.schedule-list-header h3 {
		margin: 0;
		font-size: 1rem;
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
	.schedule-detail-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.schedule-detail-header h3 {
		margin: 0;
		font-size: 1rem;
	}
	.schedule-pill {
		padding: 0.15rem 0.6rem;
		border-radius: 999px;
		background: var(--color-bg-2);
		font-size: 0.85rem;
		color: rgba(0, 0, 0, 0.7);
		font-weight: 600;
	}
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
	.row-action {
		cursor: pointer;
	}
	.row-action:hover {
		background: var(--color-bg-2);
	}
	.empty-state {
		text-align: center;
	}
</style>
