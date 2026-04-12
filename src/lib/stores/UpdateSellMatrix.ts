import { writable } from 'svelte/store';

export const sellingMatrix = writable(Object.fromEntries(Array.from({ length: 100 }, (_, i) => [i, 0])));
export const total = writable(0);
export const prohibitedNumbers = writable<number[]>([]);
