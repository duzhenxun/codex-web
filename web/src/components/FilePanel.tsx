import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import hljs from "highlight.js/lib/common";
import type { FsEntry } from "@shared/protocol";
import { useCodex } from "../lib/useCodex";
import { useDragResize, useStoredNumber } from "../lib/layout";
import { basename, dirname } from "../lib/format";
import { CopyButton } from "./CopyButton";
import { IconChevronDown, IconChevronRight, IconFile, IconFolder, IconRefresh, IconX } from "./Icons";

/* File panel width bounds (px) — the CSS default is `DEFAULT_PANEL_W`. */
const DEFAULT_PANEL_W = 560;
const MIN_PANEL_W = 320;
const MAX_PANEL_W = 1100;

/* ------------------------------- file tree -------------------------------- */

function TreeNode({ entry, depth, onPick, selected }: {
	entry: FsEntry;
	depth: number;
	onPick: (path: string) => void;
	selected: string | null;
}): ReactNode {
	const { listFiles } = useCodex();
	const [open, setOpen] = useState(false);
	const [children, setChildren] = useState<FsEntry[] | null>(null);
	const [loading, setLoading] = useState(false);

	const isDir = entry.kind === "directory";

	const toggle = useCallback(async () => {
		if (!isDir) {
			onPick(entry.path);
			return;
		}
		const next = !open;
		setOpen(next);
		if (next && children === null && !loading) {
			setLoading(true);
			try {
				const res = await listFiles(entry.path);
				setChildren(
					res.entries
						.slice()
						.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "directory" ? -1 : 1)),
				);
			} catch {
				setChildren([]);
			} finally {
				setLoading(false);
			}
		}
	}, [isDir, open, children, loading, listFiles, entry.path, onPick]);

	return (
		<div className="tree-node">
			<button
				type="button"
				className={`tree-row${selected === entry.path ? " selected" : ""}`}
				style={{ paddingLeft: 6 + depth * 12 }}
				onClick={() => void toggle()}
				title={entry.path}
			>
				<span className="tree-caret">
					{isDir ? open ? <IconChevronDown size={12} /> : <IconChevronRight size={12} /> : null}
				</span>
				{isDir ? <IconFolder size={13} /> : <IconFile size={13} />}
				<span className="tree-name">{entry.name}</span>
			</button>
			{open ? (
				<div className="tree-children">
					{loading ? <div className="tree-loading muted">Loading…</div> : null}
					{(children ?? []).map((child) => (
						<TreeNode key={child.path} entry={child} depth={depth + 1} onPick={onPick} selected={selected} />
					))}
					{!loading && children && children.length === 0 ? <div className="tree-loading muted">empty</div> : null}
				</div>
			) : null}
		</div>
	);
}

/* ----------------------------- file content ------------------------------- */

function languageFor(path: string): string {
	const ext = path.split(".").pop()?.toLowerCase() ?? "";
	const map: Record<string, string> = {
		ts: "typescript",
		tsx: "typescript",
		js: "javascript",
		jsx: "javascript",
		mjs: "javascript",
		cjs: "javascript",
		json: "json",
		css: "css",
		scss: "scss",
		html: "html",
		md: "markdown",
		py: "python",
		rs: "rust",
		go: "go",
		java: "java",
		c: "c",
		h: "c",
		cpp: "cpp",
		hpp: "cpp",
		sh: "bash",
		bash: "bash",
		zsh: "bash",
		yml: "yaml",
		yaml: "yaml",
		toml: "ini",
		sql: "sql",
		rb: "ruby",
		php: "php",
		swift: "swift",
		kt: "kotlin",
	};
	return map[ext] ?? ext;
}

function highlight(text: string, path: string): string {
	const lang = languageFor(path);
	try {
		if (lang && hljs.getLanguage(lang)) return hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
		return hljs.highlightAuto(text).value;
	} catch {
		return text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
	}
}

/* -------------------------------- panel ----------------------------------- */

