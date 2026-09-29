import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCodex } from "../lib/useCodex";
import { IconCheck, IconChevronDown, IconFolder, IconEdit, IconSearch } from "./Icons";
import { shortenProjectPath } from "../lib/format";

/**
 * Workspace switcher.
 *
 * The project list is derived from the `cwd` of known codex threads (see
 * `refreshProjects` in the provider). Picking a project re-scopes the thread
 * list, so this is the app's primary navigation control — which is why it sits
 * above the thread list, mirroring pi-web.
 */
export function ProjectPicker(): ReactNode {
	const { projects, projectsLoading, settings, info, selectProject, refreshProjects } = useCodex();
	const [open, setOpen] = useState(false);
	const [filter, setFilter] = useState("");
	const [customMode, setCustomMode] = useState(false);
	const [customValue, setCustomValue] = useState("");
	const wrapRef = useRef<HTMLDivElement>(null);

	const current = settings.cwd || info?.cwd || "";
	const defaultCwd = info?.cwd ?? null;

	// Refresh on open: another tab (or the CLI) may have created a project since.
	useEffect(() => {
		if (!open) return;
		void refreshProjects();
		const onDown = (e: MouseEvent) => {
			if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open, refreshProjects]);

	useEffect(() => {
		if (!open) {
			setFilter("");
			setCustomMode(false);
			setCustomValue("");
		}
	}, [open]);

	const visible = useMemo(() => {
		const term = filter.trim().toLowerCase();
		const list = term ? projects.filter((p) => p.path.toLowerCase().includes(term)) : projects;
		// Always keep the active project reachable, even mid-filter.
		if (current && !list.some((p) => p.path === current)) {
			const active = projects.find((p) => p.path === current);
			if (active) return [active, ...list];
		}
		return list;
	}, [projects, filter, current]);

	const pick = (path: string | null): void => {
		setOpen(false);
		void selectProject(path);
	};

	const submitCustom = (): void => {
		const value = customValue.trim();
		if (!value) return;
		pick(value);
	};

	return (
		<div className="project-picker" ref={wrapRef}>
			<button
				type="button"
				className={`project-btn${open ? " open" : ""}`}
				aria-haspopup="listbox"
				aria-expanded={open}
				title={current}
				onClick={() => setOpen((v) => !v)}
			>
				<span className="project-btn-path">{shortenProjectPath(current) || "Select project"}</span>
				{projectsLoading ? <span className="project-dot busy" aria-hidden="true" /> : <IconChevronDown size={14} />}
			</button>

			{open ? (
				<div className="project-menu" role="listbox" aria-label="Projects">
					{customMode ? (
						<div className="project-custom">
							<input
								autoFocus
								className="text-input"
								value={customValue}
								placeholder="/absolute/path/to/project"
								aria-label="Custom project path"
								onChange={(e) => setCustomValue(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") submitCustom();
								}}
							/>
							<div className="project-custom-actions">
								<button type="button" className="btn ghost small" onClick={() => setCustomMode(false)}>
									Back
								</button>
								<button type="button" className="btn primary small" onClick={submitCustom} disabled={!customValue.trim()}>
									Open
								</button>
							</div>
						</div>
					) : (
						<>
							<div className="project-filter">
								<IconSearch size={13} />
								<input
									autoFocus
									value={filter}
									placeholder="Filter projects…"
									aria-label="Filter projects"
									onChange={(e) => setFilter(e.target.value)}
								/>
							</div>

							<div className="project-list">
								{visible.length === 0 ? (
									<div className="project-empty muted small">
										{projectsLoading ? "Loading…" : "No known projects yet."}
									</div>
								) : null}
								{visible.map((p) => {
									const active = p.path === current;
									return (
										<button
											key={p.path}
											type="button"
											role="option"
											aria-selected={active}
											className={`project-item${active ? " active" : ""}`}
											title={p.path}
											onClick={() => pick(p.path)}
										>
											<span className="project-check">{active ? <IconCheck size={13} /> : null}</span>
											<span className="project-item-path">{shortenProjectPath(p.path, 30)}</span>
											<span className={`project-count${active ? " active" : ""}`}>
												<span className="project-dot" aria-hidden="true" />
												{p.threadCount}
											</span>
										</button>
									);
								})}
							</div>

							<div className="project-footer">
								<button
									type="button"
									className="project-item"
									onClick={() => pick(null)}
									disabled={!defaultCwd}
									title={defaultCwd ?? "app-server default"}
								>
									<span className="project-check">{!current || current === defaultCwd ? <IconCheck size={13} /> : null}</span>
									<IconFolder size={13} />
									<span className="project-item-path">Use default directory</span>
								</button>
								<button type="button" className="project-item" onClick={() => setCustomMode(true)}>
									<span className="project-check" />
									<IconEdit size={13} />
									<span className="project-item-path">Custom path…</span>
								</button>
							</div>
						</>
					)}
				</div>
			) : null}
		</div>
	);
}
