import { type ReactNode } from "react";
import { useCodex } from "../lib/useCodex";
import { ProjectPicker } from "./ProjectPicker";
import { ThreadList } from "./ThreadList";
import { IconPlus, IconSearch, IconSparkles, IconX } from "./Icons";

interface SidebarProps {
	onClose?: () => void;
	onNewThread: () => void;
	onOpenSessionLogs: (threadId: string) => void;
}

export function Sidebar({ onClose, onNewThread, onOpenSessionLogs }: SidebarProps): ReactNode {
	const { threads } = useCodex();

	return (
		<aside className="sidebar" aria-label="Threads">
			<div className="sidebar-head">
				<div className="brand">
					<span className="brand-mark">
						<IconSparkles size={16} />
					</span>
					<span className="brand-name">Codex</span>
				</div>
				{onClose ? (
					<button className="icon-btn" aria-label="Close sidebar" onClick={onClose}>
						<IconX size={16} />
					</button>
				) : null}
			</div>

			<ProjectPicker />

			<button className="btn primary new-thread" onClick={onNewThread}>
				<IconPlus size={15} /> New thread
			</button>

			<div className="search-box">
				<IconSearch size={14} />
				<SearchInput />
				<span className="kbd">⌘K</span>
			</div>

			<div className="sidebar-section-head">
				<span className="sidebar-section-label">Active</span>
				<span className="thread-count muted">{threads.length}</span>
			</div>

			<div className="sidebar-scroll">
				<ThreadList onOpenSessionLogs={onOpenSessionLogs} />
			</div>
		</aside>
	);
}

/** Small controlled input kept in its own component so Sidebar stays cheap. */
function SearchInput(): ReactNode {
	const { searchTerm, setSearchTerm } = useCodex();
	return (
		<input
			value={searchTerm}
			onChange={(e) => setSearchTerm(e.target.value)}
			placeholder="Search threads"
			aria-label="Search threads"
		/>
	);
}
