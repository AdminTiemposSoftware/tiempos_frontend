import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;

    if (!baseUrl || !bankingId) {
        return { prohibitedItems: [] };
    }

    try {
        const prohibitedResponse = await fetch(`${baseUrl}/number/prohibited/by-banking/${bankingId}`);
        const prohibitedPayload = prohibitedResponse.ok ? await prohibitedResponse.json().catch(() => null) : null;
        const prohibitedItems = Array.isArray(prohibitedPayload?.items) ? prohibitedPayload.items : [];
        return { prohibitedItems };
    } catch {
        return { prohibitedItems: [] };
    }
};