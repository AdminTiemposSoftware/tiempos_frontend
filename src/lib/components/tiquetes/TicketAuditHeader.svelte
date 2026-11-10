<header class="audit-header">
	<div>
		<h1>Tiquetes vendidos</h1>
	</div>
</header>

<style>
	.audit-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 0;
		border: 0;
		background: transparent;
	}

	.eyebrow {
		color: var(--color-theme-1);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0.2rem 0 0;
		color: #172b4d;
		font-size: clamp(1.7rem, 3vw, 2.4rem);
		font-weight: 700;
		line-height: 1.15;
		text-align: left;
	}

	p {
		max-width: 42rem;
		margin: 0.5rem 0 0;
		color: #68778d;
		line-height: 1.45;
	}

	@media (max-width: 640px) {
		.audit-header {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>
