<script lang="ts">
    let {
		showModal = $bindable(),
		input = $bindable(''),
		confirmText = 'Confirmar (Enter)',
		cancelText = 'Cancelar',
		numbersSold = $bindable<Record<string, number>>({})
	} = $props();
    let inputElement = $state<HTMLInputElement | null>(null);
	let ticket = $state <Ticket | null>(null);

	import { onMount } from 'svelte';
	import {Notifications, acts} from '@tadashi/svelte-notification'

	type Ticket = {
		serial: string;
		ticket_number: number;
		draw_name: string;
		draw_schedule_name: string;
		date: string;
		printed_at: string;
		multiplier?: number;
		details?: string;
		items: {
			number: number;
			amount: number;
		}[];
	};

	function onClose() {
		showModal = false;
		ticket = null;
		input = '';
	}

	onMount(() => {
		if (showModal) {
			inputElement?.focus();
		}
	});


	$effect(() => {
		showModal;
		setTimeout(() => {
			if (showModal)
				inputElement?.focus();
		}, 0);
	});

	async function jalarTicket() {
		if (input.trim() === '') {
			acts.add({
				message: 'El campo de texto no puede estar vacío',
				mode: 'error',
				lifetime: 3
			});
			return;
		}

		try {
			const response = await fetch(`/puesto/venta/tickets/${input}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',

				}
			});

			const data = await response.json();
			const items = Array.isArray(data?.items) ? data.items : [];
			if (items.length === 0) {
				acts.add({
					message: 'El tiquete consultado no existe',
					mode: 'error',
					lifetime: 3
				});
				return;
			}

			ticket = Object.values(items.reduce((acc, item) => {
				if (!acc[item.serial]) {
					acc[item.serial] = {
						...item,
						items: []
					};
				}

				acc[item.serial].items.push({
					number: item.number,
					amount: Number(item.amount)
				});

				return acc;
			}, {} as Record<string, any>))[0] as Ticket;
		} catch (error) {
			console.error('Error fetching ticket:', error);
			acts.add({
				message: 'Error al consultar el tiquete',
				mode: 'error',
				lifetime: 3
			});
		}
	}


    function decodeQrData(qrData: string): Record<string, number> | null {
        const normalized = qrData.trim().toUpperCase();

        if (!normalized || /[^0-9A-F]/.test(normalized)) {
            return null;
        }

        for (let prefixLength = normalized.length - 8; prefixLength >= 0; prefixLength -= 8) {

            const decodedSold: Record<string, number> = {};


            for (let index = 0; index < prefixLength; index += 8) {
                const chunk = normalized.slice(index, index + 8);
                const number = Number.parseInt(chunk.slice(0, 2), 16);
                const price = Number.parseInt(chunk.slice(2), 16);

                if (Number.isNaN(number) || Number.isNaN(price) || number < 0 || number > 99) {
                    continue;
                }

				decodedSold[String(number).padStart(2, '0')] = price;
            }

            return decodedSold;
        }

        return null;
    }

	async function onConfirm() {
		if (input.trim() === '') {
			return;
		}

		if (input.length > 6) {
			let decodedData;
			decodedData = decodeQrData(input);
            if (!decodedData) {
                acts.add({
                    message: 'No se pudo leer el QR.',
                    mode: 'error',
                    lifetime: 3
                });
                return;
            }
            numbersSold = decodedData;
            onClose();
		} else if (input.length < 6) {
			acts.add({
				message: 'Entrada inválida',
				mode: 'error',
				lifetime: 3
			});
			return;
		} else {
			await jalarTicket();
			if (!ticket) {
				acts.add({
					message: 'No se pudo obtener el tiquete',
					mode: 'error',
					lifetime: 3
				});
				return;
			}

			numbersSold = ticket?.items.reduce<Record<string, number>>(
				(accumulator, sold) => {
					accumulator[sold.number] = sold.amount;
					return accumulator;
				},
				{}
			);
			onClose();
		}
	}


	function  handleKeyInput(event: KeyboardEvent) {
	    if (!showModal) return;

		switch (event.key) {
			case "Enter":
				onConfirm();
				break;
			case "Escape":
				onClose();
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeyInput} />
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
    	<p class="modal-text">Ingrese el serial del tiquete</p>
    	<div class="input-container">
    		<input
    			type="text"
    			placeholder="Ingrese el texto"
    			bind:value={input}
    			class="modal-input"
    			bind:this={inputElement}
    		/>
    		<button type="button" onclick={onConfirm}>
    			{confirmText}
    		</button>
    	</div>
    	<p class="modal-text subtitle">Ó escanee el código QR</p>
	</div>
</div>
{/if}

<style>
	.modal-backdrop {
		z-index: 10;
	}
	.modal-input {
		width: 100%;
		padding: 0.5rem;
		margin-bottom: 1rem;
	}
	.input-container {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		width: 100%;
		margin-bottom: 0.5rem;
	}
	.input-container button, .input-container input {
		padding: 0.5rem;
	}

	.input-container button {
		flex: 0.7;
	}

	.modal-text {
		margin-bottom: 0.5rem;
	}

	.input-container input {
		flex: 1;
		margin-bottom: 0;
	}
	.jalar-button {
		margin-top: 1rem;
		width: 100%;
	}
</style>
