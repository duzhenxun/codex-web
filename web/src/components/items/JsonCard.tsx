import type { ReactNode } from "react";
import { Disclosure } from "../Disclosure";

/** JSON.stringify that never throws (circular payloads, BigInt, ...). */
export function safeStringify(value: unknown, indent = 2): string {
	try {
		const seen = new WeakSet<object>();
		return JSON.stringify(
			value,
			(_key, val) => {
				if (typeof val === "bigint") return `${val.toString()}n`;
				if (typeof val === "object" && val !== null) {
					if (seen.has(val as object)) return "[Circular]";
					seen.add(val as object);
				}
				return val;
			},
			indent,
		);
	} catch (err) {
		return `[Unserializable: ${err instanceof Error ? err.message : String(err)}]`;
	}
}

interface JsonCardProps {
	icon: ReactNode;
	title: ReactNode;
	subtitle?: ReactNode;
	data: unknown;
	defaultOpen?: boolean;
	className?: string;
	badge?: ReactNode;
}

/** Generic "we don't have a bespoke renderer" card: icon + title + JSON. */
export function JsonCard({ icon, title, subtitle, data, defaultOpen = false, className = "", badge }: JsonCardProps): ReactNode {
	return (
		<div className={`item item-generic ${className}`}>
			<div className="item-head">
				<span className="item-icon">{icon}</span>
				<span className="item-title">{title}</span>
				{badge}
				{subtitle ? <span className="item-subtitle">{subtitle}</span> : null}
			</div>
			<Disclosure defaultOpen={defaultOpen} summary={<span className="muted">Details</span>}>
				<pre className="code-block small">{safeStringify(data)}</pre>
			</Disclosure>
		</div>
	);
}
