<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import SchedulePuestoModal from '$lib/components/puestos/SchedulePuestoModal.svelte';
	import ScheduleModal from '$lib/components/sorteos/ScheduleModal.svelte';
	import SorteoModal from '$lib/components/sorteos/SorteoModal.svelte';
	import AssignSorteoModal from '$lib/components/sorteos/AssignSorteoModal.svelte';
	import AssignPuestoModal from '$lib/components/sorteos/AssignPuestoModal.svelte';
	import { PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';

	let puestosHeaders = [
		{ key: 'branch', label: 'Puesto' },
		{ key: 'commission', label: 'Comision' },
	];

	let sorteos = $state([
		{
			id: 1,
			name: 'Loteria Nacional',
			is_reventado: true,
			is_megareventado: true,
			days: 'Lun, Mar, Mie, Jue, Vie',
			schedule: [
				{
					id: 10,
					name: 'Manana',
					time: '12:00',
					puestos: [
						{
							id: 101,
							name: 'Comercio Central',
							commission: 10,
							commission2: 5,
							normalPayment: 60,
							extraPayment: 90
						}
					]
				},
				{
					id: 12,
					name: 'Noche',
					time: '20:00',
					puestos: [
						{
							id: 102,
							name: 'Punto Norte',
							commission: 12,
							commission2: 6,
							normalPayment: 70,
							extraPayment: 100
						}
					]
				}
			]
		},
		{
			id: 2,
			name: 'Loteria Premium',
			is_reventado: true,
			is_megareventado: false,
			days: 'Sab, Dom',
			schedule: [
                {
                    id: 11,
                    name: 'Mañana',
                    time: '18:00',
                    puestos: [
                        {
                            id: 201,
                            name: 'Sucursal Sur',
                            commission: 15,
                            commission2: 7,
                            normalPayment: 80,
                            extraPayment: 120,
                        },
                        {
                            id: 201,
                            name: 'Sucursal Sur',
                            commission: 15,
                            commission2: 7,
                            normalPayment: 80,
                            extraPayment: 120,
                        }
                    ]
                }            
            ]
		}
	]);

	const puestoOptions = [
		'Comercio Central',
		'Punto Norte',
		'Sucursal Sur',
		'Puesto Norte',
		'Tienda Centro'
	];

	let showSchedulePuestoModal = $state(false);
	let showScheduleModal = $state(false);
	let showSorteoModal = $state(false);
	let showDeleteScheduleModal = $state(false);
	let showDeletePuestoModal = $state(false);
	let showDeleteSorteoModal = $state(false);
	let showAssignSorteoModal = $state(false);
	let showAssignPuestoModal = $state(false);
	let selectedSorteo = $state(null);
	let selectedSchedule = $state(null);
	let selectedSorteoId = $state(0);
	let selectedScheduleId = $state(0);
	let selectedSchedulePuesto = $state(null);
	let selectedShortcutSorteoId = $state<number | null>(null);
	let selectedShortcutPuesto = $state('');
	let selectedShortcutPuestoForAll = $state('');
	let selectedShortcutSorteoForAll = $state<number | null>(null);
	let puestoToDelete = $state(null);
	let scheduleToDelete = $state(null);
	let sorteoToDelete = $state(null);
	let expandedSorteo = $state<number[]>([]);
	let selectedScheduleBySorteo = $state<Record<number, number | null>>({});

	// UI state toggles
	function toggleSorteo(sorteoId: number) {
		const isOpen = expandedSorteo.includes(sorteoId);
		if (isOpen) {
			expandedSorteo = expandedSorteo.filter((id) => id !== sorteoId);
			return;
		}
		expandedSorteo = [...expandedSorteo, sorteoId];
		const sorteo = sorteos.find((item) => item.id === sorteoId);
		if (sorteo && sorteo.schedule.length > 0 && selectedScheduleBySorteo[sorteoId] == null) {
			selectedScheduleBySorteo = { ...selectedScheduleBySorteo, [sorteoId]: sorteo.schedule[0].id };
		}
	}

	function selectSchedule(sorteoId: number, scheduleId: number) {
		selectedScheduleBySorteo = { ...selectedScheduleBySorteo, [sorteoId]: scheduleId };
	}

	function getSelectedSchedule(sorteo) {
		const selectedId = selectedScheduleBySorteo[sorteo.id];
		const selected = sorteo.schedule.find((slot) => slot.id === selectedId);
		return selected ?? sorteo.schedule[0] ?? null;
	}

	// Open modals for create actions
	function handleAddSorteo() {
		selectedSorteo = { name: '', type: 'Tiempos', days: '' };
		showSorteoModal = true;
	}

	function showAddSchedule(sorteoId: number) {
		selectedSchedule = { name: '', time: '' };
		selectedSorteoId = sorteoId;
		showScheduleModal = true;
	}

	function showAddPuestoToSchedule(sorteoId: number, scheduleId: number) {
		selectedSorteoId = sorteoId;
		selectedScheduleId = scheduleId;
		selectedSchedulePuesto = {
			merchantName: '',
			commission: 0,
			normalPayment: 0,
			extraPayment: 0
		};
		showSchedulePuestoModal = true;
	}

	// Open modals for edit/view actions
	function showEditSorteo(sorteoId: number) {
		selectedSorteo = { ...sorteos.find((s) => s.id === sorteoId) };
		showSorteoModal = true;
	}

	function showEditSchedule(sorteoId: number, scheduleId: number) {
		selectedSchedule = {
			...sorteos.find((s) => s.id === sorteoId)?.schedule.find((s) => s.id === scheduleId)
		};
		showScheduleModal = true;
	}

	function showEditPuestoFromSchedule(puesto, sorteoId, scheduleId) {
		selectedSorteoId = sorteoId;
		selectedScheduleId = scheduleId;
		selectedSchedulePuesto = { ...puesto, merchantName: puesto.name };
		showSchedulePuestoModal = true;
	}

	// Open modals for delete actions
	function showDeletePuestoFromSchedule(puesto) {
		puestoToDelete = puesto;
		showDeletePuestoModal = true;
	}

	function showDeleteSchedule(sorteoId: number, scheduleId: number) {
		scheduleToDelete = sorteos.find((s) => s.id === sorteoId)?.schedule.find((s) => s.id === scheduleId);
		showDeleteScheduleModal = true;
	}

	function showDeleteSorteo(sorteoId: number) {
		sorteoToDelete = sorteos.find((s) => s.id === sorteoId);
		showDeleteSorteoModal = true;
	}

	// Create handlers
	function handleAddSorteoSubmit(event: CustomEvent) {
		const newSorteo = event.detail;
		const nextId = Math.max(0, ...sorteos.map((item) => item.id)) + 1;
		sorteos = [...sorteos, { ...newSorteo, id: nextId }];
	}

	function handleAddScheduleSubmit(payload) {
		const { sorteoId, name, time } = payload;
		sorteos = sorteos.map((sorteo) => {
			if (sorteo.id !== sorteoId) {
				return sorteo;
			}
			const nextId = Math.max(0, ...sorteo.schedule.map((item) => item.id)) + 1;
			return {
				...sorteo,
				schedule: [...sorteo.schedule, { name, time, id: nextId, puestos: [] }]
			};
		});
	}

	function handleAddSchedulePuestoSubmit(puesto) {
		const sorteoId = selectedSorteoId;
		const scheduleId = selectedScheduleId;
		if (!sorteoId || !scheduleId) {
			return;
		}
		const nextPuesto = {
			...puesto,
			name: puesto.merchantName ?? puesto.name
		};
		sorteos = sorteos.map((sorteo) => {
			if (sorteo.id !== sorteoId) {
				return sorteo;
			}
			return {
				...sorteo,
				schedule: sorteo.schedule.map((slot) => {
					if (slot.id !== scheduleId) {
						return slot;
					}
					const nextId = Math.max(0, ...slot.puestos.map((item) => item.id)) + 1;
					return {
						...slot,
						puestos: [...slot.puestos, { ...nextPuesto, id: nextId }]
					};
				})
			};
		});
	}

	// Update handlers
	function updateSorteo(updatedSorteo) {
		sorteos = sorteos.map((sorteo) =>
			sorteo.id === updatedSorteo.id ? { ...sorteo, ...updatedSorteo } : sorteo
		);
	}

	function updateSchedule(updatedSchedule) {
		// TODO Send update request to backend
		sorteos = sorteos.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.map((slot) =>
				slot.id === updatedSchedule.id ? { ...slot, ...updatedSchedule } : slot
			)
		}));
	}

	function updateSchedulePuesto(updatedPuesto) {
		// TODO Send update request to backend
		const sorteoId = selectedSorteoId;
		const scheduleId = selectedScheduleId;
		if (!sorteoId || !scheduleId || !updatedPuesto?.id) {
			return;
		}
		const normalized = {
			...updatedPuesto,
			name: updatedPuesto.merchantName ?? updatedPuesto.name
		};
		sorteos = sorteos.map((sorteo) => {
			if (sorteo.id !== sorteoId) {
				return sorteo;
			}
			return {
				...sorteo,
				schedule: sorteo.schedule.map((slot) =>
					slot.id === scheduleId
						? {
							...slot,
							puestos: slot.puestos.map((puesto) =>
								puesto.id === normalized.id ? { ...puesto, ...normalized } : puesto
							)
						}
						: slot
				)
			};
		});
	}

	function deleteSchedulePuesto(payload) {
		// TODO Send delete request to backend
		const sorteoId = payload?.sorteoId ?? selectedSorteoId;
		const scheduleId = payload?.scheduleId ?? selectedScheduleId;
		const puestoId = payload?.puestoId;
		if (!sorteoId || !scheduleId || !puestoId) {
			return;
		}
		sorteos = sorteos.map((sorteo) => {
			if (sorteo.id !== sorteoId) {
				return sorteo;
			}
			return {
				...sorteo,
				schedule: sorteo.schedule.map((slot) =>
					slot.id === scheduleId
						? { ...slot, puestos: slot.puestos.filter((puesto) => puesto.id !== puestoId) }
						: slot
				)
			};
		});
	}

	// Delete handlers
	function handleConfirmDeletePuesto() {
		// TODO Send delete request to backend
		if (!puestoToDelete) {
			return;
		}
		sorteos = sorteos.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.map((slot) => ({
				...slot,
				puestos: slot.puestos.filter((puesto) => puesto.id !== puestoToDelete?.id) //Asume puesto ids are unique across sorteos and horarios for simplicidad, otherwise also check sorteoId and scheduleId
			}))
		}));
		puestoToDelete = null;
	}

	function handleConfirmDeleteSchedule() {
		// TODO Send delete request to backend
		sorteos = sorteos.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.filter((slot) => slot.id !== scheduleToDelete?.id) //Asume schedule ids are unique across sorteos for simplicity, otherwise also check sorteoId
		}));
		scheduleToDelete = null;
	}

	function handleConfirmDeleteSorteo() {
		// TODO Send delete request to backend
		sorteos = sorteos.filter((sorteo) => sorteo.id !== sorteoToDelete?.id);
		sorteoToDelete = null;
	}

	function openAssignSorteoModal() {
		selectedShortcutSorteoId = sorteos[0]?.id ?? null;
		selectedShortcutPuesto = puestoOptions[0] ?? '';
		showAssignSorteoModal = true;
	}

	function handleAssignSorteoToPuestos() {
		if (!selectedShortcutSorteoId || !selectedShortcutPuesto) {
			return;
		}
		// TODO Send request to backend
	}

	function openAssignPuestoModal() {
		selectedShortcutPuestoForAll = puestoOptions[0] ?? '';
		selectedShortcutSorteoForAll = sorteos[0]?.id ?? null;
		showAssignPuestoModal = true;
	}

	function handleAssignPuestoToSorteos() {
		if (!selectedShortcutPuestoForAll || !selectedShortcutSorteoForAll) {
			return;
		}
		// TODO Send request to backend
	}

