import { redirect, Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

type AuthUser = {
	id: string;
	role: string;
	username?: string;
 	branchId?: string | null;
	branchName?: string | null;
	branchLocation?: string | null;
	bankingId?: string | null;
} | null;

const publicPrefixes = ['/_app', '/puesto/login', '/banca/login', '/robots.txt', '/favicon'];

const baseUrl = env.API_URL;	

function resolveApp(pathname: string) {
	if (pathname.startsWith('/puesto')) {
		return 'puesto';
	}
	return 'banca';
}

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
					Authorization: `Bearer ${token}`,
					'X-Auth-App': 'puesto'
				}
			});
			const branchData = await branchResponse.json().catch(() => null);
			user.branchId = branchData?.items?.[0]?.id ? String(branchData.items[0].id) : null;
			user.branchName = branchData?.items?.[0]?.name ? String(branchData.items[0].name) : null;
			user.branchLocation = branchData?.items?.[0]?.location ? String(branchData.items[0].location) : null;
		} else if (user.role === 'banking') {
			const bankResponse = await fetchFn(`${baseUrl}/banking/by-user/${user.id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'X-Auth-App': 'banca'
				}
			});
			const bankData = await bankResponse.json().catch(() => null);
			user.bankingId = bankData?.items?.[0]?.id ? String(bankData.items[0].id) : null;
		}

		return {
			id: String(user.id),
			role: String(user.role ?? 'branch'),
			username: user.username ? String(user.username) : undefined,
			branchId: user.branchId ?? null,
			branchName: user.branchName ?? null,
			branchLocation: user.branchLocation ?? null,
			bankingId: user.bankingId ?? null
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
	const app = resolveApp(pathname);

	// existing auth logic
	const token = event.cookies.get(app === 'puesto' ? 'session_puesto' : 'session_banca');
	// const token = event.cookies.get("session");
	const isPublic = publicPrefixes.some((prefix) =>
		pathname.startsWith(prefix)
	);

	if (token) {
		event.locals.user = await fetchUser(token, event.fetch);
	} else {
		event.locals.user = null;
	}

	if (!event.locals.user && !isPublic) {
		throw redirect(303, app === 'puesto' ? '/puesto/login' : '/banca/login');
	}

	if (event.locals.user && pathname.startsWith('/puesto/login')) {
		throw redirect(303, '/puesto/venta');
	}

	if (event.locals.user && pathname.startsWith('/banca/login')) {
		throw redirect(303, '/banca/inicio');
	}

	return resolve(event);
};