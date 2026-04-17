/**
 * consul-service
 * Shared Consul service registry utilities for MediConnect microservices.
 *
 * Usage:
 *   import { registerService, deregisterService, discoverService, discoverAllServices } from "consul-service";
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export { registerService, deregisterService } from "./src/registration.js";
export { discoverService, discoverAllServices, clearCache } from "./src/discovery.js";
export { default as consulClient } from "./src/consulClient.js";

const currentFilePath = fileURLToPath(import.meta.url);
const runFilePath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectRun = currentFilePath === runFilePath;

const isLocalConsulRunning = async () => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 1200);

	try {
		const response = await fetch("http://127.0.0.1:8500/v1/status/leader", {
			signal: controller.signal,
		});
		if (!response.ok) {
			return false;
		}
		await response.text();
		return true;
	} catch {
		return false;
	} finally {
		clearTimeout(timeout);
	}
};

const keepProcessAlive = () => {
	const keepAliveTimer = setInterval(() => {}, 60000);

	const close = () => {
		clearInterval(keepAliveTimer);
		process.exit(0);
	};

	process.on("SIGINT", close);
	process.on("SIGTERM", close);
	process.on("SIGUSR2", () => {
		clearInterval(keepAliveTimer);
		process.kill(process.pid, "SIGUSR2");
	});
};

if (isDirectRun) {
	const consulExe = path.resolve(path.dirname(currentFilePath), "bin", "consul.exe");

	if (!fs.existsSync(consulExe)) {
		console.error(`[Consul] Missing executable: ${consulExe}`);
		console.error("[Consul] Run scripts/start-consul.ps1 once to install consul.exe.");
		process.exit(1);
	}

	if (await isLocalConsulRunning()) {
		console.log("[Consul] Existing agent detected on http://127.0.0.1:8500.");
		console.log("[Consul] Reusing existing instance. No new process started.");
		keepProcessAlive();
	} else {
		console.log(`[Consul] Starting agent using ${consulExe}`);
		console.log("[Consul] UI:  http://127.0.0.1:8500/ui");
		console.log("[Consul] API: http://127.0.0.1:8500/v1/status/leader");

		const consulProcess = spawn(
			consulExe,
			["agent", "-dev", "-ui", "-client", "127.0.0.1"],
			{ stdio: "inherit" }
		);

		const stopConsul = () => {
			if (consulProcess.exitCode === null && !consulProcess.killed) {
				consulProcess.kill("SIGINT");
			}
		};

		process.on("SIGINT", () => stopConsul());
		process.on("SIGTERM", () => stopConsul());

		process.on("SIGUSR2", () => {
			stopConsul();
			setTimeout(() => {
				process.kill(process.pid, "SIGUSR2");
			}, 100);
		});

		consulProcess.on("exit", (code) => {
			process.exit(code ?? 0);
		});
	}
}
