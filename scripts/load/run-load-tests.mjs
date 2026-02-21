#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULT_SCENARIOS = ["weather", "chat", "dashboard-aquariums", "dashboard-tasks"];
const DEFAULT_REQUESTS = 50;
const DEFAULT_CONCURRENCY = 10;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_ERROR_RATE_LIMIT = 0.01;

function printHelp() {
  console.log(`Usage: node scripts/load/run-load-tests.mjs [options]

Options:
  --scenarios <list>      Comma-separated scenario names
  --requests <n>          Requests per scenario (default: 50)
  --concurrency <n>       Concurrent workers per scenario (default: 10)
  --timeout-ms <n>        Request timeout in milliseconds (default: 15000)
  --bearer-token <token>  Bearer JWT for auth-required scenarios
  --auth-email <email>    Auth email used to fetch JWT if no bearer token is provided
  --auth-password <pass>  Auth password used to fetch JWT if no bearer token is provided
  --require-auth          Fail fast when auth-required scenarios can't authenticate
  --out <path>            Write JSON report to this path
  --dry-run               Print resolved config only, do not make requests
  --no-env-file           Do not load .env/.env.local from workspace
  --help                  Show this help

Scenarios:
  weather, chat, dashboard-aquariums, dashboard-tasks
`);
}

