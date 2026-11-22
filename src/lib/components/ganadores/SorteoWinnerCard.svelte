<script lang="ts">
	import { PenSolid } from 'flowbite-svelte-icons';


	let {
		winner,
		onSelect,
		handleEditMultiplier
	} = $props();

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
</script>

<div class={`panel-toggle`}>
    <div class="winner-header">
        <h3>{winner.draw_schedule_name}</h3>
        <p class="subtitle">{winner.schedule_time}</p>
    </div>

    {#if winner.positions &&  winner.positions['1'] && !winner.positions['1'].multiplier}
        <div class="tag tag-danger">
            Aun no se ha asignado a cuanto paga el primer lugar
        </div>
    {/if}


    <button class="neutral" onclick={handleEditMultiplier}>
		<PenSolid class="shrink-0 h-4 w-4" />
	</button>
</div>


<style>
    .panel-toggle {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        transition: all 0.3s ease;
    }

    .panel-toggle:hover {
        background: #f0f0f0;
    }

	.winner-header {
		display: flex;
		flex-direction: column;
		align-items: start;
		width: 100%;
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
</style>
