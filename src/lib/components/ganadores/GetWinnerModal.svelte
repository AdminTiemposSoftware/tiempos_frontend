<script lang="ts">	
    let {
		confirm,
		showModal = $bindable(),
		message = 'Estas seguro de continuar?',
		input = $bindable(''),
		confirmText = 'Confirmar (Enter)',
		ticketWinner=$bindable({}),
		cancelText = 'Cancelar'
	} = $props();

    let inputElement: HTMLInputElement;
	let responseMessage = $state<string>('');
		
	import {Notifications, acts} from '@tadashi/svelte-notification'
	import type { Receipt } from '../../printing/types';
	import ReceiptPreview from '../../printing/ReceiptPreview.svelte';
	import { auth } from '../../stores/auth';
	import { onMount } from 'svelte';

	onMount(() => {
		if (showModal) {
			setTimeout(() => {
				inputElement?.focus();
			}, 0);
		}
	});

	function onClose() {
		showModal = false;
	}

	$effect(() => {
		showModal;
		setTimeout(() => {
			if (showModal)
				inputElement?.focus();
		}, 0);
	});

	const receipt = $derived.by<Receipt>(() => {
		if (!ticketWinner) return null;

        const items = ticketWinner?.items
            .map((item) => ({
                number: String(item.number).padStart(2, '0'),
                amount: Number(item.amount) || 0
            }));

        const total = items.reduce((sum, item) => sum + item.amount, 0);
        const branchName = $auth.user?.branchName ? String($auth.user.branchName) : 'Sucursal';
        const branchLocation = $auth.user?.branchLocation ? String($auth.user.branchLocation) : '';

        const multiplierInfo = ticketWinner?.multiplier ? `El primero paga al: ${ticketWinner.multiplier}` : '';

        const title = ticketWinner?.draw_name
            ? `${ticketWinner.draw_name}${ticketWinner.draw_schedule_name ? ` ${ticketWinner.draw_schedule_name}` : ''}`
            : 'Tiquete de venta';

        const subtitleParts = [
            `${branchName} - ${branchLocation}`,
            ticketWinner?.date ? `Fecha: ${ticketWinner.date}` : '',
            ticketWinner?.printed_at ? `Hora: ${ticketWinner.printed_at.slice(0, 8)}` : ''
        ].filter(Boolean);

        return {
            title,
            subtitles: subtitleParts,
            items,
            total,
            footer: ["----------ATENCION----------", multiplierInfo, "----------------------------", '* * Gracias por su compra * *', '¡Buena suerte!'],
            serial: `${ticketWinner?.serial || ''}`,
            ticket_number: ticketWinner?.ticket_number?.toString().padStart(3, '0') || ''
        };
    });

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
	
    function serializeData(data): string {
        const serialHex = ticketWinner?.serial
            ? BigInt(ticketWinner.serial).toString(16).toUpperCase()
            : '';

        return data
            .map((item) => {
                const numberHex = Number(item.number).toString(16).toUpperCase().padStart(2, '0');
                const priceHex = Number(item.amount).toString(16).toUpperCase().padStart(6, '0');

                return `${numberHex}${priceHex}`;
            })
            .join('') + serialHex;
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
		
		confirm();
	}
		
    function formatAmount(value: number) {
        if (!Number.isFinite(value)) {
            return "0";
        }

        const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
        const [integerPart, decimalPart] = Math.abs(rounded).toFixed(2).split(".");
        const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        const sign = rounded < 0 ? "-" : "";

        return decimalPart === "00"
            ? `${sign}${groupedInteger}`
            : `${sign}${groupedInteger},${decimalPart}`;
    }

	function handleKeyInput(event: KeyboardEvent) {
		switch (event.key) {
			case "Enter":
				if (showModal)  onConfirm();
				break;
		}
	}

	function handlePayTicket() {
		if (ticketWinner?.items?.length === 0) {
			return;
		}
		
		let response = fetch('/puesto/ganadores/pagar', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				serial: ticketWinner?.serial
			})
		});

		response.then((res) => {
			if (!res.ok) {
				res.json().then((errorData) => {
					acts.add({
						message: errorData.message || 'Error al pagar el tiquete',
						mode: 'error',
						lifetime: 3
					});
				});
				return;
			}
			res.json().then((data) => {
				ticketWinner.paid = true;
				acts.add({
					message: 'Tiquete pagado exitosamente',
					mode: 'success',
					lifetime: 3
				});
				showModal = false;
				input = '';
			});
		}).catch((error) => {
			console.error('Error paying ticket:', error);
			acts.add({
				message: 'Error al pagar el tiquete',
				mode: 'error',
				lifetime: 3
			});
			showModal = false;
			input = '';
		});
	}
</script>

<svelte:window onkeydown={handleKeyInput} />
{#if showModal}
<Notifications />
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
		<div class="content">
			<div class="left">
				<p class="modal-text">{message}</p>
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
				{#if ticketWinner}
					{#if ticketWinner?.paid}
						<p class="modal-text negative">Este tiquete ya ha sido pagado.</p>
					{:else}
						<div class="to-pay">
							<p class="modal-text positive subtitle">
								Este tiquete es ganador, si desea pagarlo presione P.
							</p>
						
							<div class="winner-information">
								<div class="information-item">
									<span>Número ganador</span>
									<strong>{ticketWinner?.winner_number}</strong>
								</div>
						
								<div class="information-item">
									<span>Monto</span>
									<strong>
										{formatAmount(
											ticketWinner?.items.find(
												(item) => item.number === ticketWinner?.winner_number
											)?.amount || 0
										)}
									</strong>
								</div>
						
								<div class="information-item">
									<span>Multiplicador</span>
									<strong>x{ticketWinner?.multiplier}</strong>
								</div>
						
								<div class="information-item total">
									<span>Total a pagar</span>
									<strong>
										{formatAmount(
											(ticketWinner?.items.find(
												(item) => item.number === ticketWinner?.winner_number
											)?.amount || 0) * ticketWinner?.multiplier
										)}
									</strong>
								</div>
							</div>
							<button 
								class="pay-button"
								disabled={ticketWinner?.items?.length === 0}
								onclick={handlePayTicket}
							>
								<div class="button-name"><p>P</p>agar tiquete</div>
							</button>
						</div>
					{/if}
				{/if}
			</div>
			<div class="right">
				<div class="receipt-container scroll-thin">
					{#if ticketWinner}
						<ReceiptPreview 
							groupedItems={true} 
							details={ticketWinner?.details ?? ''}
							qrData={serializeData(ticketWinner?.items || {})} 
							receipt={receipt}
						/>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.modal-backdrop {
		z-index: 10;
	}
	.modal {
		display: flex;
		flex-direction: column;
		min-width: 800px;
		min-height: 400px;
	}
	.modal-text {
		margin: 0 0 0.5rem 0;
	}
	.modal .content {
		display: flex;
		flex-direction: row;
		gap: 1rem;
	}
	.left {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
	}
	.modal-input {
		width: 100%;
		padding: 0.5rem;
	}
	.right {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		width: 100%;
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

	.input-container input {
		flex: 1;
	}

	.to-pay {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		margin: auto 0 0 0;
	}
	.positive {
		color: green;
	}

	.negative {
		color: red;
		margin: auto 0;
	}
	.pay-button {
		margin-top: 1rem;
		width: 100%;
	}

	.winner-information {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.information-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
	}

	.information-item span {
		font-size: 0.9rem;
		opacity: 0.75;
	}

	.information-item strong {
		font-size: 1.3rem;
	}

	.information-item.total {
		font-size: 2rem;
		font-weight: 700;
	}
</style>
