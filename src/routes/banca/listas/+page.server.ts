import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca');
    const bankingId = locals.user?.bankingId;

    if (!baseUrl || !bankingId) {
        return { branchNames: [], scheduleNames: [] };
    }

    try {
        const branchNamesResponse = await fetch(`${baseUrl}/branch/names/${bankingId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            } }
        );
        const branchNamesPayload = branchNamesResponse.ok ? await branchNamesResponse.json().catch(() => null) : null;
        const branchNames = Array.isArray(branchNamesPayload?.items) ? branchNamesPayload.items : [];

        const scheduleNamesResponse = await fetch(`${baseUrl}/draw-schedule/names/${bankingId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            } }
        );
        const scheduleNamesPayload = scheduleNamesResponse.ok ? await scheduleNamesResponse.json().catch(() => null) : null;
        const scheduleNames = Array.isArray(scheduleNamesPayload?.items) ? scheduleNamesPayload.items : [];

        return { branchNames, scheduleNames };
    } catch {
        return { branchNames: [], scheduleNames: [] };
    }
};
