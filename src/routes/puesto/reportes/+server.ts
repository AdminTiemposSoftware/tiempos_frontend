import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const branchId = locals.user?.branchId;
    const token = cookies.get('session_puesto') ?? null;

    if (!baseUrl || !branchId) {
        return new Response(JSON.stringify({ error: 'Missing API_URL or branchId.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const drawSchedules = url.searchParams.get('draw_schedules');
    const groupingModes = url.searchParams.get('grouping_modes') ?? 'date,draw_schedule';

    if (!dateFrom || !dateTo || !drawSchedules) {
        return new Response(JSON.stringify({ error: 'Payload must include date_from, date_to, and draw_schedules.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Auth-App': 'banca'
    };
    const reportQuery = `date_from=${dateFrom}&date_to=${dateTo}&branches=${encodeURIComponent(branchId)}&draw_schedules=${encodeURIComponent(drawSchedules)}&grouping_modes=${encodeURIComponent(groupingModes)}`;

    const reportResponse = await fetch(`${baseUrl}/report/filtered?${reportQuery}`, { method: 'GET', headers });
    const responsePayload = await reportResponse.json().catch(() => null);

    return new Response(JSON.stringify(responsePayload), {
        status: reportResponse.status,
        headers: { 'Content-Type': 'application/json' }
    });
};
