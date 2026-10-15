import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const bankingId = locals.user?.bankingId;
    const token = cookies.get('session_banca') ?? null;

    if (!baseUrl || !bankingId) {
        return new Response(JSON.stringify({ error: 'Missing API_URL or bankingId.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const branches = url.searchParams.get('branches');
    const drawSchedules = url.searchParams.get('draw_schedules');

    if (!dateFrom || !dateTo || !branches || !drawSchedules) {
        return new Response(JSON.stringify({ error: 'Payload must include date_from, date_to, branches, and draw_schedules.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Auth-App': 'banca'
    };
    const reportQuery = `date_from=${dateFrom}&date_to=${dateTo}&branches=${encodeURIComponent(branches)}&draw_schedules=${encodeURIComponent(drawSchedules)}`;
    const prohibitedQuery = `date_from=${dateFrom}&date_to=${dateTo}&branches=${encodeURIComponent(branches)}`;

    const [reportResponse, winnersResponse, prohibitedResponse] = await Promise.all([
        fetch(`${baseUrl}/report/filtered?${reportQuery}`, { method: 'GET', headers }),
        fetch(`${baseUrl}/winner/filtered?${reportQuery}`, { method: 'GET', headers }),
        fetch(`${baseUrl}/number/prohibited/filtered?${prohibitedQuery}`, { method: 'GET', headers })
    ]);

    const [reportPayload, winnersPayload, prohibitedPayload] = await Promise.all([
        reportResponse.json().catch(() => null),
        winnersResponse.json().catch(() => null),
        prohibitedResponse.json().catch(() => null)
    ]);

    const responsePayload = {
        items: Array.isArray(reportPayload?.items) ? reportPayload.items : [],
        winnersFilteredItems: Array.isArray(winnersPayload?.items) ? winnersPayload.items : [],
        prohibitedFilteredItems: Array.isArray(prohibitedPayload?.items) ? prohibitedPayload.items : []
    };
    const failedResponse = [reportResponse, winnersResponse, prohibitedResponse].find(
        (response) => !response.ok
    );

    return new Response(JSON.stringify(responsePayload), {
        status: failedResponse?.status ?? 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
