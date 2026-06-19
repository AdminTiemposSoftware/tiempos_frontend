import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, fetch, locals, cookies }) => {
	const baseUrl = env.API_URL;
	const bankingId = locals.user?.bankingId;
	const token = cookies.get('session') ?? null;

	if (!baseUrl || !bankingId) {
		return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	const payload = await request.json().catch(() => null);
	const amount = payload?.amount;
	const starter = payload?.starter;
	const can_sell_after_amount = payload?.can_sell_after_amount;
	const by_amount = payload?.by_amount;
	const by_percentage = payload?.by_percentage;
	
    console.log(payload);
	if (amount == null || starter == null || can_sell_after_amount == null || by_amount == null || by_percentage == null) {
		return new Response(JSON.stringify({ error: 'Payload must include all required fields.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const response = await fetch(`${baseUrl}/number/prohibited/${params.id || ''}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		body: JSON.stringify({
			amount,
			starter,
			can_sell_after_amount,
			by_amount: by_amount,
			by_percentage: by_percentage
		})
	});

	const responsePayload = await response.json().catch(() => null);

	return new Response(JSON.stringify(responsePayload ?? { items: [] }), {
		status: response.ok ? 200 : response.status,
		headers: { 'Content-Type': 'application/json' }
	});
};