<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import SchedulePuestoModal from '$lib/components/puestos/SchedulePuestoModal.svelte';
	import ScheduleModal from '$lib/components/sorteos/ScheduleModal.svelte';
	import SorteoModal from '$lib/components/sorteos/SorteoModal.svelte';
	import AssignSorteoModal from '$lib/components/sorteos/AssignSorteoModal.svelte';
	import AssignPuestoModal from '$lib/components/sorteos/AssignPuestoModal.svelte';
	import { PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';

	let puestosHeaders = [
		{ key: 'merchantName', label: 'Nombre Comercio' },
		{ key: 'commission', label: 'Comision' },
		{ key: 'normalPayment', label: 'Pago normal' },
		{ key: 'extraPayment', label: 'Pago extra' },
		{ key: 'options', label: 'Opciones' }
	];

	let sorteos = $state([
		{
			id: 1,
			name: 'Loteria Nacional',
			type: 'Tiempos',
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
			type: 'Reventado',
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
	let expandedSchedule = $state<Record<number, number[]>>({});

	// UI state toggles
	function toggleSorteo(sorteoId: number) {
		expandedSorteo = expandedSorteo.includes(sorteoId)
			? expandedSorteo.filter((id) => id !== sorteoId)
			: [...expandedSorteo, sorteoId];
	}

	function toggleSchedule(sorteoId: number, scheduleKey: number) {
		expandedSchedule = {
			...expandedSchedule,
			[sorteoId]: expandedSchedule[sorteoId]?.includes(scheduleKey)
				? expandedSchedule[sorteoId].filter((item) => item !== scheduleKey)
				: [...(expandedSchedule[sorteoId] || []), scheduleKey]
		};
	}

	function isScheduleExpanded(sorteoId: number, scheduleKey: number) {
		return expandedSchedule[sorteoId]?.includes(scheduleKey);
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

	function showEditPuestoFromSchedule(puesto) {
		selectedSchedulePuesto = { ...puesto };
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

	function handleAddSchedulePuestoSubmit(event: CustomEvent) {
		const { sorteoId, scheduleId, puesto } = event.detail;
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
						puestos: [...slot.puestos, { ...puesto, id: nextId }]
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
		sorteos = sorteos.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.map((slot) => ({
				...slot,
				puestos: slot.puestos.map((puesto) =>
					puesto.id === updatedPuesto.id ? { ...puesto, ...updatedPuesto } : puesto
				)
			}))
		}));
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
<section class="sorteos-container">
	<div class="header-contained">
		<div>
			<h1>Sorteos</h1>
			<p>Gestiona horarios y puestos por sorteo.</p>
		</div>
		<button onclick={handleAddSorteo}>
			Nuevo sorteo
		</button>
	</div>
	<div class="sorteos-list">
		{#each sorteos as sorteo}
			<div class="sorteo">
				<button class="sorteo-toggle" onclick={() => toggleSorteo(sorteo.id)}>
					<div class="sorteo-main">
						<span class="sorteo-name">{sorteo.name}</span>
						<div class="chips">
							<span class="chip">{sorteo.type}</span>
							<span class="chip muted">{sorteo.days}</span>
						</div>
					</div>
					<span class="count">{sorteo.schedule.length} horarios</span>
				</button>
				{#if expandedSorteo.includes(sorteo.id)}
					<div class="sorteo-content">
						{#each sorteo.schedule as slot}
							<div class="schedule">
								<button
									class="schedule-toggle"
									onclick={() => toggleSchedule(sorteo.id, slot.id)}
								>
									<div class="schedule-main">
										<span class="schedule-name">{slot.name}</span>
										<span class="schedule-time">{slot.time}</span>
									</div>
									<span class="count">{slot.puestos.length} puestos</span>
								</button>
								{#if isScheduleExpanded(sorteo.id, slot.id)}
								<div class="table-wrap">
									<table>
										<thead>
											<tr>
												{#each puestosHeaders as header}
													<th>{header.label}</th>
												{/each}
											</tr>
										</thead>
										<tbody>
											{#if slot.puestos.length === 0}
												<tr>
													<td colspan={puestosHeaders.length} class="empty-row">
														Sin puestos en este horario
													</td>
												</tr>
											{:else}
												{#each slot.puestos as puesto}
													<tr>
														<td>{puesto.commission}%</td>
														<td>{puesto.name}</td>
														<td>{puesto.normalPayment}</td>
														<td>{puesto.extraPayment}</td>
														<td>
															<div class="options-buttons">
																<button class="neutral" onclick={() => showEditPuestoFromSchedule(puesto)}>
																	<PenSolid class="shrink-0 h-4 w-4" />
																</button>
																<button class="negative" onclick={() => showDeletePuestoFromSchedule(puesto)}>
																	<TrashBinSolid class="shrink-0 h-4 w-4" />
																</button>
															</div>
														</td>
													</tr>
												{/each}
											{/if}
										</tbody>
									</table>
								</div>
								<div class="actions">
									<button onclick={() => showAddPuestoToSchedule(sorteo.id, slot.id)}>
										Agregar puesto
									</button>
									<button onclick={() => showEditSchedule(sorteo.id, slot.id)}>
										Editar horario
									</button>
									<button onclick={() => showDeleteSchedule(sorteo.id, slot.id)}>
										Eliminar horario
									</button>
								</div>
								{/if}
							</div>
						{/each}
						<div class="actions">
							<button onclick={() => showAddSchedule(sorteo.id)}>
								Agregar horario
							</button>
							<button onclick={() => showEditSorteo(sorteo.id)}>
								Editar sorteo
							</button>
							<button onclick={() => showDeleteSorteo(sorteo.id)}>
								Eliminar sorteo
							</button>
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
	.sorteos-container {
		flex-direction: column;
		justify-content: start;
		position: relative;
		align-items: start;
		gap: 1rem;
		overflow: hidden;
		width: 100%;
	}
	.sorteos-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-height: 70vh;
		padding: 1rem;
		overflow-y: auto;
	}
	.sorteo {
		width: 100%;
		border: 1px solid var(--color-border);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		background-clip: padding-box;
		background: #fafafa;
	}
	.sorteo-toggle {
		width: 100%;
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border: none;
		cursor: pointer;
		background: #fafafa;
		border-top-left-radius: 0.5rem;
		border-top-right-radius: 0.5rem;
	}
	.sorteo-main {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.sorteo-name {
		font-size: 1.25rem;
		color: rgba(0, 0, 0, 0.85);
	}
	.chips {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.chip {
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: var(--color-bg-2);
		font-size: 0.9rem;
		color: rgba(0, 0, 0, 0.7);
		font-weight: 600;
	}
	.chip.muted {
		background: #eaeaea;
		color: rgba(0, 0, 0, 0.55);
		font-weight: 500;
	}
	.count {
		color: rgba(0, 0, 0, 0.55);
		font-weight: 500;
		margin: 0;
	}
	.sorteo-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.schedule {
		display: flex;
		border-radius: 10px;
		flex-direction: column;
		background: #fff;
		border: 1px solid var(--color-border);
		padding: 1rem;
		background-clip: padding-box;
	}
	.schedule-toggle {
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-radius: 10px;
		cursor: pointer;
		text-align: left;
		color: rgba(0, 0, 0, 0.85);
		background: transparent;
	}
	.schedule-main {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.schedule-name {
		font-size: 1.1rem;
		font-weight: 600;
	}
	.schedule-time {
		font-size: 0.8rem;
		color: rgba(0, 0, 0, 0.6);
	}
	.empty-row {
		text-align: center;
	}
	.table-wrap {
		margin: 1rem 0rem;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
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


