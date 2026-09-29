import { memo, type ReactNode } from "react";
import type { AsyncUserInputQuestion } from "@shared/codex-ts/v2";
import { Markdown } from "../Markdown";
import { CopyButton } from "../CopyButton";
import { IconInfo, IconSparkles } from "../Icons";

function Questions({ questions }: { questions: AsyncUserInputQuestion[] }): ReactNode {
	return (
		<div className="agent-questions">
			{questions.map((q, i) => (
				<div className="agent-question" key={i}>
					<div className="agent-question-title">
						<IconInfo size={13} /> {q?.title ?? "Question"}
					</div>
					{Array.isArray(q?.options) && q.options.length > 0 ? (
						<div className="agent-question-options">
							{q.options.map((o, oi) => (
								<span className="chip" key={oi}>
									{o}
								</span>
							))}
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}

interface Props {
	text: string;
	phase?: string | null;
	questions?: AsyncUserInputQuestion[] | null;
	streaming?: boolean;
}

function AgentMessageItemImpl({ text, phase, questions, streaming }: Props): ReactNode {
	const body = text ?? "";
	return (
		<div className="item item-agent">
			<div className="agent-avatar" aria-hidden>
				<IconSparkles size={15} />
			</div>
			<div className="agent-body">
				<div className="agent-toolbar">
					{phase === "commentary" ? <span className="phase-badge">commentary</span> : null}
					<span className="spacer" />
					<CopyButton text={body} label="Copy message" />
				</div>
				{body.length > 0 ? (
					<div className={streaming ? "streaming" : ""}>
						<Markdown>{body}</Markdown>
					</div>
				) : streaming ? (
					<div className="muted typing">
						<span className="dot" />
						<span className="dot" />
						<span className="dot" />
					</div>
				) : null}
				{Array.isArray(questions) && questions.length > 0 ? <Questions questions={questions} /> : null}
			</div>
		</div>
	);
}

export const AgentMessageItem = memo(AgentMessageItemImpl);
