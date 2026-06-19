import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ fetch, locals, url, cookies }) => {
	const baseUrl = env.API_URL;
	const branchId = locals.user?.branchId;
	const token = cookies.get('session_puesto') ?? '';

	const selectedScheduleIdParam = url.searchParams.get('scheduleId');

	if (!baseUrl || !branchId) {
		return { items: [], numbers: [], selectedScheduleId: null };
	}

	console.log('Fetching draw schedules and prohibited numbers for branch:', token);
	try {

        const [drawResponse, prohibitedResponse] = await Promise.all([
			fetch(`${baseUrl}/draw/by-branch/${branchId}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'X-Auth-App': 'puesto'
				}
			}),
			fetch(`${baseUrl}/number/prohibited/by-branch/${branchId}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'X-Auth-App': 'puesto'
				}
			})
		]);


		const drawPayload = await drawResponse.json().catch(() => null);
		const drawItems = Array.isArray(drawPayload?.items)
			? drawPayload.items
			: [];

		const prohibitedPayload = await prohibitedResponse.json().catch(() => null);
		const prohibitedItems = Array.isArray(prohibitedPayload?.items)
			? prohibitedPayload.items
			: [];

		const fallbackScheduleId = drawItems[0]?.schedule_id ?? null;
		const parsedScheduleId = selectedScheduleIdParam ? Number(selectedScheduleIdParam) : null;
		const selectedScheduleId = Number.isFinite(parsedScheduleId) && parsedScheduleId
			? parsedScheduleId
			: fallbackScheduleId;

		let numbers: unknown[] = [];
		if (selectedScheduleId) {
			const numbersResponse = await fetch(
				`${baseUrl}/number/by-draw-schedule/${selectedScheduleId}/${branchId}`,{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`,
						'X-Auth-App': 'puesto'
					}
				}
			);

			if (numbersResponse.ok) {
				const numbersPayload = await numbersResponse.json().catch(() => null);
				numbers = Array.isArray(numbersPayload?.items) ? numbersPayload.items : [];
			}
		}

		return { drawItems, prohibitedItems, numbers, selectedScheduleId };
	} catch {
		return { drawItems: [], prohibitedItems: [], numbers: [], selectedScheduleId: null };
	}
};

