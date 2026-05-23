<script>
    import { auth } from "$lib/stores/auth";
	import BancaModal from "$lib/components/bancas/BancaModal.svelte";

	const bancas = [
		{
			id: "BNC-001",
			name: "Banca Central",
			location: "Santo Domingo",
			manager: "Laura Mendez",
			status: "Active",
			updatedAt: "2026-05-20"
		},
		{
			id: "BNC-002",
			name: "Banca Norte",
			location: "Santiago",
			manager: "Marcos Ruiz",
			status: "Active",
			updatedAt: "2026-05-18"
		},
		{
			id: "BNC-003",
			name: "Banca Este",
			location: "La Romana",
			manager: "Andrea Perez",
			status: "Paused",
			updatedAt: "2026-05-16"
		},
		{
			id: "BNC-004",
			name: "Banca Oeste",
			location: "San Cristobal",
			manager: "Carlos Diaz",
			status: "Active",
			updatedAt: "2026-05-15"
		},
		{
			id: "BNC-005",
			name: "Banca Sur",
			location: "Barahona",
			manager: "Diana Soto",
			status: "Inactive",
			updatedAt: "2026-05-12"
		},
		{
			id: "BNC-006",
			name: "Banca Jardines",
			location: "Punta Cana",
			manager: "Rafael Ortiz",
			status: "Active",
			updatedAt: "2026-05-10"
		}
	];

	const statusLabels = {
		Active: "Activa",
		Paused: "Pausada",
		Inactive: "Inactiva"
	};

	let selectedBanca = null;
	let showBancaModal = false;
</script>

{#if ['banking'].includes($auth.user?.role ?? '')}
<section>
	<header class="header-banking">
		<div class="header-title">
			<h1 class="title">Bancas</h1>
            <p class="subtitle">Gestiona las bancas de tu negocio, visualiza su estado y detalles.</p>
		</div>
		<div class="actions">
			<button class="button" type="button">Nueva banca</button>
		</div>
	</header>

	<div class="toolbar">
		<div class="search">
			<span class="search__icon">Buscar</span>
			<input class="search__input" type="text" placeholder="Buscar por nombre o ID" />
		</div>
		<div class="filters">
			<button class="chip" type="button">Todas</button>
			<button class="chip" type="button">Activas</button>
			<button class="chip" type="button">Pausadas</button>
			<button class="chip" type="button">Inactivas</button>
		</div>
	</div>

	<BancaModal
		bind:showModal={showBancaModal}
		banca={selectedBanca}
		statusLabel={selectedBanca ? statusLabels[selectedBanca.status] : ""}
	/>

	<div class="grid">
		{#each bancas as banca}
			<article class="card">
				<div class="card__header">
					<div>
						<p class="card__id">{banca.id}</p>
						<h2 class="card__title">{banca.name}</h2>
						<p class="card__meta">{banca.location}</p>
					</div>
					<span class={`status status--${banca.status.toLowerCase()}`}>
						{statusLabels[banca.status] ?? banca.status}
					</span>
				</div>
				<div class="card__body">
					<div class="detail">
						<span class="detail__label">Encargado</span>
						<span class="detail__value">{banca.manager}</span>
					</div>
					<div class="detail">
						<span class="detail__label">Ultima actualizacion</span>
						<span class="detail__value">{banca.updatedAt}</span>
					</div>
				</div>
				<div class="card__footer">
					<button
						class="link"
						type="button"
						on:click={() => {
							selectedBanca = banca;
							showBancaModal = true;
						}}
					>
						Ver
					</button>
					<button class="link" type="button">Editar</button>
				</div>
			</article>
		{/each}
	</div>
</section>
{/if}

<style>
    section {
        flex-direction: column;
        flex: 1;
        gap: 1rem;
        justify-content: start;
    }

	.card__header,
    .toolbar,
	.card__footer {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

    .toolbar {
        width: 100%;
    }

	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.14em;
		font-size: 0.7rem;
		margin: 0 0 0.4rem;
	}

	.title {
		margin: 0 0 0.25rem;
		text-align: left;
	}

	.subtitle {
		margin: 0;
		max-width: 38rem;

	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.search__icon {
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.search__input {
		min-width: 220px;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
        width: 100%;
	}

	.card {
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		background: #fff;
		padding: 1rem;
		display: grid;
		gap: 0.75rem;
	}

	.card__id {
		margin: 0;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.card__title {
		margin: 0.35rem 0 0.2rem;
		font-size: 1.1rem;
	}

	.card__meta {
		margin: 0;
		font-size: 0.85rem;
	}

	.status {
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.7rem;
		text-transform: uppercase;
	}

	.status--active {
		background: #e9f2ea;
	}

	.status--paused {
		background: #fff2dd;
	}

	.status--inactive {
		background: #f6e7e7;
	}

	.detail {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.9rem;
	}

	.link {
		background: none;
		border: none;
		padding: 0;
		color: inherit;
		cursor: pointer;
		text-decoration: underline;
	}
</style>
