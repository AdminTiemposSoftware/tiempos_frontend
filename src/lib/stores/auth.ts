import { writable } from 'svelte/store';

type AuthUser = {
	id: string;
	role: string;
	username?: string;
} | null;

type AuthState = {
	user: AuthUser;
	isAuthenticated: boolean;
};

const authState = writable<AuthState>({
	user: null,
	isAuthenticated: false
});

const auth = {
	subscribe: authState.subscribe
};

function setAuth(user: AuthUser) {
	authState.set({
		user,
		isAuthenticated: Boolean(user)
	});
}

export type { AuthUser, AuthState };
export { auth, setAuth };
