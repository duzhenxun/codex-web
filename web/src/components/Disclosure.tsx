import { useState, type ReactNode } from "react";
import { IconChevronDown, IconChevronRight } from "./Icons";

interface DisclosureProps {
	summary: ReactNode;
	children: ReactNode;
	defaultOpen?: boolean;
	className?: string;
	/** Rendered on the right side of the header (outside the toggle button). */
	actions?: ReactNode;
	onToggle?: (open: boolean) => void;
}

export function Disclosure({
	summary,
	children,
	defaultOpen = false,
	className = "",
	actions,
	onToggle,
}: DisclosureProps): ReactNode {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className={`disclosure ${open ? "open" : "closed"} ${className}`}>
			<div className="disclosure-head">
				<button
					type="button"
					className="disclosure-toggle"
					aria-expanded={open}
					onClick={() => {
						setOpen((v) => {
							onToggle?.(!v);
							return !v;
						});
					}}
				>
					<span className="disclosure-caret">{open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}</span>
					<span className="disclosure-summary">{summary}</span>
				</button>
				{actions ? <div className="disclosure-actions">{actions}</div> : null}
			</div>
			{open ? <div className="disclosure-body">{children}</div> : null}
		</div>
	);
}
