# Datacap App Generator — Bob Mode

> Custom Bob mode: **`datacap-app-generator`**  
> Target platform: **IBM Datacap 9.1.10**  
> Mode file: [`.bob/custom_modes.yaml`](.bob/custom_modes.yaml)  
> Plan file: [`datacap-app-generator-plan.md`](datacap-app-generator-plan.md)

---

## What This Mode Does

The **Datacap App Generator** is a guided, two-phase assistant that produces a complete
IBM Datacap 9.1.10 application scaffold from a blank slate. It replaces manual Datacap Studio
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

## How to Activate

Select **"Datacap App Generator"** from the Bob mode picker (bottom-left of the interface).

The mode is registered as a **workspace mode** — it is available only in this project.

---

## Two-Phase Process

### Phase 1 — Intake

A structured Q&A conversation across **6 sections**. Each section is confirmed before the next begins. Answers are written to `output/<AppName>/requirements.json` incrementally.

| Section | Topic | Key Outputs |
|---------|-------|-------------|
| 1 | **Application Identity** | App name, server, DSNs, install path |
| 2 | **Document Hierarchy** | Document types → page types → fields, line items, dictionaries, lookups |
| 3 | **Workflow Design** | Input method, verification client, Rulerunner tasks, branching, batch split |
| 4 | **Recognition Configuration** | OCR engine, ICR, barcodes, locale, zone vs full-page mode |
| 5 | **Integration Points** | Export targets, lookup DBs, custom C# action definitions |
| 6 | **Non-Functional Requirements** | Volume, HA, environment, secrets strategy, README flag |

**Resume support:** if `output/<AppName>/requirements.json` already exists, the mode
asks whether to resume from it or start fresh.

### Phase 2 — Generation

After all sections are confirmed the mode runs **pre-generation validation**, then writes
every output file in order. Each file is logged as it is written.

---

## Generated Files

All output lands in `output/<AppName>/`.

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
|----------------|--------------|
| `<AppName>.xml` | `templates/dco-xml/AppName.xml` |
| `collection.xml` | `templates/rulesets/collection.xml` |
| `CustomActions.cs` | `templates/custom-action/CustomActions.cs` |
| `CustomActions.csproj` | `templates/custom-action/CustomActions.csproj` |
| `CustomActions.rrx` | `templates/custom-action/CustomActions.rrx` |
| `<AppName>.app` | `templates/app-config/AppName.app` |
| `.gitignore` | `templates/gitignore.txt` (if `nfr.sourceControl=true`) |
| Ruleset `.rul` files | Generated (no base template) |

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

## Generation Rules (Invariants)

These rules are enforced by the mode regardless of user answers:

- **No invented requirements** — every generated line traces to an intake answer.
- **No hard-coded paths** — smart parameters (`@APPPATH`, `@APPVAR`, `@BATCHID`) used everywhere.
- **No hard-coded secrets** — passwords go in `.app` as `@APPVAR` keys, or as `TODO` placeholders.
- **Real actions only** — every ruleset action exists in `knowledge-base/datacap-application-development-guide-v9.md`.
- **Unknown catch-all always included** — `SetupDCO XML` always contains an `<Unknown>` document type.
- **Unidentified page fallback always present** — `PageID.rul` always has a `Task_RaiseCondition(UnidentifiedPage)` path when `manualPageID=true`.
- **C# actions follow the template pattern** — `[ComVisible(true)]`, `x86`, `net48`, IDCO API, `RRLog` logging.

---

## Knowledge Base Used

The mode reads and cites these files during generation:

| File | Used for |
|------|---------|
| `knowledge-base/datacap-application-development-guide-v9.md` | Action library reference — every action in every `.rul` file is sourced here |
| `knowledge-base/datacap-app-structure.md` | Canonical folder layout, `.app` INI format, source control matrix |
| `knowledge-base/datacap-development-best-practices.md` | Coding standards, security, deployment pitfalls |
| `knowledge-base/datacap-ibm-docs-reference-9.1.8.md` | IDCO API for C# custom actions |
| `knowledge-base/datacap-ibm-docs-developing-applications.md` | Workflow task configuration, web client setup, 9.1.10 specifics |
| `knowledge-base/datacap-sample-applications.md` | Real-world DCO hierarchy examples |
| `knowledge-base/datacap-watsonx-ai-integration.md` | watsonx.ai classification and KVP extraction patterns |

