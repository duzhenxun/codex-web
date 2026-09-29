import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { RequestLogDetail, RequestLogSummary } from "@shared/protocol";
import { useCodex } from "../lib/useCodex";
import { IconRefresh, IconX } from "./Icons";

type DetailTab = "read" | "request" | "response" | "raw";

interface Props {
	threadId: string;
	onClose: () => void;
}

function shortId(value: string): string {
	return value.length > 18 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
}

function formatBytes(value: number): string {
	if (!Number.isFinite(value)) return "—";
	if (value < 1024) return `${value} B`;
	if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
	return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(value: number | null): string {
	if (value == null) return "进行中";
	if (value < 1000) return `${value} ms`;
	return `${(value / 1000).toFixed(1)} s`;
}

function formatTime(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
}

function statusLabel(row: RequestLogSummary): string {
	if (row.status == null) return "进行中";
	return row.status >= 200 && row.status < 300 ? "成功" : `HTTP ${row.status}`;
}

function statusClass(row: RequestLogSummary): string {
	if (row.status == null) return "live";
	return row.status >= 200 && row.status < 300 ? "ok" : "bad";
}

function pretty(value: string): string {
	try {
		return JSON.stringify(JSON.parse(value), null, 2);
	} catch {
		return value || "（无内容）";
	}
}

function prettyResponse(value: string): string {
	const events: unknown[] = [];
	for (const block of value.split(/\n\s*\n/)) {
		const line = block.split(/\r?\n/).find((entry) => entry.startsWith("data:"));
		const data = line?.slice(5).trim();
		if (!data || data === "[DONE]") continue;
		try {
			events.push(JSON.parse(data));
		} catch {
			/* keep incomplete/raw SSE visible in the raw tab */
		}
	}
	return events.length > 0 ? JSON.stringify(events, null, 2) : pretty(value);
}

function DetailSection({ title, children }: { title: string; children: ReactNode }): ReactNode {
	return (
		<section className="session-log-section">
			<h3>{title}</h3>
			<div className="session-log-box">{children}</div>
		</section>
	);
}

function SummaryCard({ rows, open, onToggle, onSelect, selectedId }: { rows: RequestLogSummary[]; open: boolean; onToggle: () => void; onSelect: (id: string) => void; selectedId: string | null }): ReactNode {
	const newest = rows[0];
	const question = [...rows].reverse().find((row) => row.question)?.question || "（未解析到用户问题）";
	const answer = rows.find((row) => row.answer)?.answer || "";
	const running = rows.some((row) => row.status == null);
	const failed = rows.some((row) => row.status != null && (row.status < 200 || row.status >= 300));
	const tokens = rows.reduce(
		(total, row) => ({ input: total.input + row.tokens.input, output: total.output + row.tokens.output }),
		{ input: 0, output: 0 },
	);

	return (
		<div className={`session-log-group${open ? " open" : ""}`}>
			<button className="session-log-group-head" onClick={onToggle}>
				<span className="session-log-caret">{open ? "▾" : "▸"}</span>
				<span className="session-log-group-main">
					<strong>{question}</strong>
					<span>{answer || (newest.tools.length > 0 ? `工具：${newest.tools.join(" / ")}` : "等待模型输出…")}</span>
				</span>
				<span className="session-log-group-stats">
					<span>{rows.length} 次请求</span>
					<span>{tokens.input.toLocaleString()} in · {tokens.output.toLocaleString()} out</span>
					<span className={`log-status ${running ? "live" : failed ? "bad" : "ok"}`}>{running ? "进行中" : failed ? "有失败" : "成功"}</span>
				</span>
			</button>
			{open ? (
				<div className="session-log-group-rows">
					{rows.map((row, index) => (
						<button className={`session-log-row${row.id === selectedId ? " selected" : ""}`} key={row.id} onClick={() => onSelect(row.id)}>
							<span className="session-log-row-index">#{rows.length - index}</span>
							<span>{formatTime(row.startedAt)}</span>
							<span className={`log-status ${statusClass(row)}`}>{statusLabel(row)}</span>
							<span className="session-log-row-model">{row.model || "Codex"}</span>
							<span>{formatDuration(row.durationMs)} · {formatBytes(row.responseBytes)}</span>
							<span className="session-log-row-preview">{row.answer || (row.tools.length ? `→ ${row.tools.join(", ")}` : "")}</span>
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}

export function SessionLogs({ threadId, onClose }: Props): ReactNode {
	const { fetchRequestLogs, fetchRequestLog } = useCodex();
	const [rows, setRows] = useState<RequestLogSummary[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [detail, setDetail] = useState<RequestLogDetail | null>(null);
	const [tab, setTab] = useState<DetailTab>("read");
	const [openTurns, setOpenTurns] = useState<Record<string, boolean>>({});
	const [loading, setLoading] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		const next = await fetchRequestLogs(threadId);
		setRows(next);
		setLoading(false);
		setSelectedId((current) => current && next.some((row) => row.id === current) ? current : next[0]?.id ?? null);
	}, [fetchRequestLogs, threadId]);

	useEffect(() => {
		setRows([]);
		setDetail(null);
		setSelectedId(null);
		setOpenTurns({});
		void load();
		const timer = window.setInterval(() => void load(), 1500);
		return () => window.clearInterval(timer);
	}, [load]);

	useEffect(() => {
		if (!selectedId) {
			setDetail(null);
			return;
		}
		const loadDetail = () => void fetchRequestLog(selectedId).then(setDetail);
		loadDetail();
		const timer = window.setInterval(loadDetail, 1500);
		return () => window.clearInterval(timer);
	}, [fetchRequestLog, selectedId]);

	const groups = useMemo(() => {
		const grouped = new Map<string, RequestLogSummary[]>();
		for (const row of rows) {
			const key = row.turnId || row.id;
			const group = grouped.get(key) ?? [];
			group.push(row);
			grouped.set(key, group);
		}
		return [...grouped.entries()];
	}, [rows]);

	const selectedRow = rows.find((row) => row.id === selectedId) ?? null;
	const setGroupOpen = (key: string) => setOpenTurns((current) => ({ ...current, [key]: !current[key] }));

	return (
		<div className="drawer-backdrop" onClick={onClose}>
			<div className="session-log-drawer" role="dialog" aria-label="Session logs" onClick={(event) => event.stopPropagation()}>
				<div className="drawer-head session-log-head">
					<div>
						<strong>会话实时日志</strong>
						<span className="muted small mono"> · {shortId(threadId)}</span>
					</div>
					<span className="spacer" />
					<button className="btn ghost small" onClick={() => void load()} disabled={loading}>
						<IconRefresh size={13} /> {loading ? "刷新中…" : "刷新"}
					</button>
					<button className="icon-btn" aria-label="Close session logs" onClick={onClose}><IconX size={16} /></button>
				</div>
				<div className="session-log-layout">
					<section className="session-log-list">
						<div className="session-log-list-title">请求记录 <span className="muted">{rows.length}</span></div>
						{groups.length === 0 ? (
							<div className="session-log-empty">暂无记录。由本项目托管启动的 Codex 会自动记录后续请求；正在运行的外部 app-server 不会被代理捕获。</div>
						) : groups.map(([key, group]) => (
							<div key={key}>
								<SummaryCard rows={group} open={openTurns[key] !== false} onToggle={() => setGroupOpen(key)} onSelect={setSelectedId} selectedId={selectedId} />
							</div>
						))}
					</section>
					<section className="session-log-detail">
						{detail && selectedRow ? (
							<>
								<div className="session-log-detail-head">
									<strong>{selectedRow.model || "Codex"}</strong>
									<span className={`log-status ${statusClass(selectedRow)}`}>{statusLabel(selectedRow)}</span>
									<span className="muted small">{formatDuration(selectedRow.durationMs)} · {formatBytes(selectedRow.responseBytes)}</span>
								</div>
								<div className="session-log-tabs">
									{(["read", "request", "response", "raw"] as DetailTab[]).map((value) => (
										<button key={value} className={`btn ghost small${tab === value ? " active" : ""}`} onClick={() => setTab(value)}>
											{value === "read" ? "可读内容" : value === "request" ? "请求 JSON" : value === "response" ? "响应 JSON" : "原始 SSE"}
										</button>
									))}
								</div>
								<div className="session-log-detail-body">
									{tab === "read" ? (
										<>
											<DetailSection title="请求文字"><div className="session-log-text">{detail.question || "（未解析到用户问题）"}</div></DetailSection>
											{detail.reasoning ? <DetailSection title="思考摘要"><div className="session-log-text">{detail.reasoning}</div></DetailSection> : null}
											<DetailSection title="模型回复"><div className="session-log-text">{detail.answer || "（本轮没有文本输出，可能只是工具调用）"}</div></DetailSection>
											{detail.tools.length ? <DetailSection title="工具调用"><div className="session-log-text mono">{detail.tools.join("\n")}</div></DetailSection> : null}
											<DetailSection title="用量"><div className="session-log-text">输入 {detail.tokens.input.toLocaleString()} tokens（缓存 {detail.tokens.cached.toLocaleString()}）\n输出 {detail.tokens.output.toLocaleString()} tokens（推理 {detail.tokens.reasoning.toLocaleString()}）</div></DetailSection>
											{detail.error ? <DetailSection title="错误"><div className="session-log-text error-text">{detail.error}</div></DetailSection> : null}
										</>
									) : tab === "request" ? (
										<><pre className="session-log-code">{pretty(detail.requestBody)}</pre><DetailSection title="请求头"><pre className="session-log-code compact">{pretty(JSON.stringify(detail.requestHeaders))}</pre></DetailSection></>
									) : tab === "response" ? (
										<><pre className="session-log-code">{prettyResponse(detail.responseBody)}</pre><DetailSection title="响应头"><pre className="session-log-code compact">{pretty(JSON.stringify(detail.responseHeaders))}</pre></DetailSection></>
									) : <pre className="session-log-code">{detail.responseBody || "（无内容）"}</pre>}
								</div>
							</>
						) : <div className="session-log-empty">选择一条请求查看详情。</div>}
					</section>
				</div>
			</div>
		</div>
	);
}
