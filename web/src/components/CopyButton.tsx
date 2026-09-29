import { useCallback, useRef, useState, type ReactNode } from "react";
import { IconCheck, IconCopy } from "./Icons";

export function useCopy(resetMs = 1400): { copied: boolean; copy: (text: string) => void } {
	const [copied, setCopied] = useState(false);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const copy = useCallback(
		(text: string) => {
			const done = () => {
				setCopied(true);
				if (timer.current) clearTimeout(timer.current);
				timer.current = setTimeout(() => setCopied(false), resetMs);
			};
			try {
				if (navigator.clipboard?.writeText) {
					void navigator.clipboard.writeText(text).then(done, done);
				} else {
					const el = document.createElement("textarea");
					el.value = text;
					el.style.position = "fixed";
					el.style.opacity = "0";
					document.body.appendChild(el);
					el.select();
					document.execCommand("copy");
					document.body.removeChild(el);
					done();
				}
			} catch {
				done();
			}
		},
		[resetMs],
	);
	return { copied, copy };
}

export function CopyButton({
	text,
	label = "Copy",
	className = "icon-btn",
	size = 13,
}: {
	text: string;
	label?: string;
	className?: string;
	size?: number;
}): ReactNode {
	const { copied, copy } = useCopy();
	return (
		<button
			type="button"
			className={className}
			aria-label={copied ? "Copied" : label}
			title={copied ? "Copied" : label}
			onClick={() => copy(text)}
		>
			{copied ? <IconCheck size={size} /> : <IconCopy size={size} />}
			{className.includes("btn") && !className.includes("icon-btn") ? <span>{copied ? "Copied" : label}</span> : null}
		</button>
	);
}
