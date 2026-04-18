<script lang="ts">
	import ConfirmModal from '$lib/components/ConfirmModal.svelte';
	import PuestoModal from '$lib/components/puestos/PuestoModal.svelte';
	import { PenSolid, TrashBinSolid, EyeSolid } from 'flowbite-svelte-icons';

	let headers = [
		{ key: 'name', label: 'Nombre' },
		{ key: 'phone', label: 'Telefono' },
		{ key: 'commission', label: 'Ve comision' },
		{ key: 'status', label: 'Estado' },
		{ key: 'user', label: 'Usuario' },
		{ key: 'options', label: 'Opciones' }
	];

	let data = $state([
		{
			id: 1,
			name: 'Puesto 1',
			phone: '123-456-7890',
			commission: true,
			status: 'Activo',
			user: 'user1'
		},
		{
			id: 2,
			name: 'Puesto 2',
			phone: '098-765-4321',
			commission: false,
			status: 'Inactivo',
			user: 'user2'
		},
		{
			id: 3,
			name: 'Puesto 3',
			phone: '555-555-5555',
			commission: true,
			status: 'Activo',
			user: null
		}
	]);

	let showModal = $state(false);
	let showDeleteModal = $state(false);
	let selectedPuesto = $state<(typeof data)[number] | null>(null);
	let puestoToDelete= $state<(typeof data)[number] | null>(null);

	function handleEdit(puesto: (typeof data)[number]) {
		selectedPuesto = puesto;
		showModal = true;
	}

	function handleDelete(puesto: (typeof data)[number]) {
		puestoToDelete = puesto;
		showDeleteModal = true;
	}

	function handleConfirmDelete() {
		if (!puestoToDelete) {
			return;
		}
		data = data.filter((item) => item.id !== puestoToDelete?.id);
		puestoToDelete = null;
	}

	function handleAddPuesto(event: CustomEvent) {
		data = [...data, event.detail];
	}

	function handleUpdatePuesto(event: CustomEvent) {
		const updated = event.detail;
		data = data.map((item) => (item.id === updated.id ? updated : item));
	}

	function handleView(puesto: (typeof data)[number]) {
		selectedPuesto = puesto;
		showModal = true;
	}

</script>

<PuestoModal
	bind:showModal
	bind:puesto={selectedPuesto}
	on:addPuesto={handleAddPuesto}
	on:updatePuesto={handleUpdatePuesto}
/>

<ConfirmModal
	bind:showModal={showDeleteModal}
	title="Eliminar puesto"
	message={`Estas seguro de eliminar ${puestoToDelete?.name ?? 'este puesto'}?`}
	confirmText="Eliminar"
	cancelText="Cancelar"
	on:confirm={handleConfirmDelete}
/>

<section class="puestos-container">
	<div class="header-contained">
		<div>
			<h1>Puestos</h1>
			<p>Gestiona puestos.</p>
		</div>
		<button onclick={() => ((selectedPuesto = null), (showModal = true))}>
			Agregar nuevo puesto
		</button>
	</div>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					{#each headers as header}
						<th>{header.label}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each data as row}
					<tr>
						<td>{row.name}</td>
						<td>{row.phone}</td>
						<td>{row.commission ? 'Sí' : 'No'}</td>
						<td>{row.status}</td>
						<td>{row.user || 'N/A'}</td>
						<td>
							<div class="options-buttons">
								<button class="neutral" onclick={() => handleEdit(row)}>
									<PenSolid class="shrink-0 h-4 w-4" />
								</button>
								<button class="negative" onclick={() => handleDelete(row)}>
									<TrashBinSolid class="shrink-0 h-4 w-4" />
								</button>
								<button
									onclick={() => handleView(row)}
								>
									<EyeSolid class="shrink-0 h-4 w-4" />
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	.puestos-container {
		flex-direction: column;
		justify-content: start;
		align-items: stretch;
		gap: 1rem;
		width: 100%;
	}

	h1 {
		text-align: left;
	}
</style>


