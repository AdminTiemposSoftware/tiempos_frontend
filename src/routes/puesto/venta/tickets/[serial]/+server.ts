import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, fetch, locals, cookies }) => {
    const baseUrl = env.API_URL;
    const branchId = locals.user?.branchId;
    const token = cookies.get('session_puesto') ?? null;

    if (!branchId || !token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const ticketSerial = params.serial;

    try {
        const response = await fetch(`${baseUrl}/ticket/by-serial/${branchId}/${ticketSerial}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'X-Auth-App': 'puesto'
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            return new Response(JSON.stringify({ error: errorData.message || 'Error al consultar el tiquete' }), { status: response.status });
        }
        const data = await response.json();
        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Error al consultar el tiquete' }), { status: 500 });
    }
};