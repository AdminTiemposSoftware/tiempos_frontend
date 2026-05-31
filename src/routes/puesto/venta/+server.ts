import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type TicketDetail = {
	number: number;
	amount: number;
	is_reventado: number;
	is_megareventado: number;
};

type TicketRequest = {
	draw_schedule_id: number;
	details: TicketDetail[];
};

export const POST: RequestHandler = async ({ request, fetch, locals, cookies }) => {
    const token = cookies.get('session') ?? '';
	const baseUrl = env.API_URL;
	const branchId = locals.user?.branchId;

	if (!baseUrl || !branchId) {
		return json({ error: 'Missing API_URL or branchId' }, { status: 500 });
	}

	let payload: TicketRequest;
	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	const draw_schedule_id = Number(payload?.draw_schedule_id);
	const details = Array.isArray(payload?.details) ? payload.details : [];

	if (!Number.isFinite(draw_schedule_id) || draw_schedule_id <= 0) {
		return json({ error: 'draw_schedule_id is required' }, { status: 400 });
	}

	if (!details.length) {
		return json({ error: 'details must be a non-empty list' }, { status: 400 });
	}

	const response = await fetch(`${baseUrl}/ticket`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			draw_schedule_id,
			branch_id: branchId,
			details
		})
	});

	if (!response.ok) {
		return json({ error: 'Failed to create ticket' }, { status: 400 });
	}

	const responseBody = await response.json().catch(() => null);
	return json({ success: true, items: responseBody?.items ?? [] });
};
