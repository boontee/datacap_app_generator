# Datacap App Generator

> **Bob Mode:** `datacap-app-generator`  
> **Target Platform:** IBM Datacap 9.1.10  
> **Repository:** [github.com/boontee/datacap_app_generator](https://github.com/boontee/datacap_app_generator)  
> **Mode file:** [`.bob/custom_modes.yaml`](.bob/custom_modes.yaml)  
> **Plan file:** [`datacap-app-generator-plan.md`](datacap-app-generator-plan.md)

---

## Overview

The **Datacap App Generator** is a guided, two-phase IBM Bob assistant mode that produces a complete
IBM Datacap 9.1.10 application scaffold from scratch. It replaces manual Datacap Studio
configuration for the initial application structure, ruleset skeletons, and C# action projects.

**You answer questions. It generates files.**

```
[Section 1/6] Application Identity
  ↓  confirmed
[Section 2/6] Document Hierarchy
  ↓  confirmed
  ...
[Section 6/6] Non-Functional Requirements
  ↓  confirmed
→  requirements.json written
→  Pre-generation validation
→  All files generated under output/<AppName>/
→  Deployment checklist printed
```

---

## Quick Start

1. Open this repository in IBM Bob.
2. Select **"Datacap App Generator"** from the mode picker (bottom-left).
3. Describe your application — e.g. *"I need a Datacap app for AP invoice processing"*.
4. Answer the intake questions across 6 sections.
5. Confirm generation — all files are written to `output/<AppName>/`.

---

## Two-Phase Process

### Phase 1 — Intake

A structured Q&A conversation across **6 sections**. Each section is confirmed before moving to the next. Answers are incrementally written to `output/<AppName>/requirements.json`.

| # | Section | Key Outputs |
|---|---------|-------------|
| 1 | **Application Identity** | App name, server, DSNs, install path |
| 2 | **Document Hierarchy** | Document types → page types → fields, line items, dictionaries, lookups |
| 3 | **Workflow Design** | Input method, verification client, Rulerunner tasks, branching, batch split |
| 4 | **Recognition Configuration** | OCR engine, ICR, barcodes, locale, zone vs full-page mode |
| 5 | **Integration Points** | Export targets, lookup DBs, custom C# action definitions |
| 6 | **Non-Functional Requirements** | Volume, HA, environment, secrets strategy, README flag |

**Resume support:** if `output/<AppName>/requirements.json` already exists, the mode asks whether to resume from it or start fresh.

### Phase 2 — Generation

After all sections are confirmed the mode runs **pre-generation validation**, then writes every output file in order. Each file is logged as it is written.

---

## Generated Output

All files land in `output/<AppName>/`.

```
output/<AppName>/
│
├── requirements.json                      ← single source of truth (intake output)
│
├── dco_<AppName>/
│   ├── <AppName>.xml                      ← SetupDCO document hierarchy
│   └── rules/
│       ├── collection.xml                 ← ruleset registry
│       ├── PageID.rul                     ← fingerprint / barcode / text / pattern match
│       ├── Recognition.rul                ← OCR_S / OCR_A / ICR_C / voting / PDF
│       ├── Validation.rul                 ← per-field: required, date, numeric, regex, lookup
│       ├── Export.rul                     ← FileNet P8 / IBM CM / SharePoint / CMIS /
│       │                                     ODBC / XML / CSV / REST per target
│       ├── Convert.rul                    ← (if inputMethod = pdf_convert)
│       ├── ImageEnhance.rul               ← (if imageEnhancement = true)
│       └── ManualPageID.rul               ← (if manualPageID = true)
│
├── <AppName>.app                          ← application manager config
│
├── CustomActions/                         ← (if customActions.required = true)
│   ├── CustomActions.cs                   ← C# action library stubs
│   ├── CustomActions.csproj               ← VS 2022, x86, net48, COM-visible
│   └── CustomActions.rrx                  ← RRX action declarations
│
└── README.md                              ← deployment checklist (if generateReadme = true)
```

### Template Sources

| Generated File | Base Template |
|----------------|---------------|
| `<AppName>.xml` | `templates/dco-xml/AppName.xml` |
| `collection.xml` | `templates/rulesets/collection.xml` |
| `CustomActions.cs` | `templates/custom-action/CustomActions.cs` |
| `CustomActions.csproj` | `templates/custom-action/CustomActions.csproj` |
| `CustomActions.rrx` | `templates/custom-action/CustomActions.rrx` |
| `<AppName>.app` | `templates/app-config/AppName.app` |
| `.gitignore` | `templates/gitignore.txt` (if `nfr.sourceControl=true`) |
| Ruleset `.rul` files | Generated inline (no base template) |

---

## Pre-Generation Validation

The mode blocks file generation if any of these checks fail:

| Check | Severity |
|-------|----------|
| `app.name` matches `^[A-Z][a-zA-Z0-9]+$` (PascalCase) | 🔴 Error — blocks |
| At least 1 document type defined | 🔴 Error — blocks |
| Each page type has at least 1 field | 🔴 Error — blocks |
| Every `pageIDMethod` is set | 🔴 Error — blocks |
| `workflow.inputMethod` is set | 🔴 Error — blocks |
| `customActions.required=true` but `actions[]` empty | 🔴 Error — blocks |
| `integrations.exports[]` is empty | 🟡 Warning — user confirms |
| Fingerprint method used but `autoFingerprint=false` | 🟡 Warning — user confirms |
| `rest_api` export but no `authType` set | 🟡 Warning — user confirms |

---

## Generation Invariants

These rules are enforced by the mode regardless of user answers:

- **No invented requirements** — every generated line traces to an intake answer.
- **No hard-coded paths** — smart parameters (`@APPPATH`, `@APPVAR`, `@BATCHID`) used everywhere.
- **No hard-coded secrets** — passwords go in `.app` as `@APPVAR` keys, or as `TODO` placeholders.
- **Real actions only** — every ruleset action exists in `knowledge-base/datacap-application-development-guide-v9.md`.
- **Unknown catch-all always included** — `SetupDCO XML` always contains an `<Unknown>` document type.
- **Unidentified page fallback always present** — `PageID.rul` always has a `Task_RaiseCondition(UnidentifiedPage)` path when `manualPageID=true`.
- **C# actions follow the template pattern** — `[ComVisible(true)]`, `x86`, `net48`, IDCO API, `RRLog` logging.

---

## Knowledge Base

The mode reads these files during generation:

| File | Purpose |
|------|---------|
| `knowledge-base/datacap-application-development-guide-v9.md` | Action library reference — every action in every `.rul` file is sourced here |
| `knowledge-base/datacap-app-structure.md` | Canonical folder layout, `.app` INI format, source control matrix |
| `knowledge-base/datacap-development-best-practices.md` | Coding standards, security, deployment pitfalls |
| `knowledge-base/datacap-ibm-docs-reference-9.1.8.md` | IDCO API for C# custom actions |
| `knowledge-base/datacap-ibm-docs-developing-applications.md` | Workflow task configuration, web client setup, 9.1.10 specifics |
| `knowledge-base/datacap-sample-applications.md` | Real-world DCO hierarchy examples |
| `knowledge-base/datacap-watsonx-ai-integration.md` | watsonx.ai classification and KVP extraction patterns |

---

## MCP Datacap Server

This repo includes a custom MCP server (`mcp-datacap-server/`) that connects Bob directly to a live IBM Datacap Task Manager instance via REST API.

### Available Tools

| Tool | Description |
|------|-------------|
| `list-applications` | List all registered Datacap applications |
| `get-workflow` | Get workflow hierarchy (workflows → jobs → tasks) |
| `get-task-profiles` | List ruleset execution profiles |
| `get-dco-definition` | Get full SetupDCO XML (document/page/field hierarchy) |
| `list-batches` | List batches with optional filters |
| `create-batch` | Create and grab a new batch |
| `upload-file` | Upload a TIFF/PDF image to a grabbed batch |
| `grab-batch` / `grab-next-batch` | Grab a pending batch for processing |
| `release-batch` | Release a batch with a given status |
| `get-page-file` | Retrieve the DCO XML state of a batch |
| `get-batch-history` | Get the task progression log for a batch |
| `transaction-start/end` | Start/end a stateless transaction |
| `transaction-set-file` | Upload files into a transaction workspace |
| `transaction-execute` | Execute rulesets within a transaction |
| `transaction-get-file` | Retrieve output files from a transaction |
| `delete-batch` | Delete a test batch and its folder |
| `get-statistics` | Processing stats (counts, avg time, age) |
| `get-fingerprint-list` | List fingerprint templates for a page type |

### Build & Register

```powershell
cd mcp-datacap-server
npm install
npm run build
```

Then register in `.bob/mcp.json` pointing to `build/index.js` with your Datacap server URL and credentials.

---

## Workspace Structure

```
datacap_project_generator/
│
├── .bob/
│   ├── custom_modes.yaml                   ← Datacap App Generator mode registration
│   └── mcp.json                            ← MCP server config (Datacap connection)
│
├── README.md                               ← this file
├── datacap-app-generator-plan.md           ← authoritative mode behaviour plan
├── datacap-api-help.json                   ← Datacap REST API reference
│
├── knowledge-base/                         ← reference docs used during generation
│   ├── datacap-application-development-guide-v9.md
│   ├── datacap-app-structure.md
│   ├── datacap-development-best-practices.md
│   ├── datacap-ibm-docs-developing-applications.md
│   ├── datacap-ibm-docs-reference-9.1.8.md
│   ├── datacap-sample-applications.md
│   ├── datacap-watsonx-ai-integration.md
│   └── ibm-datacap-application-development-guide-9.pdf
│
├── templates/                              ← base files used during generation
│   ├── app-config/AppName.app
│   ├── dco-xml/AppName.xml
│   ├── gitignore.txt
│   ├── rulesets/collection.xml
│   └── custom-action/
│       ├── CustomActions.cs
│       ├── CustomActions.csproj
│       └── CustomActions.rrx
│
├── mcp-datacap-server/                     ← custom MCP server (TypeScript/Node)
│   ├── src/index.ts
│   ├── build/index.js
│   ├── package.json
│   └── tsconfig.json
│
└── output/                                 ← generated applications land here (gitignored)
    └── <AppName>/
        └── ...
```

---

## Limitations

- Does **not** import fingerprints into Datacap Studio — fingerprints must be created manually.
- Does **not** register the application in Datacap Application Manager — requires the GUI.
- Does **not** create SQL Server databases or ODBC DSNs — infrastructure prerequisites.
- Does **not** build or register the custom action DLL — requires Visual Studio 2022.
- Does **not** configure Rulerunner Manager — a server-side manual step.

All of the above are covered in the generated `README.md` deployment checklist.

---

## Maintenance

| What changed | What to update |
|---|---|
| New Datacap action added | `knowledge-base/datacap-application-development-guide-v9.md` |
| New export target type | `datacap-app-generator-plan.md` Section 5A + Generation Map |
| New intake question | `datacap-app-generator-plan.md` + `requirements.json` schema |
| Template file updated | `templates/` — picked up automatically on next run |
| Mode behaviour change | `.bob/custom_modes.yaml` `roleDefinition` / `customInstructions` |
| MCP server tools changed | `mcp-datacap-server/src/index.ts` → rebuild → restart Bob |
| Watson AI / LLM patterns | `knowledge-base/datacap-watsonx-ai-integration.md` |

> `datacap-app-generator-plan.md` is the **single source of truth** for mode behaviour.
> The `roleDefinition` in `custom_modes.yaml` instructs the mode to always read the plan at session start —
> updating the plan is sufficient for most behaviour changes.
