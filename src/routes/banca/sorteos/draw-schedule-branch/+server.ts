import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session') ?? '';

    if (!baseUrl) {
        return new Response(JSON.stringify({ items: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json().catch(() => null);
        const response = await fetch(`${baseUrl}/draw-schedule-branch`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body ?? {})
        });
        const payload = await response.json().catch(() => null);

        return new Response(JSON.stringify(payload ?? { items: [] }), {
            status: response.ok ? 200 : response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch {
        return new Response(JSON.stringify({ items: [] }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
