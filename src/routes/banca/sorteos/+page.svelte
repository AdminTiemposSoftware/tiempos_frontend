<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import ScheduleModal from '$lib/components/sorteos/ScheduleModal.svelte';
	import SorteoModal from '$lib/components/sorteos/SorteoModal.svelte';
	import SorteoCard from '$lib/components/sorteos/SorteoCard.svelte';
	import AssignSorteoModal from '$lib/components/sorteos/AssignSorteoModal.svelte';
	import AssignPuestoModal from '$lib/components/sorteos/AssignPuestoModal.svelte';
	import ProhibitedNumberModal from '$lib/components/ProhibitedNumberModal.svelte';
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

	type prohibitedNumber = {
		number: number;
		amount: number;
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

		const prohibitedItems = Array.isArray(data?.prohibitedItems)
			? (data.prohibitedItems as prohibitedNumber[])
			: [];
		prohibitedNumbers = prohibitedItems
			.map((item) => ({
				number: Number(item.number),
				amount: Number(item.amount)
			}))
			.filter((item) => Number.isFinite(item.number) && Number.isFinite(item.amount))
			.sort((a, b) => a.number - b.number);

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
	let puestoToDelete = $state(null);
	let scheduleToDelete = $state(null);
	let sorteoToDelete = $state(null);
	let prohibitedNumberToDelete = $state<number | null>(null);
	let newProhibitedNumber = $state('');
	let newProhibitedAmount = $state('');
	let expandedSorteo = $state<number[]>([]);
	let selectedScheduleBySorteo = $state<Record<number, number | null>>({});
	let prohibitedNumbers = $state<prohibitedNumber[]>([]);
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
				const items = Array.isArray(payload?.items) ? payload.items as { id: number; name: string; time: string, is_reventado: boolean, is_megareventado: boolean }[] : [];
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

			const puestos = items.map((it: { branch_id: number; name: string; comission: string }) => ({
				id: it.branch_id,
				name: it.name,
				comission: Number(it.comission)
			}));
			
			puestoBySchedule = puestos;
		} catch (e) {
			console.error('Error fetching branches for schedule', e);
		}
	}

	async function toggleSchedule(sorteoId: number, scheduleId: number) {
		selectedScheduleBySorteo = { ...selectedScheduleBySorteo, [sorteoId]: scheduleId };

		const sorteo = draws.find((d) => d.id === sorteoId);
		const slot = sorteo?.schedule?.find((s) => s.id === scheduleId);
		if (!slot) return;
		// console.log('Selected schedule', scheduleId);
		await fetchBranchesForSchedule(scheduleId);
		// console.log(puestosBySchedule);
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
		selectedSorteo = { ...draws.find((s) => s.id === sorteoId) };
		showSorteoModal = true;
	}

	function showEditSchedule(sorteoId: number, scheduleId: number) {
		selectedSchedule = {
			...draws.find((s) => s.id === sorteoId)?.schedule.find((s) => s.id === scheduleId)
		};
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

	function saveScheduleSettings(
		sorteoId: number,
		scheduleId: number,
		settings: {
			is_reventado: boolean;
			is_megareventado: boolean;
			puestos: Record<number, { enabled: boolean; comission: number }>;
		}
	) {
		draws = draws.map((sorteo) => {
			if (sorteo.id !== sorteoId) {
				return sorteo;
			}

			return {
				...sorteo,
				schedule: sorteo.schedule.map((slot) =>
					slot.id !== scheduleId
						? slot
						: {
							...slot,
							is_reventado: settings.is_reventado,
							is_megareventado: settings.is_megareventado,
							puestos: puestoOptions
								.filter((puesto) => settings.puestos[puesto.id]?.enabled)
								.map((puesto) => ({
									id: puesto.id,
									name: puesto.name,
									comission: Number(settings.puestos[puesto.id]?.comission ?? puesto.comission ?? 0)
								}))
						}
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
		prohibitedNumbers = prohibitedNumbers.filter((item) => item.number !== prohibitedNumberToDelete);
		prohibitedNumberToDelete = null;
	}

	function openAddProhibitedModal() {
		newProhibitedNumber = '';
		newProhibitedAmount = '';
		showAddProhibitedModal = true;
	}

	async function handleAddProhibitedNumber(payload: { number: string; amount: string }) {
		console.log('Adding prohibited number with payload:', payload);
		const value = Number(payload.number);
		const amount = Number(payload.amount);
		if (!Number.isFinite(amount)) {
			return;
		}
		const response = await fetch('/number/prohibited', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ number: value, amount })
		});
		if (!response.ok) {
			return;
		}
		prohibitedNumbers = prohibitedNumbers.some((item) => item.number === value)
			? prohibitedNumbers
			: [...prohibitedNumbers, { number: value, amount }].sort((a, b) => a.number - b.number);
		newProhibitedNumber = '';
		newProhibitedAmount = '';
		showAddProhibitedModal = false;
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
	bind:number={newProhibitedNumber}
	bind:amount={newProhibitedAmount}
	title="Agregar numero restringido"
	confirmText="Guardar"
	cancelText="Cancelar"
	onConfirm={handleAddProhibitedNumber}
/>

<!-- TODO send the modal with the selected puestos for this sorteo -->
<AssignSorteoModal
	bind:showModal={showAssignSorteoModal}
	draws={draws}
	bind:selectedSorteoId={selectedShortcutSorteoId}
	bind:selectedPuesto={selectedShortcutPuesto}
	title="Agregar sorteo a todos los puestos"
	confirmText="Aplicar"
	cancelText="Cancelar"
	confirm={handleAssignSorteoToPuestos}
/>

<svelte:head>
	<title>Sorteos</title>
</svelte:head>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section class="page-stack draws-page">
	<header class="header-banking">
		<div class="header-top">
			<div class="header-title">
				<h1 class="title">Sorteos</h1>
				<p class="subtitle">Gestiona horarios y puestos por sorteo.</p>
			</div>
			<button onclick={handleAddSorteo}>Nuevo sorteo</button>
		</div>
		<div class="prohibited">
			<span class="label">Restringidos:</span>
			<div class="prohibited-list">
				{#if prohibitedNumbers?.length}
					{#each prohibitedNumbers as prohibitedNumber}
						<button
							type="button"
							class="prohibited-badge"
							onclick={() => showDeleteProhibitedNumber(prohibitedNumber.number)}
							aria-label={`Eliminar numero restringido ${prohibitedNumber.number}`}
						>
							{prohibitedNumber.number}
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
	</header>
	<div class="panel-list">
		{#each draws as draw}
			{@const selectedSlot = getSelectedSchedule(draw)}
			<SorteoCard
				sorteo={draw}
				expanded={expandedSorteo.includes(draw.id)}
				selectedSlot={selectedSlot}
				puestoOptions={puestoOptions}
				puestoBySchedule={puestoBySchedule}
				onToggle={() => toggleSorteo(draw.id)}
				onToggleSchedule={(scheduleId: number) => toggleSchedule(draw.id, scheduleId)}
				onEditSorteo={() => showEditSorteo(draw.id)}
				onDeleteSorteo={() => showDeleteSorteo(draw.id)}
				onAddSchedule={() => showAddSchedule(draw.id)}
				onEditSchedule={(scheduleId: number) => showEditSchedule(draw.id, scheduleId)}
				onDeleteSchedule={(scheduleId: number) => showDeleteSchedule(draw.id, scheduleId)}
				onSaveScheduleSettings={(
					scheduleId: number,
					settings: {
						is_reventado: boolean;
						is_megareventado: boolean;
						puestos: Record<number, { enabled: boolean; comission: number }>;
					}
				) => saveScheduleSettings(draw.id, scheduleId, settings)
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
	
	.prohibited-add {
		border-style: dashed;
		color: var(--color-theme-2);
		border-color: var(--color-theme-2);
		font-weight: 600;
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


