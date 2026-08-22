<script lang="ts">
    let {
        sold,
        selectedRowIndex = $bindable(),
        deleteNumber
    } = $props();

    let rowRefs: Array<HTMLTableRowElement | null> = [];
</script>

<div class="sold-table scroll-thin">
    <table>
        <thead>
            <tr>
                <th>Numero</th>
                <th>Monto</th>
            </tr>
        </thead>
        <tbody>
            {#each Object.entries(sold) as [number, price], index}
                <tr
                    bind:this={rowRefs[index]}
                    class:selected-row = {index === selectedRowIndex}
                    onclick={() => {
                        selectedRowIndex = index;
                    }}
                >
                    <td>{number}</td>
                    <td>₡{price}</td>
                    <td>
                        <button class="negative" onclick={() => deleteNumber(number)}>X</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>

    .sold-table {
        max-height: 330px;
        overflow-y: auto;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th, td {
        padding: 0.25rem 0.5rem;
        text-align: left;
        border: 1px solid #ccc;
    }

    th {
        background-color: var(--color-box-background);
        font-weight: 600;
        border: 1px solid #ccc;
        border-bottom: 2px solid #ccc;
        position: sticky;
        top: 0;
        z-index: 2;
    }

    .negative {
        padding: 0.25rem 0rem;
    }

    :global(.sell .sold tr:hover) {
        background-color: #f9fafb;
    }
</style>
