import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch }) => {
    const baseUrl = env.API_URL;

    if (!baseUrl) {
        return new Response(JSON.stringify({ items: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(`${baseUrl}/draw-schedule/${params.id}`);
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

export const PUT : RequestHandler = async ({ params, request, fetch, cookies }) => {
    const baseUrl = env.API_URL;
	const token = cookies.get('session_banca') ?? '';

    if (!baseUrl) {
        return new Response(JSON.stringify({ success: false, message: 'API URL not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json().catch(() => null);
        const response = await fetch(`${baseUrl}/draw-schedule/${params.id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            },
            body: JSON.stringify(body ?? {})
        });
        const payload = await response.json().catch(() => null);
        return new Response(JSON.stringify(payload ?? { success: false, message: 'Failed to update schedule' }), {
            status: response.ok ? 200 : response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch {
        return new Response(JSON.stringify({ success: false, message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const DELETE: RequestHandler = async ({ params, fetch, cookies }) => {
    const baseUrl = env.API_URL;
    const token = cookies.get('session_banca') ?? '';

    if (!baseUrl) {
        return new Response(JSON.stringify({ success: false, message: 'API URL not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const response = await fetch(`${baseUrl}/draw-schedule/${params.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Auth-App': 'banca'
            }
        });

        const payload = await response.json().catch(() => null);

        return new Response(JSON.stringify(payload ?? { success: false, message: 'Failed to delete schedule' }), {
            status: response.ok ? 200 : response.status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch {
        return new Response(JSON.stringify({ success: false, message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};