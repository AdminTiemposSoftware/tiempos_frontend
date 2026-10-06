<script lang="ts">
    import QrCode from 'svelte-qrcode';
    import ListasFilterModal from '../../../lib/components/listas/ListasFilterModal.svelte';
    import MatrixComparisonModal from '../../../lib/components/listas/MatrixComparisonModal.svelte';
    import { acts } from '@tadashi/svelte-notification';

    let {
        data,
        puestos,
        sorteos,
        showModal=$bindable(),
        dateFrom,
        dateTo,
        total,
        branchNames = [],
        drawScheduleNames = [],
        scheduleBranch = [],
    } = $props();

    type RegistryItem = {
        enabled?: boolean;
        number?: number;
        amount?: number;
        number_total_id?: number;
    };

    type ExportValue = number | string | null | undefined;

    const utcMinus6Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    let selectedBranch = $state<number | undefined>();
	let selectedDrawSchedule = $state<number | undefined>();
	let selectedDate =  $state(utcMinus6Date.toISOString().split('T')[0]);
	let saveReventado = $state(false);
    let saveMegareventado = $state(false);
    let showSaveModal = $state(false);
    let existingListExists = $state(false);
    let existingMatrix = $state({});
    let showOverwriteModal = $state(false);
    let createSelection = $state<Record<number, number>>({});
    let isSaving = $state(false);

    function formatDate(date: Date): string {
        return (
            date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0')
        );
    }

    function getDisplayName(value: number | undefined, options: { value: number; label: string }[]) {
        return options.find((option) => option.value === value)?.label ?? 'Sin selección';
    }

    function parseDate(date: string): Date {
        const [year, month, day] = date.split('-').map(Number);

        return new Date(year, month - 1, day);
    }
    function serializeNumber(value: number, bits: number): string {
        const numberValue = BigInt(value);
        const encodedValue = numberValue < 0n
            ? (1n << BigInt(bits)) + numberValue
            : numberValue;

        return encodedValue.toString(16).toUpperCase().padStart(bits / 4, '0');
    }
    function toFiniteNumber(value: ExportValue): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.round(parsed) : 0;
    }

    function getExportValues(): Record<number, number> {
        return Object.fromEntries(
            Array.from({ length: 100 }, (_, number) => [
                number,
                toFiniteNumber(data?.[number] ?? data?.[String(number)])
            ])
        );
    }

    function getSaveNumbers() {
        const values = getExportValues();

        return Array.from({ length: 100 }, (_, number) => ({
            number,
            amount: values[number]
        }));
    }

    function serializeData(data: Record<number, ExportValue>): string {
        const values = Object.values(getExportValuesFrom(data));
        let result = values.map((amount) => serializeNumber(amount, 24)).join('');
        result += serializeNumber(toFiniteNumber(total), 32);
        result += '000000'
        result += formatDate(parseDate(dateFrom));

        return result;
    }

    function getExportValuesFrom(values: Record<number, ExportValue>): Record<number, number> {
        return Object.fromEntries(
            Array.from({ length: 100 }, (_, number) => [
                number,
                toFiniteNumber(values?.[number] ?? values?.[String(number)])
            ])
        );
    }

    async function checkExistingList() {
        if (!selectedDate || selectedBranch === undefined || selectedDrawSchedule === undefined) {
            acts.add({ message: 'Seleccione fecha, puesto y sorteo.', mode: 'error', lifetime: 3 });
            return;
        }

        isSaving = true;
        try {
            const query = new URLSearchParams({
                draw_schedule_id: String(selectedDrawSchedule),
                branch_id: String(selectedBranch),
                date: selectedDate,
                is_reventado: String(saveReventado),
                is_megareventado: String(saveMegareventado)
            });
            const response = await fetch(`/banca/listas?${query}`);
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error ?? 'No se pudo validar la lista.');
            }

            const items: RegistryItem[] = Array.isArray(payload?.items) ? payload.items : [];
            const enabledItems = items.filter(
                (item) => item?.enabled === true
            );
            existingListExists = enabledItems.length > 0;
            existingMatrix = {};
            createSelection = getExportValues();
            showSaveModal = false;

            if (existingListExists) {
                existingMatrix = Object.fromEntries(
                    enabledItems.map((item) => {
                        const number = Number(item.number);
                        const amount = Number(item.amount);
                        return [number, Number.isFinite(amount) ? amount : 0];
                    }).filter(([number]) => Number.isInteger(number) && number >= 0 && number < 100)
                );
            }
            showOverwriteModal = true;
        } catch (error) {
            acts.add({
                message: error instanceof Error ? error.message : 'No se pudo validar la lista.',
                mode: 'error',
                lifetime: 4
            });
        } finally {
            isSaving = false;
        }
    }

    async function saveList() {
        const numbers = getSaveNumbers();
        if (selectedBranch === undefined || selectedDrawSchedule === undefined) {
            return;
        }

        createSelection = Object.fromEntries(
            numbers.map(({ number, amount }) => [number, amount])
        );

        isSaving = true;
        try {
            const response = await fetch('/banca/listas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    branch_id: selectedBranch,
                    draw_schedule_id: selectedDrawSchedule,
                    is_reventado: saveReventado,
                    is_megareventado: saveMegareventado,
                    numbers
                })
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error ?? payload?.detail ?? 'No se pudo guardar la lista.');
            }

            createSelection = {};
            showOverwriteModal = false;
            acts.add({ message: 'Lista guardada correctamente.', mode: 'success', lifetime: 3 });
        } catch (error) {
            acts.add({
                message: error instanceof Error ? error.message : 'No se pudo guardar la lista.',
                mode: 'error',
                lifetime: 4
            });
        } finally {
            isSaving = false;
        }
    }

    function onClose() {
        showModal = false;
    }
