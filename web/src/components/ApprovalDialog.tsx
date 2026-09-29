import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CODEX_REQUESTS } from "@shared/protocol";
import type { PendingRequest } from "../lib/codex-types";
import { asArray, asString, isRecord } from "../lib/codex-types";
import { useCodex } from "../lib/useCodex";
import { Modal } from "./Modal";
import { IconAlert, IconFile, IconFolder, IconSearch, IconTerminal, IconWrench } from "./Icons";
import { basename } from "../lib/format";

/* --------------------------- command action label ------------------------- */

function describeAction(action: unknown): ReactNode {
	if (!isRecord(action)) return null;
	const type = asString(action.type) ?? "run";
	switch (type) {
		case "read":
			return (
				<>
					<IconFile size={12} /> read {asString(action.path) ?? ""}
				</>
			);
		case "listFiles":
			return (
				<>
					<IconFolder size={12} /> list {asString(action.path) ?? "."}
				</>
			);
		case "search":
			return (
				<>
					<IconSearch size={12} /> search {asString(action.query) ?? ""}
				</>
			);
		default:
			return (
				<>
					<IconWrench size={12} /> {asString(action.command) ?? type}
				</>
			);
	}
}

/* ------------------------------ user input form --------------------------- */

interface Question {
	id: string;
	header?: string;
	question?: string;
	isOther?: boolean;
	isSecret?: boolean;
	options?: Array<{ label?: string; description?: string }>;
}

function UserInputForm({ questions, onSubmit }: { questions: Question[]; onSubmit: (answers: Record<string, string[]>) => void }): ReactNode {
	const [values, setValues] = useState<Record<string, { selected: string[]; other: string }>>(() => {
		const init: Record<string, { selected: string[]; other: string }> = {};
		for (const q of questions) init[q.id] = { selected: [], other: "" };
		return init;
	});

	const setSelected = (qid: string, label: string, checked: boolean) => {
		setValues((prev) => {
			const cur = prev[qid] ?? { selected: [], other: "" };
			const selected = checked ? [...cur.selected, label] : cur.selected.filter((s) => s !== label);
			return { ...prev, [qid]: { ...cur, selected } };
		});
	};
	const setOther = (qid: string, other: string) => setValues((prev) => ({ ...prev, [qid]: { ...(prev[qid] ?? { selected: [], other: "" }), other } }));

	const submit = () => {
		const answers: Record<string, string[]> = {};
		for (const q of questions) {
			const v = values[q.id] ?? { selected: [], other: "" };
			const list = [...v.selected];
			if (v.other.trim()) list.push(v.other.trim());
			answers[q.id] = list;
		}
		onSubmit(answers);
	};

	return (
		<div className="question-form">
			{questions.map((q) => (
				<div className="question" key={q.id}>
					<div className="question-head">{q.header || q.question || q.id}</div>
					{q.header && q.question ? <div className="question-text">{q.question}</div> : null}
					{Array.isArray(q.options) && q.options.length > 0 ? (
						<div className="question-options">
							{q.options.map((o, i) => {
								const label = o.label ?? `option ${i + 1}`;
								return (
									<label className="question-option" key={label}>
										<input
											type="checkbox"
											checked={(values[q.id]?.selected ?? []).includes(label)}
											onChange={(e) => setSelected(q.id, label, e.target.checked)}
										/>
										<span>
											<span className="option-label">{label}</span>
											{o.description ? <span className="option-desc muted">{o.description}</span> : null}
										</span>
									</label>
								);
							})}
						</div>
					) : null}
					{q.isOther || !q.options || q.options.length === 0 ? (
						<input
							className="text-input"
							type={q.isSecret ? "password" : "text"}
							placeholder={q.isOther ? "Other…" : "Your answer"}
							value={values[q.id]?.other ?? ""}
							onChange={(e) => setOther(q.id, e.target.value)}
							aria-label={q.header || q.question || q.id}
						/>
					) : null}
				</div>
			))}
			<div className="modal-foot">
				<button className="btn primary" onClick={submit}>
					Submit answers
				</button>
			</div>
		</div>
	);
}

/* -------------------------------- summary -------------------------------- */

function RequestSummary({ request }: { request: PendingRequest }): ReactNode {
	const params = isRecord(request.params) ? request.params : {};
	if (request.method === CODEX_REQUESTS.commandApproval) {
		const command = asString(params.command);
		const cwd = asString(params.cwd);
		const reason = asString(params.reason);
		const actions = asArray(params.commandActions);
		return (
			<>
				{reason ? <p className="approval-reason">{reason}</p> : null}
				<div className="approval-command">
					<IconTerminal size={14} />
					<code>$ {command ?? "(command)"}</code>
				</div>
				{cwd ? (
					<div className="approval-cwd" title={cwd}>
						<IconFolder size={12} /> {cwd}
					</div>
				) : null}
				{actions.length > 0 ? (
					<div className="approval-actions">
						{actions.map((a, i) => (
							<span className="chip" key={i}>
								{describeAction(a)}
							</span>
						))}
					</div>
				) : null}
			</>
		);
	}
	if (request.method === CODEX_REQUESTS.fileChangeApproval) {
		const reason = asString(params.reason);
		const grantRoot = asString(params.grantRoot);
		return (
			<>
				{reason ? <p className="approval-reason">{reason}</p> : null}
				{grantRoot ? (
					<div className="approval-cwd" title={grantRoot}>
						<IconFolder size={12} /> Write access to {grantRoot}
					</div>
				) : (
					<p className="muted">The agent wants to modify files in this workspace.</p>
				)}
			</>
		);
	}
	if (request.method === CODEX_REQUESTS.elicitation) {
		const message = asString(params.message);
		const server = asString(params.serverName);
		return (
			<>
				<p className="approval-reason">{message ?? "The MCP server requests input."}</p>
				{server ? <div className="muted small">from {server}</div> : null}
			</>
		);
	}
	return <pre className="code-block small">{JSON.stringify(request.params, null, 2)}</pre>;
}

