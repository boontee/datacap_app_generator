#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ─── Configuration ────────────────────────────────────────────────────────────
const BASE_URL   = process.env.DATACAP_URL      ?? "http://localhost:82/service";
const APP_NAME   = process.env.DATACAP_APP      ?? "APT";
const DC_USER    = process.env.DATACAP_USER     ?? "admin";
const DC_PASS    = process.env.DATACAP_PASSWORD ?? "admin";
const DC_STATION = process.env.DATACAP_STATION  ?? "1";

// ─── Session Management ───────────────────────────────────────────────────────
// Each tool call performs its own logon/logoff to stay stateless.
// Transaction tools that need session continuity across multiple calls
// use the wTmId cookie returned by logon directly.

interface Session {
  wTmId: string;
  application: string;
}

async function logon(application: string): Promise<Session> {
  const body = JSON.stringify({ application, user: DC_USER, password: DC_PASS, station: DC_STATION });
  const resp = await fetch(`${BASE_URL}/Session/Logon`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
  });
  if (!resp.ok) {
    const e = await resp.text().catch(() => String(resp.status));
    throw new Error(`Logon failed (${resp.status}): ${e}`);
  }
  const setCookie = resp.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/wTmId=([^;]+)/i);
  if (!match) throw new Error("Logon succeeded but no wTmId cookie returned");
  return { wTmId: match[1], application };
}

async function logoff(session: Session): Promise<void> {
  await fetch(`${BASE_URL}/Session/Logoff`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `wTmId=${session.wTmId}` },
    body: "{}",
  }).catch(() => { /* best-effort */ });
}

async function apiFetch<T>(session: Session, path: string, opts?: RequestInit): Promise<T> {
  const explicitCT = (opts?.headers as Record<string, string>)?.["Content-Type"];
  const headers: Record<string, string> = {
    Accept: "application/json",
    Cookie: `wTmId=${session.wTmId}`,
    ...(opts?.body && !explicitCT ? { "Content-Type": "application/json" } : {}),
    ...(opts?.headers as Record<string, string> ?? {}),
  };
  const resp = await fetch(`${BASE_URL}${path}`, { ...opts, headers });
  if (!resp.ok) {
    const e = await resp.text().catch(() => String(resp.status));
    throw new Error(`API ${path} failed (${resp.status}): ${e}`);
  }
  const text = await resp.text();
  try { return JSON.parse(text) as T; } catch { return text as unknown as T; }
}

async function withSession<T>(application: string, fn: (s: Session) => Promise<T>): Promise<T> {
  const session = await logon(application);
  try {
    return await fn(session);
  } finally {
    await logoff(session);
  }
}

// ─── Transaction Session Store ────────────────────────────────────────────────
// Keeps wTmId alive between transaction-start and transaction-end calls
// so all transaction tools share the same authenticated session cookie.
const txSessions = new Map<string, Session>();
// Tracks transactions that reused an external wTmId — these must NOT be logged off
// on transaction-end so the caller's session remains alive for log continuity.
const txExternalSessions = new Set<string>();

function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}
function err(text: string) {
  return { content: [{ type: "text" as const, text }], isError: true as const };
}

