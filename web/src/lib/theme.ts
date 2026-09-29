/**
 * Theme (skin) registry.
 *
 * A skin is just a `[data-theme="<id>"]` block of CSS variables in styles.css.
 * `data-scheme` collapses the skins into light/dark so light-mode-only rules
 * (syntax highlighting, etc.) are written once instead of per skin.
 */

export type Theme = "light" | "paper" | "mist" | "dark";

export interface ThemeInfo {
	id: Theme;
	/** Label shown in the picker. */
	label: string;
	/** Short description / hint. */
	hint: string;
	/** Two swatch colours: [canvas, accent] — previewed in the picker. */
	swatch: [string, string];
	light: boolean;
}

export const THEMES: readonly ThemeInfo[] = [
	{
		id: "light",
		label: "White",
		hint: "White canvas, grey chrome, blue accent",
		swatch: ["#ffffff", "#0969da"],
		light: true,
	},
	{
		id: "paper",
		label: "Warm paper",
		hint: "Cream canvas, ochre accent — easy on the eyes",
		swatch: ["#f7f1e3", "#b45309"],
		light: true,
	},
	{
		id: "mist",
		label: "Mist",
		hint: "Cool grey-green canvas, teal accent",
		swatch: ["#f4f8f7", "#0f766e"],
		light: true,
	},
	{
		id: "dark",
		label: "Midnight",
		hint: "Near-black canvas, violet accent",
		swatch: ["#0a0b0e", "#8b7bff"],
		light: false,
	},
];

/** Default on a fresh install. */
export const DEFAULT_THEME: Theme = "light";

export function isTheme(value: unknown): value is Theme {
	return typeof value === "string" && THEMES.some((t) => t.id === value);
}

export function themeScheme(theme: Theme): "light" | "dark" {
	return THEMES.find((t) => t.id === theme)?.light ? "light" : "dark";
}

/**
 * Apply a skin to <html>. Sets BOTH `data-theme` (the skin) and `data-scheme`
 * (light/dark), the latter being what the shared light-mode CSS keys off.
 */
export function applyTheme(theme: Theme): void {
	const root = document.documentElement;
	root.dataset.theme = theme;
	root.dataset.scheme = themeScheme(theme);
	root.style.colorScheme = themeScheme(theme);
}

export function loadTheme(): Theme {
	try {
		const saved = localStorage.getItem("cw-theme");
		return isTheme(saved) ? saved : DEFAULT_THEME;
	} catch {
		return DEFAULT_THEME;
	}
}

export function saveTheme(theme: Theme): void {
	try {
		localStorage.setItem("cw-theme", theme);
	} catch {
		/* ignore (private mode) */
	}
}
