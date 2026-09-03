# IBM Datacap Reference — Version 9.1.8

> Source: IBM Docs `ibm.com/docs/en/datacap/9.1.8?topic=reference`  
> Content reconstructed from official IBM documentation, DDK headers, and installed runtime.  
> Core APIs are stable across 9.1.x releases.

---

## Table of Contents
1. [DCO API Reference (TDCO.DLL)](#1-dco-api-reference-tdcodll)
2. [IDCO Interface — Properties](#2-idco-interface--properties)
3. [IDCO Interface — Methods](#3-idco-interface--methods)
4. [DCOSetup API](#4-dcosetup-api)
5. [DCOChar API](#5-dcochar-api)
6. [Standard Variable Reference (Quick Index)](#6-standard-variable-reference-quick-index)
7. [Action Library DCO-Level Index](#7-action-library-dco-level-index)
8. [Global Actions Reference](#8-global-actions-reference)
9. [Datacap Studio Reference](#9-datacap-studio-reference)
10. [Datacap Web Services REST API](#10-datacap-web-services-rest-api)

---

## 1. DCO API Reference (TDCO.DLL)

### Overview
The **DCO (Document Content Object)** is Datacap's runtime data model. Every piece of data in a batch — the batch itself, each document, each page, and each field — is represented as a DCO node.

**Key DLL**: `C:\Datacap\dcshared\TDCO.dll`  
**RRX interface**: `C:\Datacap\dcshared\NET\iRRX.dll`  
**Namespace (C#)**: `Datacap.TDCO`

### Three Core Classes
| Class | Purpose |
|-------|---------|
| `DCO` | Runtime batch/document/page/field objects (read/write during processing) |
| `DCOSetup` | Application setup — the document hierarchy definition (`<AppName>.xml`) |
| `DCOChar` | Character-level recognition data (from OCR engines) |

### DCO Object Type Constants
```csharp
// ObjectType() return values
const int typeUnknown  = 0;
const int typeBatch    = 1;
const int typeDocument = 2;
const int typePage     = 3;
const int typeField    = 4;
```

### Status Code Constants
```csharp
// Standard DCO status values
const int statusOK              = 0;
const int statusHidden          = 1;
const int statusIgnore          = 2;
const int statusFailed          = 4;
const int statusRecogFailed     = 8;
const int statusOverride        = 16;
const int statusEmpty           = 32;
const int statusVerifyFailed    = 64;
const int statusVerifyOverride  = 128;
```

---

## 2. IDCO Interface — Properties

The `IDCO` COM interface is the primary way custom C# actions access DCO nodes.  
In a C# custom action, the current DCO node is accessed via `m_IDCOToProcess`.

### Core Value Properties
| Property | Type | Read/Write | Description |
|----------|------|-----------|-------------|
| `Text` | string | R/W | The text value of the field (or batch/doc/page identifier) |
| `Confidence` | int | R/W | Recognition confidence (0–100) |
| `ConfidenceString` | string | R | Confidence formatted as a string |
| `ID` | string | R | Unique identifier of this DCO node |
| `Status` | int | R/W | Current status code (see constants above) |

### Type and Structure Properties
| Property | Type | Read/Write | Description |
|----------|------|-----------|-------------|
| `Name` | string | R | Type name of this node (e.g., `"CustomerName"`, `"Receipt"`) |
| `Parent` | IDCO | R | Parent DCO node (null for batch root) |
| `ObjectType()` | int | R | Returns type constant: 1=Batch, 2=Document, 3=Page, 4=Field |

### Variable Properties
| Property / Method | Description |
|-------------------|-------------|
| `FindVariable(name)` | Returns an `IDCOVariable` for the named variable, or null |
| `GetVariableValue(name)` | Returns the string value of the named variable; empty if not found |
| `SetVariableValue(name, value)` | Sets (or creates) a variable with the given value |
| `AddVariable(name, value)` | Adds a new variable (fails if already exists) |

### Example — Reading / Writing in C#
```csharp
// Read field value
string val = m_IDCOToProcess.Text;

// Write field value
m_IDCOToProcess.Text = "NEW_VALUE";

// Read a custom variable
string locale = m_IDCOToProcess.GetVariableValue("hr_locale");

// Set a custom variable
m_IDCOToProcess.SetVariableValue("MyVar", "Hello");

// Check object type
if (m_IDCOToProcess.ObjectType() == 4) // Field
{
    // field-specific logic
}
```

---

## 3. IDCO Interface — Methods

### Child Navigation
| Method | Signature | Description |
|--------|-----------|-------------|
| `NumOfChildren()` | `int NumOfChildren()` | Returns the number of direct child nodes |
| `GetChild(index)` | `IDCO GetChild(int index)` | Returns child by 0-based index |
| `GetChild(name)` | `IDCO GetChild(string name)` | Returns first child with matching type name |
| `FindByID(id)` | `IDCO FindByID(string id)` | Find any descendant by its ID string |

### Variable Management
| Method | Signature | Description |
|--------|-----------|-------------|
| `NumOfVariables()` | `int NumOfVariables()` | Number of variables on this node |
| `GetVariable(index)` | `IDCOVariable GetVariable(int i)` | Get variable by index |
| `FindVariable(name)` | `IDCOVariable FindVariable(string name)` | Get variable by name |
| `GetVariableValue(name)` | `string GetVariableValue(string name)` | Get variable value string |
| `SetVariableValue(name, val)` | `void SetVariableValue(string name, string val)` | Set variable value |
| `AddVariable(name, val)` | `void AddVariable(string name, string val)` | Add new variable |
| `DeleteVariable(name)` | `void DeleteVariable(string name)` | Remove a variable |

### Status and Confidence
| Method | Signature | Description |
|--------|-----------|-------------|
| `SetStatus(status)` | `void SetStatus(int status)` | Set the status code |
| `GetStatus()` | `int GetStatus()` | Get the status code |
| `SetConfidence(conf)` | `void SetConfidence(int conf)` | Set confidence (0–100) |
| `GetConfidence()` | `int GetConfidence()` | Get confidence value |

### Full Traversal Example (C#)
```csharp
// Traverse all pages in a batch
IDCO batch = m_IDCOToProcess;  // assume called at batch level
int docCount = batch.NumOfChildren();
for (int d = 0; d < docCount; d++)
{
    IDCO doc = batch.GetChild(d);
    int pageCount = doc.NumOfChildren();
    for (int p = 0; p < pageCount; p++)
    {
        IDCO page = doc.GetChild(p);
        int fieldCount = page.NumOfChildren();
        for (int f = 0; f < fieldCount; f++)
        {
            IDCO field = page.GetChild(f);
            string fieldName  = field.Name;
            string fieldValue = field.Text;
            int    fieldConf  = field.Confidence;
            // process...
        }
    }
}
```

### GetChild by Name Example
```csharp
// Get specific field from current page
IDCO page = m_IDCOToProcess;  // at page level
IDCO customerField = page.GetChild("CustomerName");
if (customerField != null)
{
    string name = customerField.Text;
}
```

---

## 4. DCOSetup API

`DCOSetup` reads the application's hierarchy definition file (`<AppName>.xml`).

### Key Methods
| Method | Description |
|--------|-------------|
| `LoadSetup(appPath)` | Load the SetupDCO XML for an application |
| `GetDocTypes()` | Return list of defined document type names |
| `GetPageTypes(docType)` | Return list of page types for a document type |
| `GetFieldTypes(pageType)` | Return list of field types for a page type |
| `GetVariables(typeName)` | Return variables defined for a type |
| `GetVariableValue(typeName, varName)` | Get a setup variable value |

### Usage in a Custom Action
```csharp
// Read the application setup
DCOSetup setup = new DCOSetup();
setup.LoadSetup(m_AppPath);

// Enumerate document types
string[] docTypes = setup.GetDocTypes();
foreach (string dt in docTypes)
{
    string[] pageTypes = setup.GetPageTypes(dt);
    // ...
}
```

---

## 5. DCOChar API

`DCOChar` holds character-level recognition data (the CCO — Character Content Object).

### Overview
- After OCR/ICR, each recognized field has an associated `DCOChar` object.
- Contains individual character data: value, confidence, bounding box.
- Used by voting and verification clients to show character-level highlighting.

### Key Properties
| Property | Type | Description |
|----------|------|-------------|
| `Char` | char | The recognized character |
| `Confidence` | int | Per-character confidence (0–100) |
| `Left` | int | Bounding box left (pixels) |
| `Top` | int | Bounding box top (pixels) |
| `Right` | int | Bounding box right (pixels) |
| `Bottom` | int | Bounding box bottom (pixels) |

### Key Methods
| Method | Description |
|--------|-------------|
| `NumOfChars()` | Number of characters in the CCO |
| `GetChar(index)` | Get `DCOChar` at index |
| `GetText()` | Get full recognized text string |
| `GetConfidence()` | Get overall CCO confidence |

---

## 6. Standard Variable Reference (Quick Index)

> Full descriptions are in `datacap-application-development-guide-v9.md` § 16.  
> This section provides a quick lookup table organized by DCO level.

### All Levels
| Variable | R/W | Description |
|----------|-----|-------------|
| `STATUS` | R/W | Processing status integer |
| `TYPE` | R | DCO type name |
| `rules` | R/W | Semicolon-separated ruleset list |
| `MAX_TYPES` | R/W | Maximum child types |
| `MIN_TYPES` | R/W | Minimum child types |
| `MESSAGE` | R/W | Error or info message |
| `hr_locale` | R/W | OCR language code (e.g., `eng`) |

### Batch Level Only
| Variable | Description |
|----------|-------------|
| `LAST_RR_PROFILE` | Last Rulerunner profile name |

### Document Level Only
| Variable | Description |
|----------|-------------|
| `DD` | Document data metadata |

### Page Level Only
| Variable | Description |
|----------|-------------|
| `Confidence` | Minimum field confidence on this page |
| `DATAFILE` | Full path to the `.xml` page data file |
| `IMAGEFILE` | Full path to the page image (`.tif`) |
| `Fingerprint Created` | Set to `1` when auto-fingerprint was created |
| `Image_Offset` | Pixel offset for cropped image |
| `PatternConfidence` | Pattern match confidence score |
| `PD` | Page data metadata |
| `ScanSrcPath` | Original scan source path |
| `TEMPLATE IMAGE` | Fingerprint template image path |
| `TemplateID` | Fingerprint template ID |

### Field Level Only
| Variable | Description |
|----------|-------------|
| `DataType` | `Alpha` / `Numeric` / `Currency` / `Date` |
| `DensityString` | OMR pixel density (checkbox recognition) |
| `DICT` | Dictionary file path |
| `Index` | Field position index |
| `Label` | Display label in verification UI |
| `Lookup` | ODBC lookup string |
| `LookupEx` | Extended lookup |
| `MaxLength` | Maximum allowed character length |
| `METRIC` | Confidence scoring metric |
| `MultiLine` | `1` = multi-line field |
| `MultiPunch` | `1` = checkbox group parent |
| `PatternMatch` | Pattern match config string |
| `PictureString` | Format mask (e.g., `AAAA-9999`) |
| `Position` | Zone coordinates `left,top,right,bottom` |
| `Pos<templateID>` | Zone for specific fingerprint template |
| `ReadOnly` | `1` = operator cannot edit |
| `RecogStatus` | Recognition engine status code |
| `RecogType` | `OCR` / `ICR` / `OMR` / `Barcode` |
| `ReqConf` | Required confidence threshold |
| `SELECT` | Checkbox option value |
| `ShowChar` | `1` = show character-level data |
| `Sticky` | `1` = value persists between batches |
| `Text` | Field text value |
| `Zone_Offset` | Zone position offset |

---

## 7. Action Library DCO-Level Index

Each action library specifies which DCO level(s) its actions are designed to run at.  
Running an action at the wrong level typically results in a `false` return.

| Library | Typical DCO Level |
|---------|------------------|
| `Autodoc` | Page |
| `Barcode_P` / `Barcode_X` | Page |
| `CC` | Page |
| `Convert` | Page / Batch |
| `DCImageFix` | Page |
| `DCO` | Any (level-specific actions exist) |
| `dcpdf` | Page / Document |
| `Email` | Batch |
| `Ewsmail` | Batch |
| `Export` | Page / Field |
| `ExportDB` | Page / Field |
| `ExportXML` | Batch / Document / Page / Field |
| `FileIO` | Batch / Page |
| `FileNet P8` | Page / Document |
| `FingerprintMaintenance` | Batch |
| `FPXML` | Page |
| `IBMCM` | Document / Page |
| `ICR_C` / `ICR_P` | Page / Field |
| `ImageConvert` | Page |
| `Imprint` | Page |
| `Intellocate` | Page |
| `Locate` | Page / Field |
| `Lookup` | Field |
| `MC_Identify` | Page |
| `MC_Validation` | Field |
| `mvscan` | Batch |
| `OCR_A` / `OCR_N` / `OCR_S` / `OCR_SR` | Page / Field |
| `PatternMatch` | Page |
| `Picture` | Field |
| `Recog_Shared` | Page |
| `rrunner` | Any |
| `SPExport` | Page / Document |
| `Split` | Batch |
| `TifMerge` | Page |
| `Validations` | Field / Page |
| `Vote` | Field |
| `Vscan` | Batch |
| `Web Services` | Any |
| `Zones` | Page / Field |

---

## 8. Global Actions Reference

Global actions are available in every task without a library prefix.

### AddChildDCONode
**Signature**: `AddChildDCONode(typeName, [position])`  
**Level**: Any  
**Description**: Adds a new child DCO node of the specified type to the current object at runtime.  
**Use case**: Dynamically creating field nodes during recognition when the exact number of children is not known at design time.

```
// Example: add a line item field to a page
AddChildDCONode(LineItemAmount)
```

### 64-Bit Action Libraries (9.1.x)
The following libraries run in 64-bit mode in Datacap 9.1.x:
`OCR_S`, `OCR_SR`, `ICR_C`, `ICR_P`, `PatternMatch`, `Intellocate`, `Zones`, `Locate`, `Validations`, `rrunner`, `DCO`, `Export`, `ExportDB`, `ExportXML`, `FileIO`, `Vscan`, `Barcode_P`, `Barcode_X`, `FPXML`

All other libraries run in 32-bit mode (hosted in 32-bit Rulerunner process).

### Supported Image Types
Datacap 9.1.x can ingest the following image formats:
`TIFF`, `JPEG`, `PNG`, `BMP`, `GIF`, `PDF` (converted to TIFF on ingestion), `JFIF`

---

## 9. Datacap Studio Reference

### Studio Interface Overview
| Panel | Tab | Purpose |
|-------|-----|---------|
| Left | Application tree | Navigate application structure |
| Centre | Rulemanager | Build and edit rules/rulesets |
| Right | Properties | Edit properties of selected item |
| Bottom | Zones | Define recognition zones on fingerprint images |
| Bottom | Test | Run batches, set breakpoints, view logs |

### Rulemanager Tab
- Lists all **jobs**, **tasks**, **task profiles**, **rulesets**, **rules**, and **actions**.
- Drag-and-drop to reorder rules within a ruleset.
- Right-click → **Add Action** to add from the installed action library.
- Action parameters are smart parameter strings (see § 15).

### Zones Tab
- Displays the fingerprint template image.
- Draw zones by clicking and dragging over areas of interest.
- Link zones to DCO fields by name.
- Zone coordinates are stored in `Position` / `Pos<templateID>` variables.
- Supports multiple fingerprint templates per page type.

### Test Tab
- Load a batch folder directly into Studio for testing.
- Select a task profile to execute against the batch.
- Use **Run**, **Step**, **Break** controls.
- Set breakpoints on individual actions (right-click → Breakpoint).
- View DCO node values in the object inspector pane.
- Log output appears in the bottom log panel.

### Creating a New Application in Studio
1. **File → New Application** → enter application name, database connection.
2. Studio creates `<AppName>.app`, `<AppName>.xml`, folder structure.
3. In the **Document Hierarchy** panel: add Document types, Page types, Field types.
4. In the **Workflow** panel: define Jobs and Tasks.
5. In the **Rulemanager**: create Task Profiles, Rulesets, Rules, Actions.
6. In the **Zones** tab: add fingerprints and draw zones.
7. In the **Test** tab: run test batches.

### Key Studio Menu Actions
| Menu | Action | Description |
|------|--------|-------------|
| File | New Application | Create a new Datacap application |
| File | Open Application | Open an existing application |
| Tools | Action Library Manager | Register/unregister action libraries |
| Tools | Rulerunner Manager | Configure background tasks |
| Tools | Application Manager | Manage workflow, jobs, tasks |
| View | Reset Layout | Restore default panel layout |

---

## 10. Datacap Web Services REST API

> **⚠️ This section reflects confirmed behaviour on IBM Datacap 9.1.10 (lab-verified).**

### Architecture

| Component | Detail |
|-----------|--------|
| Service name | **wTM** — Datacap Web Task Manager WCF service |
| Protocol | REST over HTTP, WCF `webHttpBinding` |
| Port | `82` (Task Manager's HTTP server, kernel PID 4) |
| Base URL | `http://localhost:82/service` |
| Service file | `C:\Datacap\wTM\ServicewTM.svc` |
| Help / endpoint list | `http://localhost:82/service/help` |
| Response format | JSON (send `Accept: application/json`) or XML (default) |

---

### Authentication

#### Session/Logon
```http
POST /service/Session/Logon
Content-Type: application/json
Accept: application/json

{"application":"APT","user":"admin","password":"admin","station":"1"}
```
Response: `true` + sets `wTmId` cookie (GUID).
**All subsequent requests must include `Cookie: wTmId=<guid>`.**

#### Session/Logoff
```http
POST /service/Session/Logoff
Cookie: wTmId=<guid>
```
No body. Empty response = success.

---

### API Quirks — Confirmed Gotchas (9.1.10)

| Endpoint | Gotcha |
|----------|--------|
| `Queue/CreateBatch` | Body fields: `job` (not `jobName`), `task` (not `taskName`) |
| `Queue/GrabBatch` | PUT with **NO body** — empty response string = success |
| `Queue/ReleaseBatch` | PUT with **NO body, no Content-Type** — any body causes "unrecognized body format" error |
| `Queue/SetFile` | Content-Type must be `application/octet-stream` — NOT `application/xml` |
| `Transaction/SetFile` | Same: raw `application/octet-stream` only |
| `Transaction/GetFile` | Do NOT send `Accept: application/json` — returns XML as text; with JSON accept returns opaque XmlDocument object |
| `Transaction/Start` | Returns GUID string; send `Accept: application/json` to get plain string |
| `Transaction/Execute` | Body key is `TransactionId` (capital T). `Rulesets` must match `name` in `collection.xml` |
| `Transaction/End` | HTTP **DELETE** (not POST/PUT) |
| `Rules/Execute` | **BROKEN on 9.1.10** — always HTTP 500 "Object reference not set". Use `Transaction/Execute` instead. |

---

### Confirmed Working Endpoints (9.1.10)

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/Admin/GetApplicationList` | GET | No auth needed |
| `/Session/Logon` | POST | JSON `{application,user,password,station}` → wTmId cookie |
| `/Session/Logoff` | POST | No body |
| `/Admin/GetWorkflowHierarchy/{app}` | GET | Workflow→Job→Task tree |
| `/Admin/GetTaskProfileList/{app}` | GET | Task profile names |
| `/Admin/GetSetupDCOList/{app}` | GET | DCO definition names |
| `/Admin/GetTaskList/{app}/-3` | GET | All tasks (jobIndex=-3 = all) |
| `/Queue/GetBatchList/{app}/{size}/{page}/{sort}` | GET | Paginated batch list |
| `/Queue/GetBatchAttributes/{app}/{qid}` | GET | Single batch status |
| `/Queue/CreateBatch` | POST | JSON: `{application,job,task}` |
| `/Queue/UploadFile/{app}/{qid}` | POST | multipart/form-data, returns pageId |
| `/Queue/GrabBatch/{app}/{qid}` | PUT | No body |
| `/Queue/ReleaseBatch/{app}/{qid}/{status}` | PUT | No body; status: `finished\|hold\|cancelled\|aborted` |
| `/Queue/GetPageFile/{app}/{qid}` | GET | Returns DCO XML string |
| `/Queue/SetFile/{app}/{qid}/{name}/{ext}` | POST | Raw octet-stream body |
| `/Queue/GetBatchHistory/{app}/{qid}` | GET | Task progression log |
| `/Statistics/TotalCounts/{app}` | GET | Batch/doc/page counts |
| `/Transaction/Start` | GET | Returns txId GUID; use `Accept: application/json` |
| `/Transaction/SetFile/{txId}/{name}/{ext}` | POST | Raw `application/octet-stream` |
| `/Transaction/Execute` | POST | JSON body — see Transaction flow below |
| `/Transaction/GetFile/{txId}/{name}/{ext}` | GET | No Accept header → raw file bytes |
| `/Transaction/End/{txId}` | DELETE | No body |

---

### Transaction API Flow — Rule Execution (8 Calls)

The **Transaction** flow is the correct way to execute rules via REST in Datacap 9.1.10.
It is stateless — no persistent batch queue entry is created.

```
CALL 1  POST   /service/Session/Logon                              ← authenticate, get wTmId cookie
CALL 2  GET    /service/Transaction/Start                          ← get transactionId GUID
CALL 3  POST   /service/Transaction/SetFile/{txId}/VScan/xml       ← upload DCO page file (octet-stream)
CALL 4  POST   /service/Transaction/SetFile/{txId}/TM000001/tif    ← upload image file (octet-stream)
CALL 5  POST   /service/Transaction/Execute                        ← run ruleset(s)
CALL 6  GET    /service/Transaction/GetFile/{txId}/VScan/xml       ← read updated page file
CALL 7  DELETE /service/Transaction/End/{txId}                     ← clean up temp workspace
CALL 8  POST   /service/Session/Logoff                             ← end session
```

Transaction temp files land in:
`C:\ProgramData\IBM\Datacap\wTM\batches\{wTmId}\{txId}\`

#### CALL 3 — DCO page file format (VScan.xml)
```xml
<?xml-stylesheet type="text/xsl" href="..\..\dco.xsl"?>
<B id="BATCH001">
  <V n="STATUS">0</V>
  <V n="TYPE">APT</V>
  <P id="TM000001">
    <V n="TYPE">Other</V>
    <V n="STATUS">49</V>
    <V n="IMAGEFILE">TM000001.tif</V>
  </P>
</B>
```

#### CALL 5 — Transaction/Execute JSON body
```json
{
  "TransactionId":   "82fcaf7c-...",
  "Application":     "APT",
  "Workflow":        "APT",
  "PageFile":        "VScan.xml",
  "Rulesets":        "PageID",
  "TaskProfile":     "Batch Profiler",
  "TargetDCOObject": ""
}
```
`Rulesets` = exact `name` values from `collection.xml`, comma-separated for multiple.

#### CALL 5 — Response
```json
{ "Status": 1, "DocumentCount": 0, "PageCount": 1, "Messages": null }
```
`Status=1` = success. `Status=0` = failure.

#### CALL 6 — GetFile response (after PageID)
```xml
<B id="BATCH001">
  <V n="STATUS">0</V>
  <V n="TYPE">APT</V>
  <V n="Settings File">C:\Datacap\APT\dco_APT\settings.ini</V>
  <P id="TM000001">
    <V n="TYPE">Main_Page</V>
    <V n="STATUS">49</V>
    <V n="IMAGEFILE">tm000001.tif</V>
    <V n="OriginalImageHeight">3305</V>
  </P>
</B>
```
PageID updated `TYPE` from `Other` → `Main_Page` (fingerprint match).

---

### collection.xml Ruleset Names (APT application)

Rulesets in `C:\Datacap\APT\dco_APT\rules\collection.xml`:

| Ruleset name | Typical task |
|---|---|
| `VScan` | Scan / import |
| `PageID` | Page identification / fingerprint matching |
| `AutoRotation` | Auto page rotation |
| `CreateDocs` | Document creation / batch profiling |
| `Recognize` | OCR / field recognition |
| `Locate` | Field location |
| `Validate` | Field validation |
| `Clean` | Image cleanup |
| `Export` | Batch export |
| `Routing` | Workflow routing |
| `ImageEnhancement.Rul.dll` | Global image enhancement (use `.Rul.dll` suffix) |

---

### Batch Queue Flow (persistent batch)

Use this when the batch must persist in the queue and advance through workflow tasks:

```
CreateBatch → UploadFile → GrabBatch → [SetFile/GetPageFile] → ReleaseBatch(finished)
```

The batch moves to the next workflow task after `ReleaseBatch(finished)`.
History is available via `GetBatchHistory`.

---

### Web Services Action Library (in-rule)
For calling external web services **from within Datacap rules**, use the `Web Services` action library:

| Action | Description |
|--------|-------------|
| `WsUrlSet(url)` | Set the target web service URL |
| `WsSetHeaderValue(name, value)` | Add an HTTP header |
| `WsSetMessageProperty(name, value)` | Set a SOAP/REST message property |
| `WsSetMessageTemplate(template)` | Set the request body template |
| `WsExecute()` | Call the web service |
| `WsGetValue(xpath)` | Extract a value from the response |
| `WsGetLineItems(xpath)` | Extract multiple values (line items) |
| `WsCompare(xpath, value)` | Compare a response value |
| `WsDownloadFile(url, path)` | Download a file from a URL |
| `WsUploadFile(url, path)` | Upload a file to a URL |
| `WsUrlReplaceValue(token, value)` | Replace a token in the URL |
| `WsMessageLineItemPropertyAdd` | Add property to a line item message |
| `WsSetResponseNameSpace(ns)` | Set XML namespace for response parsing |

---

## Appendix A — Key File Paths (Installed 9.1.10)

| Item | Path |
|------|------|
| Application root | `C:\Datacap\<AppName>\` |
| Action library DLLs | `C:\Datacap\RRS\` |
| Core DCO DLL | `C:\Datacap\dcshared\TDCO.dll` |
| RRX interface | `C:\Datacap\dcshared\NET\iRRX.dll` |
| Logging DLL | `C:\Datacap\dcshared\dclogX.dll` |
| Web services | `C:\Datacap\wTM\` |
| Sample applications | `C:\Datacap\APT\`, `C:\Datacap\TravelDocs\`, etc. |
| Templates | `C:\Datacap\Templates\FormTemplate\`, `LearningTemplate\` |
| Studio executable | `C:\Datacap\datacapstudio.exe` |
| Rulerunner Manager | `C:\Datacap\rrmanager.exe` |
| Fingerprint Maintenance | `C:\Datacap\FingerprintMaintenanceTool.exe` |

## Appendix B — Custom C# Action Skeleton

```csharp
using System;
using System.Runtime.InteropServices;
using Datacap.TDCO;

namespace MyActions
{
    [ComVisible(true)]
    [Guid("YOUR-GUID-HERE")]
    [ClassInterface(ClassInterfaceType.AutoDual)]
    public class MyActions : IDisposable
    {
        // Injected by Rulerunner — do not rename
        public IDCO m_IDCOToProcess;
        public string m_AppPath;

        /// <summary>
        /// Example action: sets a field value.
        /// </summary>
        public bool SetFieldValue(string fieldName, string value)
        {
            try
            {
                IDCO field = m_IDCOToProcess.GetChild(fieldName);
                if (field == null) return false;
                field.Text = value;
                return true;
            }
            catch (Exception ex)
            {
                // Log to Datacap log
                m_IDCOToProcess.SetVariableValue("MESSAGE", ex.Message);
                return false;
            }
        }

        public void Dispose() { }
    }
}
```

## Appendix C — RRX Declaration Format

Each action library has an `.rrx` file (XML) that declares its actions to the Rulerunner:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rrx version="2.0">
  <library name="MyActions" path="MyActions.dll" platform="x64">
    <action name="SetFieldValue" class="MyActions.MyActions" method="SetFieldValue">
      <param name="fieldName" type="string" required="true"/>
      <param name="value"     type="string" required="true"/>
    </action>
  </library>
</rrx>
```

Place the `.rrx` and `.dll` in `C:\Datacap\RRS\` and register via **Tools → Action Library Manager** in Datacap Studio.

---

*End of IBM Datacap Reference — Version 9.1.8*
