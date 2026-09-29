import { memo, isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useCodex } from "../lib/useCodex";
import { CopyButton } from "./CopyButton";

/** Decide whether a markdown href points at a local file we can preview. */
function filePathFromHref(href: string | undefined): string | null {
	if (!href) return null;
	if (/^(https?:|mailto:|tel:|data:|blob:|#)/i.test(href)) return null;
	if (href.startsWith("file://")) return decodeURIComponent(href.slice(7));
	if (href.startsWith("/")) return href;
	// Relative path: accept things with a separator or a file extension.
	if (href.includes("/") || /\.[a-zA-Z0-9]{1,8}$/.test(href)) return href;
	return null;
}

function FileLink({ href, children }: { href?: string; children?: ReactNode }): ReactNode {
	const { openFilePreview, settings, info } = useCodex();
	const filePath = filePathFromHref(href);
	if (filePath) {
		const absolute = filePath.startsWith("/") ? filePath : joinPath(settings.cwd || info?.cwd || "", filePath);
		return (
			<button
				type="button"
				className="md-file-link"
				title={`Preview ${absolute}`}
				onClick={(e) => {
					e.preventDefault();
					openFilePreview(absolute);
				}}
			>
				{children}
			</button>
		);
	}
	return (
		<a href={href} target="_blank" rel="noreferrer noopener">
			{children}
		</a>
	);
}

function joinPath(base: string, rel: string): string {
	if (!base) return rel;
	if (base.endsWith("/")) return base + rel;
	return `${base}/${rel}`;
}

/** Reconstruct the raw text of a rendered node tree (for copy buttons). */
function textOf(node: ReactNode): string {
	if (node == null || typeof node === "boolean") return "";
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(textOf).join("");
	if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
	return "";
}

function PreBlock(props: ComponentPropsWithoutRef<"pre">): ReactNode {
	// Deriving the text during render keeps the copy button correct on the very
	// first paint (a ref would still be empty until a re-render).
	const text = textOf(props.children);
	return (
		<div className="md-pre-wrap">
			<div className="md-pre-bar">
				<CopyButton text={text} label="Copy code" />
			</div>
			<pre {...props} />
		</div>
	);
}

interface MarkdownProps {
	children: string;
	className?: string;
}

function MarkdownImpl({ children, className }: MarkdownProps): ReactNode {
	return (
		<div className={`markdown ${className ?? ""}`}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
				components={{
					a: ({ href, children: c }) => <FileLink href={href}>{c}</FileLink>,
					pre: PreBlock,
				}}
			>
				{children ?? ""}
			</ReactMarkdown>
		</div>
	);
}

export const Markdown = memo(MarkdownImpl);
