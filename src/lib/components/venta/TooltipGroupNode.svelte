<script lang="ts">
	import {
		formatAmount,
		type GroupNode
	} from './grouping';
	import TooltipGroupNode from './TooltipGroupNode.svelte';

	let {
		node,
		depth = 0
	} = $props<{
		node: GroupNode;
		depth?: number;
	}>();

</script>

<li class="tooltip-node" style={`--node-depth: ${depth};`}>
	<div class="group-header">
		<span class="group-label">{node.label}</span>
		<span class="group-subtotal">{formatAmount(node.subtotal)}</span>
	</div>
    
    <ul class="group-children">
        {#each node.children as child}
            <TooltipGroupNode node={child} depth={depth + 1} />
        {/each}
    </ul>
</li>

<style>
	.tooltip-node {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding-left: calc(var(--node-depth) * 0.45rem);
	}

	.group-header {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		align-items: center;
	}

	.group-label {
		font-weight: 600;
	}

	.group-subtotal {
		font-weight: 600;
		color: #fbbf24;
		white-space: nowrap;
	}

	.group-children {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.group-children {
		border-left: 1px solid rgba(255, 255, 255, 0.12);
		padding-left: 0.55rem;
	}
</style>