import { memo, useEffect, useRef, type ReactNode } from "react";
import type { CommandAction } from "@shared/codex-ts/v2";
import { CopyButton } from "../CopyButton";
import { Disclosure } from "../Disclosure";
import { IconFolder, IconSearch, IconTerminal, IconFile, IconWrench } from "../Icons";

function actionLabel(action: CommandAction): ReactNode {
	const type = (action as { type?: string }).type;
	switch (type) {
		case "read": {
			const path = (action as { path?: unknown }).path;
			return (
				<>
					<IconFile size={12} /> read {typeof path === "string" ? path : ""}
				</>
			);
		}
		case "listFiles": {
			const path = (action as { path?: unknown }).path;
			return (
				<>
					<IconFolder size={12} /> list {typeof path === "string" ? path : "."}
				</>
			);
		}
		case "search": {
			const query = (action as { query?: unknown }).query;
			return (
				<>
					<IconSearch size={12} /> search {typeof query === "string" ? query : ""}
				</>
			);
		}
		default:
			return (
				<>
					<IconWrench size={12} /> run
				</>
			);
	}
}

function StatusBadge({ status, exitCode }: { status: string; exitCode: number | null }): ReactNode {
	if (status === "inProgress") return <span className="badge badge-running">running</span>;
	if (status === "declined") return <span className="badge badge-warn">declined</span>;
	if (status === "failed" || (typeof exitCode === "number" && exitCode !== 0)) {
		return <span className="badge badge-error">exit {exitCode ?? "?"}</span>;
	}
	// Successful commands are intentionally quiet: exit 0 adds no signal, and
	// the app-server duration is not reliable enough to show here.
	return null;
}

/** Auto-scroll a scroll container to the bottom while it is "stuck" there. */
function useStickyScroll<T extends HTMLElement>(dep: unknown) {
	const ref = useRef<T>(null);
	const stick = useRef(true);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const onScroll = () => {
			const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
			stick.current = distance < 48;
		};
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, []);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		if (stick.current) el.scrollTop = el.scrollHeight;
	}, [dep]);
	return ref;
}

interface Props {
	command: string;
	cwd?: string;
	status?: string;
	exitCode?: number | null;
	aggregatedOutput?: string | null;
	commandActions?: CommandAction[] | null;
	streaming?: boolean;
}

function CommandExecutionItemImpl({
	command,
	cwd,
	status = "inProgress",
	exitCode = null,
	aggregatedOutput,
	commandActions,
	streaming,
}: Props): ReactNode {
	const output = aggregatedOutput ?? "";
	const outputRef = useStickyScroll<HTMLPreElement>(output);
	const actions = Array.isArray(commandActions) ? commandActions : [];

	return (
			<div className={`item item-command status-${status}`}>
				<Disclosure
					defaultOpen={false}
					className="command-card"
					summary={
						<span className="command-summary">
							<IconTerminal size={14} />
							<code className="command-text" title={command || "(command)"}>$ {command || "(command)"}</code>
						{actions.length > 0 ? (
							<span className="command-actions">
								{actions.slice(0, 3).map((a, i) => (
									<span className="command-action" key={i}>
										{actionLabel(a)}
									</span>
								))}
							</span>
						) : null}
					</span>
				}
					actions={
						<span className="command-meta">
							<StatusBadge status={status} exitCode={exitCode ?? null} />
							<CopyButton text={output || command} label="Copy output" />
						</span>
					}
			>
				<div className="command-body">
					{cwd ? (
						<div className="command-cwd" title={cwd}>
							<IconFolder size={12} /> {cwd}
						</div>
					) : null}
					{output.length > 0 || streaming ? (
						<pre className="command-output" ref={outputRef}>
							{output}
							{streaming ? <span className="caret" /> : null}
						</pre>
					) : (
						<div className="muted small pad">No output</div>
					)}
				</div>
			</Disclosure>
		</div>
	);
}

export const CommandExecutionItem = memo(CommandExecutionItemImpl);