</script>

<SchedulePuestoModal
	bind:showModal={showSchedulePuestoModal}
	bind:puesto={selectedSchedulePuesto}
	bind:sorteoId={selectedSorteoId}
	bind:scheduleId={selectedScheduleId}
	options={puestoOptions}
	addSchedulePuesto={handleAddSchedulePuestoSubmit}
	updateSchedulePuesto={updateSchedulePuesto}
	deleteSchedulePuesto={deleteSchedulePuesto}
/>

<ScheduleModal
	bind:showModal={showScheduleModal}
	bind:schedule={selectedSchedule}
	bind:sorteoId={selectedSorteoId}
	addSchedule={handleAddScheduleSubmit}
	updateSchedule={updateSchedule}
/>

<SorteoModal
	bind:showModal={showSorteoModal}
	bind:sorteo={selectedSorteo}
	addSorteo={handleAddSorteoSubmit}
	updateSorteo={updateSorteo}
/>

<ConfirmModal
	bind:showModal={showDeletePuestoModal}
	title="Eliminar puesto"
	message={`Estas seguro de eliminar ${puestoToDelete?.name ?? 'este puesto'} del horario?`}
	confirmText="Eliminar"
	cancelText="Cancelar"
	confirm={handleConfirmDeletePuesto}
/>

