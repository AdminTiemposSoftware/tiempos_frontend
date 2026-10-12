import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({ fetch, locals, url, cookies }) => {
	const baseUrl = env.API_URL;
	const branchId = locals.user?.branchId;
    const token = cookies.get('session_puesto') ?? '';

	if (!baseUrl || !branchId) {
		return { drawItems: [], prohibitedItems: [], amountItems: [] };
	}

	try {
        const [drawResponse, prohibitedResponse, amountResponse] = await Promise.all([
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
			}),
			fetch(`${baseUrl}/amount/${branchId}`, {
				method: 'GET',
				headers: {
					Authorization: 'Bearer ' + token,
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

		const amountPayload = await amountResponse.json().catch(() => null);
		const amountItems = amountResponse.ok && Array.isArray(amountPayload?.items)
			? amountPayload.items
			: [];

		return { drawItems, prohibitedItems, amountItems };
	} catch {
		return { drawItems: [], prohibitedItems: [], amountItems: [] };
	}
};
