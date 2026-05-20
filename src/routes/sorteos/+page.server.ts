import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
	const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;

    if (!baseUrl || !bankingId) {
        return { items: [] };
    }

    try {
        const response = await fetch(`${baseUrl}/draw/by-banking/${bankingId}`);

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