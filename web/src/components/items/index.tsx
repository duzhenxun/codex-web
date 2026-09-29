import { memo, type ReactNode } from "react";
import type { ThreadItem } from "@shared/codex-ts/v2";
import { ErrorBoundary } from "../ErrorBoundary";
import { IconAlert, IconLayers } from "../Icons";
import { UserMessageItem } from "./UserMessageItem";
import { AgentMessageItem } from "./AgentMessageItem";
import { ReasoningItem } from "./ReasoningItem";
import { CommandExecutionItem } from "./CommandExecutionItem";
import { FileChangeItem } from "./FileChangeItem";
import {
	DynamicToolCallItem,
	FunctionCallOutputItem,
	McpToolCallItem,
	WebSearchItem,
} from "./ToolItems";
import {
	CollabAgentToolCallItem,
	ContextCompactionItem,
	HookPromptItem,
	ImageGenerationItem,
	ImageViewItem,
	PlanItem,
	ReviewItem,
	SleepItem,
	SubAgentActivityItem,
} from "./MiscItems";
import { JsonCard } from "./JsonCard";

function ItemBody({ item, streaming }: { item: ThreadItem; streaming?: boolean }): ReactNode {
	switch (item.type) {
		case "userMessage":
			return <UserMessageItem content={item.content} />;
		case "agentMessage":
			return (
				<AgentMessageItem
					text={item.text}
					phase={item.phase}
					questions={item.questions}
					streaming={streaming}
				/>
			);
		case "reasoning":
			return <ReasoningItem summary={item.summary} content={item.content} streaming={streaming} />;
		case "commandExecution":
			return (
				<CommandExecutionItem
					command={item.command}
					cwd={item.cwd}
					status={item.status}
					exitCode={item.exitCode}
					aggregatedOutput={item.aggregatedOutput}
					commandActions={item.commandActions}
					streaming={streaming}
				/>
			);
		case "fileChange":
			return <FileChangeItem changes={item.changes} status={item.status} />;
		case "mcpToolCall":
			return (
				<McpToolCallItem
					server={item.server}
					tool={item.tool}
					status={item.status}
					arguments={item.arguments}
					result={item.result}
					error={item.error}
					durationMs={item.durationMs}
				/>
			);
		case "dynamicToolCall":
			return (
				<DynamicToolCallItem
					namespace={item.namespace}
					tool={item.tool}
					arguments={item.arguments}
					status={item.status}
					contentItems={item.contentItems}
					success={item.success}
					durationMs={item.durationMs}
				/>
			);
		case "functionCallOutput":
			return <FunctionCallOutputItem name={item.name} namespace={item.namespace} output={item.output} />;
		case "webSearch":
			return <WebSearchItem query={item.query} action={item.action} results={item.results} />;
		case "plan":
			return <PlanItem text={item.text} />;
		case "contextCompaction":
			return <ContextCompactionItem />;
		case "imageView":
			return <ImageViewItem path={item.path} />;
		case "imageGeneration":
			return (
				<ImageGenerationItem
					item={{
						revisedPrompt: item.revisedPrompt,
						result: item.result,
						savedPath: item.savedPath ?? null,
						status: item.status,
						failure: item.failure,
					}}
				/>
			);
		case "subAgentActivity":
			return <SubAgentActivityItem kind={item.kind} agentThreadId={item.agentThreadId} agentPath={item.agentPath} />;
		case "enteredReviewMode":
			return <ReviewItem entered review={item.review} />;
		case "exitedReviewMode":
			return <ReviewItem entered={false} review={item.review} />;
		case "sleep":
			return <SleepItem durationMs={item.durationMs} />;
		case "hookPrompt":
			return <HookPromptItem fragments={item.fragments} />;
		case "collabAgentToolCall":
			return <CollabAgentToolCallItem item={item as unknown as Record<string, unknown>} />;
		default: {
			// Unknown/forward-compatible item type: never crash, show the payload.
			const unknownItem = item as unknown as Record<string, unknown>;
			return (
				<JsonCard
					icon={<IconAlert size={14} />}
					title={`Unknown item${typeof unknownItem.type === "string" ? `: ${unknownItem.type}` : ""}`}
					data={unknownItem}
					badge={
						<span className="badge badge-warn">
							<IconLayers size={11} /> raw
						</span>
					}
				/>
			);
		}
	}
}

interface Props {
	item: ThreadItem;
	streaming?: boolean;
}

function ThreadItemViewImpl({ item, streaming }: Props): ReactNode {
	const label = (item as { type?: string })?.type ?? "unknown";
	return (
		<ErrorBoundary label={label}>
			<ItemBody item={item} streaming={streaming} />
		</ErrorBoundary>
	);
}

export const ThreadItemView = memo(ThreadItemViewImpl, (a, b) => a.item === b.item && a.streaming === b.streaming);
