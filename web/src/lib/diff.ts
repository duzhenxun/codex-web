// Minimal unified-diff parser — no external dependency.
// Handles the subset of `git diff` / `apply_patch` output we render:
//   diff --git a/... b/...
//   --- a/...
//   +++ b/...
//   @@ -1,3 +1,4 @@ context
//    context / +added / -removed / \ No newline ...

export type DiffLineKind = "context" | "add" | "del" | "meta";

export interface DiffLine {
	kind: DiffLineKind;
	text: string;
	oldNo: number | null;
	newNo: number | null;
}

export interface DiffHunk {
	header: string;
	lines: DiffLine[];
}

export interface DiffFile {
	/** Display path (the b/ side when present). */
	path: string;
	oldPath: string | null;
	newPath: string | null;
	hunks: DiffHunk[];
	/** Lines before the first hunk (index lines, binary notice, ...). */
	header: string[];
}

interface MutableFile {
	path: string;
	oldPath: string | null;
	newPath: string | null;
	hunks: DiffHunk[];
	header: string[];
	curHunk: DiffHunk | null;
	oldNo: number;
	newNo: number;
}

const HUNK_RE = /^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/;

function pushLine(file: MutableFile, kind: DiffLineKind, text: string): void {
	if (!file.curHunk) {
		file.header.push(text);
		return;
	}
	let oldNo: number | null = null;
	let newNo: number | null = null;
	if (kind === "context") {
		oldNo = file.oldNo++;
		newNo = file.newNo++;
	} else if (kind === "add") {
		newNo = file.newNo++;
	} else if (kind === "del") {
		oldNo = file.oldNo++;
	}
	file.curHunk.lines.push({ kind, text, oldNo, newNo });
}

/**
 * Parse a unified diff. Never throws: malformed input degrades to a single
 * "meta" file so callers always get something renderable.
 */
export function parseUnifiedDiff(raw: string): DiffFile[] {
	if (typeof raw !== "string" || raw.length === 0) return [];
	const files: DiffFile[] = [];
	let file: MutableFile | null = null;

	const startFile = (path: string, oldPath: string | null, newPath: string | null): MutableFile => {
		const f: MutableFile = { path, oldPath, newPath, hunks: [], header: [], curHunk: null, oldNo: 0, newNo: 0 };
		files.push(f);
		return f;
	};

	for (const line of raw.split("\n")) {
		if (line.startsWith("diff --git ") || line.startsWith("diff --")) {
			const m = line.match(/diff --git a\/(.*?) b\/(.*)$/);
			const path = m ? m[2] : "diff";
			file = startFile(path, m ? m[1] : null, m ? m[2] : null);
			file.header.push(line);
			continue;
		}
		if (line.startsWith("--- ")) {
			const p = line.slice(4).trim();
			if (!file) file = startFile(p === "/dev/null" ? "diff" : p, p, null);
			else file.oldPath = p === "/dev/null" ? null : p;
			file.header.push(line);
			continue;
		}
		if (line.startsWith("+++ ")) {
			const p = line.slice(4).trim();
			if (!file) file = startFile(p === "/dev/null" ? "diff" : p, null, p);
			else {
				file.newPath = p === "/dev/null" ? null : p;
				if (file.newPath) file.path = file.newPath;
			}
			file.header.push(line);
			continue;
		}
		if (line.startsWith("@@")) {
			if (!file) file = startFile("diff", null, null);
			const m = line.match(HUNK_RE);
			if (m) {
				file.oldNo = parseInt(m[1], 10);
				file.newNo = parseInt(m[2], 10);
			}
			const hunk: DiffHunk = { header: line, lines: [] };
			file.hunks.push(hunk);
			file.curHunk = hunk;
			continue;
		}
		if (!file) {
			file = startFile("diff", null, null);
		}
		if (line.startsWith("+")) pushLine(file, "add", line.slice(1));
		else if (line.startsWith("-")) pushLine(file, "del", line.slice(1));
		else if (line.startsWith("\\")) pushLine(file, "meta", line);
		else if (line.startsWith(" ") || line.length === 0) pushLine(file, "context", line.startsWith(" ") ? line.slice(1) : "");
		else pushLine(file, "meta", line);
	}

	return files.map((f) => ({
		path: f.path,
		oldPath: f.oldPath,
		newPath: f.newPath,
		hunks: f.hunks,
		header: f.header,
	}));
}

export interface DiffStats {
	additions: number;
	deletions: number;
}

/**
 * Convert one `FileUpdateChange.diff` payload into renderable diff files.
 *
 * `diff` means different things per change kind — verified against
 * `codex-cli 0.156.1`:
 *
 *   kind={"type":"update"} → unified-diff **hunks only** (`@@ -1,3 +1,3 @@ ...`);
 *                            no `diff --git` / `---` / `+++` header at all.
 *   kind={"type":"add"}    → the **raw new file content** (`alpha\nbeta\n`), not a diff.
 *   kind={"type":"delete"} → the **raw old file content**, not a diff.
 *
 * Feeding raw add/delete content to a unified-diff parser produces nonsense
 * (everything lands in the file header as context and the stats read `+0 −0`),
 * so we synthesise the proper hunks here.
 */
export function parseFileChangeDiff(
	change: { path?: string | null; kind?: unknown; diff?: string | null } | null | undefined,
): DiffFile[] {
	const path = typeof change?.path === "string" ? change.path : "(unknown path)";
	const diff = typeof change?.diff === "string" ? change.diff : "";
	if (!diff) return [];

	const kindType = typeof change?.kind === "string" ? change.kind : (change?.kind as { type?: string } | undefined)?.type;

	// Normalise trailing newline so "a\n" is one line rather than two.
	const body = diff.replace(/\n$/, "");
	const lines = body.length === 0 ? [] : body.split("\n");

	if (kindType === "add" || kindType === "delete") {
		const isAdd = kindType === "add";
		const hunk: DiffHunk = {
			header: isAdd ? `@@ -0,0 +1,${lines.length} @@` : `@@ -1,${lines.length} +0,0 @@`,
			lines: lines.map((text, i) => ({
				kind: isAdd ? "add" : "del",
				text,
				oldNo: isAdd ? null : i + 1,
				newNo: isAdd ? i + 1 : null,
			})),
		};
		return [
			{
				path,
				oldPath: isAdd ? null : path,
				newPath: isAdd ? path : null,
				// Keep git's own framing visible in the header, like `git diff` does.
				header: [
					`diff --git a/${path} b/${path}`,
					...(isAdd
						? ["new file mode 100644", "--- /dev/null", `+++ b/${path}`]
						: ["deleted file mode 100644", `--- a/${path}`, "+++ /dev/null"]),
				],
				hunks: [hunk],
			},
		];
	}

	// update (or unknown): already hunks, or possibly a full git diff.
	const parsed = parseUnifiedDiff(diff);
	if (parsed.length === 0) return [];
	// A bare `@@` hunk has no path; label it with the change's path and drop the
	// synthetic "diff" name so the header does not read literally `diff`.
	return parsed.map((file) => (file.path === "diff" && !file.oldPath && !file.newPath ? { ...file, path } : file));
}

export function diffStats(files: DiffFile[]): DiffStats {
	let additions = 0;
	let deletions = 0;
	for (const f of files) {
		for (const h of f.hunks) {
			for (const l of h.lines) {
				if (l.kind === "add") additions++;
				else if (l.kind === "del") deletions++;
			}
		}
	}
	return { additions, deletions };
}
