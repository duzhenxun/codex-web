import { memo, type ReactNode } from "react";
import { Markdown } from "../Markdown";
import { CopyButton } from "../CopyButton";
import { Disclosure } from "../Disclosure";
import {
	IconAlert,
	IconBrain,
	IconCheckCircle,
	IconCircle,
	IconClock,
	IconImage,
	IconLayers,
	IconList,
	IconSparkles,
	IconUser,
	IconWrench,
} from "../Icons";
import { JsonCard, safeStringify } from "./JsonCard";
import { formatDuration } from "../../lib/format";
import { useCodex } from "../../lib/useCodex";

/* --------------------------------- plan ---------------------------------- */

interface PlanStep {
	step: string;
	status: string;
}

export const PlanCard = memo(function PlanCard({
	plan,
	explanation,
	title = "Plan",
}: {
	plan: PlanStep[];
	explanation?: string | null;
	title?: string;
}): ReactNode {
	const steps = Array.isArray(plan) ? plan : [];
	if (steps.length === 0 && !explanation) return null;
	return (
		<div className="item item-plan">
			<div className="item-head">
				<span className="item-icon">
					<IconList size={15} />
				</span>
				<span className="item-title">{title}</span>
			</div>
			{explanation ? <div className="plan-explanation muted">{explanation}</div> : null}
			<ol className="plan-steps">
				{steps.map((s, i) => (
					<li className={`plan-step status-${s.status ?? "pending"}`} key={i}>
						<span className="plan-step-icon">
							{s.status === "completed" ? (
								<IconCheckCircle size={14} />
							) : s.status === "inProgress" ? (
								<IconClock size={14} />
							) : (
								<IconCircle size={14} />
							)}
						</span>
						<span className="plan-step-text">{s.step || "(step)"}</span>
					</li>
				))}
			</ol>
		</div>
	);
});

function PlanItemImpl({ text }: { text: string }): ReactNode {
	if (!text) return null;
	return (
		<div className="item item-plan">
			<div className="item-head">
				<span className="item-icon">
					<IconList size={15} />
				</span>
				<span className="item-title">Plan</span>
				<span className="spacer" />
				<CopyButton text={text} label="Copy plan" />
			</div>
			<Markdown>{text}</Markdown>
		</div>
	);
}
export const PlanItem = memo(PlanItemImpl);

/* ---------------------------- context compaction -------------------------- */

export const ContextCompactionItem = memo(function ContextCompactionItem(): ReactNode {
	return (
		<div className="item item-compaction">
			<div className="compaction-line">
				<IconLayers size={13} />
				<span>Context compacted</span>
			</div>
		</div>
	);
});

/* -------------------------------- imageView ------------------------------- */

export const ImageViewItem = memo(function ImageViewItem({ path }: { path: string }): ReactNode {
	const { openFilePreview } = useCodex();
	return (
		<button type="button" className="item item-imageview" onClick={() => path && openFilePreview(path)}>
			<IconImage size={15} />
			<span>Viewed image</span>
			<code className="path-chip">{path || "(unknown path)"}</code>
		</button>
	);
});

/* ----------------------------- imageGeneration ---------------------------- */

export const ImageGenerationItem = memo(function ImageGenerationItem({
	item,
}: {
	item: { revisedPrompt?: string | null; result?: string; savedPath?: string | null; status?: string; failure?: unknown };
}): ReactNode {
	const { openFilePreview } = useCodex();
	const result = item.result ?? "";
	const isImage = result.startsWith("data:image") || /^https?:/.test(result);
	return (
		<div className="item item-imagegen">
			<div className="item-head">
				<span className="item-icon">
					<IconImage size={15} />
				</span>
				<span className="item-title">Image generation</span>
				<span className="spacer" />
				{item.savedPath ? (
					<button type="button" className="btn ghost small" onClick={() => item.savedPath && openFilePreview(item.savedPath)}>
						Open file
					</button>
				) : null}
			</div>
			{item.revisedPrompt ? <div className="muted small">{item.revisedPrompt}</div> : null}
			{isImage ? <img className="generated-image" src={result} alt={item.revisedPrompt ?? "generated image"} loading="lazy" /> : null}
			{item.failure ? <div className="error-text small">{safeStringify(item.failure)}</div> : null}
		</div>
	);
});

/* ----------------------------- subAgentActivity --------------------------- */

export const SubAgentActivityItem = memo(function SubAgentActivityItem({
	kind,
	agentThreadId,
	agentPath,
}: {
	kind?: string;
	agentThreadId?: string;
	agentPath?: string;
}): ReactNode {
	return (
		<div className="item item-subagent">
			<IconUser size={14} />
			<span>
				Sub-agent <strong>{kind || "activity"}</strong>
			</span>
			{agentPath ? <code className="path-chip">{agentPath}</code> : null}
			{agentThreadId ? <span className="muted small">#{agentThreadId.slice(0, 8)}</span> : null}
		</div>
	);
});

/* ------------------------------ review mode ------------------------------- */

function ReviewItem({ entered, review }: { entered: boolean; review: string }): ReactNode {
	return (
		<div className={`item item-review ${entered ? "entered" : "exited"}`}>
			<div className="review-line">
				<IconAlert size={14} />
				<span>{entered ? "Entered review mode" : "Exited review mode"}</span>
			</div>
			{review ? <Markdown>{review}</Markdown> : null}
		</div>
	);
}

/* ---------------------------- generic fallbacks --------------------------- */

export const SleepItem = memo(function SleepItem({ durationMs }: { durationMs?: number }): ReactNode {
	return (
		<div className="item item-sleep">
			<IconClock size={13} />
			<span className="muted small">Slept {formatDuration(durationMs)}</span>
		</div>
	);
});

export const HookPromptItem = memo(function HookPromptItem({ fragments }: { fragments: unknown }): ReactNode {
	return <JsonCard icon={<IconWrench size={14} />} title="Hook prompt" data={fragments} />;
});

export const CollabAgentToolCallItem = memo(function CollabAgentToolCallItem({
	item,
}: {
	item: Record<string, unknown>;
}): ReactNode {
	const tool = typeof item.tool === "string" ? item.tool : "collab call";
	const status = typeof item.status === "string" ? item.status : undefined;
	return (
		<div className="item item-collab">
			<Disclosure
				defaultOpen={false}
				summary={
					<span className="tool-summary">
						<IconBrain size={14} />
						<span className="tool-name">{tool}</span>
						{status ? <span className="chip tiny">{status}</span> : null}
					</span>
				}
			>
				<pre className="code-block small">{safeStringify(item)}</pre>
			</Disclosure>
		</div>
	);
});

export const SparkleItem = memo(function SparkleItem({ title, data }: { title: string; data: unknown }): ReactNode {
	return <JsonCard icon={<IconSparkles size={14} />} title={title} data={data} />;
});

export { ReviewItem };
