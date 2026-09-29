import { memo, type ReactNode } from "react";
import type { UserInput } from "@shared/codex-ts/v2";
import { useCodex } from "../../lib/useCodex";
import { IconAt, IconFile, IconImage, IconSparkles, IconUser } from "../Icons";

function Chip({ icon, label, onClick, title }: { icon: ReactNode; label: string; onClick?: () => void; title?: string }): ReactNode {
	const cls = `input-chip${onClick ? " clickable" : ""}`;
	if (onClick) {
		return (
			<button type="button" className={cls} title={title ?? label} onClick={onClick}>
				{icon}
				<span>{label}</span>
			</button>
		);
	}
	return (
		<span className={cls} title={title ?? label}>
			{icon}
			<span>{label}</span>
		</span>
	);
}

function Content({ input }: { input: UserInput }): ReactNode {
	const { openFilePreview } = useCodex();
	const type = (input as { type?: string }).type;
	switch (type) {
		case "text":
			return <div className="user-text">{String((input as { text?: unknown }).text ?? "")}</div>;
		case "image": {
			const url = (input as { url?: unknown }).url;
			if (typeof url === "string" && url.length > 0) {
				return (
					<figure className="user-image">
						<img src={url} alt="attachment" loading="lazy" />
					</figure>
				);
			}
			return (
				<Chip icon={<IconImage size={13} />} label="image attachment" />
			);
		}
		case "localImage": {
			const path = (input as { path?: unknown }).path;
			return (
				<Chip
					icon={<IconImage size={13} />}
					label={typeof path === "string" ? path : "local image"}
					title={typeof path === "string" ? path : undefined}
					onClick={typeof path === "string" ? () => openFilePreview(path) : undefined}
				/>
			);
		}
		case "mention": {
			const path = (input as { path?: unknown }).path;
			const name = (input as { name?: unknown }).name;
			const label = typeof name === "string" ? name : typeof path === "string" ? path : "mention";
			return (
				<Chip
					icon={<IconAt size={13} />}
					label={label}
					title={typeof path === "string" ? path : undefined}
					onClick={typeof path === "string" ? () => openFilePreview(path) : undefined}
				/>
			);
		}
		case "skill": {
			const name = (input as { name?: unknown }).name;
			const path = (input as { path?: unknown }).path;
			return (
				<Chip
					icon={<IconSparkles size={13} />}
					label={typeof name === "string" ? name : "skill"}
					title={typeof path === "string" ? path : undefined}
					onClick={typeof path === "string" ? () => openFilePreview(path) : undefined}
				/>
			);
		}
		case "audio":
		case "localAudio":
			return <Chip icon={<IconFile size={13} />} label="audio attachment" />;
		default:
			return <Chip icon={<IconFile size={13} />} label={type ?? "input"} />;
	}
}

function UserMessageItemImpl({ content }: { content: UserInput[] | undefined }): ReactNode {
	const inputs = Array.isArray(content) ? content : [];
	return (
		<div className="item item-user">
			<div className="user-avatar" aria-hidden>
				<IconUser size={15} />
			</div>
			<div className="user-bubble">
				{inputs.map((input, i) => (
					<Content key={i} input={input} />
				))}
				{inputs.length === 0 ? <div className="user-text muted">(empty message)</div> : null}
			</div>
		</div>
	);
}

export const UserMessageItem = memo(UserMessageItemImpl);
