import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ fetch, locals, url, cookies }) => {
	const baseUrl = env.API_URL;
	const branchId = locals.user?.branchId;
    const token = cookies.get('session_puesto') ?? '';

	if (!baseUrl || !branchId) {
		return { drawItems: [], prohibitedItems: [] };
	}

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
		return { drawItems, prohibitedItems };
	} catch {
		return { drawItems: [], prohibitedItems: [] };
	}
};
