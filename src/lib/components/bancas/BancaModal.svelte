<script lang="ts">
	type Banca = {
		id: string;
		name: string;
		location: string;
		manager: string;
		status: string;
		updatedAt: string;
	};

	let { banca = $bindable<Banca | null>(null), showModal = $bindable(false), statusLabel = '' } = $props();

	function closeModal() {
		showModal = false;
	}
</script>

{#if showModal && banca}
	<div
		class="modal-backdrop"
		role="button"
		tabindex="0"
		onclick={closeModal}
		onkeydown={(e) => e.key === "Escape" && closeModal()}
	>
		<div class="modal" role="presentation" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-title">Detalle de banca</h2>
			<div class="details">
				<div class="detail-row">
					<span class="label">ID</span>
					<span>{banca.id}</span>
				</div>
				<div class="detail-row">
					<span class="label">Nombre</span>
					<span>{banca.name}</span>
				</div>
				<div class="detail-row">
					<span class="label">Ubicacion</span>
					<span>{banca.location}</span>
				</div>
				<div class="detail-row">
					<span class="label">Encargado</span>
					<span>{banca.manager}</span>
				</div>
				<div class="detail-row">
					<span class="label">Estado</span>
					<span>{statusLabel || banca.status}</span>
				</div>
				<div class="detail-row">
					<span class="label">Ultima actualizacion</span>
					<span>{banca.updatedAt}</span>
				</div>
			</div>
			<div class="modal-actions">
				<button onclick={closeModal}>Cerrar</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.details {
		display: grid;
		gap: 0.5rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.95rem;
	}

	.label {
		font-weight: 600;
	}
</style>
