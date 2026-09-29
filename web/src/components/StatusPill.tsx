import type { ReactNode } from "react";
import type { CodexStatus } from "@shared/protocol";
import type { ConnectionState } from "../lib/ws";
import { relativeTime } from "../lib/format";
import { useCodex } from "../lib/useCodex";

const PHASE_LABEL: Record<string, string> = {
	starting: "starting",
	ready: "ready",
	stopped: "stopped",
	error: "error",
};

function phaseClass(status: CodexStatus | null, connection: ConnectionState): string {
	if (connection !== "open") return "pill-offline";
	if (!status) return "pill-unknown";
	switch (status.phase) {
		case "ready":
			return status.connected ? "pill-ready" : "pill-warn";
		case "starting":
			return "pill-warn";
		case "error":
			return "pill-error";
		case "stopped":
			return "pill-offline";
		default:
			return "pill-unknown";
	}
}

export function StatusPill(): ReactNode {
	const { status, connection, info } = useCodex();
	const cls = phaseClass(status, connection);
	const label = connection !== "open" ? "disconnected" : status ? PHASE_LABEL[status.phase] ?? status.phase : "unknown";
	const title = [
		`Connection: ${connection}`,
		status ? `Phase: ${status.phase}${status.connected ? " (connected)" : ""}` : null,
		status?.url ? `URL: ${status.url}` : null,
		typeof status?.pid === "number" ? `PID: ${status.pid}` : null,
		status ? `Restarts: ${status.restarts}` : null,
		status?.since ? `Since: ${relativeTime(status.since)}` : null,
		status?.error ? `Error: ${status.error}` : null,
		info?.codexVersion ? `Codex: ${info.codexVersion}` : null,
	]
		.filter(Boolean)
		.join("\n");

	return (
		<span className={`status-pill ${cls}`} title={title}>
			<span className="status-dot" />
			<span className="status-label">{label}</span>
		</span>
	);
}

