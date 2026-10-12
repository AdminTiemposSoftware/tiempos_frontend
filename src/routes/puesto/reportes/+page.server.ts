import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_puesto');
    const branchId = locals.user?.branchId;

    if (!baseUrl || !branchId) {
        return { scheduleNames: [] };
    }

    try {

        const scheduleNamesResponse = await fetch(`${baseUrl}/draw-schedule/by-branch/${branchId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            }
        });
        const scheduleNamesPayload = scheduleNamesResponse.ok ? await scheduleNamesResponse.json().catch(() => null) : null;
        const scheduleNames = Array.isArray(scheduleNamesPayload?.items) ? scheduleNamesPayload.items : [];

        return {
            scheduleNames
        };
    } catch {
        return { scheduleNames: [] };
    }
};
