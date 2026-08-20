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
	details: string;
    numbers: TicketDetail[];
	date: string;
};

export const POST: RequestHandler = async ({ request, fetch, locals, cookies }) => {
    const token = cookies.get('session_puesto') ?? '';
	const baseUrl = env.API_URL;
    const branchId = locals.user?.branchId;
    const userId = locals.user?.id;

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
	const details = payload?.details;
    const numbers = Array.isArray(payload?.numbers) ? payload.numbers : [];
	const date = payload?.date;

	if (!Number.isFinite(draw_schedule_id) || draw_schedule_id <= 0) {
		return json({ error: 'draw_schedule_id is required' }, { status: 400 });
	}

	if (!numbers.length) {
		return json({ error: 'numbers must be a non-empty list' }, { status: 400 });
	}

	const response = await fetch(`${baseUrl}/ticket`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			'X-Auth-App': 'puesto'
		},
        body: JSON.stringify({
            date,
			draw_schedule_id,
			branch_id: branchId,
            details,
			user_id: userId,
			numbers
		})
	});

	if (!response.ok) {
		return json({ error: 'Failed to create ticket' }, { status: 400 });
	}

	const responseBody = await response.json().catch(() => null);
	return json({ success: true, items: responseBody?.items ?? [] });
};