<ConfirmModal
	bind:showModal={showDeleteScheduleModal}
	title="Eliminar horario"
	message={`Estas seguro de eliminar ${scheduleToDelete?.name ?? 'este horario'} del sorteo?`}
	confirmText="Eliminar"
	cancelText="Cancelar"
	confirm={handleConfirmDeleteSchedule}
/>

<ConfirmModal
	bind:showModal={showDeleteSorteoModal}
	title="Eliminar sorteo"
	message={`Estas seguro de eliminar ${sorteoToDelete?.name ?? 'este sorteo'}?`}
	confirmText="Eliminar"
	cancelText="Cancelar"
	confirm={handleConfirmDeleteSorteo}
/>

<!-- TODO send the modal with the selected puestos for this sorteo -->
<AssignSorteoModal
	bind:showModal={showAssignSorteoModal}
	sorteos={sorteos}
	puestos={puestoOptions}
	bind:selectedSorteoId={selectedShortcutSorteoId}
	bind:selectedPuesto={selectedShortcutPuesto}
	title="Agregar sorteo a todos los puestos"
	confirmText="Aplicar"
	cancelText="Cancelar"
	confirm={handleAssignSorteoToPuestos}
/>

<AssignPuestoModal
	bind:showModal={showAssignPuestoModal}
	sorteos={sorteos}
	puestos={puestoOptions}
	bind:selectedSorteoId={selectedShortcutSorteoForAll}
	bind:selectedPuesto={selectedShortcutPuestoForAll}
	title="Agregar puesto en todos los sorteos"
	confirmText="Aplicar"
	cancelText="Cancelar"
	confirm={handleAssignPuestoToSorteos}
