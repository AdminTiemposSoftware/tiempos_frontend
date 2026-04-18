<script lang="ts">
    import { Dropdown, Button, DropdownItem, DropdownGroup, Radio } from 'flowbite-svelte';
    import { ChevronDownOutline } from "flowbite-svelte-icons";

    let {
        title = $bindable(),
        items = $bindable(), 
        selectedValue = $bindable()
    } = $props();

</script>

<style>
    .dropdown-container {
        position: relative;
        width: 100%;
        max-width: 220px; /* Adjust as needed */
    }

    :global(.dropdown-container button) {
        width: 100%;
        justify-content: space-between;
        transition: background-color 0.3s ease;
    }


    :global(.dropdown-container .w-30) {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid var(--color-border, #ccc);
        border-radius: 0.5rem;
        margin-top: 0.5rem;
        max-height: 300px;
    }

    :global(.dropdown-container .flex.items-center.gap-2) {
        transition: background-color 0.2s ease-in-out;
        padding: 0.2rem 0.5rem;
    }

    :global(.dropdown-container .flex.items-center.gap-2:hover) {
        background-color: var(--color-box-background, #f0f0f0);
    }
</style>

<div class="dropdown-container">
    <Button slot="trigger" class="flex">
        {title}
        <ChevronDownOutline class="ms-2 h-6 w-6 text-white dark:text-white" />
    </Button>
    <Dropdown simple class="h-48 w-30 overflow-y-auto py-1">
        <DropdownGroup>
            {#each items as item, i (item)}
            <DropdownItem class="flex items-center gap-2 text-base font-semibold">
                <Radio 
                        name="{title}-radio-group"
                        value={item}
                        bind:group={selectedValue}
                        class="mr-2 text-sm text-gray-700"
                    >
                        {item}
                    </Radio>
                </DropdownItem>
            {/each}
        </DropdownGroup>
        {#if items.length === 0}
            <DropdownItem class="empty-state">
                No options available
            </DropdownItem>
        {/if}
    </Dropdown>
</div>
