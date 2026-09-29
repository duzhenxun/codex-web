import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { App } from "./App";
import { CodexProvider } from "./state/CodexProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";

const container = document.getElementById("root");
if (container) {
	createRoot(container).render(
		<StrictMode>
			<ErrorBoundary label="app">
				<CodexProvider>
					<App />
				</CodexProvider>
			</ErrorBoundary>
		</StrictMode>,
	);
}
