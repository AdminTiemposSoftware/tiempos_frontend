import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;

    if (!baseUrl || !bankingId) {
        return { items: [], branchItems: [] };
    }

    try {
        const [drawResponse, branchResponse] = await Promise.all([
            fetch(`${baseUrl}/draw/by-banking/${bankingId}`),
            fetch(`${baseUrl}/branch/by-banking/${bankingId}`)
        ]);

        const drawPayload = drawResponse.ok ? await drawResponse.json().catch(() => null) : null;
        const branchPayload = branchResponse.ok ? await branchResponse.json().catch(() => null) : null;

        const items = Array.isArray(drawPayload?.items) ? drawPayload.items : [];
        const branchItems = Array.isArray(branchPayload?.items)
            ? branchPayload.items
            : [];
            
        return { items, branchItems };
    } catch {
        return { items: [], branchItems: [] };
    }
};