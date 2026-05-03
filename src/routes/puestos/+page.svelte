<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import PuestoModal from '$lib/components/puestos/PuestoModal.svelte';
	import { PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';

	type SorteoLink = {
		id: number;
		name: string;
		type: string;
		days: string;
	};

	let data = $state([
		{
			id: 1,
			banking_id: 4,
			name: 'Puesto Central',
			location: 'Av. Duarte #120',
			status: 'Activo',
			prohibited_percentage: 7.5,
			users: [
				{ username: 'ana.p', name: 'Ana Pérez', phone: '123-456-7890' },
				{ username: 'carlosg', name: 'Carlos García', phone: '098-765-4321' },
				{ username: 'maria.l', name: 'María López', phone: '555-555-5555' }
			],
			sorteos: [
				{ id: 1, name: 'Loteria Nacional', type: 'Tiempos', days: 'Lun, Mie, Vie' },
				{ id: 1, name: 'Loteria Nacional', type: 'Tiempos', days: 'Lun, Mie, Vie' },
				{ id: 1, name: 'Loteria Nacional', type: 'Tiempos', days: 'Lun, Mie, Vie' },
				{ id: 1, name: 'Loteria Nacional', type: 'Tiempos', days: 'Lun, Mie, Vie' },
				{ id: 1, name: 'Loteria Nacional', type: 'Tiempos', days: 'Lun, Mie, Vie' },
				{ id: 1, name: 'Loteria Nacional', type: 'Tiempos', days: 'Lun, Mie, Vie' },
				{ id: 1, name: 'Loteria Nacional', type: 'Tiempos', days: 'Lun, Mie, Vie' },
				{ id: 2, name: 'Loteria Premium', type: 'Reventado', days: 'Sab, Dom' }
			]
		},
		{
			id: 2,
			banking_id: 7,
			name: 'Puesto Norte',
			location: 'Sector Naco, Local 3',
			status: 'Activo',
			prohibited_percentage: 5,
			users: [
				{ username: 'juan.m', name: 'Juan Martínez', phone: '555-123-4567' },
				{ username: 'rosa.d', name: 'Rosa Díaz', phone: '555-987-6543' }
			],
			sorteos: [
				{ id: 3, name: 'Quiniela Express', type: 'Express', days: 'Mar, Jue, Sab' }]
		},
		{
			id: 3,
			banking_id: 2,
			name: 'Puesto Oeste',
			location: 'Calle 8, Plaza Norte',
			status: 'Inactivo',
			prohibited_percentage: 0,
			users: [],
			sorteos: []
		}
	]);

	let showModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedPuesto = $state(null);
	let puestoToDelete = $state(null);
	let expandedPuestos = $state<number[]>([]);

	function togglePuesto(puestoId: number) {
		expandedPuestos = expandedPuestos.includes(puestoId)
			? expandedPuestos.filter((id) => id !== puestoId)
			: [...expandedPuestos, puestoId];
	}

	function openNewPuesto() {
		selectedPuesto = {
			banking_id: 1,
			name: '',
			location: '',
			status: 'Activo',
			prohibited_percentage: 0,
			users: [],
			sorteos: []
		};
		showModal = true;
	}

	function handleEdit(puesto) {
		selectedPuesto = { ...puesto };
		showModal = true;
	}

	function handleDelete(puesto) {
		puestoToDelete = puesto;
		showDeleteModal = true;
	}

	function handleConfirmDelete() {
		if (!puestoToDelete) {
			return;
		}
		data = data.filter((item) => item.id !== puestoToDelete?.id);
		expandedPuestos = expandedPuestos.filter((id) => id !== puestoToDelete?.id);
		puestoToDelete = null;
	}

	function handleAddPuesto(payload) {
		const nextId = Math.max(0, ...data.map((item) => item.id ?? 0)) + 1;
		const nextPuesto = {
			id: nextId,
			banking_id: Number(payload.banking_id ?? 1),
			name: payload.name ?? 'Nuevo puesto',
			location: payload.location ?? '-',
			status: payload.status ?? 'Activo',
			prohibited_percentage: Number(payload.prohibited_percentage ?? 0),
			users: payload.users ?? [],
			sorteos: payload.sorteos ?? []
		};
		data = [...data, nextPuesto];
	}

	function handleUpdatePuesto(payload) {
		data = data.map((item) =>
			item.id === payload.id
				? {
						...item,
						...payload,
						users: payload.users ?? item.users,
						sorteos: payload.sorteos ?? item.sorteos
					}
				: item
		);
	}
</script>

<PuestoModal
	bind:showModal
	bind:puesto={selectedPuesto}
	addPuesto={handleAddPuesto}
	updatePuesto={handleUpdatePuesto}
/>

<ConfirmModal
	bind:showModal={showDeleteModal}
	title="Eliminar puesto"
	message={`Estas seguro de eliminar ${puestoToDelete?.name ?? 'este puesto'}?`}
	confirmText="Eliminar"
	cancelText="Cancelar"
	confirm={handleConfirmDelete}
/>

<svelte:head>
	<title>Puestos</title>
</svelte:head>

<section class="page-stack">
	<div class="header-contained">
		<div>
			<h1>Puestos</h1>
			<p>Gestiona usuarios y sorteos por puesto.</p>
		</div>
		<button onclick={openNewPuesto}>
			Agregar nuevo puesto
		</button>
	</div>
	<div class="panel-list">
		{#each data as puesto}
			<div class="panel-card">
				<button class="panel-toggle" onclick={() => togglePuesto(puesto.id ?? 0)}>
					<div class="panel-main">
						<span class="panel-title">{puesto.name}</span>
						<span class="puesto-location">{puesto.location}</span>
						<div class="chip-row">
							<span class="chip">{puesto.status}</span>
							<span class="chip chip--muted">{puesto.users.length} usuarios</span>
							<span class="chip chip--muted">{puesto.sorteos.length} sorteos</span>
						</div>
					</div>
					<span class="panel-count">Banca #{puesto.banking_id}</span>
				</button>
				{#if expandedPuestos.includes(puesto.id ?? 0)}
					<div class="panel-content panel-content--filled">
						<div class="info-grid">
							<div class="info-card">
								<p class="info-title">Ubicacion</p>
								<p class="info-value">{puesto.location}</p>
							</div>
							<div class="info-card">
								<p class="info-title">Estado</p>
								<p class="info-value">{puesto.status}</p>
							</div>
							<div class="info-card">
								<p class="info-title">Prohibido</p>
								<p class="info-value">{puesto.prohibited_percentage}%</p>
							</div>
						</div>

						<div class="subsection column">
							<div class="sub-subsection">
								<h3>Usuarios</h3>
								{#if puesto.users.length === 0}
									<p class="empty-state">Sin usuarios asignados.</p>
								{:else}
									<div class="table-scroll table-scroll--rows">
										<table class="mini-table">
											<thead>
												<tr>
													<th>Usuario</th>
													<th>Nombre</th>
													<th>Telefono</th>
												</tr>
											</thead>
											<tbody>
												{#each puesto.users as user}
													<tr>
														<td>{user.username}</td>
														<td>{user.name}</td>
														<td>{user.phone}</td>	
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{/if}
							</div>

							<div class="sub-subsection">
								<h3>Sorteos asociados</h3>
								{#if puesto.sorteos.length === 0}
									<p class="empty-state">Sin sorteos asignados.</p>
								{:else}
									<div class="table-scroll table-scroll--rows">
										<table class="mini-table">
											<thead>
												<tr>
													<th>Sorteo</th>
													<th>Tipo</th>
													<th>Dias</th>
												</tr>
											</thead>
											<tbody>
												{#each puesto.sorteos as sorteo}
													<tr>
														<td>{sorteo.name}</td>
														<td>{sorteo.type}</td>
														<td>{sorteo.days}</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{/if}
							</div>
						</div>


						<div class="panel-actions">
							<button onclick={() => handleEdit(puesto)}>
								<PenSolid class="shrink-0 h-4 w-4" />
								Editar
							</button>
							<button class="danger" onclick={() => handleDelete(puesto)}>
								<TrashBinSolid class="shrink-0 h-4 w-4" />
								Eliminar
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>

<style>
	.puesto-location {
		color: rgba(0, 0, 0, 0.6);
		font-size: 0.9rem;
	}

	.panel-content--filled {
		background: #fff;
		border-top: 1px solid var(--color-border);
		border-bottom-left-radius: 0.5rem;
		border-bottom-right-radius: 0.5rem;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 0.75rem;
	}

	.info-card {
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.75rem;
		background: var(--color-bg-2);
	}

	.info-title {
		margin: 0;
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(0, 0, 0, 0.55);
	}

	.info-value {
		margin: 0.35rem 0 0;
		font-weight: 600;
	}

	.subsection {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.subsection h3 {
		margin: 0;
		font-size: 1rem;
	}

	.mini-table {
		width: 100%;
		border-collapse: collapse;
	}

	.mini-table th,
	.mini-table td {
		padding: 0.5rem 0.6rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.9rem;
	}

	.mini-table th {
		color: rgba(0, 0, 0, 0.6);
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.subsection.column {
		display: flex;
		flex-direction: row;
		width: 100%;
	}
	.sub-subsection {
		flex: 1;
	}
</style>


