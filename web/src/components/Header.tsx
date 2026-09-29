import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCodex } from "../lib/useCodex";
import type { ApprovalPolicy, ApprovalsReviewer, SandboxMode } from "../lib/useCodex";
import { THEMES, type Theme } from "../lib/theme";
import { StatusPill } from "./StatusPill";
import { TokenMeter } from "./TokenMeter";
import { IconMenu, IconPalette, IconPanelLeft, IconRefresh, IconSettings, IconTerminal } from "./Icons";

interface HeaderProps {
	onOpenSidebar: () => void;
	/**
	 * Whether the thread list is currently shown — a persistent collapse on
	 * desktop, the drawer on narrow viewports. Drives the button's icon + label,
	 * so it must reflect what the user actually sees in both modes.
	 */
	sidebarVisible: boolean;
	theme: Theme;
	onSetTheme: (theme: Theme) => void;
	onOpenSessionLogs: () => void;
}

const APPROVALS: Array<{ value: ApprovalPolicy; label: string }> = [
	{ value: "untrusted", label: "Untrusted" },
	{ value: "on-request", label: "On request" },
	{ value: "never", label: "Never" },
];

const SANDBOXES: Array<{ value: SandboxMode; label: string }> = [
	{ value: "read-only", label: "Read only" },
	{ value: "workspace-write", label: "Workspace write" },
	{ value: "danger-full-access", label: "Full access" },
];

// `null` = inherit codex's config.toml. Note that a config with
// `approvals_reviewer = "auto_review"` means a subagent approves/denies on its
// own and this UI never shows a dialog — pick "Ask me" to review everything here.
const REVIEWERS: Array<{ value: ApprovalsReviewer | ""; label: string }> = [
	{ value: "", label: "Inherit config" },
	{ value: "user", label: "Ask me" },
	{ value: "auto_review", label: "Auto review" },
	{ value: "guardian_subagent", label: "Guardian" },
];

function accountLabel(account: { account: unknown; requiresOpenaiAuth: boolean } | null): string {
	if (!account) return "Account unavailable";
	const a = account.account;
	if (a && typeof a === "object") {
		const type = (a as { type?: string }).type;
		if (type === "chatgpt") {
			const email = (a as { email?: string | null }).email;
			return email ? `ChatGPT · ${email}` : "ChatGPT";
		}
		if (type === "apiKey") return "API key";
		if (type === "amazonBedrock") return "Amazon Bedrock";
	}
	return account.requiresOpenaiAuth ? "Login required" : "Unknown account";
}

