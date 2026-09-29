import { memo, useMemo, type ReactNode } from "react";
import type { FileUpdateChange, PatchChangeKind } from "@shared/codex-ts/v2";
import { DiffView } from "../DiffView";
import { CopyButton } from "../CopyButton";
import { Disclosure } from "../Disclosure";
import { IconGitBranch } from "../Icons";
import { basename } from "../../lib/format";
import { parseFileChangeDiff } from "../../lib/diff";

function kindLabel(kind: PatchChangeKind | string | undefined): { label: string; cls: string } {
	const t = typeof kind === "string" ? kind : kind?.type;
	switch (t) {
		case "add":
			return { label: "add", cls: "kind-add" };
		case "delete":
			return { label: "delete", cls: "kind-del" };
		case "update":
			return { label: "update", cls: "kind-update" };
		default:
			return { label: t ?? "change", cls: "kind-update" };
	}
}

function FileChange({ change }: { change: FileUpdateChange }): ReactNode {
	const kind = kindLabel(change?.kind);
	const movePath = typeof change?.kind === "object" && change.kind ? (change.kind as { move_path?: string | null }).move_path : null;
	const diff = typeof change?.diff === "string" ? change.diff : "";
	// `diff` is raw file content for add/delete and bare hunks for update —
	// parseFileChangeDiff normalises all three into renderable diff files.
	const files = useMemo(() => parseFileChangeDiff(change), [change]);
	return (
		<div className="file-change">
			<div className="file-change-head">
				<span className={`badge ${kind.cls}`}>{kind.label}</span>
				<span className="file-change-path" title={change?.path}>
					{change?.path ?? "(unknown path)"}
				</span>
				{movePath ? <span className="file-change-move">→ {movePath}</span> : null}
				{diff ? <CopyButton text={diff} label="Copy diff" /> : null}
			</div>
			{diff ? <DiffView diff={diff} files={files} copyText={diff} /> : <div className="muted small pad">No diff</div>}
		</div>
	);
}

interface Props {
	changes?: FileUpdateChange[] | null;
	status?: string;
}

function FileChangeItemImpl({ changes, status = "completed" }: Props): ReactNode {
	const list = Array.isArray(changes) ? changes : [];
	const label = list.length === 1 ? basename(list[0]?.path ?? "") : `${list.length} files`;
	return (
		<div className={`item item-filechange status-${status}`}>
			<Disclosure
				defaultOpen={false}
				className="filechange-card"
				summary={
					<span className="filechange-summary">
						<IconGitBranch size={14} />
						<span className="filechange-title">Changed {label}</span>
						{status === "inProgress" ? <span className="badge badge-running">applying</span> : null}
						{status === "failed" ? <span className="badge badge-error">failed</span> : null}
						{status === "declined" ? <span className="badge badge-warn">declined</span> : null}
					</span>
				}
			>
				<div className="filechange-body">
					{list.length === 0 ? <div className="muted small pad">No file changes recorded</div> : null}
					{list.map((change, i) => (
						<FileChange change={change} key={`${change?.path ?? i}-${i}`} />
					))}
				</div>
			</Disclosure>
		</div>
	);
}

export const FileChangeItem = memo(FileChangeItemImpl);
