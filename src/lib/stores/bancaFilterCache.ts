export type BancaFilterData = {
	branchNames: unknown[];
	scheduleNames: unknown[];
	scheduleBranch: unknown[];
};

let cachedFilterData: BancaFilterData | null = null;

export function getBancaFilterData(initialData: Partial<BancaFilterData>): BancaFilterData {
	if (cachedFilterData) {
		return cachedFilterData;
	}

	cachedFilterData = {
		branchNames: Array.isArray(initialData.branchNames) ? initialData.branchNames : [],
		scheduleNames: Array.isArray(initialData.scheduleNames) ? initialData.scheduleNames : [],
		scheduleBranch: Array.isArray(initialData.scheduleBranch) ? initialData.scheduleBranch : []
	};

	return cachedFilterData;
}

export function invalidateBancaFilterCache() {
	cachedFilterData = null;
}