function parseArgs(argv) {
  const options = {
    scenarios: DEFAULT_SCENARIOS,
    requests: DEFAULT_REQUESTS,
    concurrency: DEFAULT_CONCURRENCY,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    bearerToken: "",
    authEmail: "",
    authPassword: "",
    requireAuth: false,
    out: "",
    dryRun: false,
    noEnvFile: false,
    help: false,
  };

  const readOptionValue = (inlineValue, i) => {
    if (inlineValue != null && inlineValue !== "") return { value: inlineValue, consumed: 0 };
    const nextValue = argv[i + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      throw new Error(`Missing value for ${argv[i]}`);
    }
    return { value: nextValue, consumed: 1 };
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    const [flag, inlineValue] = arg.split("=", 2);
    if (flag === "--help") {
      options.help = true;
      continue;
    }
    if (flag === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (flag === "--no-env-file") {
      options.noEnvFile = true;
      continue;
    }
    if (flag === "--require-auth") {
      options.requireAuth = true;
      continue;
    }

    const { value, consumed } = readOptionValue(inlineValue, i);
    i += consumed;

    switch (flag) {
      case "--scenarios":
        options.scenarios = value.split(",").map((item) => item.trim()).filter(Boolean);
        break;
      case "--requests":
        options.requests = Number(value);
        break;
      case "--concurrency":
        options.concurrency = Number(value);
        break;
      case "--timeout-ms":
        options.timeoutMs = Number(value);
        break;
      case "--bearer-token":
        options.bearerToken = value;
        break;
      case "--auth-email":
        options.authEmail = value;
        break;
      case "--auth-password":
        options.authPassword = value;
        break;
      case "--out":
        options.out = value;
        break;
      default:
        throw new Error(`Unknown argument: ${flag}`);
    }
  }

  if (options.requests <= 0 || !Number.isFinite(options.requests)) {
    throw new Error("--requests must be a positive number");
  }
  if (options.concurrency <= 0 || !Number.isFinite(options.concurrency)) {
    throw new Error("--concurrency must be a positive number");
  }
  if (options.timeoutMs <= 0 || !Number.isFinite(options.timeoutMs)) {
    throw new Error("--timeout-ms must be a positive number");
  }
  if (options.scenarios.length === 0) {
    throw new Error("At least one scenario is required");
  }

  return options;
}

function parseEnvFile(path) {
  if (!existsSync(path)) return {};

  const content = readFileSync(path, "utf8");
  const values = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("export ")) {
      line = line.slice("export ".length);
    }

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    if (!key) continue;

    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function resolveEnv(cwd, noEnvFile) {
  if (noEnvFile) {
    return { ...process.env };
  }

  const fromDotEnv = parseEnvFile(resolve(cwd, ".env"));
  const fromDotEnvLocal = parseEnvFile(resolve(cwd, ".env.local"));
  return {
    ...fromDotEnv,
    ...fromDotEnvLocal,
    ...process.env,
  };
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function percentile(sortedValues, pct) {
  if (sortedValues.length === 0) return 0;
  const rank = (pct / 100) * (sortedValues.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sortedValues[lower];
  const weight = rank - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function round(value) {
  return Number(value.toFixed(2));
}

function truncateForLog(input, maxLength = 160) {
  if (!input) return "";
  if (input.length <= maxLength) return input;
  return `${input.slice(0, maxLength)}...`;
}

async function fetchJwtFromPasswordAuth({
  baseUrl,
  apikey,
  email,
  password,
  timeoutMs,
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    const payloadText = await response.text();
    let payload = null;
    try {
      payload = payloadText ? JSON.parse(payloadText) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        (payload && typeof payload.msg === "string" && payload.msg) ||
        (payload && typeof payload.error_description === "string" && payload.error_description) ||
        truncateForLog(payloadText);
      throw new Error(
        `Password auth failed (${response.status})${message ? `: ${message}` : ""}`
      );
    }

    if (!payload || typeof payload.access_token !== "string" || !payload.access_token) {
      throw new Error("Password auth succeeded but no access_token was returned.");
    }

    return payload.access_token;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveBearerToken({
  baseUrl,
  apikey,
  timeoutMs,
  env,
  options,
  selectedScenarios,
}) {
  const hasAuthScenario = selectedScenarios.some((scenario) => scenario.requiresBearer);
  const directBearerToken =
    options.bearerToken ||
    env.LOAD_BEARER_TOKEN ||
    env.SUPABASE_USER_JWT ||
    env.SUPABASE_ACCESS_TOKEN ||
    "";

  if (directBearerToken) {
    return {
      token: directBearerToken,
      source: "direct-token",
      hasAuthScenario,
    };
  }

  const authEmail = options.authEmail || env.LOAD_AUTH_EMAIL || "";
  const authPassword = options.authPassword || env.LOAD_AUTH_PASSWORD || "";

  if (authEmail && authPassword) {
    const token = await fetchJwtFromPasswordAuth({
      baseUrl,
      apikey,
      email: authEmail,
      password: authPassword,
      timeoutMs,
    });

    return {
      token,
      source: "password-auth",
      hasAuthScenario,
    };
  }

  if (hasAuthScenario && options.requireAuth) {
    throw new Error(
      "Auth-required scenarios selected, but no auth credentials were provided. " +
      "Set LOAD_BEARER_TOKEN, or LOAD_AUTH_EMAIL + LOAD_AUTH_PASSWORD, " +
      "or pass --bearer-token / --auth-email / --auth-password."
    );
  }

  return {
    token: "",
    source: "none",
    hasAuthScenario,
  };
}

function createScenarios(env) {
  const lat = Number(env.LOAD_WEATHER_LAT ?? env.WEATHER_LAT ?? 37.7749);
  const lon = Number(env.LOAD_WEATHER_LON ?? env.WEATHER_LON ?? -122.4194);

  return {
    weather: {
      name: "weather",
      method: "POST",
      path: "/functions/v1/get-weather",
      readMode: "text",
      requiresBearer: false,
      targetP95Ms: 1200,
      targetErrorRate: DEFAULT_ERROR_RATE_LIMIT,
      body: { latitude: lat, longitude: lon },
    },
    chat: {
      name: "chat",
      method: "POST",
      path: "/functions/v1/ally-chat",
      readMode: "firstChunk",
      requiresBearer: true,
      targetP95Ms: 4000,
      targetErrorRate: DEFAULT_ERROR_RATE_LIMIT,
      body: {
        messages: [{ role: "user", content: "Give one short aquarium maintenance tip." }],
        aquariumId: null,
        model: "standard",
      },
    },
    "dashboard-aquariums": {
      name: "dashboard-aquariums",
      method: "GET",
      path: "/rest/v1/aquariums?select=id,name,status,volume_gallons,type,created_at&order=created_at.desc&limit=20",
      readMode: "text",
      requiresBearer: true,
      targetP95Ms: 800,
      targetErrorRate: DEFAULT_ERROR_RATE_LIMIT,
    },
    "dashboard-tasks": {
      name: "dashboard-tasks",
      method: "GET",
      path: "/rest/v1/maintenance_tasks?select=id,aquarium_id,status,due_date&status=eq.pending&order=due_date.asc&limit=20",
      readMode: "text",
      requiresBearer: true,
      targetP95Ms: 800,
      targetErrorRate: DEFAULT_ERROR_RATE_LIMIT,
    },
  };
}

async function consumeResponseBody(response, readMode) {
  if (readMode === "firstChunk") {
    const reader = response.body?.getReader();
    if (!reader) return;
    try {
      await reader.read();
    } finally {
      await reader.cancel().catch(() => {});
    }
    return;
  }

  await response.text();
}

async function runSingleRequest(url, requestInit, timeoutMs, readMode) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      ...requestInit,
      signal: controller.signal,
    });

    await consumeResponseBody(response, readMode);

    const durationMs = performance.now() - startedAt;
    return {
      ok: response.ok,
      status: response.status,
      durationMs,
      error: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    const durationMs = performance.now() - startedAt;
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      ok: false,
      status: 0,
      durationMs,
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runScenario({ scenario, baseUrl, apikey, bearerToken, requests, concurrency, timeoutMs }) {
  if (scenario.requiresBearer && !bearerToken) {
    return {
      name: scenario.name,
      skipped: true,
      skipReason:
        "Missing bearer token (set LOAD_BEARER_TOKEN/SUPABASE_USER_JWT, " +
        "or LOAD_AUTH_EMAIL + LOAD_AUTH_PASSWORD).",
    };
  }

  const latencies = [];
  const failures = [];
  const statusCounts = {};
  const url = `${baseUrl}${scenario.path}`;
  const totalRequests = requests;

  let nextRequestIndex = 0;
  const workers = Math.min(concurrency, totalRequests);

  const baseHeaders = {
    apikey,
    Authorization: `Bearer ${bearerToken ?? apikey}`,
  };

  const requestInit = {
    method: scenario.method,
    headers: scenario.method === "GET"
      ? baseHeaders
      : {
          ...baseHeaders,
          "Content-Type": "application/json",
        },
    body: scenario.body ? JSON.stringify(scenario.body) : undefined,
  };

  const worker = async () => {
    while (nextRequestIndex < totalRequests) {
      const current = nextRequestIndex;
      nextRequestIndex += 1;
      if (current >= totalRequests) break;

      const result = await runSingleRequest(url, requestInit, timeoutMs, scenario.readMode);
      latencies.push(result.durationMs);
      statusCounts[result.status] = (statusCounts[result.status] ?? 0) + 1;
      if (!result.ok) {
        failures.push(result.error ?? "Unknown failure");
      }
    }
  };

  await Promise.all(Array.from({ length: workers }, () => worker()));

  const sorted = [...latencies].sort((a, b) => a - b);
  const successful = totalRequests - failures.length;
  const errorRate = totalRequests === 0 ? 0 : failures.length / totalRequests;
  const avgMs = totalRequests === 0
    ? 0
    : latencies.reduce((sum, ms) => sum + ms, 0) / totalRequests;

  const metrics = {
    requests: totalRequests,
    success: successful,
    failures: failures.length,
    errorRate: round(errorRate * 100),
    avgMs: round(avgMs),
    p50Ms: round(percentile(sorted, 50)),
    p95Ms: round(percentile(sorted, 95)),
    p99Ms: round(percentile(sorted, 99)),
    minMs: round(sorted[0] ?? 0),
    maxMs: round(sorted[sorted.length - 1] ?? 0),
    statusCounts,
  };

  const pass =
    errorRate <= scenario.targetErrorRate &&
    metrics.p95Ms <= scenario.targetP95Ms;

  return {
    name: scenario.name,
    skipped: false,
    pass,
    target: {
      p95Ms: scenario.targetP95Ms,
      errorRate: round(scenario.targetErrorRate * 100),
    },
    metrics,
    sampleFailures: failures.slice(0, 5),
  };
}

function printScenarioResult(result) {
  if (result.skipped) {
    console.log(`- ${result.name}: SKIPPED (${result.skipReason})`);
    return;
  }

  const status = result.pass ? "PASS" : "FAIL";
  const m = result.metrics;
  console.log(
    `- ${result.name}: ${status} | req=${m.requests} ok=${m.success} fail=${m.failures} ` +
      `error=${m.errorRate}% p95=${m.p95Ms}ms target<=${result.target.p95Ms}ms`
  );
}

async function main() {
  const cwd = process.cwd();
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const env = resolveEnv(cwd, options.noEnvFile);
  const rawBaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const apikey =
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY;

  if (!rawBaseUrl) {
    throw new Error("Missing SUPABASE_URL or VITE_SUPABASE_URL.");
  }
  if (!apikey) {
    throw new Error("Missing SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.");
  }

  const baseUrl = normalizeBaseUrl(rawBaseUrl);
  const allScenarios = createScenarios(env);
  const selectedScenarios = options.scenarios.map((name) => {
    const scenario = allScenarios[name];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${name}`);
    }
    return scenario;
  });

  if (options.dryRun) {
    console.log("Dry run configuration:");
    console.log(
      JSON.stringify(
        {
          baseUrl,
          hasBearerToken:
            Boolean(options.bearerToken) ||
            Boolean(env.LOAD_BEARER_TOKEN) ||
            Boolean(env.SUPABASE_USER_JWT) ||
            Boolean(env.SUPABASE_ACCESS_TOKEN),
          hasPasswordAuthCredentials:
            Boolean(options.authEmail || env.LOAD_AUTH_EMAIL) &&
            Boolean(options.authPassword || env.LOAD_AUTH_PASSWORD),
          requireAuth: options.requireAuth,
          requests: options.requests,
          concurrency: options.concurrency,
          timeoutMs: options.timeoutMs,
          scenarios: selectedScenarios.map((scenario) => ({
            name: scenario.name,
            method: scenario.method,
            path: scenario.path,
            requiresBearer: scenario.requiresBearer,
            targetP95Ms: scenario.targetP95Ms,
            targetErrorRatePercent: round(scenario.targetErrorRate * 100),
          })),
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  const authResolution = await resolveBearerToken({
    baseUrl,
    apikey,
    timeoutMs: options.timeoutMs,
    env,
    options,
    selectedScenarios,
  });
  const bearerToken = authResolution.token;

  console.log(`Running load tests against ${baseUrl}`);
  console.log(
    `Scenarios: ${selectedScenarios.map((scenario) => scenario.name).join(", ")} | ` +
      `requests/scenario=${options.requests} concurrency=${options.concurrency}`
  );
  if (authResolution.hasAuthScenario) {
    console.log(`Auth mode: ${authResolution.source}${bearerToken ? " (JWT available)" : " (no JWT)"}`);
  }

  const startedAt = new Date().toISOString();
  const scenarioResults = [];

  for (const scenario of selectedScenarios) {
    const result = await runScenario({
      scenario,
      baseUrl,
      apikey,
      bearerToken,
      requests: options.requests,
      concurrency: options.concurrency,
      timeoutMs: options.timeoutMs,
    });
    scenarioResults.push(result);
    printScenarioResult(result);
  }

  const finishedAt = new Date().toISOString();
  const executed = scenarioResults.filter((scenario) => !scenario.skipped);
  const skipped = scenarioResults.filter((scenario) => scenario.skipped);
  const overallPass = executed.length > 0 && executed.every((scenario) => scenario.pass);

  const report = {
    startedAt,
    finishedAt,
    baseUrl,
    options: {
      requests: options.requests,
      concurrency: options.concurrency,
      timeoutMs: options.timeoutMs,
      scenarios: options.scenarios,
      requireAuth: options.requireAuth,
      authMode: authResolution.source,
    },
    overall: {
      pass: overallPass,
      executedScenarios: executed.length,
      skippedScenarios: skipped.length,
    },
    scenarios: scenarioResults,
  };

  const timestamp = startedAt.replace(/[:.]/g, "-");
  const outputPath = options.out
    ? resolve(cwd, options.out)
    : resolve(cwd, "artifacts/load-tests", `load-report-${timestamp}.json`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`Report written to ${outputPath}`);
  if (skipped.length > 0) {
    console.log(`Skipped scenarios: ${skipped.map((item) => item.name).join(", ")}`);
  }
  console.log(`Overall status: ${overallPass ? "PASS" : "FAIL"}`);

  process.exit(overallPass ? 0 : 1);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Load test runner failed: ${message}`);
  process.exit(1);
});
