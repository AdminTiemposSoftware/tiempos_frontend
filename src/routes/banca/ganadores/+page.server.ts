import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, url, cookies }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;
    const token = cookies.get('session_banca')


    if (!baseUrl || !bankingId) {
        return { itemsPositions: [], itemsWinners: [] };
    }

    try {
        const responsePosition = await fetch(`${baseUrl}/position/by-banking/${bankingId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-App': 'banca',
                Authorization: `Bearer ${token}`
            }
        });

        const fallbackDate = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const formattedFallbackDate = fallbackDate.toISOString().split('T')[0];

        const responseWinners = await fetch(`${baseUrl}/winner/by-banking-last-7-days/${bankingId}/${formattedFallbackDate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-App': 'banca',
                Authorization: `Bearer ${token}`
            }
        });

        const payloadPosition = responsePosition.ok ? await responsePosition.json().catch(() => null) : null;
        const payloadWinners = responseWinners.ok ? await responseWinners.json().catch(() => null) : null;

        const itemsPositions = Array.isArray(payloadPosition?.items) ? payloadPosition.items : [];
        const itemsWinners = Array.isArray(payloadWinners?.items) ? payloadWinners.items : [];

        return { itemsPositions, itemsWinners };
    } catch {
        return { itemsPositions: [], itemsWinners: [] };
    }
};
