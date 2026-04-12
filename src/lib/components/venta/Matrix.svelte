<script lang="ts">
    export let rows: number = 10;
    export let columns: number = 10;
    export let data: number[][] = [];

    import { sellingMatrix } from '../../stores/UpdateSellMatrix';
    import { prohibitedNumbers } from '../../stores/UpdateSellMatrix';

    function updateCell(index: number, value: string) {
        if (isNaN(Number(value))) {
            sellingMatrix.update(prev => ({ ...prev, [index]: 0 }));
        } else {
            sellingMatrix.update(prev => ({ ...prev, [index]: Number(value) }));
        }
    }

    if (data.length > 0) {
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                const index = j * rows + i;
                sellingMatrix.update(prev => ({ ...prev, [index]: data[i][j] }));
            }
        }
    }
</script>

<section class="matrix-container">
    <div class="matrix" style="--cols: {columns}">
        {#each Array.from({ length: rows }) as _, rowIndex}           
            {#each Array.from({ length: columns }) as _, colIndex}

                <div 
                    class={`matrix-cell ${$prohibitedNumbers.includes(colIndex * rows + rowIndex) ? "prohibited-number" : ""}`}
                >
                    <input
                        type="number"
                        value={colIndex * rows + rowIndex}
                        disabled={true}
                    />
                    <input
                        type="number"
                        class="price"
                        value={$prohibitedNumbers.includes(colIndex * rows + rowIndex) ? 0 : $sellingMatrix[colIndex * rows + rowIndex] || 0}
                        disabled={true}
                    />
                </div>
            {/each}
        {/each}
    </div>
</section>

<style>
    .matrix-container {
        flex:4;
    }

    .matrix {
        display: grid;
        grid-template-columns: repeat(var(--cols), auto);
        width: fit-content;
        align-items: center;
    }

    .matrix-cell {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .prohibited-number input[type="number"] {
        background-color: #f8d7da;
        border-color: #f5c6cb;
        color: #721c24;
    }
    .prohibited-number input[type="number"]:first-child {
        background-color: #f8c3c7;
        border-color: #f5c6cb;
    }


    .price {
        width: 80px !important; 
        background-color: #ffffff;
    }

    .matrix-cell input[type="number"]{
        width: 40px;
        height: 35px;
        padding: 0.5rem;
        text-align: center;
        border: 1px solid #ccc;
        font-size: 1.1rem;
    }


    .matrix-cell input[type="number"]:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
</style>
