import { useEffect, useRef, type ReactNode } from "react";
import { IconX } from "./Icons";

interface ModalProps {
	open: boolean;
	title: ReactNode;
	onClose: () => void;
	children: ReactNode;
	footer?: ReactNode;
	/** Prevent closing via backdrop/Esc (e.g. required approval). */
	persistent?: boolean;
	width?: number;
}

/** Accessible dialog: role=dialog, aria-modal, focus trap, Esc to close. */
export function Modal({ open, title, onClose, children, footer, persistent, width = 560 }: ModalProps): ReactNode {
	const ref = useRef<HTMLDivElement>(null);
	const previousFocus = useRef<Element | null>(null);

	useEffect(() => {
		if (!open) return;
		previousFocus.current = document.activeElement;
		const node = ref.current;
		const focusFirst = () => {
			const focusable = node?.querySelector<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			focusable?.focus();
		};
		const t = setTimeout(focusFirst, 0);

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !persistent) {
				e.stopPropagation();
				onClose();
				return;
			}
			if (e.key !== "Tab" || !node) return;
			const focusable = Array.from(
				node.querySelectorAll<HTMLElement>(
					'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
				),
			).filter((el) => el.offsetParent !== null);
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		};
		document.addEventListener("keydown", onKeyDown, true);
		return () => {
			clearTimeout(t);
			document.removeEventListener("keydown", onKeyDown, true);
			const prev = previousFocus.current;
			if (prev instanceof HTMLElement) prev.focus();
		};
	}, [open, onClose, persistent]);

	if (!open) return null;
	return (
		<div className="modal-backdrop" onMouseDown={(e) => {
			if (!persistent && e.target === e.currentTarget) onClose();
		}}>
			<div
				ref={ref}
				role="dialog"
				aria-modal="true"
				aria-label={typeof title === "string" ? title : "Dialog"}
				className="modal"
				style={{ maxWidth: width }}
			>
				<div className="modal-head">
					<div className="modal-title">{title}</div>
					<button className="icon-btn" aria-label="Close dialog" onClick={onClose} disabled={persistent}>
						<IconX size={16} />
					</button>
				</div>
				<div className="modal-body">{children}</div>
				{footer ? <div className="modal-foot">{footer}</div> : null}
			</div>
		</div>
	);
}
