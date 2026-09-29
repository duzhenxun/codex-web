import { memo, useMemo, type ReactNode } from "react";
import { diffStats, parseUnifiedDiff, type DiffFile } from "../lib/diff";
import { CopyButton } from "./CopyButton";

function FileDiff({ file }: { file: DiffFile }): ReactNode {
	const stats = useMemo(() => diffStats([file]), [file]);
	return (
		<div className="diff-file">
			<div className="diff-file-head">
				<span className="diff-file-path" title={file.path}>
					{file.path}
				</span>
				<span className="diff-stats">
					<span className="add">+{stats.additions}</span>
					<span className="del">−{stats.deletions}</span>
				</span>
			</div>
			{file.hunks.length === 0 ? (
				<pre className="diff-body">
					{file.header.map((line, i) => (
						<div className="diff-line meta" key={i}>
							<span className="diff-code">{line}</span>
						</div>
					))}
				</pre>
			) : (
				<pre className="diff-body">
					{file.hunks.map((hunk, hi) => (
						<div className="diff-hunk" key={hi}>
							<div className="diff-line hunk">
								<span className="diff-code">{hunk.header}</span>
							</div>
							{hunk.lines.map((line, li) => (
								<div className={`diff-line ${line.kind}`} key={li}>
									<span className="diff-no">{line.oldNo ?? ""}</span>
									<span className="diff-no">{line.newNo ?? ""}</span>
									<span className="diff-sign">{line.kind === "add" ? "+" : line.kind === "del" ? "-" : " "}</span>
									<span className="diff-code">{line.text}</span>
								</div>
							))}
						</div>
					))}
				</pre>
			)}
		</div>
	);
}

interface DiffViewProps {
	diff: string;
	className?: string;
	/** Copy button text / raw payload for the clipboard. */
	copyText?: string;
	/**
	 * Pre-parsed diff files. When provided, `diff` is only used as the copy payload
	 * and for the empty check — needed for `fileChange` payloads whose `diff` field
	 * is NOT a unified diff (raw content for add/delete).
	 */
	files?: DiffFile[];
}

export const DiffView = memo(function DiffView({ diff, className = "", copyText, files: filesProp }: DiffViewProps): ReactNode {
	const parsed = useMemo(() => parseUnifiedDiff(diff), [diff]);
	const files = filesProp ?? parsed;
	const copy = copyText ?? diff;
	if (!diff || diff.trim().length === 0) {
		return <div className="diff-empty muted">No changes</div>;
	}
	if (files.length === 0) {
		return (
			<div className={`diff-view ${className}`}>
				<pre className="diff-body">{diff}</pre>
			</div>
		);
	}
	return (
		<div className={`diff-view ${className}`}>
			{files.map((f, i) => (
				<FileDiff key={`${f.path}-${i}`} file={f} />
			))}
			<div className="diff-view-actions">
				<CopyButton text={copy} label="Copy diff" className="btn ghost small" />
			</div>
		</div>
	);
});
