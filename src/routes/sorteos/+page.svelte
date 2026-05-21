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
	import { auth } from '$lib/stores/auth';	

	let { data } = $props();

	type draw = {
		id: number;
		name: string;
		is_reventado: boolean;
		is_megareventado: boolean;
		draw_day_id: number;
		day_name: string;
		schedule: schedule[];
	};

	type schedule = {
			id: number;
			name: string;
			time: string;
			is_reventado: boolean;
			is_megareventado: boolean;
		};
	
	type puesto = {
		id: number;
		name: string;
		comission: number;
	};

	let draws =$state<draw[]>([]);

	$effect(() => {
		const items = Array.isArray(data?.items) ? (data.items as draw[]) : [];
		draws = items.map((item) => ({
			id: item.id,
			name: item.name,
			is_reventado: item.is_reventado,
			is_megareventado: item.is_megareventado,
			draw_day_id: item.draw_day_id,
			day_name: item.day_name,
			schedule: [] // initialize empty schedule, will be loaded on demand
		}));
	});

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
	let selectedSorteo = $state<draw | null>(null);
	let selectedSchedule = $state<schedule | null>(null);
	let selectedSorteoId = $state(0);
	let selectedScheduleId = $state(0);
	let selectedSchedulePuesto = $state<puesto | null>(null);
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
	let puestoOptions = $state<puesto[]>([]);
	let puestoNames = $state<string[]>([]);

	async function fetchPuestoOptionsByBanking() {
		try {
			const res = await fetch(`/sorteos/branch/names/by-banking`);
			const payload = await res.json().catch(() => null);
			const items = Array.isArray(payload?.items) ? (payload.items as puesto[]) : [];
			puestoOptions = items
				.map((item) => ({
					id: item.id,
					name: item.name,
					comission: Number(item.comission ?? 0)
				}))
				.filter((item) => item?.id && item?.name);
			puestoNames = puestoOptions.map((item) => item.name);
		} catch (e) {
			puestoOptions = [];
		}
	}

	// UI state toggles
	async function toggleSorteo(sorteoId: number) {
		const isOpen = expandedSorteo.includes(sorteoId);
		if (isOpen) {
			expandedSorteo = expandedSorteo.filter((id) => id !== sorteoId);
			return;
		}

		// open immediately
		expandedSorteo = [...expandedSorteo, sorteoId];

		const sorteo = draws.find((item) => item.id === sorteoId);
		if (!sorteo) return;

		// If there are no schedules yet, fetch them from the backend
		if (!sorteo.schedule || sorteo.schedule.length === 0) {
			try {
				const res = await fetch(`/sorteos/draw-schedule/${sorteoId}`);
				const payload = await res.json().catch(() => null);
				const items = Array.isArray(payload?.items) ? payload.items : [];
				const schedule = items.map((it: { time: any; }) => ({ ...it, time: it.time ?? '', puestos: [] }));

				// attach schedules to the draw
				draws = draws.map((d) => (d.id === sorteoId ? { ...d, schedule } : d));

				if (schedule.length > 0 && selectedScheduleBySorteo[sorteoId] == null) {
					selectedScheduleBySorteo = { ...selectedScheduleBySorteo, [sorteoId]: schedule[0].id };
					// load branches for the first schedule
					await fetchBranchesForSchedule(sorteoId, schedule[0].id);
				}
			} catch (e) {
				// ignore fetch errors for now
			}
		} else {
			if (sorteo.schedule.length > 0 && selectedScheduleBySorteo[sorteoId] == null) {
				selectedScheduleBySorteo = { ...selectedScheduleBySorteo, [sorteoId]: sorteo.schedule[0].id };
				await fetchBranchesForSchedule(sorteoId, sorteo.schedule[0].id);
			}
		}
	}

	async function fetchBranchesForSchedule(sorteoId: number, scheduleId: number) {
		try {
			const res = await fetch(`/sorteos/branch/${scheduleId}`);
			const payload = await res.json().catch(() => null);
			const items = Array.isArray(payload?.items) ? payload.items : [];

			const puestos = items.map((it: puesto) => ({
				id: it.id,
				name: it.name,
				comission: Number(it.comission)
			}));

			draws = draws.map((d) => {
				if (d.id !== sorteoId) return d;
				return {
					...d,
					schedule: d.schedule.map((s) => (s.id === scheduleId ? { ...s, puestos } : s))
				};
			});
		} catch (e) {
			// ignore errors
		}
	}

	async function selectSchedule(sorteoId: number, scheduleId: number) {
		selectedScheduleBySorteo = { ...selectedScheduleBySorteo, [sorteoId]: scheduleId };

		const sorteo = draws.find((d) => d.id === sorteoId);
		const slot = sorteo?.schedule?.find((s) => s.id === scheduleId);
		if (!slot) return;

		if (!slot.puestos || slot.puestos.length === 0) {
			await fetchBranchesForSchedule(sorteoId, scheduleId);
		}
	}

	function getSelectedSchedule(sorteo: draw) {
		const selectedId = selectedScheduleBySorteo[sorteo.id];
		const selected = sorteo?.schedule?.find((slot) => slot.id === selectedId);
		return selected ?? sorteo?.schedule?.[0] ?? null;
	}

	// Open modals for create actions
	function handleAddSorteo() {
		selectedSorteo = { name: '', days: '', is_reventado: false, is_megareventado: false };
		showSorteoModal = true;
	}

	function showAddSchedule(sorteoId: number) {
		selectedSchedule = { id: -1, name: '', time: '', is_reventado: false, is_megareventado: false };
		selectedSorteoId = sorteoId;
		showScheduleModal = true;
	}

	async function showAddPuestoToSchedule(sorteoId: number, scheduleId: number) {
		await fetchPuestoOptionsByBanking();
		selectedSorteoId = sorteoId;
		selectedScheduleId = scheduleId;
		selectedSchedulePuesto = { id: -1, name: '', comission: 0 };
		showSchedulePuestoModal = true;
	}

	// Open modals for edit/view actions
	function showEditSorteo(sorteoId: number) {
		selectedSorteo = { ...draws.find((s) => s.id === sorteoId) };
		showSorteoModal = true;
	}

	function showEditSchedule(sorteoId: number, scheduleId: number) {
		selectedSchedule = {
			...draws.find((s) => s.id === sorteoId)?.schedule.find((s) => s.id === scheduleId)
		};
		showScheduleModal = true;
	}

	function showEditPuestoFromSchedule(puesto: { id: number; name: string; commission: number; } | null, sorteoId: number, scheduleId: number) {
		selectedSorteoId = sorteoId;
		selectedScheduleId = scheduleId;
		selectedSchedulePuesto = { ...puesto };
		showSchedulePuestoModal = true;
	}

	function showDeleteSchedule(sorteoId: number, scheduleId: number) {
		scheduleToDelete = draws.find((s) => s.id === sorteoId)?.schedule.find((s) => s.id === scheduleId);
		showDeleteScheduleModal = true;
	}

	function showDeleteSorteo(sorteoId: number) {
		sorteoToDelete = draws.find((s) => s.id === sorteoId);
		showDeleteSorteoModal = true;
	}

	function showDeleteProhibitedNumber(value: number) {
		prohibitedNumberToDelete = value;
		showDeleteProhibitedModal = true;
	}

	// Create handlers
	function handleAddSorteoSubmit(event: CustomEvent) {
		const newSorteo = event.detail;
		const nextId = Math.max(0, ...draws.map((item) => item.id)) + 1;
		draws = [...draws, { ...newSorteo, id: nextId }];
	}

	function handleAddScheduleSubmit(payload: { sorteoId: any; name: any; time: any; id: any; }) {
		const { sorteoId, name, time, id } = payload;
		draws = draws.map((sorteo) => {
			if (sorteo.id !== sorteoId) {
				return sorteo;
			}
			const nextId = id ?? Math.max(0, ...sorteo.schedule.map((item) => item.id)) + 1;
			return {
				...sorteo,
				schedule: [...sorteo.schedule, { name, time, id: nextId, puestos: [] }]
			};
		});
	}

	function handleAddSchedulePuestoSubmit(puesto: { name: any; }) {
		const sorteoId = selectedSorteoId;
		const scheduleId = selectedScheduleId;
		if (!sorteoId || !scheduleId) {
			return;
		}
		const nextPuesto = {
			...puesto,
			name: puesto.name
		};
		draws = draws.map((sorteo) => {
			if (sorteo.id !== sorteoId) {
				return sorteo;
			}
			return {
				...sorteo,
				schedule: sorteo.schedule.map((slot) => {
					if (slot.id !== scheduleId) {
						return slot;
					}
					const nextId = nextPuesto.id ?? Math.max(0, ...slot.puestos.map((item: { id: any; }) => item.id)) + 1;
					return {
						...slot,
						puestos: [...slot.puestos, { ...nextPuesto, id: nextId }]
					};
				})
			};
		});
	}

	// Update handlers
	function updateSorteo(updatedSorteo: { id: number; }) {
		draws = draws.map((sorteo) =>
			sorteo.id === updatedSorteo.id ? { ...sorteo, ...updatedSorteo } : sorteo
		);
	}

	function updateSchedule(updatedSchedule: { id: number; }) {
		// TODO Send update request to backend
		draws = draws.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.map((slot) =>
				slot.id === updatedSchedule.id ? { ...slot, ...updatedSchedule } : slot
			)
		}));
	}

	function updateSchedulePuesto(updatedPuesto: { id: any; name: any; }) {
		// TODO Send update request to backend
		const sorteoId = selectedSorteoId;
		const scheduleId = selectedScheduleId;
		if (!sorteoId || !scheduleId || !updatedPuesto?.id) {
			return;
		}
		const normalized = {
			...updatedPuesto,
			name: updatedPuesto.name
		};
		draws = draws.map((sorteo) => {
			if (sorteo.id !== sorteoId) {
				return sorteo;
			}
			return {
				...sorteo,
				schedule: sorteo.schedule.map((slot) =>
					slot.id === scheduleId
						? {
							...slot,
							puestos: slot.puestos.map((puesto: { id: any; }) =>
								puesto.id === normalized.id ? { ...puesto, ...normalized } : puesto
							)
						}
						: slot
				)
			};
		});
	}

	function deleteSchedulePuesto(payload: { sorteoId: number; scheduleId: number; puestoId: any; }) {
		// TODO Send delete request to backend
		const sorteoId = payload?.sorteoId ?? selectedSorteoId;
		const scheduleId = payload?.scheduleId ?? selectedScheduleId;
		const puestoId = payload?.puestoId;
		if (!sorteoId || !scheduleId || !puestoId) {
			return;
		}
		draws = draws.map((sorteo) => {
			if (sorteo.id !== sorteoId) {
				return sorteo;
			}
			return {
				...sorteo,
				schedule: sorteo.schedule.map((slot) =>
					slot.id === scheduleId
						? { ...slot, puestos: slot.puestos.filter((puesto: { id: any; }) => puesto.id !== puestoId) }
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
		draws = draws.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.map((slot) => ({
				...slot,
				puestos: slot.puestos.filter((puesto: { id: any; }) => puesto.id !== puestoToDelete?.id) //Asume puesto ids are unique across draws and horarios for simplicidad, otherwise also check sorteoId and scheduleId
			}))
		}));
		puestoToDelete = null;
	}

	function handleConfirmDeleteSchedule() {
		// TODO Send delete request to backend
		draws = draws.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.filter((slot) => slot.id !== scheduleToDelete?.id) //Asume schedule ids are unique across draws for simplicity, otherwise also check sorteoId
		}));
		scheduleToDelete = null;
	}

	function handleConfirmDeleteSorteo() {
		// TODO Send delete request to backend
		draws = draws.filter((sorteo) => sorteo.id !== sorteoToDelete?.id);
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

	function handleAddProhibitedNumber(newProhibitedNumber: string) {
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
		selectedShortcutSorteoId = draws[0]?.id ?? null;
		selectedShortcutPuesto = puestoNames[0] ?? '';
		showAssignSorteoModal = true;
	}

	function handleAssignSorteoToPuestos() {
		if (!selectedShortcutSorteoId || !selectedShortcutPuesto) {
			return;
		}
		// TODO Send request to backend
	}

	async function openAssignPuestoModal() {
		await fetchPuestoOptionsByBanking();
		selectedShortcutPuestoForAll = puestoNames[0] ?? '';
		selectedShortcutSorteoForAll = draws[0]?.id ?? null;
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
	draws={draws}
	puestos={puestoNames}
	bind:selectedSorteoId={selectedShortcutSorteoId}
	bind:selectedPuesto={selectedShortcutPuesto}
	title="Agregar sorteo a todos los puestos"
	confirmText="Aplicar"
	cancelText="Cancelar"
	confirm={handleAssignSorteoToPuestos}
/>

<AssignPuestoModal
	bind:showModal={showAssignPuestoModal}
	draws={draws}
	puestos={puestoNames}
	bind:selectedSorteoId={selectedShortcutSorteoForAll}
	bind:selectedPuesto={selectedShortcutPuestoForAll}
	title="Agregar puesto en todos los draws"
	confirmText="Aplicar"
	cancelText="Cancelar"
	confirm={handleAssignPuestoToSorteos}
/>

<svelte:head>
	<title>Sorteos</title>
</svelte:head>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="page-stack draws-page">
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
		{#each draws as draw}
			{@const selectedSlot = getSelectedSchedule(draw)}
			<SorteoCard
				sorteo={draw}
				expanded={expandedSorteo.includes(draw.id)}
				selectedSlot={selectedSlot}
				onToggle={() => toggleSorteo(draw.id)}
				onSelectSchedule={(scheduleId: number) => selectSchedule(draw.id, scheduleId)}
				onEditSorteo={() => showEditSorteo(draw.id)}
				onDeleteSorteo={() => showDeleteSorteo(draw.id)}
				onAddSchedule={() => showAddSchedule(draw.id)}
				onEditSchedule={(scheduleId: number) => showEditSchedule(draw.id, scheduleId)}
				onDeleteSchedule={(scheduleId: number) => showDeleteSchedule(draw.id, scheduleId)}
				onAddPuesto={(scheduleId: number) => showAddPuestoToSchedule(draw.id, scheduleId)}
				onEditPuesto={(puesto: any, scheduleId: any) =>
					showEditPuestoFromSchedule(puesto, draw.id, scheduleId)
				}
			/>
		{/each}
	</div>
	<div class="shortcuts">
		<h2>Atajos</h2>
		<div class="shortcuts-actions">
			<button onclick={openAssignSorteoModal}>Agregar un sorteo a todos los puestos</button>
			<button onclick={openAssignPuestoModal}>Agregar un puesto en todos los draws</button>
		</div>
	</div>
</section>
{/if}

<style>
	.draws-page {
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


