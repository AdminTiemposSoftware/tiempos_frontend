import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, locals }) => {
	const baseUrl = env.API_URL;
	const bankingId = locals.user?.bankingId;

	if (!baseUrl || !bankingId) {
		return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const payload = await request.json().catch(() => null);
	const number = payload?.number;
	const amount = payload?.amount;
	const starter = payload?.starter;
	const canSellAfterAmount = payload?.canSellAfterAmount;

	if (number == null || amount == null) {
		return new Response(JSON.stringify({ error: 'Payload must include number and amount.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const response = await fetch(`${baseUrl}/number/prohibited`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			number,
			amount,
			starter,
			canSellAfterAmount,
			banking_id: Number(bankingId)
		})
	});
	const responsePayload = await response.json().catch(() => null);

	return new Response(JSON.stringify(responsePayload ?? { items: [] }), {
		status: response.ok ? 200 : response.status,
		headers: { 'Content-Type': 'application/json' }
	});
};
