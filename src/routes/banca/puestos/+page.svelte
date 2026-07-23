<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import PuestoModal from '$lib/components/puestos/PuestoModal.svelte';
	import UserModal from '../../../lib/components/puestos/UserModal.svelte';
	import { PenSolid, TrashBinSolid } from 'flowbite-svelte-icons';
	import { auth } from '$lib/stores/auth';
	import {Notifications, acts} from '@tadashi/svelte-notification'

	let { data } = $props();
	let showModal = $state(false);
	let showUserModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedPuesto = $state<Puesto | null>(null);
	let puestoToDelete = $state<Puesto | null>(null);
	let expandedPuestos = $state<number[]>([]);
	let puestos = $state<Puesto[]>([]);

	type Puesto = {
		id?: number;
		banking_id: number;
		name: string;
		location: string;
		prohibited_percentage?: number | string;
		user_count?: number;
		draw_count?: number;
		users?: Array<{ username: string; name: string; phone: string }>;
		sorteos?: Array<{ id: number; name: string; type: string; days: string }>;
	};

	$effect(() => {
		const items: Puesto[] = Array.isArray(data?.items) ? data.items : [];
		puestos = items.map((item: Puesto) => ({
			...item,
			prohibited_percentage: Number(item.prohibited_percentage ?? 0),
			user_count: Number(item.user_count ?? 0),
			draw_count: Number(item.draw_count ?? 0),
			users: item.users ?? [],
			sorteos: item.sorteos ?? []
		}));
	});

	function togglePuesto(puestoId: number) {
		expandedPuestos = expandedPuestos.includes(puestoId)
			? expandedPuestos.filter((id) => id !== puestoId)
			: [...expandedPuestos, puestoId];
	}

	function openNewPuesto() {
		selectedPuesto = {
			banking_id: Number(data?.bankingId ?? 1),
			name: '',
			location: '',
			prohibited_percentage: 0,
			users: [],
			sorteos: []
		};
		showModal = true;
	}

	function handleEdit(puesto: Puesto) {
		selectedPuesto = { ...puesto };
		showModal = true;
	}

	function handleDelete(puesto: Puesto) {
		puestoToDelete = puesto;
		showDeleteModal = true;
	}

	async function handleConfirmDelete() {
		try {
			if (!puestoToDelete) {
				return;
			}
			const response = await fetch(`/banca/puestos/${puestoToDelete?.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				acts.add({
					message: 'Error al eliminar el puesto',
					mode: 'error',
					lifetime: 3
				});
				return;
			}

			acts.add({
				message: 'Puesto eliminado correctamente',
				mode: 'success',
				lifetime: 3
			});
			puestos = puestos.filter((item) => item.id !== puestoToDelete?.id);
			expandedPuestos = expandedPuestos.filter((id) => id !== puestoToDelete?.id);
			puestoToDelete = null;
		} catch (error) {
			console.error('Error al eliminar el puesto:', error);
			acts.add({
				message: 'Error al eliminar el puesto',
				mode: 'error',
				lifetime: 3
			});
		}
	}

	async function handleAddPuesto(payload: Puesto) {
		try {
			const response = await fetch('/banca/puestos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					banking_id: Number(payload.banking_id ?? data?.bankingId ?? 1),
					name: payload.name ?? 'Nuevo puesto',
					location: payload.location ?? '-',
					prohibited_percentage: Number(payload.prohibited_percentage ?? 0)
				})
			});

			if (!response.ok) {
				acts.add({
					message: 'Error al crear el puesto',
					mode: 'error',
					lifetime: 3
				});
				return;
			}

			const result = await response.json().catch(() => null);
			const id = result?.items?.[0]?.id;
			const createdPuesto =  {
				id: id,
				banking_id: Number(payload.banking_id ?? data?.bankingId ?? 1),
				name: payload.name ?? 'Nuevo puesto',
				location: payload.location ?? '-',
				prohibited_percentage: Number(payload.prohibited_percentage ?? 0),
				user_count: 0,
				draw_count: 0,
				users: payload.users ?? [],
				sorteos: payload.sorteos ?? []
			};

			acts.add({
				message: 'Puesto creado correctamente',
				mode: 'success',
				lifetime: 3
			});

			showModal = false;
			puestos = [...puestos, createdPuesto];
		} catch (error) {
			console.error('Error al crear el puesto:', error);
			acts.add({
				message: 'Error al crear el puesto',
				mode: 'error',
				lifetime: 3
			});
		}
	}

	async function handleUpdatePuesto(payload: { id: number, name?: string, location?: string, prohibited_percentage?: number } ) {
		try {
			if (!payload.id) {
				throw new Error('El payload debe contener un id válido para actualizar el puesto.');
			}

			const response = await fetch(`/banca/puestos/${payload.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: payload.name ?? '',
					location: payload.location ?? '',
					prohibited_percentage: Number(payload.prohibited_percentage ?? 0)
				})
			});

			if (!response.ok) {
				acts.add({
					message: 'Error al actualizar el puesto',
					mode: 'error',
					lifetime: 3
				});
				return;
			}

			acts.add({
				message: 'Puesto actualizado correctamente',
				mode: 'success',
				lifetime: 3
			});
			puestos = puestos.map((item) => item.id === payload.id ? {
				...item,
				...payload
			} : item );
			showModal = false;
		} catch (error) {
			console.error('Error al actualizar el puesto:', error);
			acts.add({
				message: 'Error al actualizar el puesto',
				mode: 'error',
				lifetime: 3
			});
		}
	}

	function handleCreateUser(puesto: Puesto) {
		selectedPuesto = puesto;
		showUserModal = true;
	}

	async function addUser(payload: { username: string; name: string; phone: string; password?: string }) {
		try {
			if (!selectedPuesto?.id) {
				throw new Error('No se puede agregar un usuario sin un puesto seleccionado.');
			}

			const response = await fetch(`/banca/puestos/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({"branch_id": selectedPuesto.id, "username": payload.username, "name": payload.name, "phone": payload.phone, "password": payload.password})
			});

			if (!response.ok) {
				acts.add({
					message: 'Error al agregar el usuario',
					mode: 'error',
					lifetime: 3
				});
				return;
			}

			const result = await response.json().catch(() => null);
			const id = result?.items?.[0].new_user_id;

			acts.add({
				message: 'Usuario agregado correctamente',
				mode: 'success',
				lifetime: 3
			});
			puestos = puestos.map((item) => item.id === selectedPuesto?.id ? {
				...item,
				users: [...(item.users ?? []), { id, username: payload.username, name: payload.name, phone: payload.phone }],
				user_count: (item.user_count ?? 0) + 1
			} : item );

			showUserModal = false;
		} catch (error) {
			console.error('Error al agregar el usuario:', error);
			acts.add({
				message: 'Error al agregar el usuario',
				mode: 'error',
				lifetime: 3
			});
		}
	}

	function updateUser() {
		// TODO
	}

	function handleAssignSorteo() {
		// TODO
	}
</script>

<PuestoModal
	bind:showModal={showModal}
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

<UserModal
	bind:showModal={showUserModal}
	updateUser={updateUser}
	addUser={addUser}
/>
	
<svelte:head>
	<title>Puestos</title>
</svelte:head>

{#if ['banking'].includes($auth.user?.role ?? '')}
<Notifications />
<section class="page-stack">
	<header class="header-banking">
		<div>
			<h1 class="title">Puestos</h1>
			<p class="subtitle">Gestiona usuarios y sorteos por puesto.</p>
		</div>
		<button onclick={openNewPuesto}>
			Agregar nuevo puesto
		</button>
	</header>
	<div class="panel-list">
		{#each puestos as puesto}
			<div class="panel-card">
				<div 
					class="panel-toggle" 
					onclick={() => togglePuesto(puesto.id ?? 0)}
					onkeydown={(e) => e.key === 'Enter' && togglePuesto(puesto.id ?? 0)}
					role="button"
					tabindex="0"
				>
					<div class="panel-info">
						<span class="panel-title">{puesto.name}</span>
						<span class="puesto-location">{puesto.location}</span>
						<div class="chip-row">
							<span class="chip chip--muted">{puesto.user_count ?? puesto.users?.length ?? 0} usuarios</span>
							<span class="chip chip--muted">{puesto.draw_count ?? puesto.sorteos?.length ?? 0} sorteos</span>
							<span class="chip chip--muted">Prohibidos al {puesto.prohibited_percentage}%</span>
						</div>
					</div>
					<div class="options-buttons">
						<button class="neutral" onclick={(event) => {event.stopPropagation(); handleEdit(puesto); }}>
							<PenSolid class="shrink-0 h-4 w-4" />
						</button>
						<button class="negative" onclick={(event) => {event.stopPropagation(); handleDelete(puesto); }}>
							<TrashBinSolid class="shrink-0 h-4 w-4" />
						</button>
					</div>
				</div>
				{#if expandedPuestos.includes(puesto.id ?? 0)}
					<div class="panel-content panel-content--filled">

						<div class="subsection column">
							<div class="sub-subsection">
								<h3>Usuarios</h3>
								{#if puesto.users?.length === 0}
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
								<button onclick={() => handleCreateUser(puesto)}>
									Agregar usuario
								</button>
							</div>

							<div class="sub-subsection">
								<h3>Sorteos asociados</h3>
								{#if puesto.sorteos?.length === 0}
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
								<button onclick={handleAssignSorteo}>
									Assignar sorteo	
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</section>
{/if}

<style>
	section {
		gap: 0;
	}

	.puesto-location {
		color: rgba(0, 0, 0, 0.6);
		font-size: 0.9rem;
	}

	.panel-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.chip-row {
		margin-top: 0.5rem;
	}

	.panel-content--filled {
		background: #fff;
		border-top: 1px solid var(--color-border);
		border-bottom-left-radius: 0.5rem;
		border-bottom-right-radius: 0.5rem;
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


