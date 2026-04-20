import { redirect, Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

type AuthUser = {
	id: string;
	role: string;
	username?: string;
} | null;

const publicPrefixes = ['/_app', '/login', '/robots.txt', '/favicon'];

// TODO - Refactor to support multiple auth methods and providers more cleanly
const ENV_LOGIN_USERNAME = env.ADMIN_USERNAME ?? '';
const ENV_LOGIN_USER_ID = env.PRIVATE_AUTH_USER_ID ?? 'env-user';
const ENV_LOGIN_ROLE = env.PRIVATE_AUTH_ROLE ?? 'admin';

const baseUrl = env.API_URL;	

async function fetchUser(token: string, fetchFn: typeof fetch): Promise<AuthUser> {
	if (!baseUrl) {
		return {
			id: ENV_LOGIN_USER_ID,
			role: ENV_LOGIN_ROLE,
			username: ENV_LOGIN_USERNAME || undefined
		};
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

		return {
			id: String(user.id),
			role: String(user.role ?? 'user'),
			username: user.username ? String(user.username) : undefined
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