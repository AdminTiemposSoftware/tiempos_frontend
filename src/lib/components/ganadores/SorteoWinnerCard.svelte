<script lang="ts">
	let {winner} = $props();

	type Winner = {
		draw_id: number;
		draw_is_megareventado: boolean;
		draw_is_reventado: boolean;
		draw_schedule_name: string;
        positions: Record<string, Position>;
		schedule_id: number;
		schedule_time: string;
	};

    type Position = {
        id: number;
        multiplier: number;
    };
    console.log('winner', winner);
</script>

<div class="panel-card">
    <div 
        class="panel-toggle"
        onclick={handleToggle}
        onkeydown={(e) => e.key === "Enter" && handleToggle()}
        role="button"
        tabindex="0"
    >
	<div class="winner-header">
		<div>
			<h3>{winner.draw_schedule_name}</h3>
			<p>{winner.schedule_time}</p>
		</div>

		<div class="winner-tags">
            {#if winner.positions && Object.keys(winner.positions).length > 0}
                {#each Object.entries(winner.positions) as [number, position]}
                    {#if number === '1' && !position.multiplier}
                        <div class="tag tag-danger">
                            Aun no se ha asignado un multiplicador para el primer lugar
                        </div>
                    {:else}
                        <div class="tag">
                            {#if number === '1'}
                                El primero paga al
                            {:else if number === '2'}
                                Si cae reventado paga al 
                            {:else if number === '3'}
                                Si cae megaeventado paga al
                            {:else}
                                {number}º
                            {/if}
                            <span>{position?.multiplier}</span>
                        </div>
                    {/if}
                {/each}
            {/if}
		</div>
	</div>
</div>

</div>

<style>
	.winner-card {
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 1rem;
		background: white;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.winner-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
	}

	.winner-header h3 {
		margin: 0;
	}

	.winner-header p {
		margin: 0.25rem 0 0;
		opacity: 0.7;
	}

	.winner-tags {
		display: flex;
		gap: 0.5rem;
	}

	.tag {
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		background: #eef2ff;
		font-size: 0.8rem;
	}

	.tag-danger {
		background: #fee2e2;
	}

	.winner-content {
		display: flex;
		gap: 1rem;
	}

	.winner-item {
		flex: 1;
		padding: 0.75rem;
		border-radius: 8px;
		background: #f8f9fa;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.winner-item span {
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.winner-item strong {
		font-size: 1.25rem;
	}
</style>