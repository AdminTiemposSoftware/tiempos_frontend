import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;

    if (!baseUrl || !bankingId) {
        return { items: [], prohibitedItems: [] };
    }

    try {
        const [drawResponse, prohibitedResponse] = await Promise.all([
            fetch(`${baseUrl}/draw/by-banking/${bankingId}`),
            fetch(`${baseUrl}/number/prohibited/by-banking/${bankingId}`)
        ]);

        const drawPayload = drawResponse.ok ? await drawResponse.json().catch(() => null) : null;
        const prohibitedPayload = prohibitedResponse.ok ? await prohibitedResponse.json().catch(() => null) : null;

        const items = Array.isArray(drawPayload?.items) ? drawPayload.items : [];
        const prohibitedItems = Array.isArray(prohibitedPayload?.items)
            ? prohibitedPayload.items
            : [];
        return { items, prohibitedItems };
    } catch {
        return { items: [], prohibitedItems: [] };
    }
};