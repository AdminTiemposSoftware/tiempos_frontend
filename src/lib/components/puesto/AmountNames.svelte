<script lang="ts">
	import { acts } from '@tadashi/svelte-notification';

	type AmountName = {
		id?: number;
		branch_id?: number | string;
		name: string;
		amount: number | string;
		key: string;
	};

	let { branchId, initialItems = [] }: {
		branchId: string | null | undefined;
		initialItems?: AmountName[];
	} = $props();
	let items = $state<AmountName[]>(initialItems);
	let loading = $state(false);
	let saving = $state(false);
	let editingId = $state<number | null>(null);
	let form = $state({ name: '', amount: '', key: '' });

	function notify(message: string, mode: 'success' | 'error') {
		acts.add({ message, mode, lifetime: 3 });
	}

	function resetForm() {
		form = { name: '', amount: '', key: '' };
		editingId = null;
	}

	function editItem(item: AmountName) {
		editingId = (item.id ?? null);
		form = { name: item.name, amount: String(item.amount), key: item.key };
	}

	async function saveItem() {
		const name = form.name.trim();
		const amount = Number(form.amount);
		const key = form.key.trim();

		if (!name || !Number.isInteger(amount) || amount < 0 || key.length !== 1) {
			notify('Ingresa un nombre, un monto entero y una tecla de un solo carácter', 'error');
			return;
		}

		const wasEditing = Boolean(editingId);
		saving = true;
		try {
			const current = editingId ? items.find((item) => item.id === editingId) : null;
			const response = await fetch('/puesto/usuario/amount', {
				method: editingId ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					branch_id: Number(branchId),
					name,
					amount,
					key,
					...(current?.id !== undefined
						? { id: current.id }
						: {})
				})
			});
			const payload = await response.json().catch(() => null);
			if (!response.ok) throw new Error(payload?.error);

			const returned = Array.isArray(payload?.items) ? payload.items[0] : null;
			const saved = returned ?? {
				...(current ?? {}),
				branch_id: Number(branchId),
				name,
				amount,
				key
			};
			items = editingId
				? items.map((item) => (item.id === editingId ? saved : item))
				: [...items, saved];
			resetForm();
			notify(wasEditing ? 'Actualizada correctamente' : 'Creado correctamente', 'success');
		} catch (error) {
			console.error('Error al guardar:', error);
			notify('Error al guardar', 'error');
		} finally {
			saving = false;
		}
	}

	async function deleteItem(item: AmountName) {
		if (!confirm(`¿Eliminar la configuración "${item.name}"?`)) return;

		try {
			const response = await fetch(`/puesto/usuario/amount/${item.id}`, {
				method: 'DELETE'
			});
			const payload = await response.json().catch(() => null);
			if (!response.ok) throw new Error(payload?.error);
			items = items.filter((candidate) => candidate.id !== item.id);
			if (editingId === item.id) resetForm();
			notify('Eliminada correctamente', 'success');
		} catch (error) {
			console.error('Error al eliminar:', error);
			notify('Error al eliminar', 'error');
		}
	}
</script>

<div class="amount-names">
	<form class="amount-form" onsubmit={(event) => { event.preventDefault(); saveItem() }}>
		<label>
			<span>Nombre</span>
			<input type="text" maxlength="50" bind:value={form.name} required />
		</label>
		<label>
			<span>Monto</span>
			<input type="number" min="0" step="1" bind:value={form.amount} required />
		</label>
		<label>
			<span>Tecla</span>
			<input type="text" maxlength="1" bind:value={form.key} required />
		</label>
		<div class="form-actions">
			<button type="submit" disabled={saving}>{editingId ? 'Actualizar' : 'Agregar'}</button>
			{#if editingId}
				<button type="button" class="secondary" onclick={resetForm}>Cancelar</button>
			{/if}
		</div>
	</form>

	{#if loading}
		<p class="empty">Cargando...</p>
	{:else if items.length === 0}
		<p class="empty">No hay rifas.</p>
	{:else}
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th scope="col">Monto</th>
						<th scope="col">Nombre</th>
						<th scope="col">Tecla</th>
						<th scope="col">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{#each items as item}
						<tr>
							<td>{item.amount}</td>
							<td>{item.name}</td>
							<td>{item.key}</td>
							<td>
								<div class="item-actions">
									<button type="button" onclick={() => editItem(item)}>Editar</button>
									<button type="button" class="negative" onclick={() => void deleteItem(item)}>Eliminar</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.amount-names {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.amount-form {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.75rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	label {
		display: flex;
		flex: 1 1 10rem;
		flex-direction: column;
		gap: 0.3rem;
	}

	label span {
		color: rgba(0, 0, 0, 0.65);
		font-size: 0.85rem;
	}

	.form-actions,
	.item-actions {
		display: flex;
		gap: 0.5rem;
	}

	.table-container {
		overflow: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	tbody tr:hover {
		background: var(--color-box-background);
	}

</style>