export function FilePanel(): ReactNode {
	const { previewFile, closeFilePreview, readFile, listFiles, settings, info, openFilePreview } = useCodex();
	const [content, setContent] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [truncated, setTruncated] = useState(false);
	const [showTree, setShowTree] = useState(false);
	const [entries, setEntries] = useState<FsEntry[] | null>(null);

	const root = settings.cwd || info?.cwd || "";

	useEffect(() => {
		if (!previewFile) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		readFile(previewFile)
			.then((res) => {
				if (cancelled) return;
				setContent(res.text);
				setTruncated(res.truncated);
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				setContent("");
				setError(err instanceof Error ? err.message : String(err));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [previewFile, readFile]);

	const loadRoot = useCallback(async () => {
		if (!root) return;
		try {
			const res = await listFiles(root);
			setEntries(
				res.entries.slice().sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === "directory" ? -1 : 1)),
			);
		} catch {
			setEntries([]);
		}
	}, [listFiles, root]);

	useEffect(() => {
		if (showTree && entries === null) void loadRoot();
	}, [showTree, entries, loadRoot]);

	const [panelWidth, setPanelWidth] = useStoredNumber("cw-file-panel-width", DEFAULT_PANEL_W);
	const panelDrag = useDragResize({
		axis: "x",
		// The handle is on the panel's LEFT edge: dragging left grows it.
		sign: -1,
		size: panelWidth ?? DEFAULT_PANEL_W,
		min: MIN_PANEL_W,
		max: typeof window === "undefined" ? MAX_PANEL_W : Math.min(MAX_PANEL_W, Math.round(window.innerWidth * 0.75)),
		onResize: setPanelWidth,
	});
	const resetPanelWidth = useCallback(() => setPanelWidth(DEFAULT_PANEL_W), [setPanelWidth]);

	const html = useMemo(() => {
		if (!previewFile || !content) return "";
		return highlight(content, previewFile);
	}, [content, previewFile]);

	if (!previewFile) return null;

	return (
		<div
			className={`file-panel${panelDrag.dragging ? " dragging" : ""}`}
			role="complementary"
			aria-label="File preview"
			style={{ "--file-panel-w": `${panelWidth ?? DEFAULT_PANEL_W}px` } as CSSProperties}
		>
			<div
				className="resize-handle vertical left"
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize file panel"
				title="Drag to resize · double-click to reset"
				onPointerDown={panelDrag.onPointerDown}
				onDoubleClick={resetPanelWidth}
			/>
			<div className="file-panel-head">
				<div className="file-panel-title" title={previewFile}>
					<IconFile size={14} />
					<span className="file-name">{basename(previewFile)}</span>
					<span className="file-dir">{dirname(previewFile)}</span>
				</div>
				<div className="file-panel-actions">
					<button
						className={`icon-btn${showTree ? " active" : ""}`}
						aria-label="Toggle file tree"
						title="File tree"
						onClick={() => setShowTree((v) => !v)}
					>
						<IconFolder size={15} />
					</button>
					<CopyButton text={content} label="Copy file contents" />
					<button className="icon-btn" aria-label="Close file preview" onClick={closeFilePreview}>
						<IconX size={16} />
					</button>
				</div>
			</div>

			{showTree ? (
				<div className="file-tree">
					<div className="file-tree-head">
						<span className="muted small" title={root}>
							{root || "workspace"}
						</span>
						<button className="icon-btn tiny" aria-label="Refresh file tree" onClick={() => void loadRoot()}>
							<IconRefresh size={13} />
						</button>
					</div>
					<div className="file-tree-body">
						{(entries ?? []).map((entry) => (
							<TreeNode key={entry.path} entry={entry} depth={0} onPick={openFilePreview} selected={previewFile} />
						))}
						{entries && entries.length === 0 ? <div className="muted small pad">No files</div> : null}
					</div>
				</div>
			) : null}

			<div className="file-content">
				{loading ? (
					<div className="muted pad">Loading…</div>
				) : error ? (
					<div className="error-text pad">{error}</div>
				) : (
					<>
						{truncated ? <div className="file-truncated muted small">File truncated</div> : null}
						{/* highlight.js escapes its input, so this is safe to inject. */}
						<pre className="hljs file-code">
							<code dangerouslySetInnerHTML={{ __html: html }} />
						</pre>
					</>
				)}
			</div>
		</div>
	);
}
