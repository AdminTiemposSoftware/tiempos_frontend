import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, cookies }) => {
	const baseUrl = env.API_URL;
	const bankingId = locals.user?.bankingId;
	const token = cookies.get('session_banca');

	if (!baseUrl || !bankingId) {
		return { branchNames: [], scheduleNames: [], scheduleBranch: [] };
	}

	const headers = {
		Authorization: `Bearer ${token ?? ''}`,
		'X-Auth-App': 'banca'
	};

	try {
		const [branchResponse, scheduleResponse, associationResponse] = await Promise.all([
			fetch(`${baseUrl}/branch/names/${bankingId}`, { headers }),
			fetch(`${baseUrl}/draw-schedule/names/${bankingId}`, { headers }),
			fetch(`${baseUrl}/draw-schedule-branch/by-banking/${bankingId}`, { headers })
		]);

		const [branchPayload, schedulePayload, associationPayload] = await Promise.all([
			branchResponse.json().catch(() => null),
			scheduleResponse.json().catch(() => null),
			associationResponse.json().catch(() => null)
		]);

		return {
			branchNames: Array.isArray(branchPayload?.items) ? branchPayload.items : [],
			scheduleNames: Array.isArray(schedulePayload?.items) ? schedulePayload.items : [],
			scheduleBranch: Array.isArray(associationPayload?.items) ? associationPayload.items : []
		};
	} catch {
		return { branchNames: [], scheduleNames: [], scheduleBranch: [] };
	}
};
