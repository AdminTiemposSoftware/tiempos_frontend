import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, cookies }) => {
	const baseUrl = env.API_URL;
	const bankingId = locals.user?.bankingId;
	const token = cookies.get('session_banca');
	const empty = { branchNames: [], scheduleNames: [] };

	if (!baseUrl || !bankingId) return empty;

	const headers = {
		Authorization: `Bearer ${token ?? ''}`,
		'X-Auth-App': 'banca'
	};

	try {
		const [branchesResponse, schedulesResponse] = await Promise.all([
			fetch(`${baseUrl}/branch/names/${bankingId}`, { headers }),
			fetch(`${baseUrl}/draw-schedule/names/${bankingId}`, { headers })
		]);
		const [branchesPayload, schedulesPayload] = await Promise.all([
			branchesResponse.ok ? branchesResponse.json().catch(() => null) : null,
			schedulesResponse.ok ? schedulesResponse.json().catch(() => null) : null
		]);

		return {
			branchNames: Array.isArray(branchesPayload?.items) ? branchesPayload.items : [],
			scheduleNames: Array.isArray(schedulesPayload?.items) ? schedulesPayload.items : []
		};
	} catch {
		return empty;
	}
};
