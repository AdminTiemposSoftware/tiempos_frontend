/// <reference types="svelte-adapter-azure-swa" />

declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				role: string;
				username?: string;
			} | null;
		}

		interface PageData {
			user: Locals['user'];
		}
	}
}

export {};