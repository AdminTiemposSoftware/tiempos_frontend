import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type BranchRequest = {
	banking_id: number;
	name: string;
	location: string;
    prohibited_percentage: number;
    buy: number;
    buy_first_place: number;
};

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	const baseUrl = env.API_URL;
	const token = cookies.get('session_banca') ?? '';

	if (!baseUrl) {
		return json({ error: 'Missing API_URL' }, { status: 500 });
	}

	let payload: BranchRequest;
	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	const banking_id = Number(payload?.banking_id);
	const prohibited_percentage = Number(payload?.prohibited_percentage ?? 0);
	const name = String(payload?.name ?? '').trim();
	const location = String(payload?.location ?? '').trim();
    const comission = Number(payload?.comission ?? 0);
	const buy = Number(payload?.buy ?? 0);
	const buy_first_place = Number(payload?.buy_first_place ?? 0);


	if (!Number.isFinite(banking_id) || banking_id <= 0) {
		return json({ error: 'banking_id is required' }, { status: 400 });
	}

	if (!name || !location) {
		return json({ error: 'name and location are required' }, { status: 400 });
	}

	if (!Number.isFinite(prohibited_percentage)) {
		return json({ error: 'prohibited_percentage must be a number' }, { status: 400 });
	}

	if (!Number.isFinite(comission)) {
		return json({ error: 'comission must be a number' }, { status: 400 });
	}

	if (!Number.isFinite(buy)) {
		return json({ error: 'buy must be a number' }, { status: 400 });
	}

	if (!Number.isFinite(buy_first_place)) {
		return json({ error: 'buy_first_place must be a number' }, { status: 400 });
	}

	const response = await fetch(`${baseUrl}/branch`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'X-Auth-App': 'banca'
		},
		body: JSON.stringify({
			banking_id,
			name,
			location,
			prohibited_percentage,
			comission,
			buy,
			buy_first_place
		})
	});

	const responseBody = await response.json().catch(() => null);
	return json(responseBody ?? { items: [] }, { status: response.ok ? 200 : response.status });
};
