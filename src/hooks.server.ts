import { redirect, Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

type AuthUser = {
	id: string;
	role: string;
	username?: string;
 	branchId?: string | null;
} | null;

const publicPrefixes = ['/_app', '/login', '/robots.txt', '/favicon'];

const baseUrl = env.API_URL;	

async function fetchUser(token: string, fetchFn: typeof fetch): Promise<AuthUser> {
	if (!baseUrl) {
		return null;
	}

	try {
		const response = await fetchFn(`${baseUrl}/auth/me`, {
			headers: {
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			return null;
		}

		const payload = await response.json().catch(() => null);
		const user = payload?.user ?? payload;
		if (!user?.id) {
			return null;
		}

		if (user.role === 'branch') {
			const branchResponse = await fetchFn(`${baseUrl}/branch/by-user/${user.id}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			const branchData = await branchResponse.json().catch(() => null);
			user.branchId = branchData?.items?.[0]?.id ? String(branchData.items[0].id) : null;
		}

		return {
			id: String(user.id),
			role: String(user.role ?? 'branch'),
			username: user.username ? String(user.username) : undefined,
			branchId: user.branchId ?? null
		};
	} catch {
		return null;
	}
}


export const handle: Handle = async ({ event, resolve }) => {
	if (building) {
		return resolve(event);
	}

	const { pathname } = event.url;

	// existing auth logic
	const token = event.cookies.get('session');
	const isPublic = publicPrefixes.some((prefix) =>
		pathname.startsWith(prefix)
	);

	if (token) {
		event.locals.user = await fetchUser(token, event.fetch);
	} else {
		event.locals.user = null;
	}

	if (!event.locals.user && !isPublic) {
		throw redirect(303, '/login');
	}

	if (event.locals.user && pathname.startsWith('/login')) {
		throw redirect(303, '/venta');
	}

	return resolve(event);
};