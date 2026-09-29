import type { ReactNode } from "react";
import { useCodex } from "../lib/useCodex";
import { formatTokens } from "../lib/format";

export function TokenMeter(): ReactNode {
	const { tokenUsage } = useCodex();
	if (!tokenUsage) return null;
	const window = typeof tokenUsage.modelContextWindow === "number" ? tokenUsage.modelContextWindow : null;
	const used = tokenUsage.last?.totalTokens ?? 0;
	const total = tokenUsage.total?.totalTokens ?? 0;
	const pct = window && window > 0 ? Math.min(1, used / window) : 0;
	const hasWindow = typeof window === "number" && window > 0;
	const title = [
		`Context: ${formatTokens(used)}${hasWindow ? ` / ${formatTokens(window!)}` : ""}`,
		`Thread total: ${formatTokens(total)}`,
		`Input: ${formatTokens(tokenUsage.total?.inputTokens ?? 0)}  Output: ${formatTokens(tokenUsage.total?.outputTokens ?? 0)}`,
		`Reasoning: ${formatTokens(tokenUsage.total?.reasoningOutputTokens ?? 0)}`,
	].join("\n");

	return (
		<div className={`token-meter${pct > 0.85 ? " hot" : pct > 0.6 ? " warm" : ""}`} title={title}>
			<div className="token-bar" aria-hidden>
				<div className="token-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
			</div>
			<span className="token-label">
				{formatTokens(used)}
				{hasWindow ? `/${formatTokens(window!)}` : ""}
			</span>
		</div>
	);
}
