/// <reference types="svelte-adapter-azure-swa" />

declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				role: string;
				username?: string;
				branchId?: string | null;
				branchName?: string | null;
				branchLocation?: string | null;
				bankingId?: string | null;
				prohibitedPercentage?: number | null;
			} | null;
		}

		interface PageData {
			user: Locals['user'];
		}
	}
}

export {};