---

## Tool Permissions

The mode has access to the following Bob tool groups:

| Group | Capability | Why needed |
|-------|-----------|-----------|
| `read` | File reading, symbol lookup | Read plan, templates, knowledge-base |
| `edit` | File writing and modification | Write `requirements.json` and all generated files |
| `execute` | Shell command execution | Create output directories (`New-Item`) |
| `todo` | `update_todo_list` | Track intake section and generation progress |
| `skill` | `use_skill` | Load specialist skills if needed during generation |

---

## Usage Example

```
User: [switches to Datacap App Generator mode]
User: I need a new Datacap app for accounts payable invoice processing.

Mode: Starting Datacap App Generator.
      Checking for existing requirements.json... not found.
      
      [Section 1/6 - Application Identity]
      
      1.1  What is the application name? (PascalCase, no spaces)
      1.2  What is a short description?
      ...
      
      [Section 1/6 confirmed]
      ✓ Written to output/APInvoice/requirements.json (app section)
      
      [Section 2/6 - Document Hierarchy]
      ...
      
      [All 6 sections complete]
      Running pre-generation validation...
      ✅ No errors. 1 warning: no export target configured — Export.rul will be a stub.
      Confirm? [y/n]
      
      Generating files...
      ✓ Generated dco_APInvoice/APInvoice.xml
      ✓ Generated dco_APInvoice/rules/collection.xml
      ✓ Generated dco_APInvoice/rules/PageID.rul
      ...
      ✓ Generated README.md
      
      Generation complete. 11 files written to output/APInvoice/
      
      [Deployment Checklist]
      ...
```

---

## What This Mode Does NOT Do

- It does **not** import fingerprints into Datacap Studio — fingerprints must be created manually.
- It does **not** register the application in Datacap Application Manager — this requires the GUI.
- It does **not** create SQL Server databases or ODBC DSNs — those are infrastructure prerequisites.
- It does **not** build or register the custom action DLL — that requires Visual Studio 2022.
- It does **not** configure Rulerunner Manager — that is a server-side manual step.

All of the above are covered in the generated `README.md` deployment checklist.

---

## Files in This Workspace

```
datacap_project_generator/
│
├── .bob/
│   └── custom_modes.yaml                        ← mode registration (this mode)
│
├── datacap-app-generator-plan.md                ← authoritative plan (source of truth for the mode)
├── datacap-app-generator-README.md              ← this file
│
├── knowledge-base/                              ← reference knowledge used during generation
│   ├── datacap-application-development-guide-v9.md
│   ├── datacap-app-structure.md
│   ├── datacap-development-best-practices.md
│   ├── datacap-ibm-docs-developing-applications.md
│   ├── datacap-ibm-docs-reference-9.1.8.md
│   ├── datacap-sample-applications.md
│   └── datacap-watsonx-ai-integration.md
│
├── templates/                                   ← base files used during generation
│   ├── app-config/AppName.app
│   ├── dco-xml/AppName.xml
│   ├── gitignore.txt
│   ├── rulesets/collection.xml
│   └── custom-action/
│       ├── CustomActions.cs
│       ├── CustomActions.csproj
│       └── CustomActions.rrx
│
└── output/                                      ← generated applications land here
    └── <AppName>/
        └── ...
```

---

## Maintenance

| What changed | What to update |
|---|---|
| New Datacap action library added | `knowledge-base/datacap-application-development-guide-v9.md` + optionally the plan |
| New export target type needed | `datacap-app-generator-plan.md` Section 5A + Generation Map |
| New intake question | `datacap-app-generator-plan.md` appropriate section + `requirements.json` schema |
| Template file updated | `templates/` — mode picks up changes automatically on next run |
| Mode behaviour change | `.bob/custom_modes.yaml` `roleDefinition` or `customInstructions` |
| Watson AI / LLM patterns updated | `knowledge-base/datacap-watsonx-ai-integration.md` |

> The `datacap-app-generator-plan.md` is the **single source of truth**. The `roleDefinition`
> in `custom_modes.yaml` instructs the mode to always read the plan file at session start —
> so updating the plan is sufficient for most behaviour changes.
