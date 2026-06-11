import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ fetch, locals, url, cookies }) => {
	const baseUrl = env.API_URL;
	const branchId = locals.user?.branchId;
	const token = cookies.get('session') ?? '';

	const selectedScheduleIdParam = url.searchParams.get('scheduleId');

	if (!baseUrl || !branchId) {
		return { items: [], numbers: [], selectedScheduleId: null };
	}

	try {
		const response = await fetch(`${baseUrl}/draw/by-branch/${branchId}`,{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

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

