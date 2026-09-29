import { useEffect, type ReactNode } from "react";
import { useCodex } from "../lib/useCodex";
import { IconAlert, IconCheckCircle, IconInfo, IconX } from "./Icons";

function ToastCard({ id, kind, message, onDismiss }: {
	id: string;
	kind: "info" | "error" | "success";
	message: string;
	onDismiss: (id: string) => void;
}): ReactNode {
	useEffect(() => {
		const t = setTimeout(() => onDismiss(id), kind === "error" ? 9000 : 4500);
		return () => clearTimeout(t);
	}, [id, kind, onDismiss]);

	const icon = kind === "error" ? <IconAlert size={15} /> : kind === "success" ? <IconCheckCircle size={15} /> : <IconInfo size={15} />;
	return (
		<div className={`toast toast-${kind}`} role="status">
			<span className="toast-icon">{icon}</span>
			<span className="toast-msg">{message}</span>
			<button className="icon-btn tiny" aria-label="Dismiss notification" onClick={() => onDismiss(id)}>
				<IconX size={13} />
			</button>
		</div>
	);
}

export function Toasts(): ReactNode {
	const { toasts, dismissToast } = useCodex();
	if (toasts.length === 0) return null;
	return (
		<div className="toasts" aria-live="polite">
			{toasts.map((t) => (
				<ToastCard key={t.id} id={t.id} kind={t.kind} message={t.message} onDismiss={dismissToast} />
			))}
		</div>
	);
}
