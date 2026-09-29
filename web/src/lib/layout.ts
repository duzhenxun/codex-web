import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

/* ------------------------------------------------------------------ */
/* persisted layout state                                              */
/* ------------------------------------------------------------------ */

/** Persistence is debounced so a drag does not hammer localStorage. */
const PERSIST_DEBOUNCE_MS = 200;

function readRaw(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeRaw(key: string, value: string | null): void {
	try {
		if (value === null) localStorage.removeItem(key);
		else localStorage.setItem(key, value);
	} catch {
		/* ignore (private mode / quota) */
	}
}

/**
 * A number persisted in localStorage, where `null` means "no explicit choice"
 * (the caller then falls back to its own auto-sizing behaviour).
 *
 * The setter accepts an updater function, matching React's `useState` — the
 * keyboard shortcuts rely on it to avoid stale closures.
 */
export function useStoredNumber(
	key: string,
	fallback: number | null,
): [number | null, (value: number | null | ((prev: number | null) => number | null)) => void] {
	const [value, setValue] = useState<number | null>(() => {
		const raw = readRaw(key);
		if (raw === null) return fallback;
		const parsed = Number(raw);
		return Number.isFinite(parsed) ? parsed : fallback;
	});

	useEffect(() => {
		const t = setTimeout(() => writeRaw(key, value === null ? null : String(Math.round(value))), PERSIST_DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [key, value]);

	const set = useCallback(
		(next: number | null | ((prev: number | null) => number | null)) =>
			setValue((prev) => (typeof next === "function" ? next(prev) : next)),
		[],
	);
	return [value, set];
}

export function useStoredBoolean(
	key: string,
	fallback: boolean,
): [boolean, (value: boolean | ((prev: boolean) => boolean)) => void] {
	const [value, setValue] = useState<boolean>(() => {
		const raw = readRaw(key);
		if (raw === "1" || raw === "true") return true;
		if (raw === "0" || raw === "false") return false;
		return fallback;
	});

	useEffect(() => {
		const t = setTimeout(() => writeRaw(key, value ? "1" : "0"), PERSIST_DEBOUNCE_MS);
		return () => clearTimeout(t);
	}, [key, value]);

	const set = useCallback(
		(next: boolean | ((prev: boolean) => boolean)) => setValue((prev) => (typeof next === "function" ? next(prev) : next)),
		[],
	);
	return [value, set];
}

/* ------------------------------------------------------------------ */
/* media query                                                        */
/* ------------------------------------------------------------------ */

export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() =>
		typeof window === "undefined" ? false : window.matchMedia(query).matches,
	);

	useEffect(() => {
		const mql = window.matchMedia(query);
		const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
		setMatches(mql.matches);
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, [query]);

	return matches;
}

/* ------------------------------------------------------------------ */
/* drag to resize                                                     */
/* ------------------------------------------------------------------ */

export interface DragResizeOptions {
	/** Axis the pointer moves along. */
	axis: "x" | "y";
	/**
	 * `-1` when dragging *towards the origin* grows the box — e.g. dragging the
	 * top edge of a bottom panel upwards, or the left edge of a right panel
	 * leftwards. `+1` for the conventional right/bottom-edge handles.
	 */
	sign: 1 | -1;
	/** Size in px at the start of the drag. */
	size: number;
	min: number;
	max: number;
	onResize: (size: number) => void;
	/** Called once on pointerup with the final size. */
	onCommit?: (size: number) => void;
	disabled?: boolean;
}

export interface DragResizeHandle {
	onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
	dragging: boolean;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Pointer-driven resize built on **pointer capture**, so the drag keeps working
 * when the cursor leaves the handle or the window — the usual failure mode of
 * mousemove-based resizers.
 */
export function useDragResize(opts: DragResizeOptions): DragResizeHandle {
	const [dragging, setDragging] = useState(false);
	// Live options for the duration of a drag (handlers are attached to window,
	// so they would otherwise close over the first render's values).
	const optsRef = useRef(opts);
	optsRef.current = opts;

	const onPointerDown = useCallback((e: ReactPointerEvent<HTMLElement>) => {
		if (optsRef.current.disabled) return;
		if (e.button !== 0) return; // keep right-click menus working on the handle
		e.preventDefault();
		e.stopPropagation();

		const target = e.currentTarget;
		const startPos = optsRef.current.axis === "x" ? e.clientX : e.clientY;
		const startSize = optsRef.current.size;
		let last = startSize;

		try {
			target.setPointerCapture(e.pointerId);
		} catch {
			/* not fatal — window listeners still drive the drag */
		}
		setDragging(true);
		// Without this, dragging across text selects it in every other panel.
		const previousUserSelect = document.body.style.userSelect;
		document.body.style.userSelect = "none";

		const onMove = (ev: PointerEvent): void => {
			const o = optsRef.current;
			const pos = o.axis === "x" ? ev.clientX : ev.clientY;
			last = clamp(startSize + (pos - startPos) * o.sign, o.min, o.max);
			o.onResize(last);
		};

		const onUp = (): void => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
			try {
				target.releasePointerCapture(e.pointerId);
			} catch {
				/* already released */
			}
			setDragging(false);
			document.body.style.userSelect = previousUserSelect;
			optsRef.current.onCommit?.(last);
		};

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
	}, []);

	return { onPointerDown, dragging };
}
