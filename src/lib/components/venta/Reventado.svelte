<script lang="ts">
    let {
        number = $bindable(),
        price = $bindable(),
        reventado = $bindable()
    } = $props();

    function onCheck(checked: boolean) {
        const hasNumber = !!number?.trim();
        const hasPrice = !!price?.trim();
        if (!hasNumber || !hasPrice) return;
        reventado = checked;
    }

    function handlekeyinput(event: KeyboardEvent) {
        if (event.key === 'e' || event.key === 'E') {
            onCheck(!reventado);
        }
    }

    console.log(number, price);
</script>

<svelte:window onkeydown={handlekeyinput} />
<div class="reventado">
    <span class="sold-amount">Reventado</span>
    <input
        class="switch-input"
        type="checkbox"
        checked={reventado}
        onchange={(e) => onCheck(e.currentTarget.checked)}
        disabled={!number?.trim() || !price?.trim()}
    />
</div>
<style>
    .reventado {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .reventado .sold-amount {
        margin: 0;
    }
</style>
