// Narrow, defensive view of the generated codex bindings.
//
// We re-export the frozen generated types (never re-declare them) and layer
// small structural helpers on top: the app-server protocol is experimental, so
// every field we touch is treated as potentially missing / mistyped.

import type { RequestId } from "@shared/protocol";

export type {
	Thread,
	Turn,
	ThreadItem,
	ThreadStatus,
	ThreadTokenUsage,
	TokenUsageBreakdown,
	TurnStatus,
	TurnPlanStep,
	TurnPlanStepStatus,
	FileUpdateChange,
	PatchChangeKind,
	PatchApplyStatus,
	CommandAction,
	CommandExecutionStatus,
	UserInput,
	Model,
	AsyncUserInputQuestion,
	McpToolCallStatus,
	DynamicToolCallStatus,
} from "@shared/codex-ts/v2";

export type { ServerInfo, CodexStatus, RequestId, FsEntry, CwPaths } from "@shared/protocol";

/** A `serverRequest` we are holding open until the user answers it. */
export interface PendingRequest {
	id: RequestId;
	method: string;
	params: unknown;
	receivedAt: number;
}

/** Inline transcript error (rendered in-place rather than as a toast). */
export interface TranscriptError {
	id: string;
	threadId: string | null;
	turnId: string | null;
	message: string;
	willRetry: boolean;
	at: number;
}

/** A turn's aggregated diff, kept outside the Turn shape (codex doesn't carry it). */
export interface TurnPlanState {
	explanation: string | null;
	plan: Array<{ step: string; status: string }>;
}

export interface Toast {
	id: string;
	kind: "info" | "error" | "success";
	message: string;
}

export interface ApprovalDecisionResult {
	decision: "accept" | "acceptForSession" | "decline" | "cancel";
}

/* ------------------------------------------------------------------ */
/* narrowing helpers                                                   */
/* ------------------------------------------------------------------ */

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

export function asNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function asArray<T = unknown>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

/** Read `record[field]` as a string, or undefined. */
export function str(record: Record<string, unknown> | null | undefined, field: string): string | undefined {
	if (!record) return undefined;
	return asString(record[field]);
}

/** Read `record[field]` as a number, or undefined. */
export function num(record: Record<string, unknown> | null | undefined, field: string): number | undefined {
	if (!record) return undefined;
	return asNumber(record[field]);
}

/** Best-effort human message from an unknown thrown value. */
export function errorMessage(value: unknown): string {
	if (value instanceof Error) return value.message;
	if (typeof value === "string") return value;
	if (isRecord(value)) {
		const m = asString(value.message);
		if (m) return m;
		const err = value.error;
		if (isRecord(err)) {
			const em = asString(err.message);
			if (em) return em;
		}
		try {
			return JSON.stringify(value);
		} catch {
			return "Unknown error";
		}
	}
	return String(value);
}

/**
 * Event params arrive as `unknown`. Extract the shared routing fields that most
 * notifications carry without asserting a full generated type.
 */
export interface RoutedParams {
	threadId: string | null;
	turnId: string | null;
	itemId: string | null;
	raw: Record<string, unknown>;
}

export function routeParams(params: unknown): RoutedParams {
	const raw = isRecord(params) ? params : {};
	return {
		threadId: asString(raw.threadId) ?? null,
		turnId: asString(raw.turnId) ?? null,
		itemId: asString(raw.itemId) ?? null,
		raw,
	};
}

/**
 * True for the server's "codex app-server isn't up (yet)" errors.
 *
 * These are transient by nature — the app-server may still be booting, or the
 * supervisor may be restarting it — so callers should retry/ignore them instead
 * of surfacing a toast the user can do nothing about.
 */
export function isTransientConnectionError(value: unknown): boolean {
	const code =
		typeof value === "object" && value !== null ? (value as { code?: unknown }).code : undefined;
	return code === -32001 || code === -32002;
}
