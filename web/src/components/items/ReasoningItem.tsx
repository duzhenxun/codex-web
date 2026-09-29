import { memo, type ReactNode } from "react";
import { Disclosure } from "../Disclosure";
import { IconBrain } from "../Icons";
import { CopyButton } from "../CopyButton";

interface Props {
	summary?: string[] | null;
	content?: string[] | null;
	streaming?: boolean;
}

function ReasoningItemImpl({ summary, content, streaming }: Props): ReactNode {
	const summaryParts = (Array.isArray(summary) ? summary : []).filter((s) => s && s.length > 0);
	const contentParts = (Array.isArray(content) ? content : []).filter((s) => s && s.length > 0);
	const text = [...summaryParts, ...contentParts].join("\n\n");
	const preview = summaryParts[0] ?? contentParts[0] ?? "Reasoning";

	return (
		<div className="item item-reasoning">
			<Disclosure
				defaultOpen={false}
				summary={
					<span className="reasoning-summary">
						<IconBrain size={13} />
						<span className="reasoning-label">{streaming ? "Thinking…" : "Reasoning"}</span>
						{!streaming && preview ? <span className="reasoning-preview">{preview.slice(0, 120)}</span> : null}
					</span>
				}
				actions={text ? <CopyButton text={text} label="Copy reasoning" /> : undefined}
			>
				<div className="reasoning-content">
					{summaryParts.length > 0 ? (
						<div className="reasoning-block">
							{summaryParts.map((s, i) => (
								<p key={`s${i}`}>{s}</p>
							))}
						</div>
					) : null}
					{contentParts.length > 0 ? (
						<div className="reasoning-block reasoning-raw">
							{contentParts.map((s, i) => (
								<p key={`c${i}`}>{s}</p>
							))}
						</div>
					) : null}
					{text.length === 0 ? <p className="muted">(empty reasoning)</p> : null}
				</div>
			</Disclosure>
		</div>
	);
}

export const ReasoningItem = memo(ReasoningItemImpl);
