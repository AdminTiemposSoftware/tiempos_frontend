<script lang="ts">
	import { PenSolid } from 'flowbite-svelte-icons';
	import AssignWinner from './AssignWinner.svelte';

	let {
		position,
		handleEditMultiplier,
		handleAssignWinner
	} = $props();
</script>

<div class={`panel-toggle`}>
    <div class="position-header">
        <h3>{position.draw_schedule_name}</h3>
        <p class="subtitle">{position.schedule_time}</p>
    </div>
    <button class="neutral" onclick={handleEditMultiplier}>
		<PenSolid class="shrink-0 h-4 w-4" />
	</button>

    {#if position.positions &&  position.positions['1'] && !position.positions['1'].multiplier}
        <div class="tag tag-danger">
            Aun no se ha asignado a cuanto paga el primer lugar
        </div>
    {/if}


    <AssignWinner
        position={position}
        assignWinner={handleAssignWinner}
    />
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

	.position-header {
		display: flex;
		flex-direction: column;
		align-items: start;
		width: 15%;
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
