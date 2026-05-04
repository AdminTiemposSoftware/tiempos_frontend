<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import SchedulePuestoModal from '$lib/components/puestos/SchedulePuestoModal.svelte';
	import ScheduleModal from '$lib/components/sorteos/ScheduleModal.svelte';
	import SorteoModal from '$lib/components/sorteos/SorteoModal.svelte';
	import SorteoCard from '$lib/components/sorteos/SorteoCard.svelte';
	import AssignSorteoModal from '$lib/components/sorteos/AssignSorteoModal.svelte';
	import AssignPuestoModal from '$lib/components/sorteos/AssignPuestoModal.svelte';
	import ProhibitedNumberModal from '$lib/components/ProhibitedNumberModal.svelte';
    import { prohibitedNumbers } from "../../lib/stores/UpdateSellMatrix";

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
	let showDeleteProhibitedModal = $state(false);
	let showAddProhibitedModal = $state(false);
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
	let prohibitedNumberToDelete = $state<number | null>(null);
	let newProhibitedNumber = $state('');
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
		selectedSorteo = { name: '', days: '', is_reventado: false, is_megareventado: false };
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

	function showDeleteProhibitedNumber(value: number) {
		prohibitedNumberToDelete = value;
		showDeleteProhibitedModal = true;
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

	function handleConfirmDeleteProhibitedNumber() {
		if (prohibitedNumberToDelete == null) {
			return;
		}
		prohibitedNumbers.update((items) => items.filter((item) => item !== prohibitedNumberToDelete));
		prohibitedNumberToDelete = null;
	}

	function openAddProhibitedModal() {
		newProhibitedNumber = '';
		showAddProhibitedModal = true;
	}

	function handleAddProhibitedNumber(newProhibitedNumber) {
		const trimmed = newProhibitedNumber.trim();
		if (!trimmed || !/^\d+$/.test(trimmed)) {
			return;
		}
		const value = Number(trimmed);
		prohibitedNumbers.update((items) =>
			items.includes(value) ? items : [...items, value].sort((a, b) => a - b)
		);
		newProhibitedNumber = '';
		showAddProhibitedModal = false;
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

<ConfirmModal
	bind:showModal={showDeleteProhibitedModal}
	message={
		prohibitedNumberToDelete == null
			? 'Eliminar numero restringido?'
			: `Eliminar el numero ${prohibitedNumberToDelete}?`
	}
	confirmText="Eliminar"
	cancelText="Cancelar"
	confirm={handleConfirmDeleteProhibitedNumber}
/>

<ProhibitedNumberModal
	bind:showModal={showAddProhibitedModal}
	bind:value={newProhibitedNumber}
	title="Agregar numero restringido"
	confirmText="Guardar"
	cancelText="Cancelar"
	onConfirm={handleAddProhibitedNumber}
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
	<div class="prohibited">
        <span class="label">Restringidos:</span>
        <div class="prohibited-list">
            {#if $prohibitedNumbers?.length}
                {#each $prohibitedNumbers as number}
					<button
						type="button"
						class="prohibited-badge"
						onclick={() => showDeleteProhibitedNumber(number)}
						aria-label={`Eliminar numero restringido ${number}`}
					>
						{number}
					</button>
                {/each}
            {:else}
                <span class="prohibited-empty">-</span>
            {/if}
			<button
				type="button"
				class="prohibited-badge prohibited-add"
				onclick={openAddProhibitedModal}
				aria-label="Agregar numero restringido"
			>
				+
			</button>
        </div>
    </div> 
	<div class="panel-list">
		{#each sorteos as sorteo}
			{@const selectedSlot = getSelectedSchedule(sorteo)}
			<SorteoCard
				sorteo={sorteo}
				expanded={expandedSorteo.includes(sorteo.id)}
				selectedSlot={selectedSlot}
				puestosHeadersLength={puestosHeaders.length}
				onToggle={() => toggleSorteo(sorteo.id)}
				onSelectSchedule={(scheduleId) => selectSchedule(sorteo.id, scheduleId)}
				onEditSorteo={() => showEditSorteo(sorteo.id)}
				onDeleteSorteo={() => showDeleteSorteo(sorteo.id)}
				onAddSchedule={() => showAddSchedule(sorteo.id)}
				onEditSchedule={(scheduleId) => showEditSchedule(sorteo.id, scheduleId)}
				onDeleteSchedule={(scheduleId) => showDeleteSchedule(sorteo.id, scheduleId)}
				onAddPuesto={(scheduleId) => showAddPuestoToSchedule(sorteo.id, scheduleId)}
				onEditPuesto={(puesto, scheduleId) =>
					showEditPuestoFromSchedule(puesto, sorteo.id, scheduleId)
				}
			/>
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


