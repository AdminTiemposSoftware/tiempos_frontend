import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const baseUrl = env.API_URL;
	if (!baseUrl) {
		return { items: [] };
	}

	try {
		const response = await fetch(`${baseUrl}/branch`);
		if (!response.ok) {
			return { items: [] };
		}

		const payload = await response.json().catch(() => null);
		const items = Array.isArray(payload?.items) ? payload.items : [];
		return { items };
	} catch {
		return { items: [] };
	}
};
