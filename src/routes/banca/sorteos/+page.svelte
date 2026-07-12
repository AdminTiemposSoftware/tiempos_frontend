<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import ScheduleModal from '$lib/components/sorteos/ScheduleModal.svelte';
	import SorteoModal from '$lib/components/sorteos/SorteoModal.svelte';
	import SorteoCard from '$lib/components/sorteos/SorteoCard.svelte';
	import AssignSorteoModal from '$lib/components/sorteos/AssignSorteoModal.svelte';
	import {Notifications, acts} from '@tadashi/svelte-notification'
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
		id: number | null;
		name: string;
		time: string;
		is_reventado: boolean;
		is_megareventado: boolean;
	};

	type puesto = {
		id: number;
		name: string;
		comission: number;
		enabled?: boolean;
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

		const branchItems = Array.isArray(data?.branchItems)
			? (data.branchItems as { id: number; name: string; }[])
			: [];

		puestoOptions = branchItems.map((item) => ({
			id: item.id,
			name: item.name,
			comission: 0 
		}));
	});

	let showScheduleModal = $state(false);
	let showSorteoModal = $state(false);
	let showDeleteScheduleModal = $state(false);
	let showDeleteSorteoModal = $state(false);
	let showAssignSorteoModal = $state(false);
	let selectedSorteo = $state<draw>();
	let selectedSchedule = $state<schedule>();
	let selectedSorteoId = $state(0);
	let selectedShortcutSorteoId = $state<number>();
	let selectedShortcutPuesto = $state('');
	let scheduleToDelete = $state<schedule>();
	let sorteoToDelete = $state<draw>();
	let expandedSorteo = $state<number[]>([]);
	let selectedScheduleBySorteo = $state<Record<number, number | null>>({});
	let puestoOptions = $state<puesto[]>([]);
	let puestoBySchedule = $state<puesto[]>([]);
	let schedule: schedule[] = [];

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
				const res = await fetch(`/banca/sorteos/draw-schedule/${sorteoId}`);
				const payload = await res.json().catch(() => null);
				const items = Array.isArray(payload?.items) ? payload.items as schedule[] : [];
				schedule = items.map((it) => ({ 
					id: it.id,
					name: it.name ?? '',
					time: it.time ?? '',
					is_reventado: it.is_reventado ?? false,
					is_megareventado: it.is_megareventado ?? false
				}));

				// attach schedules to the draw
				draws = draws.map((d) => (d.id === sorteoId ? { ...d, schedule } : d));

			} catch (e) {
				console.error('Error fetching schedules for sorteo', e);
			}
		}
	}

	async function fetchBranchesForSchedule(scheduleId: number) {
		try {
			const res = await fetch(`/banca/sorteos/branch/${scheduleId}`);
			const payload = await res.json().catch(() => null);
			const items = Array.isArray(payload?.items) ? payload.items : [];

			const puestos = items.map((it: { branch_id: number; name: string; comission: string; enabled?: boolean }) => ({
				id: it.branch_id,
				name: it.name,
				comission: Number(it.comission),
				enabled: it.enabled ?? true
			}));
			
			puestoBySchedule = puestos;
		} catch (e) {
			console.error('Error fetching branches for schedule', e);
		}
	}

	async function toggleSchedule(sorteoId: number, scheduleId: number) {
		await fetchBranchesForSchedule(scheduleId);
		selectedScheduleBySorteo = { ...selectedScheduleBySorteo, [sorteoId]: scheduleId };
		const sorteo = draws.find((d) => d.id === sorteoId);
		const slot = sorteo?.schedule?.find((s) => s.id === scheduleId);
		if (!slot) return;
	}

	function getSelectedSchedule(sorteo: draw) {
		const selectedId = selectedScheduleBySorteo[sorteo.id];
		const selected = sorteo?.schedule?.find((slot) => slot.id === selectedId);
		return selected ?? null;
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

	// Open modals for edit/view actions
	function showEditSorteo(sorteoId: number) {
		selectedSorteo = draws.find((s) => s.id === sorteoId);
		showSorteoModal = true;
	}

	function showEditSchedule(sorteoId: number, scheduleId: number) {
		selectedSchedule = draws.find((s) => s.id === sorteoId)?.schedule.find((s) => s.id === scheduleId);
		showScheduleModal = true;
	}

	function showDeleteSchedule(sorteoId: number, scheduleId: number) {
		scheduleToDelete = draws.find((s) => s.id === sorteoId)?.schedule.find((s) => s.id === scheduleId);
		showDeleteScheduleModal = true;
	}

	function showDeleteSorteo(sorteoId: number) {
		sorteoToDelete = draws.find((s) => s.id === sorteoId);
		showDeleteSorteoModal = true;
	}


	// Create handlers
	function handleAddSorteoSubmit(event: CustomEvent) {
		const newSorteo = event.detail;
		const nextId = Math.max(0, ...draws.map((item) => item.id)) + 1;
		draws = [...draws, { ...newSorteo, id: nextId }];
	}

	function handleAddScheduleSubmit(payload: { sorteoId: any; name: any; time: any; id: any; is_reventado: any; is_megareventado: any; }) {
	
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

	async function saveScheduleSettings(
		scheduleId: number,
		settings: {
			name: string;
			is_reventado: boolean;
			is_megareventado: boolean;
			time: string;
			puestos: puesto[];
		},
		change: 'flags' | 'puestos'
	) {

		// if (change === 'flags') {
		const response = await fetch(`/banca/sorteos/draw-schedule/${scheduleId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ 
				name: settings.name,
				time: settings.time,
				is_reventado: settings.is_reventado,
				is_megareventado: settings.is_megareventado
			})
		});
		if (!response.ok) {
			console.error('Error saving schedule settings', await response.text());
			acts.add({
				message: 'Ha ocurrido un error al guardar los cambios.',
				mode: 'error',
				lifetime: 3
			})
			return;
		}
		// } else if (change === 'puestos') {
		for (const puesto of settings.puestos) {
			if (puesto.id === undefined) continue; // skip if puesto id is not defined
			if (puesto.comission <= 0 || puesto.comission >= 100) continue; // skip if comission is not valid

			const response = await fetch(`/banca/sorteos/draw-schedule-branch`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					branch_id: puesto.id,
					draw_schedule_id: scheduleId,
					comission: puesto.comission,
					enabled: puesto.enabled
				})
			});
			if (!response.ok) {
				console.error('Error saving puesto settings', await response.text());
				acts.add({
					message: 'Ha ocurrido un error al guardar los cambios.',
					mode: 'error',
					lifetime: 3
				})
				return;
			}
		}

		draws = draws.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.map((slot) =>
				slot.id === scheduleId ? { ...slot, ...settings } : slot
			)
		}));

		acts.add({
			message: 'Se han guardado los cambios correctamente.',
			mode: 'success',
			lifetime: 3
		})
	}

	async function handleConfirmDeleteSchedule() {
		const response = await fetch(`/banca/sorteos/draw-schedule/${scheduleToDelete?.id}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			console.error('Error deleting schedule', response.statusText);
			acts.add({
				message: 'Ha ocurrido un error al eliminar el horario.',
				mode: 'error',
				lifetime: 3
			})
			return;
		}
		acts.add({
			message: 'Horario eliminado correctamente.',
			mode: 'success',
			lifetime: 3
		})

		draws = draws.map((sorteo) => ({
			...sorteo,
			schedule: sorteo.schedule.filter((slot) => slot.id !== scheduleToDelete?.id) //Asume schedule ids are unique across draws for simplicity, otherwise also check sorteoId
		}));
		scheduleToDelete = { id: -1, name: '', time: '', is_reventado: false, is_megareventado: false };
	}

	function handleConfirmDeleteSorteo() {
		// TODO Send delete request to backend
		// fetch(`/banca/sorteos/draw/${sorteoToDelete?.id}`, {
		// 	method: 'DELETE'
		// }).then((res) => {
		// 	if (!res.ok) {
		// 		console.error('Error deleting sorteo', res.statusText);
		// 		acts.add({
		// 			message: 'Ha ocurrido un error al eliminar el sorteo.',
		// 			mode: 'error',
		// 			lifetime: 3
		// 		})
		// 		return;
		// 	}
		// 	acts.add({
		// 		message: 'Sorteo eliminado correctamente.',
		// 		mode: 'success',
		// 		lifetime: 3
		// 	})
		// }).catch((error) => {
		// 	console.error('Error deleting sorteo', error);
		// 	acts.add({
		// 		message: 'Ha ocurrido un error al eliminar el sorteo.',
		// 		mode: 'error',
		// 		lifetime: 3
		// 	})
		// });

		draws = draws.filter((sorteo) => sorteo.id !== sorteoToDelete?.id);
		sorteoToDelete = {id: -1, name: '', is_reventado: false, is_megareventado: false, draw_day_id: 0, day_name: '', schedule: []};
	}

	function openAssignSorteoModal() {
		selectedShortcutSorteoId = draws[0]?.id ?? null;
		showAssignSorteoModal = true;
	}

	function handleAssignSorteoToPuestos() {
		if (!selectedShortcutSorteoId || !selectedShortcutPuesto) {
			return;
		}
		// TODO Send request to backend
	}
	
</script>

<ScheduleModal
	bind:showModal={showScheduleModal}
	schedule={selectedSchedule}
	sorteoId={selectedSorteoId}
	addSchedule={handleAddScheduleSubmit}
	updateSchedule={updateSchedule}
/>

<SorteoModal
	bind:showModal={showSorteoModal}
	sorteo={selectedSorteo}
	addSorteo={handleAddSorteoSubmit}
	updateSorteo={updateSorteo}
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
<!-- <AssignSorteoModal
	bind:showModal={showAssignSorteoModal}
	draws={draws}
	bind:selectedSorteoId={selectedShortcutSorteoId}
	bind:selectedPuesto={selectedShortcutPuesto}
	title="Agregar sorteo a todos los puestos"
	confirmText="Aplicar"
	cancelText="Cancelar"
	confirm={handleAssignSorteoToPuestos}
/> -->

<svelte:head>
	<title>Sorteos</title>
</svelte:head>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="page-stack draws-page">
	<Notifications />
	<header class="header-banking">
		<div class="header-top">
			<div class="header-title">
				<h1 class="title">Sorteos</h1>
				<p class="subtitle">Gestiona horarios y puestos por sorteo.</p>
			</div>
			<button onclick={handleAddSorteo}>Nuevo sorteo</button>
		</div>
	</header>
	<div class="panel-list">
		{#each draws as draw}
			{@const selectedSchedule = getSelectedSchedule(draw)}
			<SorteoCard
				sorteo={draw}
				expanded={expandedSorteo.includes(draw.id)}
				selectedSchedule={selectedSchedule}
				puestoOptions={puestoOptions}
				puestoBySchedule={puestoBySchedule}
				onToggle={() => toggleSorteo(draw.id)}
				onToggleSchedule={async (scheduleId: number) => await toggleSchedule(draw.id, scheduleId)}
				onEditSorteo={() => showEditSorteo(draw.id)}
				onDeleteSorteo={() => showDeleteSorteo(draw.id)}
				onAddSchedule={() => showAddSchedule(draw.id)}
				onEditSchedule={(scheduleId: number) => showEditSchedule(draw.id, scheduleId)}
				onDeleteSchedule={(scheduleId: number) => showDeleteSchedule(draw.id, scheduleId)}
				onSaveScheduleSettings={(
					scheduleId: number,
					settings: {
						name: string;
						time: string;
						is_reventado: boolean;
						is_megareventado: boolean;
						puestos: puesto[];
					},
					change: 'flags' | 'puestos'
				) => saveScheduleSettings(scheduleId, settings, change)
				}
			/>
		{/each}
	</div>
	<div class="shortcuts">
		<h2>Atajos</h2>
		<div class="shortcuts-actions">
			<button onclick={openAssignSorteoModal}>Agregar un sorteo a todos los puestos</button>
			<button onclick={() => {}}>Agregar un puesto en todos los draws</button>
		</div>
	</div>
</section>
{/if}

<style>
	section {
		gap: 0;
	}
	.header-banking {
		flex-direction: column;
		align-items: flex-start;
	}
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
	
	.header-top {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		width: 100%;
		align-items: flex-end;
		gap: 0.25rem;
	}
</style>