// ─── Helper: build multipart/form-data body for a file ───────────────────────
function buildMultipart(fileBytes: Buffer, fileName: string, mimeType = "application/octet-stream") {
  const boundary = `----DatacapBoundary${Date.now()}`;
  const CRLF = "\r\n";
  const head = Buffer.from(
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}` +
    `Content-Type: ${mimeType}${CRLF}${CRLF}`
  );
  const tail = Buffer.from(`${CRLF}--${boundary}--${CRLF}`);
  return { body: Buffer.concat([head, fileBytes, tail]), boundary };
}

// ─── MCP Server ───────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "mcp-datacap-server",
  version: "1.2.0",
});

// ─── Tool: list-applications ──────────────────────────────────────────────────
server.registerTool(
  "list-applications",
  {
    description: "List all Datacap applications registered in the Task Manager.",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const data = await (await fetch(`${BASE_URL}/Admin/GetApplicationList`, {
        headers: { Accept: "application/json" },
      })).json() as { Applications: string[] };
      return ok(JSON.stringify(data, null, 2));
    } catch (e) {
      return err(String(e));
    }
  }
);

// ─── Tool: get-workflow ───────────────────────────────────────────────────────
server.registerTool(
  "get-workflow",
  {
    description: "Get the workflow hierarchy (workflows → jobs → tasks) for a Datacap application.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name (e.g. APT)").optional(),
    }),
  },
  async ({ application }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch(s, `/Admin/GetWorkflowHierarchy/${app}`);
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: get-task-profiles ──────────────────────────────────────────────────
server.registerTool(
  "get-task-profiles",
  {
    description: "List all task profiles (ruleset execution profiles) defined in a Datacap application.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
    }),
  },
  async ({ application }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch(s, `/Admin/GetTaskProfileList/${app}`);
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: get-dco-list ───────────────────────────────────────────────────────
server.registerTool(
  "get-dco-list",
  {
    description: "List all SetupDCO document hierarchy definitions for a Datacap application.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
    }),
  },
  async ({ application }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch(s, `/Admin/GetSetupDCOList/${app}`);
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: get-dco-definition ─────────────────────────────────────────────────
server.registerTool(
  "get-dco-definition",
  {
    description: "Get the full SetupDCO XML definition (document types, page types, fields) for a Datacap application.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      dcoName:     z.string().describe("DCO name — usually same as application name").optional(),
    }),
  },
  async ({ application, dcoName }) => {
    const app = application ?? APP_NAME;
    const dco = dcoName ?? app;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch(s, `/Admin/GetSetupDCOFile/${app}/${dco}`);
        return ok(typeof data === "string" ? data : JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: list-batches ───────────────────────────────────────────────────────
server.registerTool(
  "list-batches",
  {
    description: "List batches in a Datacap application queue with optional filters.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      pageSize:    z.number().int().min(1).max(100).describe("Number of batches per page (default 20)").optional(),
      pageIndex:   z.number().int().min(1).describe("Page index starting at 1 (default 1)").optional(),
      sortColumn:  z.string().describe("Sort column — e.g. qu_id, qu_batch, qu_status (default qu_id)").optional(),
      filter:      z.string().describe("Optional filter expression e.g. qu_status==|pending").optional(),
    }),
  },
  async ({ application, pageSize = 20, pageIndex = 1, sortColumn = "qu_id", filter }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        // Filter is passed as a query parameter (not encoded — Datacap expects raw ==| syntax)
        let path = `/Queue/GetBatchList/${app}/${pageSize}/${pageIndex}/${sortColumn}`;
        if (filter) path += `?${filter}`;
        const data = await apiFetch(s, path);
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: get-batch ──────────────────────────────────────────────────────────
server.registerTool(
  "get-batch",
  {
    description: "Get attributes and status of a specific batch by its queue ID.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      queueId:     z.string().describe("Batch queue ID (e.g. 30)"),
    }),
  },
  async ({ application, queueId }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch(s, `/Queue/GetBatchAttributes/${app}/${queueId}`);
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: get-statistics ─────────────────────────────────────────────────────
server.registerTool(
  "get-statistics",
  {
    description: "Get processing statistics for a Datacap application: total counts, batches by task, average task time, and batch age.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      stat: z.enum(["counts", "by-task", "avg-time", "age", "all"])
            .describe("Which statistic to retrieve (default all)").optional(),
    }),
  },
  async ({ application, stat = "all" }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const results: Record<string, unknown> = {};
        if (stat === "counts"  || stat === "all") results.totalCounts = await apiFetch(s, `/Statistics/TotalCounts/${app}`);
        if (stat === "by-task" || stat === "all") results.batchByTask = await apiFetch(s, `/Statistics/BatchByTask/${app}`);
        if (stat === "avg-time"|| stat === "all") results.avgTaskTime = await apiFetch(s, `/Statistics/AvgTaskTime/${app}`);
        if (stat === "age"     || stat === "all") results.batchAge    = await apiFetch(s, `/Statistics/BatchAge/${app}`);
        return ok(JSON.stringify(stat === "all" ? results : Object.values(results)[0], null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: release-batch ──────────────────────────────────────────────────────
server.registerTool(
  "release-batch",
  {
    description: "Release a grabbed batch back to the queue with a given status. Typical status values: finished, hold, cancelled, aborted.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      queueId:     z.string().describe("Batch queue ID"),
      status:      z.enum(["finished", "hold", "cancelled", "aborted", "offline"])
                   .describe("Status to release the batch with"),
    }),
  },
  async ({ application, queueId, status }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch(s, `/Queue/ReleaseBatch/${app}/${queueId}/${status}`, { method: "PUT" });
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: get-batch-history ──────────────────────────────────────────────────
server.registerTool(
  "get-batch-history",
  {
    description: "Get the processing history (task progression log) for a specific batch.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      queueId:     z.string().describe("Batch queue ID"),
    }),
  },
  async ({ application, queueId }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch(s, `/Queue/GetBatchHistory/${app}/${queueId}`);
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: get-page-file ──────────────────────────────────────────────────────
server.registerTool(
  "get-page-file",
  {
    description: "Get the current page file (DCO XML with extracted field values and batch state) for a batch.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      queueId:     z.string().describe("Batch queue ID"),
    }),
  },
  async ({ application, queueId }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch<string>(s, `/Queue/GetPageFile/${app}/${queueId}`);
        return ok(typeof data === "string" ? data : JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: create-batch ───────────────────────────────────────────────────────
server.registerTool(
  "create-batch",
  {
    description:
      "Create a new batch in a Datacap application and set it to running status. " +
      "Returns the queueId needed for subsequent upload-file and execute-rules calls. " +
      "jobName and taskName must match entries visible in get-workflow.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      jobName:     z.string().describe("Workflow job name to create the batch under (e.g. Demo)"),
      taskName:    z.string().describe("Task name to start at (e.g. VScan, Batch Profiler)"),
    }),
  },
  async ({ application, jobName, taskName }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const body = JSON.stringify({ application: app, job: jobName, task: taskName });
        const data = await apiFetch<{
          queueId: number; batchId: string; batchdir: string; status: string; job: string; task: string;
        }>(s, "/Queue/CreateBatch", { method: "POST", body });
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: upload-file ────────────────────────────────────────────────────────
server.registerTool(
  "upload-file",
  {
    description:
      "Upload a local image file (TIFF, PDF) to an existing grabbed batch. " +
      "The batch must be in 'running' status (call grab-batch first). " +
      "Returns the pageId assigned to the uploaded image (e.g. TM000001).",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      queueId:     z.string().describe("Batch queue ID returned by create-batch or list-batches"),
      filePath:    z.string().describe("Absolute path to the image file on the server (e.g. C:\\Datacap\\APT\\images\\Input\\APT001.tif)"),
    }),
  },
  async ({ application, queueId, filePath }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const fs = await import("fs");
        const path = await import("path");
        const fileBytes = fs.readFileSync(filePath);
        const fileName  = path.basename(filePath);
        const ext       = path.extname(filePath).toLowerCase();
        const mimeType  = ext === ".pdf" ? "application/pdf" : "image/tiff";
        const { body, boundary } = buildMultipart(fileBytes, fileName, mimeType);
        const resp = await fetch(`${BASE_URL}/Queue/UploadFile/${app}/${queueId}`, {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            Accept: "application/json",
            Cookie: `wTmId=${s.wTmId}`,
          },
          body,
        });
        if (!resp.ok) {
          const e = await resp.text().catch(() => String(resp.status));
          throw new Error(`UploadFile failed (${resp.status}): ${e}`);
        }
        const data = await resp.json();
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: grab-batch ─────────────────────────────────────────────────────────
server.registerTool(
  "grab-batch",
  {
    description:
      "Grab a pending batch and set its status to running so files can be uploaded and rules executed. " +
      "Use grab-next-batch to grab the next available pending batch automatically.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      queueId:     z.string().describe("Batch queue ID to grab"),
    }),
  },
  async ({ application, queueId }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const resp = await fetch(`${BASE_URL}/Queue/GrabBatch/${app}/${queueId}`, {
          method: "PUT",
          headers: { Accept: "application/json", Cookie: `wTmId=${s.wTmId}` },
        });
        if (!resp.ok) {
          const e = await resp.text().catch(() => String(resp.status));
          throw new Error(`GrabBatch failed (${resp.status}): ${e}`);
        }
        const text = await resp.text();
        return ok(text.trim() || `Grabbed batch queueId: ${queueId}`);
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: grab-next-batch ────────────────────────────────────────────────────
server.registerTool(
  "grab-next-batch",
  {
    description:
      "Grab the next available pending batch for a given job and task, set it to running, and return its queue ID. " +
      "Returns -1 if no pending batches are available.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      jobName:     z.string().describe("Job name (e.g. Demo)"),
      taskName:    z.string().describe("Task name (e.g. Batch Profiler)"),
    }),
  },
  async ({ application, jobName, taskName }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const resp = await fetch(
          `${BASE_URL}/Queue/GrabNextPendingBatchOnJobTaskList/${app}/${encodeURIComponent(jobName)}/${encodeURIComponent(taskName)}`,
          { method: "PUT", headers: { Accept: "application/json", Cookie: `wTmId=${s.wTmId}` } }
        );
        if (!resp.ok) {
          const e = await resp.text().catch(() => String(resp.status));
          throw new Error(`GrabNextPending failed (${resp.status}): ${e}`);
        }
        const text = await resp.text();
        const queueId = text.trim().replace(/"/g, "");
        if (queueId === "-1") return ok("No pending batches available for this job/task.");
        return ok(`Grabbed batch queueId: ${queueId}`);
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: transaction-start ─────────────────────────────────────────────────
// Logs on, starts a transaction, and keeps the session alive in txSessions
// so that transaction-set-file / transaction-execute / transaction-get-file /
// transaction-end all share the same wTmId cookie.
// If wTmId is supplied the logon step is skipped and the existing session is reused,
// keeping all calls in the same RRS log file.
server.registerTool(
  "transaction-start",
  {
    description:
      "Start a new Datacap Transaction for stateless rule execution. " +
      "Returns a transactionId (GUID) that must be passed to transaction-set-file, " +
      "transaction-execute, transaction-get-file, and transaction-end. " +
      "Use this flow instead of the Queue-based flow when you want to run rules on files " +
      "without creating a persistent batch record. " +
      "Pass wTmId to reuse an existing session and keep all calls in the same RRS log file " +
      "(skips Logon — caller is responsible for calling Logoff when fully done).",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      wTmId: z.string().describe("Existing session cookie value to reuse (skips Logon)").optional(),
    }),
  },
  async ({ application, wTmId }) => {
    const app = application ?? APP_NAME;
    try {
      // If an existing wTmId is supplied, reuse it — skip logon so the RRS log stays continuous
      let session: Session;
      let skipLogoffOnError = false;
      if (wTmId) {
        session = { wTmId, application: app };
        skipLogoffOnError = true;
      } else {
        // Logon and keep the session alive — do NOT call logoff here
        session = await logon(app);
      }
      const resp = await fetch(`${BASE_URL}/Transaction/Start`, {
        method: "GET",
        headers: { Accept: "application/json", Cookie: `wTmId=${session.wTmId}` },
      });
      if (!resp.ok) {
        if (!skipLogoffOnError) await logoff(session);
        const e = await resp.text().catch(() => String(resp.status));
        throw new Error(`Transaction/Start failed (${resp.status}): ${e}`);
      }
      const text = await resp.text();
      const txId  = text.replace(/<[^>]+>/g, "").replace(/"/g, "").trim();
      // Extract GUID
      const guidMatch = txId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (!guidMatch) {
        if (!skipLogoffOnError) await logoff(session);
        throw new Error(`Transaction/Start returned unexpected response: ${text}`);
      }
      const transactionId = guidMatch[0];
      // Store session so subsequent transaction tools can reuse the same wTmId
      txSessions.set(transactionId, session);
      if (skipLogoffOnError) txExternalSessions.add(transactionId);
      return ok(`transactionId: ${transactionId}\nwTmId: ${session.wTmId}`);
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: transaction-set-file ───────────────────────────────────────────────
server.registerTool(
  "transaction-set-file",
  {
    description:
      "Upload a file into a Datacap Transaction's temporary workspace. " +
      "Call this for BOTH the page file (e.g. fileName=VScan, fileExt=xml) AND each image file " +
      "(e.g. fileName=TM000001, fileExt=tif) before calling transaction-execute. " +
      "The page file must be a valid DCO XML batch file using <B>/<P>/<V> tags. " +
      "filePath must be an absolute path on the server.",
    inputSchema: z.object({
      application:   z.string().describe("Datacap application name").optional(),
      transactionId: z.string().describe("Transaction GUID from transaction-start"),
      fileName:      z.string().describe("File name without extension (e.g. VScan or TM000001)"),
      fileExt:       z.string().describe("File extension without dot (e.g. xml or tif)"),
      filePath:      z.string().describe("Absolute path to the file on the server (e.g. C:\\Datacap\\APT\\images\\Input\\APT001.tif)"),
    }),
  },
  async ({ application, transactionId, fileName, fileExt, filePath }) => {
    const app = application ?? APP_NAME;
    try {
      // Reuse stored session if available, otherwise start a new one (best-effort)
      const session = txSessions.get(transactionId) ?? await logon(app);
      const fs        = await import("fs");
      const path      = await import("path");
      const fileBytes = fs.readFileSync(filePath);
      const ext       = path.extname(filePath).toLowerCase().slice(1);
      const isImage   = ["tif", "tiff", "pdf", "jpg", "jpeg", "png"].includes(ext);

      let respOk = false;
      let respText = "";

      if (isImage) {
        // Images must be sent as multipart/form-data
        const baseName = path.basename(filePath);
        const mimeType = ext === "pdf" ? "application/pdf" : "image/tiff";
        const { body, boundary } = buildMultipart(fileBytes, baseName, mimeType);
        const resp = await fetch(`${BASE_URL}/Transaction/SetFile/${transactionId}/${fileName}/${fileExt}`, {
          method: "POST",
          headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            Cookie: `wTmId=${session.wTmId}`,
          },
          body,
        });
        respOk   = resp.ok;
        respText = await resp.text().catch(() => String(resp.status));
        if (!respOk) throw new Error(`Transaction/SetFile failed (${resp.status}): ${respText}`);
      } else {
        // XML / other text files as raw octet-stream
        const resp = await fetch(`${BASE_URL}/Transaction/SetFile/${transactionId}/${fileName}/${fileExt}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            Cookie: `wTmId=${session.wTmId}`,
          },
          body: fileBytes,
        });
        respOk   = resp.ok;
        respText = await resp.text().catch(() => String(resp.status));
        if (!respOk) throw new Error(`Transaction/SetFile failed (${resp.status}): ${respText}`);
      }

      return ok(`Uploaded ${fileName}.${fileExt} (${fileBytes.length} bytes) to transaction ${transactionId}`);
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: transaction-set-page-xml ──────────────────────────────────────────
server.registerTool(
  "transaction-set-page-xml",
  {
    description:
      "Upload a DCO page XML string directly into a Datacap Transaction. " +
      "Use this instead of transaction-set-file when the page XML content is generated inline " +
      "rather than read from disk. The xml must use Datacap DCO format: " +
      "<B id='Transaction'><V n='TYPE'>AppName</V>" +
      "<P id='TM000001'><V n='TYPE'>Other</V><V n='STATUS'>0</V><V n='IMAGEFILE'>TM000001.tif</V></P></B>",
    inputSchema: z.object({
      application:   z.string().describe("Datacap application name").optional(),
      transactionId: z.string().describe("Transaction GUID from transaction-start"),
      fileName:      z.string().describe("Page file name without extension (e.g. VScan)").optional(),
      xmlContent:    z.string().describe("Full DCO XML content for the page file"),
    }),
  },
  async ({ application, transactionId, fileName = "VScan", xmlContent }) => {
    const app = application ?? APP_NAME;
    try {
      const session  = txSessions.get(transactionId) ?? await logon(app);
      const bytes    = Buffer.from(xmlContent, "utf-8");
      const resp     = await fetch(`${BASE_URL}/Transaction/SetFile/${transactionId}/${fileName}/xml`, {
        method:  "POST",
        headers: { "Content-Type": "application/octet-stream", Cookie: `wTmId=${session.wTmId}` },
        body:    bytes,
      });
      if (!resp.ok) {
        const e = await resp.text().catch(() => String(resp.status));
        throw new Error(`Transaction/SetFile (xml) failed (${resp.status}): ${e}`);
      }
      return ok(`Uploaded ${fileName}.xml (${bytes.length} bytes) to transaction ${transactionId}`);
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: transaction-execute ────────────────────────────────────────────────
server.registerTool(
  "transaction-execute",
  {
    description:
      "Execute one or more Datacap rulesets within a Transaction. " +
      "rulesets must be a comma-separated list of ruleset names exactly as they appear in " +
      "collection.xml (e.g. 'PageID', 'CreateDocs', 'Recognize,Validate'). " +
      "For global action DLLs append .Rul.dll (e.g. 'ImageEnhancement.Rul.dll'). " +
      "pageFile is the name+ext of the page file uploaded via transaction-set-file (e.g. 'VScan.xml'). " +
      "Returns Status (0=success), DocumentCount, PageCount, and any Messages.",
    inputSchema: z.object({
      application:   z.string().describe("Datacap application name").optional(),
      transactionId: z.string().describe("Transaction GUID from transaction-start"),
      rulesets:      z.string().describe("Comma-separated ruleset names from collection.xml (e.g. 'PageID' or 'CreateDocs,PageID')"),
      pageFile:      z.string().describe("Page file name with extension uploaded earlier (e.g. VScan.xml)").optional(),
      taskProfile:   z.string().describe("Task profile name for context (e.g. 'Batch Profiler')").optional(),
      workflow:      z.string().describe("Workflow name — usually same as application name").optional(),
    }),
  },
  async ({ application, transactionId, rulesets, pageFile = "VScan.xml", taskProfile = "", workflow }) => {
    const app = application ?? APP_NAME;
    try {
      const session = txSessions.get(transactionId) ?? await logon(app);
      const body = JSON.stringify({
        TransactionId:   transactionId,
        Application:     app,
        Workflow:        workflow ?? app,
        PageFile:        pageFile,
        Rulesets:        rulesets,
        TaskProfile:     taskProfile,
        TargetDCOObject: "",
      });
      const resp = await fetch(`${BASE_URL}/Transaction/Execute`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Cookie: `wTmId=${session.wTmId}` },
        body,
      });
      if (!resp.ok) {
        const e = await resp.text().catch(() => String(resp.status));
        throw new Error(`Transaction/Execute failed (${resp.status}): ${e}`);
      }
      const data = await resp.json() as { Status: number; DocumentCount: number; PageCount: number; Messages: unknown };
      return ok(JSON.stringify(data, null, 2));
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: transaction-get-file ───────────────────────────────────────────────
server.registerTool(
  "transaction-get-file",
  {
    description:
      "Retrieve a file from a Datacap Transaction's temporary workspace after rule execution. " +
      "Typically used to read back the updated DCO page file (e.g. VScan.xml) to inspect " +
      "classification results, extracted field values, and page statuses. " +
      "Also supports fetching field data files (e.g. fileName=tm000001, fileExt=xml) and " +
      "full-page CCO word maps (e.g. fileName=tm000001c, fileExt=xml).",
    inputSchema: z.object({
      application:   z.string().describe("Datacap application name").optional(),
      transactionId: z.string().describe("Transaction GUID from transaction-start"),
      fileName:      z.string().describe("File name without extension (e.g. VScan, tm000001, tm000001c)").optional(),
      fileExt:       z.string().describe("File extension without dot (e.g. xml)").optional(),
    }),
  },
  async ({ application, transactionId, fileName = "VScan", fileExt = "xml" }) => {
    const app = application ?? APP_NAME;
    try {
      const session = txSessions.get(transactionId) ?? await logon(app);
      const resp = await fetch(`${BASE_URL}/Transaction/GetFile/${transactionId}/${fileName}/${fileExt}`, {
        headers: { Cookie: `wTmId=${session.wTmId}` },
      });
      if (!resp.ok) {
        const e = await resp.text().catch(() => String(resp.status));
        throw new Error(`Transaction/GetFile failed (${resp.status}): ${e}`);
      }
      const text = await resp.text();
      return ok(text);
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: transaction-end ────────────────────────────────────────────────────
server.registerTool(
  "transaction-end",
  {
    description:
      "End a Datacap Transaction and clean up its temporary workspace. " +
      "Always call this after transaction-get-file to release server resources. " +
      "Set keepAlive=true to skip Session/Logoff so the user can inspect the batch " +
      "folder and RRS log before the session is closed. The returned wTmId can be " +
      "passed to a subsequent transaction-start to reuse the same session.",
    inputSchema: z.object({
      application:   z.string().describe("Datacap application name").optional(),
      transactionId: z.string().describe("Transaction GUID to end"),
      keepAlive:     z.boolean().describe("Skip Session/Logoff — keep session open for inspection").optional(),
    }),
  },
  async ({ application, transactionId, keepAlive }) => {
    const app = application ?? APP_NAME;
    try {
      const session = txSessions.get(transactionId) ?? await logon(app);
      const resp = await fetch(`${BASE_URL}/Transaction/End/${transactionId}`, {
        method:  "DELETE",
        headers: { Cookie: `wTmId=${session.wTmId}` },
      });
      // Clean up stored session — skip logoff if external session or keepAlive requested
      const isExternal = txExternalSessions.has(transactionId);
      txSessions.delete(transactionId);
      txExternalSessions.delete(transactionId);
      if (!isExternal && !keepAlive) await logoff(session);
      if (!resp.ok) {
        const e = await resp.text().catch(() => String(resp.status));
        throw new Error(`Transaction/End failed (${resp.status}): ${e}`);
      }
      if (keepAlive && !isExternal) {
        return ok(`Transaction ${transactionId} ended. Session kept alive.\nwTmId: ${session.wTmId}\nPass this wTmId to transaction-start to reuse the session.`);
      }
      return ok(`Transaction ${transactionId} ended.`);
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: transaction-run ────────────────────────────────────────────────────
// Single-call helper: Logon → Transaction/Start → SetFile VScan.xml →
// SetFile image → Execute → GetFile VScan.xml → End → Logoff
// All steps share the same persistent HTTP session so the wTmId cookie
// is correctly propagated, matching the proven Postman/PowerShell flow.
server.registerTool(
  "transaction-run",
  {
    description:
      "Run a complete Datacap Transaction in a single call: " +
      "Logon → Transaction/Start → SetFile page XML → SetFile image → Execute rulesets → " +
      "GetFile results → Transaction/End → Logoff. " +
      "Returns the full DCO result XML from VScan.xml plus optionally tm000001.xml and tm000001c.xml. " +
      "Use this instead of the individual transaction-* tools when you want a one-shot pipeline.",
    inputSchema: z.object({
      application:  z.string().describe("Datacap application name").optional(),
      imagePath:    z.string().describe("Absolute path to the image file on the server (e.g. C:\\Datacap\\TravelDocs\\Images\\Car1.tif)"),
      rulesets:     z.string().describe("Comma-separated ruleset names from collection.xml (e.g. 'ImageFix,PageID,CreateDocs,Recognize,Validate')"),
      taskProfile:  z.string().describe("Task profile name (e.g. 'TransactionCaptureOCR', 'Batch Profiler')").optional(),
      pageFileName: z.string().describe("Page ID to assign to the image, default TM000001").optional(),
      extraFiles:   z.array(z.string()).describe("Additional file names (no extension) to fetch after execute, e.g. ['tm000001', 'tm000001c']").optional(),
    }),
  },
  async ({ application, imagePath, rulesets, taskProfile = "", pageFileName = "TM000001", extraFiles = [] }) => {
    const app = application ?? APP_NAME;
    const fs   = await import("fs");
    const path = await import("path");

    let session: Session | null = null;
    let transactionId = "";

    try {
      // ── 1. Logon ────────────────────────────────────────────────────────────
      session = await logon(app);

      // ── 2. Transaction/Start ────────────────────────────────────────────────
      const startResp = await fetch(`${BASE_URL}/Transaction/Start`, {
        method: "GET",
        headers: { Accept: "application/json", Cookie: `wTmId=${session.wTmId}` },
      });
      if (!startResp.ok) throw new Error(`Transaction/Start failed (${startResp.status})`);
      const startText = await startResp.text();
      const guidMatch = startText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (!guidMatch) throw new Error(`Transaction/Start bad response: ${startText}`);
      transactionId = guidMatch[0];

      // ── 3. SetFile VScan.xml ─────────────────────────────────────────────────
      const vscanXml = Buffer.from(
        `<?xml-stylesheet type="text/xsl" href="..\\..\\dco.xsl"?>\r\n` +
        `<B id="Transaction"><V n="TYPE">${app}</V>` +
        `<P id="${pageFileName}"><V n="TYPE">Other</V><V n="STATUS">0</V>` +
        `<V n="IMAGEFILE">${pageFileName}.tif</V></P></B>`,
        "utf-8"
      );
      const setXmlResp = await fetch(`${BASE_URL}/Transaction/SetFile/${transactionId}/VScan/xml`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream", Cookie: `wTmId=${session.wTmId}` },
        body: vscanXml,
      });
      if (!setXmlResp.ok) throw new Error(`SetFile VScan.xml failed (${setXmlResp.status})`);

      // ── 4. SetFile image ─────────────────────────────────────────────────────
      const imageBytes = fs.readFileSync(imagePath);
      const imageName  = path.basename(imagePath);
      const imageExt   = path.extname(imagePath).toLowerCase().slice(1);
      const mimeType   = imageExt === "pdf" ? "application/pdf" : "image/tiff";
      const { body: mpBody, boundary } = buildMultipart(imageBytes, imageName, mimeType);
      const setImgResp = await fetch(`${BASE_URL}/Transaction/SetFile/${transactionId}/${pageFileName}/${imageExt}`, {
        method: "POST",
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, Cookie: `wTmId=${session.wTmId}` },
        body: mpBody,
      });
      if (!setImgResp.ok) throw new Error(`SetFile image failed (${setImgResp.status})`);

      // ── 5. Execute ───────────────────────────────────────────────────────────
      const execBody = JSON.stringify({
        TransactionId: transactionId,
        Application:   app,
        Workflow:      app,
        PageFile:      "VScan.xml",
        TaskProfile:   taskProfile,
        Rulesets:      rulesets,
      });
      const execResp = await fetch(`${BASE_URL}/Transaction/Execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Cookie: `wTmId=${session.wTmId}` },
        body: execBody,
      });
      if (!execResp.ok) {
        const e = await execResp.text().catch(() => String(execResp.status));
        throw new Error(`Transaction/Execute failed (${execResp.status}): ${e}`);
      }
      const execResult = await execResp.json() as { Status: number; DocumentCount: number; PageCount: number; Messages: unknown };

      // ── 6. GetFile VScan.xml ─────────────────────────────────────────────────
      const getVscanResp = await fetch(`${BASE_URL}/Transaction/GetFile/${transactionId}/VScan/xml`, {
        headers: { Cookie: `wTmId=${session.wTmId}` },
      });
      if (!getVscanResp.ok) throw new Error(`GetFile VScan.xml failed (${getVscanResp.status})`);
      const vscanResult = await getVscanResp.text();

      // ── 6b. Get extra files (e.g. tm000001.xml, tm000001c.xml) ───────────────
      const extraResults: Record<string, string> = {};
      for (const extra of extraFiles) {
        try {
          const r = await fetch(`${BASE_URL}/Transaction/GetFile/${transactionId}/${extra}/xml`, {
            headers: { Cookie: `wTmId=${session.wTmId}` },
          });
          if (r.ok) extraResults[`${extra}.xml`] = await r.text();
        } catch { /* best-effort */ }
      }

      // ── 7. Transaction/End ───────────────────────────────────────────────────
      await fetch(`${BASE_URL}/Transaction/End/${transactionId}`, {
        method:  "DELETE",
        headers: { Cookie: `wTmId=${session.wTmId}` },
      }).catch(() => { /* best-effort */ });

      // ── 8. Logoff ────────────────────────────────────────────────────────────
      await logoff(session);
      session = null;

      // ── Build output ─────────────────────────────────────────────────────────
      const lines = [
        `=== Execute Result ===`,
        JSON.stringify(execResult, null, 2),
        `\n=== VScan.xml (DCO) ===`,
        vscanResult,
      ];
      for (const [name, content] of Object.entries(extraResults)) {
        lines.push(`\n=== ${name} ===`);
        lines.push(content);
      }
      return ok(lines.join("\n"));

    } catch (e) {
      // Cleanup on error
      if (transactionId) {
        await fetch(`${BASE_URL}/Transaction/End/${transactionId}`, {
          method: "DELETE",
          headers: { Cookie: `wTmId=${session?.wTmId ?? ""}` },
        }).catch(() => { /* best-effort */ });
      }
      if (session) await logoff(session).catch(() => { /* best-effort */ });
      return err(String(e));
    }
  }
);

// ─── Tool: delete-batch ───────────────────────────────────────────────────────
server.registerTool(
  "delete-batch",
  {
    description:
      "Delete a batch and its batch folder from a Datacap application. " +
      "Use this to clean up test batches after inspection. " +
      "This action is irreversible.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      queueId:     z.string().describe("Batch queue ID to delete"),
    }),
  },
  async ({ application, queueId }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const body = JSON.stringify({ application: app, batchIds: [queueId] });
        const data = await apiFetch(s, `/Queue/DeleteBatches/${app}`, { method: "POST", body });
        return ok(typeof data === "string" && data.trim() === "" ? `Batch ${queueId} deleted.` : JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: get-task-list ──────────────────────────────────────────────────────
server.registerTool(
  "get-task-list",
  {
    description:
      "List all tasks defined in a Datacap application (flat list, jobIndex=-3 = all jobs). " +
      "Returns task names, IDs, and associated job info. " +
      "Use this to discover valid taskName values for create-batch and grab-next-batch.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
    }),
  },
  async ({ application }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch(s, `/Admin/GetTaskList/${app}/-3`);
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: queue-set-file ─────────────────────────────────────────────────────
server.registerTool(
  "queue-set-file",
  {
    description:
      "Upload or replace a file on an existing grabbed batch in the Datacap queue. " +
      "Use this to update the DCO page file (e.g. VScan.xml) or add/replace an image " +
      "on a batch that is already in 'running' status. " +
      "Content-Type is always application/octet-stream — do not use multipart here.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      queueId:     z.string().describe("Batch queue ID (must be in running status)"),
      fileName:    z.string().describe("File name without extension (e.g. VScan or TM000001)"),
      fileExt:     z.string().describe("File extension without dot (e.g. xml or tif)"),
      filePath:    z.string().describe("Absolute path to the file on the server"),
    }),
  },
  async ({ application, queueId, fileName, fileExt, filePath }) => {
    const app = application ?? APP_NAME;
    try {
      return await withSession(app, async (s) => {
        const fs        = await import("fs");
        const fileBytes = fs.readFileSync(filePath);
        const resp = await fetch(`${BASE_URL}/Queue/SetFile/${app}/${queueId}/${fileName}/${fileExt}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            Cookie: `wTmId=${s.wTmId}`,
          },
          body: fileBytes,
        });
        if (!resp.ok) {
          const e = await resp.text().catch(() => String(resp.status));
          throw new Error(`Queue/SetFile failed (${resp.status}): ${e}`);
        }
        const text = await resp.text();
        return ok(text.trim() || `Uploaded ${fileName}.${fileExt} (${fileBytes.length} bytes) to batch ${queueId}`);
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Tool: get-fingerprint-list ───────────────────────────────────────────────
server.registerTool(
  "get-fingerprint-list",
  {
    description: "List fingerprint templates registered for a page type in a Datacap application.",
    inputSchema: z.object({
      application: z.string().describe("Datacap application name").optional(),
      pageType:    z.string().describe("Page type name (e.g. InvoicePage)"),
      dcoName:     z.string().describe("DCO name — usually same as application name").optional(),
    }),
  },
  async ({ application, pageType, dcoName }) => {
    const app = application ?? APP_NAME;
    const dco = dcoName ?? app;
    try {
      return await withSession(app, async (s) => {
        const data = await apiFetch(s, `/Admin/GetFingerprintList/${app}/${pageType}/${dco}`);
        return ok(JSON.stringify(data, null, 2));
      });
    } catch (e) { return err(String(e)); }
  }
);

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`mcp-datacap-server v1.2.0 running — base: ${BASE_URL}, default app: ${APP_NAME}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
