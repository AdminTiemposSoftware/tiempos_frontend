import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, locals, cookies }) => {
	const baseUrl = env.API_URL;
	const bankingId = locals.user?.bankingId;
	const token = cookies.get('session_banca') ?? null;

	if (!baseUrl || !bankingId) {
		return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	console.log('Received POST request with payload:', await request.clone().text());

	const payload = await request.json().catch(() => null);
	const number = payload?.number;
	const amount = payload?.amount;
	const starter = payload?.starter;
	const canSellAfterAmount = payload?.can_sell_after_amount;
	const byAmount = payload?.by_amount;
	const byPercentage = payload?.by_percentage;

	if (number == null || amount == null || starter == null || canSellAfterAmount == null || byAmount == null || byPercentage == null) {
		return new Response(JSON.stringify({ error: 'Payload must include all required fields.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const response = await fetch(`${baseUrl}/number/prohibited`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 
			Authorization: `Bearer ${token}`, 
			'X-Auth-App': 'banca' },
		body: JSON.stringify({
			number,
			amount,
			starter,
			canSellAfterAmount,
			banking_id: Number(bankingId),
			by_amount: byAmount,
			by_percentage: byPercentage
		})
	});
	const responsePayload = await response.json().catch(() => null);

	return new Response(JSON.stringify(responsePayload ?? { items: [] }), {
		status: response.ok ? 200 : response.status,
		headers: { 'Content-Type': 'application/json' }
	});
};