</script>

<ListasFilterModal
    bind:selectedDate={selectedDate}
    bind:selectedBranch={selectedBranch}
    branchNames={branchNames}
    drawScheduleNames={drawScheduleNames}
    scheduleBranch={scheduleBranch}
    bind:selectedDrawSchedule={selectedDrawSchedule}
    includeReventado={false}
    bind:selectedReventado={saveReventado}
    bind:selectedMegareventado={saveMegareventado}
    onConfirm={checkExistingList}
    bind:showModal={showSaveModal}
/>

<MatrixComparisonModal
    bind:showModal={showOverwriteModal}
    confirm={saveList}
    existingListExists={existingListExists}
    existingMatrix={existingMatrix}
    createdMatrix={createSelection}
    selectedBranchName={getDisplayName(selectedBranch, branchNames)}
    selectedScheduleName={getDisplayName(selectedDrawSchedule, drawScheduleNames)}
    selectedDate={selectedDate}
    isReventado={saveReventado}
    isMegareventado={saveMegareventado}
/>


{#if showModal}
<div
    class="modal-backdrop"
    role="button"
    onclick={onClose}
    onkeydown={(e) => e.key === "Escape" && onClose()}
    tabindex="0"
>
    <div
        class="modal"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
    >
        <h2 class="modal-title">
        {#if dateFrom === dateTo}
            {dateFrom}
        {:else}
            {dateFrom} - {dateTo}
        {/if}</h2>
        <div class="chip-row">
            {#each puestos as puesto}
            <p>{puesto}</p>
            {#if puestos.indexOf(puesto) < puestos.length - 1}
                •
            {/if}
            {/each}
        </div>
        <div class="chip-row">
            {#each sorteos as sorteo}
                <p>{sorteo}</p>
                {#if sorteos.indexOf(sorteo) < sorteos.length - 1}
                    •
                {/if}
            {/each}
        </div>
        <div class="qr-container">
            <QrCode value={serializeData(data)} size={350} errorCorrection="L" />
        </div>
        <div class="row">
			<button type="button" class="option-button" onclick={() => {showSaveModal = true; showModal = false;}}>
                Guardar lista
			</button>
		</div>
    </div>
</div>

{/if}

<style>
    .qr-container {
        margin: 1rem 0;
    }

    .modal {
        align-items: center;
        display: flex;
        flex-direction: column;
    }

    .chip-row, .modal-title{
        margin-bottom: 0.5rem;
        font-size: 1rem;
        justify-content: center;
    }
</style>
