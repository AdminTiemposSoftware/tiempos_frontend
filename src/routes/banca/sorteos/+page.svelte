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
		days: string[];
		schedules: schedule[];
	};

	type schedule = {
		id: number;
		name: string;
		time: string;
		puestos: puesto[];
		days: string[];
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
		const items = Array.isArray(data?.items) ? (data.items as {id: number; name: string; is_reventado: boolean; is_megareventado: boolean; draw_day_id: number; day_name: string}[]) : [];

		draws = Object.values(
			items.reduce<Record<number, draw>>((acc, item) => {
				if (!acc[item.id]) {
					acc[item.id] = {
						id: item.id,
						name: item.name,
						is_reventado: item.is_reventado,
						is_megareventado: item.is_megareventado,
						days: [],
						schedules: []
					};
				}
				acc[item.id].days.push(item.day_name);
				return acc;
			}, {})
		);

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
		if (!sorteo.schedules || sorteo.schedules.length === 0) {
			try {
				const res = await fetch(`/banca/sorteos/draw-schedule/${sorteoId}`);
				const payload = await res.json().catch(() => null);
				const items = Array.isArray(payload?.items)
					? payload.items as Array<schedule & {
						branch_id?: number;
						comission?: number | string;
						enabled?: boolean;
					}>
					: [];

				const schedules = items.reduce<Schedule[]>((result, row) => {
                    let schedule = result.find(s => s.id === row.id);
                    if (!schedule) {
                        schedule = {
                            id: row.id,
                            name: row.name,
                            time: row.time,
                            puestos: [],
                            days: [],
                            is_reventado: row.is_reventado,
                            is_megareventado: row.is_megareventado
                        };
                        result.push(schedule);
                    }

                    if (row.branch_id !== null && !schedule.puestos.some(p => p.branch_id === row.branch_id)) {
                        schedule.puestos.push({
                            id: row.branch_id,
                            comission: row.comission
                        });
                    }

                    if (row.day_name !== null && !schedule.days.includes(row.day_name)) {
                        schedule.days.push(row.day_name);
                    }

                    return result;
				}, []);

				draws = draws.map((d) => (d.id === sorteoId ? { ...d, schedules: schedules } : d));
			} catch (e) {
				console.error('Error fetching schedules for sorteo', e);
			}
		}
	}

	async function toggleSchedule(sorteoId: number, scheduleId: number) {
		selectedScheduleBySorteo = { ...selectedScheduleBySorteo, [sorteoId]: scheduleId };
	}

	function getSelectedSchedule(sorteo: draw) {
		const selectedId = selectedScheduleBySorteo[sorteo.id];
		const selected = sorteo?.schedules?.find((slot) => slot.id === selectedId);
		return selected ?? null;
	}

	function updateSchedule(sorteoId: number, scheduleId: number, changes: Partial<schedule>) {
		draws = draws.map((sorteo) =>
			sorteo.id === sorteoId
				? {
					...sorteo,
					schedules: sorteo.schedules.map((schedule) =>
						schedule.id === scheduleId ? { ...schedule, ...changes } : schedule
					)
				}
				: sorteo
		);
	}

	// Open modals for create actions
	function handleAddSorteo() {
		selectedSorteo = { id: -1, name: '', days: [], is_reventado: false, is_megareventado: false, schedules: [] };
		showSorteoModal = true;
	}

	function showAddSchedule(sorteoId: number) {
		selectedSchedule = { id: -1, name: '', time: '', is_reventado: false, is_megareventado: false, puestos: [] };
		selectedSorteoId = sorteoId;
		showScheduleModal = true;
	}

	// Open modals for edit/view actions
	function showEditSorteo(sorteoId: number) {
		selectedSorteo = draws.find((s) => s.id === sorteoId);
		showSorteoModal = true;
	}

	function showDeleteSchedule(sorteoId: number, scheduleId: number) {
		scheduleToDelete = draws.find((s) => s.id === sorteoId)?.schedules.find((s) => s.id === scheduleId);
		showDeleteScheduleModal = true;
	}

	function showDeleteSorteo(sorteoId: number) {
		sorteoToDelete = draws.find((s) => s.id === sorteoId);
		showDeleteSorteoModal = true;
	}

	async function handleAddSorteoSubmit(payload: { name: string; is_reventado: boolean; is_megareventado: boolean; draw_days: string[]; }) {
		try {
			const response = await fetch(`/banca/sorteos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				console.error('Error adding sorteo', response.statusText);
				acts.add({
					message: 'Ha ocurrido un error al agregar el sorteo.',
					mode: 'error',
					lifetime: 3
				})
				return;
			}

			const result = await response.json();
			draws = [...draws, { id: result.items[0]["id"], schedules: [], name: payload.name, is_reventado: payload.is_reventado, is_megareventado: payload.is_megareventado, days: payload.draw_days }];
			acts.add({
				message: 'Sorteo agregado correctamente.',
				mode: 'success',
				lifetime: 3
			})
			showSorteoModal = false;

		} catch (error) {
			console.error('Error adding sorteo', error);
			acts.add({
				message: 'Ha ocurrido un error al agregar el sorteo.',
				mode: 'error',
				lifetime: 3
			})
		}
	}

	function handleAddScheduleSubmit(payload: { sorteoId: any; name: any; time: any; id: any; is_reventado: any; is_megareventado: any; }) {
		draws = draws.map((sorteo) => sorteo.id === payload.sorteoId ? {
			...sorteo,
			schedules: [
				...sorteo.schedules,
				{
					id: payload.id ?? -1,
					name: payload.name,
					time: payload.time,
					is_reventado: sorteo.is_reventado ?? false,
					is_megareventado: sorteo.is_megareventado ?? false,
					puestos: [],
					days: sorteo.days
				}
			]
		}: sorteo);
	}

	async function updateSorteo(updatedSorteo: { id: number; name: string; is_reventado: boolean; is_megareventado: boolean; days: string[]; schedules: schedule[]; }) {
		try {
			const response = await fetch(`/banca/sorteos/${updatedSorteo.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedSorteo)
			});

			if (!response.ok) {
				console.error('Error updating sorteo', response.statusText);
				acts.add({
					message: 'Ha ocurrido un error al actualizar el sorteo.',
					mode: 'error',
					lifetime: 3
				})
				return;
			}
			console.log(draws);
			console.log(updatedSorteo)
			draws = draws.map((sorteo) => sorteo.id === updatedSorteo.id ? {
				...sorteo,
				days: updatedSorteo.draw_days,
				schedules: updatedSorteo.schedules ? updatedSorteo.schedules.map((schedule) => ({ ...schedule, days: updatedSorteo.draw_days })) : []
			} : sorteo);
			console.log(draws);

			acts.add({
				message: 'Sorteo actualizado correctamente.',
				mode: 'success',
				lifetime: 3
			})
			showSorteoModal = false;
			const isOpen = expandedSorteo.includes(updatedSorteo.id);
			if (isOpen) {
				expandedSorteo = expandedSorteo.filter((id) => id !== updatedSorteo.id);
				return;
			}

		} catch (error) {
			console.error('Error updating sorteo', error);
			acts.add({
				message: 'Ha ocurrido un error al actualizar el sorteo.',
				mode: 'error',
				lifetime: 3
			})
		}
	}

	async function saveScheduleSettings(scheduleId: number, settings: schedule) {
		try {
			const response = await fetch(`/banca/sorteos/draw-schedule/${scheduleId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: settings.name,
					time: settings.time,
					is_reventado: settings.is_reventado,
					is_megareventado: settings.is_megareventado,
					days: settings.days
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
				schedules: sorteo.schedules.map((slot) =>
					slot.id === scheduleId ? { ...slot, is_reventado: settings.is_reventado, is_megareventado: settings.is_megareventado, name: settings.name, time: settings.time, puestos: settings.puestos } : slot
				)
			}));

			acts.add({
				message: 'Se han guardado los cambios correctamente.',
				mode: 'success',
				lifetime: 3
			})
		} catch (error) {
			console.error('Error saving schedule settings', error);
			acts.add({
				message: 'Ha ocurrido un error al guardar los cambios.',
				mode: 'error',
				lifetime: 3
			})
		}
	}

	async function handleConfirmDeleteSchedule() {
		try {
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
				schedules: sorteo.schedules.filter((slot) => slot.id !== scheduleToDelete?.id) //Asume schedule ids are unique across draws for simplicity, otherwise also check sorteoId
			}));
			scheduleToDelete = { id: -1, name: '', time: '', is_reventado: false, is_megareventado: false };
		} catch (error) {
			console.error('Error deleting schedule', error);
			acts.add({
				message: 'Ha ocurrido un error al eliminar el horario.',
				mode: 'error',
				lifetime: 3
			})
		}
	}

	async function handleConfirmDeleteSorteo() {
		const sorteoId = sorteoToDelete?.id;
		if (sorteoId == null || sorteoId === -1) return;

		if (draws.find((sorteo) => sorteo.id === sorteoId)?.schedules.length) {
			acts.add({
				message: 'No se puede eliminar un sorteo con horarios asignados.',
				mode: 'error',
				lifetime: 3
			})
			return;
		}
		try {
			const response = await fetch(`/banca/sorteos/${sorteoId}`, {method: 'DELETE'})

			if (!response.ok) {
				console.error('Error deleting sorteo', response.statusText);
				acts.add({
					message: 'Ha ocurrido un error al eliminar el sorteo.',
					mode: 'error',
					lifetime: 3
				})
				return;
			}

			acts.add({
				message: 'Sorteo eliminado correctamente.',
				mode: 'success',
				lifetime: 3
			})
			draws = draws.filter((sorteo) => sorteo.id !== sorteoId);
			expandedSorteo = expandedSorteo.filter((id) => id !== sorteoId);
			sorteoToDelete = undefined;

		} catch (error) {
			console.error('Error deleting sorteo', error);
			acts.add({
				message: 'Ha ocurrido un error al eliminar el sorteo.',
				mode: 'error',
				lifetime: 3
			})
			return;
		}
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
				onToggle={() => toggleSorteo(draw.id)}
				onToggleSchedule={async (scheduleId: number) => await toggleSchedule(draw.id, scheduleId)}
				onUpdateSchedule={(scheduleId: number, changes: Partial<schedule>) =>
					updateSchedule(draw.id, scheduleId, changes)
				}
				onEditSorteo={() => showEditSorteo(draw.id)}
				onDeleteSorteo={() => showDeleteSorteo(draw.id)}
				onAddSchedule={() => showAddSchedule(draw.id)}
				onDeleteSchedule={(scheduleId: number) => showDeleteSchedule(draw.id, scheduleId)}
				onSaveScheduleSettings={saveScheduleSettings}
			/>
		{/each}
	</div>
	<div class="shortcuts">
		<h2>Atajos</h2>
		<div class="shortcuts-actions">
			<button onclick={openAssignSorteoModal}>Agregar un sorteo a todos los puestos</button>
			<button onclick={() => {}}>Agregar un puesto en todos los sorteos</button>
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
