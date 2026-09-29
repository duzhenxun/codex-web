import { memo, type ReactNode } from "react";
import { CopyButton } from "../CopyButton";
import { Disclosure } from "../Disclosure";
import { IconGlobe, IconWrench, IconSearch, IconTerminal } from "../Icons";
import { JsonCard, safeStringify } from "./JsonCard";
import { formatDuration } from "../../lib/format";

function StatusBadge({ status, success }: { status?: string; success?: boolean | null }): ReactNode {
	if (status === "inProgress") return <span className="badge badge-running">running</span>;
	if (status === "failed" || success === false) return <span className="badge badge-error">failed</span>;
	return <span className="badge badge-success">done</span>;
}

/* ------------------------------ mcpToolCall ------------------------------ */

interface McpProps {
	server: string;
	tool: string;
	status?: string;
	arguments?: unknown;
	result?: unknown;
	error?: unknown;
	durationMs?: number | null;
}

function McpToolCallItemImpl({ server, tool, status, arguments: args, result, error, durationMs }: McpProps): ReactNode {
	const hasError = error != null;
	return (
		<div className="item item-tool">
			<Disclosure
				defaultOpen={false}
				summary={
					<span className="tool-summary">
						<IconWrench size={14} />
						<span className="tool-name">
							<span className="muted">{server}</span>
							<span className="tool-sep">/</span>
							{tool}
						</span>
						{typeof durationMs === "number" ? <span className="muted small">{formatDuration(durationMs)}</span> : null}
						<StatusBadge status={hasError ? "failed" : status} />
					</span>
				}
			>
				<div className="tool-body">
					<div className="tool-section">
						<div className="tool-section-title">Arguments</div>
						<pre className="code-block small">{safeStringify(args)}</pre>
					</div>
					{result != null ? (
						<div className="tool-section">
							<div className="tool-section-title">Result</div>
							<pre className="code-block small">{safeStringify(result)}</pre>
						</div>
					) : null}
					{hasError ? (
						<div className="tool-section">
							<div className="tool-section-title error-text">Error</div>
							<pre className="code-block small">{safeStringify(error)}</pre>
						</div>
					) : null}
				</div>
			</Disclosure>
		</div>
	);
}
export const McpToolCallItem = memo(McpToolCallItemImpl);

/* ---------------------------- dynamicToolCall ---------------------------- */

interface DynamicProps {
	namespace?: string | null;
	tool: string;
	arguments?: unknown;
	status?: string;
	contentItems?: unknown;
	success?: boolean | null;
	durationMs?: number | null;
}

function DynamicToolCallItemImpl({
	namespace,
	tool,
	arguments: args,
	status,
	contentItems,
	success,
	durationMs,
}: DynamicProps): ReactNode {
	const items = Array.isArray(contentItems) ? contentItems : [];
	return (
		<div className="item item-tool">
			<Disclosure
				defaultOpen={false}
				summary={
					<span className="tool-summary">
						<IconTerminal size={14} />
						<span className="tool-name">
							{namespace ? <span className="muted">{namespace}/</span> : null}
							{tool}
						</span>
						{typeof durationMs === "number" ? <span className="muted small">{formatDuration(durationMs)}</span> : null}
						<StatusBadge status={status} success={success} />
					</span>
				}
			>
				<div className="tool-body">
					<div className="tool-section">
						<div className="tool-section-title">Arguments</div>
						<pre className="code-block small">{safeStringify(args)}</pre>
					</div>
					{items.length > 0 ? (
						<div className="tool-section">
							<div className="tool-section-title">Output</div>
							<pre className="code-block small">{safeStringify(items)}</pre>
						</div>
					) : null}
				</div>
			</Disclosure>
		</div>
	);
}
export const DynamicToolCallItem = memo(DynamicToolCallItemImpl);

/* --------------------------- functionCallOutput -------------------------- */

function FunctionCallOutputItemImpl({ name, namespace, output }: { name: string; namespace?: string | null; output: unknown }): ReactNode {
	const text = typeof output === "string" ? output : safeStringify(output);
	return (
		<div className="item item-tool item-function-output">
			<div className="item-head">
				<span className="item-icon">
					<IconTerminal size={14} />
				</span>
				<span className="item-title">
					{namespace ? <span className="muted">{namespace}/</span> : null}
					{name}
				</span>
				<span className="spacer" />
				<CopyButton text={text} label="Copy output" />
			</div>
			<pre className="code-block small max-h">{text}</pre>
		</div>
	);
}
export const FunctionCallOutputItem = memo(FunctionCallOutputItemImpl);

/* -------------------------------- webSearch ------------------------------- */

interface WebSearchProps {
	query: string;
	action?: unknown;
	results?: unknown;
}

function WebSearchItemImpl({ query, action, results }: WebSearchProps): ReactNode {
	const actionType = action && typeof action === "object" ? (action as { type?: string }).type : undefined;
	const resultList = Array.isArray(results) ? results : [];
	return (
		<div className="item item-websearch">
			<Disclosure
				defaultOpen={false}
				summary={
					<span className="tool-summary">
						<IconGlobe size={14} />
						<span className="tool-name">
							<IconSearch size={12} /> {query || "web search"}
						</span>
						{actionType ? <span className="chip tiny">{actionType}</span> : null}
						{resultList.length > 0 ? <span className="muted small">{resultList.length} results</span> : null}
					</span>
				}
			>
				<div className="tool-body">
					{actionType === "openPage" && action && typeof (action as { url?: string }).url === "string" ? (
						<div className="tool-section">
							<a href={(action as { url: string }).url} target="_blank" rel="noreferrer noopener">
								{(action as { url: string }).url}
							</a>
						</div>
					) : null}
					{resultList.length > 0 ? (
						<div className="tool-section">
							<div className="tool-section-title">Results</div>
							<pre className="code-block small">{safeStringify(results)}</pre>
						</div>
					) : (
						<JsonCard icon={<IconGlobe size={14} />} title="Search details" data={{ query, action }} />
					)}
				</div>
			</Disclosure>
		</div>
	);
}
export const WebSearchItem = memo(WebSearchItemImpl);
