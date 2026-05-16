import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
	const baseUrl = env.API_URL;
	const branchId = locals.user?.branchId;

	const selectedScheduleIdParam = url.searchParams.get('scheduleId');

	if (!baseUrl || !branchId) {
		return { items: [], numbers: [], selectedScheduleId: null };
	}

	try {
		const response = await fetch(`${baseUrl}/draw/by-branch/${branchId}`);

		if (!response.ok) {
			return { items: [], numbers: [], selectedScheduleId: null };
		}

		const payload = await response.json().catch(() => null);
		const items = Array.isArray(payload?.items)
			? payload.items
			: [];

		const fallbackScheduleId = items[0]?.schedule_id ?? null;
		const parsedScheduleId = selectedScheduleIdParam ? Number(selectedScheduleIdParam) : null;
		const selectedScheduleId = Number.isFinite(parsedScheduleId) && parsedScheduleId
			? parsedScheduleId
			: fallbackScheduleId;

		let numbers: unknown[] = [];
		if (selectedScheduleId) {
			const numbersResponse = await fetch(
				`${baseUrl}/number/by-draw-schedule/${selectedScheduleId}/${branchId}`
			);

			if (numbersResponse.ok) {
				const numbersPayload = await numbersResponse.json().catch(() => null);
				numbers = Array.isArray(numbersPayload?.items) ? numbersPayload.items : [];
			}
		}

		return { items, numbers, selectedScheduleId };
	} catch {
		return { items: [], numbers: [], selectedScheduleId: null };
	}
};

export const actions: Actions = {
	addTicket: async ({ request, fetch, locals }) => {
		const baseUrl = env.API_URL;
		const branchId = locals.user?.branchId;

		if (!baseUrl || !branchId) {
			return fail(500, {
				error: 'Missing API_URL or branchId'
			});
		}

		const data = await request.formData();
		// Expecting draw_schedule_id and details[] from the form
		const draw_schedule_id = Number(data.get('draw_schedule_id'));
		let details: Array<{ number: number; amount: number; is_reventado: number; is_megareventado: number }> = [];

		// Parse details from formData (details should be sent as JSON string)
		const detailsRaw = data.get('details');
		if (typeof detailsRaw === 'string') {
			try {
				details = JSON.parse(detailsRaw);
			} catch {
				return fail(400, { error: 'Invalid details format' });
			}
		}

		const payload = {
			draw_schedule_id,
			branch_id: branchId,
			details
		};

		const response = await fetch(`${baseUrl}/ticket`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			return fail(400, {
				error: 'Failed to create ticket'
			});
		}

		return {
			success: true
		};
	}
};