export function Header({ onOpenSidebar, sidebarVisible, theme, onSetTheme, onOpenSessionLogs }: HeaderProps): ReactNode {
	const {
		activeThread,
		settings,
		models,
		setModel,
		setEffort,
		setApprovalPolicy,
		setSandbox,
		setReviewer,
		setAutoApprove,
		restartCodex,
		fetchLogs,
		renameThread,
		account,
		info,
	} = useCodex();

	const [settingsOpen, setSettingsOpen] = useState(false);
	const [themeOpen, setThemeOpen] = useState(false);
	const [logsOpen, setLogsOpen] = useState(false);
	const [logs, setLogs] = useState<string[]>([]);
	const [logsLoading, setLogsLoading] = useState(false);
	const popRef = useRef<HTMLDivElement>(null);
	const themeRef = useRef<HTMLDivElement>(null);
	const titleInputRef = useRef<HTMLInputElement>(null);
	const [editingTitle, setEditingTitle] = useState(false);
	const [titleDraft, setTitleDraft] = useState("");

	// One shared click-outside/Escape handler for every header popover.
	useEffect(() => {
		if (!settingsOpen && !themeOpen) return;
		const onDown = (e: MouseEvent) => {
			if (settingsOpen && popRef.current && !popRef.current.contains(e.target as Node)) setSettingsOpen(false);
			if (themeOpen && themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setSettingsOpen(false);
				setThemeOpen(false);
			}
		};
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [settingsOpen, themeOpen]);

	const visibleModels = useMemo(() => models.filter((m) => !m.hidden), [models]);
	const selectedModel = useMemo(() => {
		const id = settings.model ?? activeThread?.model ?? visibleModels.find((m) => m.isDefault)?.id ?? visibleModels[0]?.id ?? null;
		return visibleModels.find((m) => m.id === id) ?? visibleModels[0] ?? null;
	}, [settings.model, activeThread?.model, visibleModels]);

	const efforts = useMemo(() => {
		const list = selectedModel?.supportedReasoningEfforts ?? [];
		return list.map((e) => ({ value: e.reasoningEffort, label: e.reasoningEffort, description: e.description }));
	}, [selectedModel]);

	const effort = settings.effort ?? activeThread?.reasoningEffort ?? selectedModel?.defaultReasoningEffort ?? "";

	const loadLogs = useCallback(async () => {
		setLogsLoading(true);
		const lines = await fetchLogs();
		setLogs(lines);
		setLogsLoading(false);
	}, [fetchLogs]);

	useEffect(() => {
		if (logsOpen) void loadLogs();
	}, [logsOpen, loadLogs]);

	const title = activeThread ? activeThread.name?.trim() || activeThread.id.slice(0, 12) : "New thread";

	// Click the header title to rename the thread (same `thread/setName` the
	// sidebar's Rename action uses). Enter/blur commits, Escape cancels.
	const startEditTitle = useCallback(() => {
		if (!activeThread) return;
		setTitleDraft(activeThread.name?.trim() || activeThread.id.slice(0, 12));
		setEditingTitle(true);
	}, [activeThread]);

	const commitTitle = useCallback(() => {
		const name = titleDraft.trim();
		if (activeThread && name && name !== (activeThread.name?.trim() || activeThread.id.slice(0, 12))) {
			void renameThread(activeThread.id, name);
		}
		setEditingTitle(false);
	}, [activeThread, titleDraft, renameThread]);

	useEffect(() => {
		if (editingTitle) requestAnimationFrame(() => titleInputRef.current?.select());
	}, [editingTitle]);

	// Switching threads abandons an in-progress rename.
	useEffect(() => {
		setEditingTitle(false);
	}, [activeThread?.id]);

	return (
		<header className="header">
			<div className="header-left">
				<button
					className="icon-btn"
					aria-label={sidebarVisible ? "Hide threads" : "Show threads"}
					title={`${sidebarVisible ? "Hide" : "Show"} sidebar (⌘B)`}
					onClick={onOpenSidebar}
				>
					{sidebarVisible ? <IconPanelLeft size={17} /> : <IconMenu size={17} />}
				</button>
				<div className="header-title" title={activeThread?.id}>
					{activeThread && editingTitle ? (
						<input
							ref={titleInputRef}
							className="header-title-input"
							value={titleDraft}
							onChange={(e) => setTitleDraft(e.target.value)}
							onBlur={commitTitle}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									e.currentTarget.blur();
								} else if (e.key === "Escape") {
									e.preventDefault();
									setEditingTitle(false);
								}
							}}
							aria-label="Thread name"
						/>
					) : activeThread ? (
						<button
							type="button"
							className="header-title-text header-title-btn"
							title="Click to rename"
							onClick={startEditTitle}
						>
							{title}
						</button>
					) : (
						<span className="header-title-text">{title}</span>
					)}
					{activeThread ? (
						<span className="header-cwd" title={activeThread.cwd}>
							{activeThread.cwd}
						</span>
					) : null}
				</div>
			</div>

			<div className="header-right">
				<TokenMeter />
				<label className="inline-select" title="Model">
					<select
						value={selectedModel?.id ?? ""}
						onChange={(e) => setModel(e.target.value || null)}
						aria-label="Model"
					>
						{visibleModels.length === 0 ? <option value="">default</option> : null}
						{visibleModels.map((m) => (
							<option value={m.id} key={m.id}>
								{m.displayName || m.id}
							</option>
						))}
					</select>
				</label>
				{efforts.length > 0 ? (
					<label className="inline-select" title="Reasoning effort">
						<select value={effort} onChange={(e) => setEffort(e.target.value || null)} aria-label="Reasoning effort">
							{efforts.map((e) => (
								<option value={e.value} key={e.value} title={e.description}>
									{e.label}
								</option>
							))}
						</select>
					</label>
				) : null}

				<StatusPill />

				{activeThread ? (
					<button className="btn ghost small session-logs-trigger" aria-label="Session logs" title="View session logs" onClick={onOpenSessionLogs}>
						<IconTerminal size={14} /> 日志
					</button>
				) : null}

				<div className="popover-wrap" ref={popRef}>
					<button
						className="icon-btn"
						aria-label="Settings and codex controls"
						aria-expanded={settingsOpen}
						onClick={() => setSettingsOpen((v) => !v)}
					>
						<IconSettings size={16} />
					</button>
					{settingsOpen ? (
						<div className="popover" role="dialog" aria-label="Settings">
							<div className="popover-section">
								<div className="popover-title">Working directory</div>
								<div className="path-static mono small" title={settings.cwd || info?.cwd || ""}>
									{settings.cwd || info?.cwd || "(unset)"}
								</div>
								<div className="hint">Switch projects from the picker at the top of the sidebar.</div>
							</div>

							<div className="popover-section">
								<div className="popover-title">Approval policy</div>
								<select
									value={settings.approvalPolicy}
									onChange={(e) => setApprovalPolicy(e.target.value as ApprovalPolicy)}
									aria-label="Approval policy"
								>
									{APPROVALS.map((a) => (
										<option value={a.value} key={a.value}>
											{a.label}
										</option>
									))}
								</select>
							</div>

							<div className="popover-section">
								<div className="popover-title">Sandbox</div>
								<select
									value={settings.sandbox}
									onChange={(e) => setSandbox(e.target.value as SandboxMode)}
									aria-label="Sandbox"
								>
									{SANDBOXES.map((s) => (
										<option value={s.value} key={s.value}>
											{s.label}
										</option>
									))}
								</select>
							</div>

							<div className="popover-section">
								<div className="popover-title">Who reviews approvals</div>
								<select
									value={settings.reviewer ?? ""}
									onChange={(e) => setReviewer((e.target.value || null) as ApprovalsReviewer | null)}
									aria-label="Approvals reviewer"
								>
									{REVIEWERS.map((r) => (
										<option value={r.value} key={r.value}>
											{r.label}
										</option>
									))}
								</select>
								<div className="hint">
									“Inherit config” keeps codex&apos;s own <code>approvals_reviewer</code>. If that is{" "}
									<code>auto_review</code>, requests are decided by a subagent and no dialog appears here.
								</div>
							</div>

							<label className="toggle-row">
								<input
									type="checkbox"
									checked={settings.autoApprove}
									onChange={(e) => setAutoApprove(e.target.checked)}
								/>
								<span>
									Auto-approve commands
									<span className="hint block">Convenience: replies “accept” to approvals automatically.</span>
								</span>
							</label>

							<div className="popover-section">
								<div className="popover-title">Account</div>
								<div className="muted small">{accountLabel(account)}</div>
							</div>

							<div className="popover-actions">
								<button className="btn ghost small" onClick={() => void restartCodex()}>
									<IconRefresh size={13} /> Restart codex
								</button>
								<button className="btn ghost small" onClick={() => setLogsOpen(true)}>
									<IconTerminal size={13} /> Logs
								</button>
							</div>
						</div>
					) : null}
				</div>

				<div className="popover-wrap" ref={themeRef}>
					<button
						className="icon-btn"
						aria-label="Theme"
						aria-expanded={themeOpen}
						onClick={() => setThemeOpen((v) => !v)}
					>
						<IconPalette size={16} />
					</button>
					{themeOpen ? (
						<div className="popover" role="dialog" aria-label="Theme">
							<div className="popover-section">
								<div className="popover-title">Skin</div>
								<div className="theme-grid">
									{THEMES.map((t) => (
										<button
											key={t.id}
											type="button"
											className={`theme-option${theme === t.id ? " active" : ""}`}
											aria-pressed={theme === t.id}
											title={t.hint}
											onClick={() => {
												onSetTheme(t.id);
												setThemeOpen(false);
											}}
										>
											<span
												className="theme-swatch"
												style={{ background: t.swatch[0], borderColor: t.swatch[1] }}
												aria-hidden="true"
											>
												<i style={{ background: t.swatch[1] }} />
											</span>
											<span className="theme-option-label">{t.label}</span>
										</button>
									))}
								</div>
							</div>
						</div>
					) : null}
				</div>
			</div>

			{logsOpen ? (
				<div className="drawer-backdrop" onClick={() => setLogsOpen(false)}>
					<div className="drawer" role="dialog" aria-label="Codex logs" onClick={(e) => e.stopPropagation()}>
						<div className="drawer-head">
							<span>Codex logs</span>
							<span className="spacer" />
							<button className="btn ghost small" onClick={() => void loadLogs()} disabled={logsLoading}>
								<IconRefresh size={13} /> {logsLoading ? "Loading…" : "Refresh"}
							</button>
							<button className="icon-btn" aria-label="Close logs" onClick={() => setLogsOpen(false)}>
								×
							</button>
						</div>
						<pre className="drawer-body">{logs.length > 0 ? logs.join("\n") : "No logs available."}</pre>
					</div>
				</div>
			) : null}
		</header>
	);
}