/* -------------------------------- dialog --------------------------------- */

export function ApprovalDialog(): ReactNode {
	const { pendingRequests, respondApproval, respondUserInput, rejectRequest } = useCodex();
	const request = pendingRequests[0] ?? null;
	const [decisionBusy, setDecisionBusy] = useState(false);

	// Hooks must run unconditionally: compute everything (including the questions
	// useMemo) before the `!request` early return below.
	const params = isRecord(request?.params) ? request.params : {};
	const isCommand = request?.method === CODEX_REQUESTS.commandApproval;
	const isFileChange = request?.method === CODEX_REQUESTS.fileChangeApproval;
	const isUserInput = request?.method === CODEX_REQUESTS.toolInput;
	const isElicitation = request?.method === CODEX_REQUESTS.elicitation;
	const isPermissions = request?.method === CODEX_REQUESTS.permissionsApproval;

	const questions = useMemo<Question[]>(() => {
		if (!isUserInput) return [];
		return asArray<Question>(params.questions).map((q, i) => ({
			id: q?.id ?? `q${i}`,
			header: q?.header,
			question: q?.question,
			isOther: q?.isOther,
			isSecret: q?.isSecret,
			options: asArray(q?.options),
		}));
	}, [isUserInput, params.questions]);

	useEffect(() => {
		setDecisionBusy(false);
	}, [request?.id]);

	if (!request) return null;

	const title =
		isCommand
			? "Approve command"
			: isFileChange
				? "Approve file changes"
				: isUserInput
					? "Codex needs input"
					: isElicitation
						? "MCP server request"
						: isPermissions
							? "Permission request"
							: "Codex request";

	const decide = (decision: string) => {
		setDecisionBusy(true);
		respondApproval(request.id, decision, request.method);
	};

	const header = (
		<span className="approval-title">
			<IconAlert size={16} /> {title}
			{pendingRequests.length > 1 ? <span className="badge badge-warn">{pendingRequests.length} pending</span> : null}
		</span>
	);

	let body: ReactNode;
	let footer: ReactNode;
	if (isUserInput) {
		body = <UserInputForm questions={questions} onSubmit={(answers) => respondUserInput(request.id, answers)} />;
		footer = null;
	} else if (isElicitation) {
		body = <RequestSummary request={request} />;
		footer = (
			<>
				<button className="btn" disabled={decisionBusy} onClick={() => respondApproval(request.id, "cancel", request.method)}>
					Cancel
				</button>
				<button className="btn" disabled={decisionBusy} onClick={() => respondApproval(request.id, "decline", request.method)}>
					Decline
				</button>
				<button className="btn primary" disabled={decisionBusy} onClick={() => respondApproval(request.id, "accept", request.method)}>
					Accept
				</button>
			</>
		);
	} else if (isPermissions) {
		body = <RequestSummary request={request} />;
		footer = (
			<>
				<button className="btn ghost" onClick={() => rejectRequest(request.id)}>
					Dismiss
				</button>
				<button className="btn" onClick={() => respondApproval(request.id, "decline", request.method)}>
					Decline
				</button>
			</>
		);
	} else if (isCommand || isFileChange) {
		body = <RequestSummary request={request} />;
		footer = (
			<>
				<button className="btn" disabled={decisionBusy} onClick={() => decide("cancel")}>
					Cancel
				</button>
				<button className="btn" disabled={decisionBusy} onClick={() => decide("decline")}>
					Decline
				</button>
				<button className="btn" disabled={decisionBusy} onClick={() => decide("acceptForSession")}>
					Accept for session
				</button>
				<button className="btn primary" disabled={decisionBusy} onClick={() => decide("accept")}>
					Accept
				</button>
			</>
		);
	} else {
		body = <RequestSummary request={request} />;
		footer = (
			<>
				<button className="btn ghost" onClick={() => rejectRequest(request.id)}>
					Reject
				</button>
				<button className="btn" onClick={() => respondApproval(request.id, "cancel", request.method)}>
					Cancel
				</button>
			</>
		);
	}

	return (
		<Modal open title={header} onClose={() => undefined} persistent width={620}>
			<div className="approval-method muted small">
				{request.method}
				{asString(params.itemId) ? ` · ${basename(asString(params.cwd) ?? "") || asString(params.itemId)?.slice(0, 8)}` : ""}
			</div>
			{body}
			{footer ? <div className="modal-foot">{footer}</div> : null}
		</Modal>
	);
}
