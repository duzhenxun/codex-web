// Tiny inline SVG icon set (stroke-based, currentColor). Keeps the bundle
// dependency-free and gives the UI a consistent Linear/Vercel-ish feel.

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...props }: P) {
	return {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.8,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
		"aria-hidden": true,
		...props,
	};
}

export const IconPlus = (p: P) => (
	<svg {...base(p)}>
		<path d="M12 5v14M5 12h14" />
	</svg>
);
export const IconSearch = (p: P) => (
	<svg {...base(p)}>
		<circle cx="11" cy="11" r="7" />
		<path d="m20 20-3.5-3.5" />
	</svg>
);
export const IconMore = (p: P) => (
	<svg {...base(p)}>
		<circle cx="5" cy="12" r="1" />
		<circle cx="12" cy="12" r="1" />
		<circle cx="19" cy="12" r="1" />
	</svg>
);
export const IconChevronDown = (p: P) => (
	<svg {...base(p)}>
		<path d="m6 9 6 6 6-6" />
	</svg>
);
export const IconChevronRight = (p: P) => (
	<svg {...base(p)}>
		<path d="m9 6 6 6-6 6" />
	</svg>
);
export const IconChevronLeft = (p: P) => (
	<svg {...base(p)}>
		<path d="m15 6-6 6 6 6" />
	</svg>
);
export const IconTrash = (p: P) => (
	<svg {...base(p)}>
		<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
	</svg>
);
export const IconArchive = (p: P) => (
	<svg {...base(p)}>
		<rect x="3" y="4" width="18" height="4" rx="1" />
		<path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
	</svg>
);
export const IconFork = (p: P) => (
	<svg {...base(p)}>
		<circle cx="6" cy="5" r="2" />
		<circle cx="18" cy="5" r="2" />
		<circle cx="12" cy="19" r="2" />
		<path d="M6 7v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M12 12v5" />
	</svg>
);
export const IconEdit = (p: P) => (
	<svg {...base(p)}>
		<path d="M12 20h9" />
		<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
	</svg>
);
export const IconX = (p: P) => (
	<svg {...base(p)}>
		<path d="M6 6l12 12M18 6 6 18" />
	</svg>
);
export const IconCopy = (p: P) => (
	<svg {...base(p)}>
		<rect x="9" y="9" width="11" height="11" rx="2" />
		<path d="M5 15V5a2 2 0 0 1 2-2h8" />
	</svg>
);
export const IconCheck = (p: P) => (
	<svg {...base(p)}>
		<path d="m5 13 4 4 10-11" />
	</svg>
);
export const IconSend = (p: P) => (
	<svg {...base(p)}>
		<path d="M4 12 20 4l-6 16-3-7-7-1Z" />
	</svg>
);
export const IconStop = (p: P) => (
	<svg {...base(p)}>
		<rect x="6" y="6" width="12" height="12" rx="2" />
	</svg>
);
export const IconSun = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
	</svg>
);
export const IconMoon = (p: P) => (
	<svg {...base(p)}>
		<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
	</svg>
);
export const IconPalette = (p: P) => (
	<svg {...base(p)}>
		<path d="M12 21a9 9 0 1 1 9-9c0 1.7-1.3 3-3 3h-1.8a1.7 1.7 0 0 0-1.2 2.9l.2.2c.5.5.8 1.2.8 1.9 0 .6-.5 1-1 1Z" />
		<circle cx="7.5" cy="12" r="1.2" />
		<circle cx="10" cy="8" r="1.2" />
		<circle cx="14.5" cy="7.5" r="1.2" />
	</svg>
);
export const IconFolder = (p: P) => (
	<svg {...base(p)}>
		<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
	</svg>
);
export const IconFile = (p: P) => (
	<svg {...base(p)}>
		<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
		<path d="M14 3v5h5" />
	</svg>
);
export const IconTerminal = (p: P) => (
	<svg {...base(p)}>
		<rect x="3" y="4" width="18" height="16" rx="2" />
		<path d="m7 9 3 3-3 3M13 15h4" />
	</svg>
);
export const IconGitBranch = (p: P) => (
	<svg {...base(p)}>
		<circle cx="6" cy="6" r="2" />
		<circle cx="6" cy="18" r="2" />
		<circle cx="18" cy="8" r="2" />
		<path d="M6 8v8M18 10c0 4-6 2-6 6" />
	</svg>
);
export const IconSparkles = (p: P) => (
	<svg {...base(p)}>
		<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6Z" />
		<path d="M5 16l.7 1.8L7.5 18.5l-1.8.7L5 21l-.7-1.8L2.5 18.5l1.8-.7Z" />
	</svg>
);
export const IconWrench = (p: P) => (
	<svg {...base(p)}>
		<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.1-.4-.4-2.1Z" />
	</svg>
);
export const IconGlobe = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="9" />
		<path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
	</svg>
);
export const IconImage = (p: P) => (
	<svg {...base(p)}>
		<rect x="3" y="4" width="18" height="16" rx="2" />
		<circle cx="9" cy="9" r="1.5" />
		<path d="m5 18 5-5 3 3 2-2 4 4" />
	</svg>
);
export const IconLayers = (p: P) => (
	<svg {...base(p)}>
		<path d="m12 3 9 5-9 5-9-5Z" />
		<path d="m3 13 9 5 9-5" />
	</svg>
);
export const IconAlert = (p: P) => (
	<svg {...base(p)}>
		<path d="M12 3 2 20h20Z" />
		<path d="M12 9v5M12 17h.01" />
	</svg>
);
export const IconRefresh = (p: P) => (
	<svg {...base(p)}>
		<path d="M21 12a9 9 0 1 1-2.6-6.4" />
		<path d="M21 4v5h-5" />
	</svg>
);
export const IconMenu = (p: P) => (
	<svg {...base(p)}>
		<path d="M4 6h16M4 12h16M4 18h16" />
	</svg>
);
export const IconPanelRight = (p: P) => (
	<svg {...base(p)}>
		<rect x="3" y="4" width="18" height="16" rx="2" />
		<path d="M15 4v16" />
	</svg>
);
export const IconPanelLeft = (p: P) => (
	<svg {...base(p)}>
		<rect x="3" y="4" width="18" height="16" rx="2" />
		<path d="M9 4v16" />
	</svg>
);
export const IconBrain = (p: P) => (
	<svg {...base(p)}>
		<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8V16a3 3 0 0 0 3 3h1V4Z" />
		<path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5.8V16a3 3 0 0 1-3 3h-1V4Z" />
	</svg>
);
export const IconCheckCircle = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="9" />
		<path d="m8 12 3 3 5-6" />
	</svg>
);
export const IconCircle = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="8" />
	</svg>
);
export const IconClock = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 7v5l3 2" />
	</svg>
);
export const IconList = (p: P) => (
	<svg {...base(p)}>
		<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
	</svg>
);
export const IconUser = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="8" r="4" />
		<path d="M4 21a8 8 0 0 1 16 0" />
	</svg>
);
export const IconSettings = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="3" />
		<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a1.7 1.7 0 0 0-1.6-1H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 3 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 3a1.7 1.7 0 0 0 1-1.6V1a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15 3c.7 0 1.4-.3 1.9-.8l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 9h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
	</svg>
);
export const IconExternal = (p: P) => (
	<svg {...base(p)}>
		<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
	</svg>
);
export const IconDot = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
	</svg>
);
export const IconInfo = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 11v5M12 8h.01" />
	</svg>
);
export const IconAt = (p: P) => (
	<svg {...base(p)}>
		<circle cx="12" cy="12" r="4" />
		<path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
	</svg>
);
