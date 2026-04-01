import { create } from "zustand";
import { ProgressEntry, LogProgressData, WeightDataPoint, ProgressSummary } from "@/types";
import { progressService } from "@/services";
import { format, parseISO } from "date-fns";

// Helper to sort and derive stable weight metrics
const sortEntries = (entries: ProgressEntry[]): ProgressEntry[] =>
	[...entries].sort((a, b) => {
		const da = new Date(a.date).getTime();
		const db = new Date(b.date).getTime();
		if (da !== db) return da - db;
		const ca = new Date(a.createdAt).getTime();
		const cb = new Date(b.createdAt).getTime();
		return ca - cb;
	});

const deriveWeights = (sorted: ProgressEntry[]) => {
	if (sorted.length === 0) {
		return {
			startingWeight: null as number | null,
			currentWeight: null as number | null,
			previousWeight: null as number | null,
			changeFromStart: null as number | null,
			changeFromPrevious: null as number | null,
		};
	}

	const startingWeight = sorted[0].weight;
	const currentWeight = sorted[sorted.length - 1].weight;
	const previousWeight =
		sorted.length > 1 ? sorted[sorted.length - 2].weight : null;

	const changeFromStart = Number(
		(currentWeight - startingWeight).toFixed(1)
	);
	const changeFromPrevious =
		previousWeight !== null
			? Number((currentWeight - previousWeight).toFixed(1))
			: null;

	return {
		startingWeight,
		currentWeight,
		previousWeight,
		changeFromStart,
		changeFromPrevious,
	};
};

const buildStateFromEntries = (entries: ProgressEntry[]) => {
	const sorted = sortEntries(entries);
	const derived = deriveWeights(sorted);
	const latestProgress = sorted.length > 0 ? sorted[sorted.length - 1] : null;

	return {
		progressHistory: sorted,
		latestProgress,
		...derived,
	};
};

interface ProgressState {
	progressHistory: ProgressEntry[];
	latestProgress: ProgressEntry | null;
	summary: ProgressSummary | null;
	isLoading: boolean;
	error: string | null;
	startingWeight: number | null;
	currentWeight: number | null;
	previousWeight: number | null;
	changeFromStart: number | null;
	changeFromPrevious: number | null;

	// Actions
	fetchProgress: (limit?: number) => Promise<void>;
	fetchLatestProgress: () => Promise<void>;
	fetchProgressSummary: () => Promise<void>;
	logProgress: (data: LogProgressData) => Promise<void>;
	getWeightChartData: () => WeightDataPoint[];
	clearError: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
	progressHistory: [],
	latestProgress: null,
	summary: null,
	isLoading: false,
	error: null,
	startingWeight: null,
	currentWeight: null,
	previousWeight: null,
	changeFromStart: null,
	changeFromPrevious: null,

	fetchProgress: async (limit = 30) => {
		set({ isLoading: true, error: null });
		try {
			const entries = await progressService.getProgress({ limit });
			const newState = buildStateFromEntries(entries);
			set({ ...newState, isLoading: false });
		} catch (error: unknown) {
			const err = error as { message?: string };
			set({ error: err.message || "Failed to fetch progress", isLoading: false });
		}
	},

	fetchLatestProgress: async () => {
		set({ isLoading: true, error: null });
		try {
			const latestProgress = await progressService.getLatestProgress();
			set({ latestProgress, isLoading: false });
		} catch (error: unknown) {
			const err = error as { message?: string };
			set({ error: err.message || "Failed to fetch latest progress", isLoading: false });
		}
	},

	fetchProgressSummary: async () => {
		set({ isLoading: true, error: null });
		try {
			const summary = await progressService.getProgressSummary();
			set({ summary, isLoading: false });
		} catch (error: unknown) {
			const err = error as { message?: string };
			set({ error: err.message || "Failed to fetch progress summary", isLoading: false });
		}
	},

	logProgress: async (data: LogProgressData) => {
		set({ isLoading: true, error: null });
		try {
			// 1) Call API to log
			await progressService.logProgress(data);
			// 2) Refetch entries and 3) recompute derived values
			const entries = await progressService.getProgress({ limit: 30 });
			const newState = buildStateFromEntries(entries);
			set({ ...newState, isLoading: false });
		} catch (error: unknown) {
			const err = error as { message?: string };
			set({ error: err.message || "Failed to log progress", isLoading: false });
		}
	},

	getWeightChartData: () => {
		const { progressHistory } = get();
		return progressHistory.map((entry) => ({
			date: entry.date,
			weight: entry.weight,
			label: format(parseISO(entry.date), "MMM d"),
		}));
	},

	clearError: () => set({ error: null }),
}));