/>

<svelte:head>
	<title>Sorteos</title>
</svelte:head>
<section class="page-stack sorteos-page">
	<div class="header-contained">
		<div>
			<h1>Sorteos</h1>
			<p>Gestiona horarios y puestos por sorteo.</p>
		</div>
		<button onclick={handleAddSorteo}>
			Nuevo sorteo
		</button>
	</div>
	<div class="panel-list">
		{#each sorteos as sorteo}
			<div class="panel-card">
				<div 
					class="panel-toggle" 
					onclick={() => toggleSorteo(sorteo.id)}
					onkeydown={(e) => e.key === "Enter" && toggleSorteo(sorteo.id)}
					role="button"
					tabindex="0"
				>
					<div class="panel-main">
						<span class="panel-title">{sorteo.name}</span>
						<div class="chip-row">
							{#if sorteo.is_reventado }
								<span class="chip">Reventado</span>
							{/if}
							{#if sorteo.is_megareventado }
								<span class="chip">Megareventado</span>
							{/if}
							<span class="chip chip--muted">{sorteo.days}</span>
						</div>
					</div>
						<div class="options-buttons">
							<button class="neutral" onclick={() => showEditSorteo(sorteo.id)}>
								<PenSolid class="shrink-0 h-4 w-4" />
							</button>
							<button class="negative" onclick={() => showDeleteSorteo(sorteo.id)}>
								<TrashBinSolid class="shrink-0 h-4 w-4" />
							</button>
						</div>
				</div>
				{#if expandedSorteo.includes(sorteo.id)}
					{@const selectedSlot = getSelectedSchedule(sorteo)}
					<div class="panel-content sorteo-content">
						<div class="schedule-split">
							<div class="schedule-list-panel">
								<div class="schedule-list-header">
									<h3>Horarios</h3>
									<button onclick={() => showAddSchedule(sorteo.id)}>
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
												onkeydown={(e) => e.key === "Enter" && selectSchedule(sorteo.id, slot.id)}
												onclick={() => selectSchedule(sorteo.id, slot.id)}
												role="button"
												tabindex="0"
											>
												<div class="schedule-main">
													<span class="schedule-name">{slot.name}</span>
													<span class="schedule-time">{slot.time}</span>
												</div>
												<div class="options-buttons">
													<button class="neutral" onclick={() => showEditSchedule(sorteo.id, selectedSlot.id)}>
														<PenSolid class="shrink-0 h-4 w-4" />
													</button>
													<button class="negative" onclick={() => showDeleteSchedule(sorteo.id, selectedSlot.id)}>
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
										<button onclick={() => showAddPuestoToSchedule(sorteo.id, selectedSlot.id)}>
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
														<td colspan={puestosHeaders.length} class="empty-state">
															Sin puestos en este horario
														</td>
													</tr>
												{:else}
													{#each selectedSlot.puestos as puesto}
														<tr
															class="row-action"
															tabindex="0"
															role="button"
															onclick={() => showEditPuestoFromSchedule(puesto, sorteo.id, selectedSlot.id)}
															onkeydown={(e) => e.key === 'Enter' && showEditPuestoFromSchedule(puesto, sorteo.id, selectedSlot.id)}
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
		{/each}
	</div>
	<div class="shortcuts">
		<h2>Atajos</h2>
		<div class="shortcuts-actions">
			<button onclick={openAssignSorteoModal}>Agregar un sorteo a todos los puestos</button>
			<button onclick={openAssignPuestoModal}>Agregar un puesto en todos los sorteos</button>
		</div>
	</div>
</section>

<style>
	.sorteos-page {
		position: relative;
		overflow: hidden;
	}
	.sorteo-content {
		gap: 1.25rem;
	}
	.schedule-split {
		display: grid;
		grid-template-columns: minmax(220px, 0.85fr) minmax(0, 1.15fr);
		gap: 1rem;
	}
	.schedule-list-panel {
		display: flex;
		flex-direction: column;
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
	.shortcuts {
		position: absolute;
		border-top: 2px dashed var(--color-border);
		background: var(--color-bg-2);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		flex-direction: column;
		bottom: 0rem;
		right: -2rem;
		left: -2rem;
	}
	.shortcuts h2 {
		margin-top: -1rem;
		padding: 0 1rem;
		background-color: var(--color-bg-2);
		font-size: 1.1rem;
		
	}
	.shortcuts-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>


