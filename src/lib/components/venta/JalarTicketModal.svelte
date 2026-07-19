<script lang="ts">	
    let {
		showModal = $bindable(),
		input = $bindable(''),
		confirmText = 'Confirmar (Enter)',
		cancelText = 'Cancelar',
		numbersSold = $bindable<Record<string, { price: number }>>({})
	} = $props();
    let inputElement: HTMLInputElement;
	let ticket = $state <Ticket | null>(null);
	
	import ReceiptPreview from '../../printing/ReceiptPreview.svelte';
	import type { Receipt } from '../../printing/types';
	import { auth } from '../../stores/auth';
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

	const receipt = $derived.by<Receipt>(() => {
		if (!ticket) return null;

        const items = ticket?.items
            .map((item) => ({
                number: String(item.number).padStart(2, '0'),
                amount: Number(item.amount) || 0
            }));

        const total = items.reduce((sum, item) => sum + item.amount, 0);
        const branchName = $auth.user?.branchName ? String($auth.user.branchName) : 'Sucursal';
        const branchLocation = $auth.user?.branchLocation ? String($auth.user.branchLocation) : '';

        const multiplierInfo = ticket?.multiplier ? `El primero paga al: ${ticket.multiplier}` : '';

        const title = ticket?.draw_name
            ? `${ticket.draw_name}${ticket.draw_schedule_name ? ` ${ticket.draw_schedule_name}` : ''}`
            : 'Tiquete de venta';

        const subtitleParts = [
            `${branchName} - ${branchLocation}`,
            ticket?.date ? `Fecha: ${ticket.date}` : '',
            ticket?.printed_at ? `Hora: ${ticket.printed_at.slice(0, 8)}` : ''
        ].filter(Boolean);

        return {
            title,
            subtitles: subtitleParts,
            items,
            total,
            footer: ["----------ATENCION----------", multiplierInfo, "----------------------------", '* * Gracias por su compra * *', '¡Buena suerte!'],
            serial: `${ticket?.serial || ''}`,
            ticket_number: ticket?.ticket_number?.toString().padStart(3, '0') || ''
        };
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

	// TODO Globalize this function to a utility file since it's used in multiple places
	function serializeData(data: { number: number; amount: number }[]): string {
        const serialHex = ticket?.serial
            ? BigInt(ticket.serial).toString(16).toUpperCase()
            : '';

        return data
            .map((item) => {
                const numberHex = Number(item.number).toString(16).toUpperCase().padStart(2, '0');
                const priceHex = Number(item.amount).toString(16).toUpperCase().padStart(6, '0');

                return `${numberHex}${priceHex}`;
            })
            .join('') + serialHex;
    }
	
    function extractSerial(qr: string, ticketCount: number): string {
        const serialStart = ticketCount * 8;
        const serialHex = qr.slice(serialStart);

        return BigInt(`0x${serialHex}`).toString();
    }
	
    function countPossibleNumbers(qrData: string) {
        const normalized = qrData.trim().toUpperCase();

        if (!normalized || /[^0-9A-F]/.test(normalized)) {
            return null;
        }
		let count = 0;

        for (let prefixLength = normalized.length - 8; prefixLength >= 0; prefixLength -= 8) {
            for (let index = 0; index < prefixLength; index += 8) {
                const chunk = normalized.slice(index, index + 8);
                const number = Number.parseInt(chunk.slice(0, 2), 16);
                const price = Number.parseInt(chunk.slice(2), 16);

                if (Number.isNaN(number) || Number.isNaN(price) || number < 0 || number > 99) {
                    continue;
                }

				count++;
            }

            return count;
        }

        return null;
    }

	function onConfirm() {
		if (input.trim() === '') {
			return;
		}
		
		if (input.length > 16) {
			let decodedData;
			decodedData = countPossibleNumbers(input);
			if (decodedData && decodedData > 0)
				input = extractSerial(input, decodedData);
		}
		
		jalarTicket();
	}

    function loadSoldNumbers() {
        numbersSold = ticket?.items?.reduce<Record<string, { price: number }>>(
            (accumulator, sold) => {
                accumulator[sold.number] = { price: sold.amount };
                return accumulator;
            },
            {}
        );
		onClose();
    }
	function  handleKeyInput(event: KeyboardEvent) {
		switch (event.key) {
			case "Enter":
				if (ticket) 
					loadSoldNumbers();
				else
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
		{#if ticket}
			<div class="receipt-container scroll-thin">
				<ReceiptPreview 
					groupedItems={true} 
					details={ticket?.details ?? ''}
					qrData={serializeData(ticket?.items || {})} 
					receipt={receipt}
				/>
			</div>
			<button class="jalar-button"
				onclick={loadSoldNumbers}>
				Jalar (Enter)
			</button>
		{:else}
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
		{/if}
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
