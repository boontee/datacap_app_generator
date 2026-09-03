# IBM Datacap 9.1.10 — Developing Applications
## Source: https://www.ibm.com/docs/en/datacap/9.1.10?topic=developing-applications

> **Note:** The IBM Docs site returns HTTP 403 to automated clients. This knowledge-base entry
> is reconstructed from confirmed DuckDuckGo search snippets, the openc.co.uk 9.1.10 release
> summary, the IBM community blog posts, and cross-referencing with the installed sample
> applications on this machine (`C:\Datacap\`). All topic URLs are real 9.1.10 endpoints.

---

## Topic Tree

```
developing-applications
├── applications-planning-capture
├── applications-developing-capture
│   ├── TravelDocs: Creating the document hierarchy
│   ├── TravelDocs: Creating documents and setting up page files
│   ├── TravelDocs: Adding fingerprints and setting up recognition
│   ├── TravelDocs: Setting up field extraction and validation
│   ├── TravelDocs: Updating the application to complete validation
│   └── TravelDocs: Setting up export
├── applications-coding-maintenance
├── applications-automating-capture-application-workflow
│   ├── Background task automation with Rulerunner
│   └── Automatic fingerprint generation
└── (Parts of a Datacap Application / Source Control)
```

---

## 1. Planning Capture Applications
**URL:** `https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-planning-capture`

Configuring a Datacap application consists of providing Datacap with a combination of visual
clues and processing rules from its catalog of rulesets and actions. They guide how to:

- Automatically **recognise and separate** the documents
- **Find, capture, and process** the data in them
- **Transfer** both images and data to the back-end systems

### The Seven Basic Steps of a Datacap Application

Every Datacap application, regardless of domain, follows the same seven-step architecture:

| Step | Task type | Description |
|------|-----------|-------------|
| 1. **Document input** | Automatic (VScan) | Scan images or import digital files (PDF, TIFF). Rulerunner can run this automatically or an operator uses a scan client. |
| 2. **Page identification** | Automatic (PageID) | Fingerprint matching assigns each incoming page to its correct page type. Pages that do not match any fingerprint are assigned `Other`. |
| 3. **Document assembly** | Automatic | Pages are assembled into structured documents according to the document hierarchy (e.g., a Car Rental doc is assembled from its Main + Insurance pages). |
| 4. **Character recognition** | Automatic (Recognize) | The OCR engine extracts text from each field zone on each page. Recognition engines: OCR/A, OCR/PL, OCR/S. |
| 5. **Verification** | Manual (NVerify) | An operator reviews and corrects extracted field values in Datacap Desktop or Navigator. |
| 6. **Validation** | Automatic or manual | Business rules validate field values. Fields that fail validation are flagged for re-verification. |
| 7. **Export** | Automatic (Export) | Verified documents are exported to the back-end system (FileNet P8, CMIS, database, folder, etc.). |

### Planning Checklist

Before building the application in Datacap Studio:

- [ ] **Identify document types** — what distinct document forms will the application process?
- [ ] **Identify page types** — what page variants exist within each document type?
- [ ] **Identify fields** — what data elements need to be captured from each page?
- [ ] **Determine classification method** — fingerprint (fixed-format), barcode, FlexID (variable), or AI/LLM?
- [ ] **Plan validation rules** — what field-level and document-level business rules apply?
- [ ] **Plan export destination** — FileNet P8, CMIS, SharePoint, DB, folder?
- [ ] **Plan workflow tasks** — which tasks run automatically (Rulerunner) vs. require operator input?
- [ ] **Multi-language?** — does the application need locale/language support?
- [ ] **PII / Redaction?** — does any captured data require redaction before export?

---

## 2. Developing Datacap Capture Applications
**URL:** `https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-developing-capture`

> Plan, code, and debug Datacap applications. Automate the application workflow. Learn from
> the TravelDocs sample application.

This section is the core development tutorial, using the **TravelDocs** sample application
(`C:\Datacap\TravelDocs\`) as the worked example throughout.

### 2.1 Creating the Document Hierarchy

**URL:** `https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-traveldocs-creating-document-hierarchy`

The document hierarchy enables Datacap to convert a collection of unstructured images into
a structured runtime batch hierarchy containing the relevant business data.

The goal is to create **generalised definitions (classes)** for:
- Document types
- Page types within each document
- Fields within each page

**How-to in Datacap Studio:**
1. Open Datacap Studio → `File > New Application` or use the Application Wizard
2. Go to the **Document Hierarchy** tab in the Rule Manager
3. Add Document types (`+Document`)
4. Add Page types under each Document (`+Page`)
5. Add Field types under each Page (`+Field`)
6. Set field properties: data type, required confidence, position, recognition type
7. Save — this writes `dco_<AppName>/<AppName>.xml`

**Key DCO XML concepts (confirmed from `C:\Datacap\TravelDocs\TravelDocs.xml`):**
```xml
<S>
  <B type="TravelDocs">           <!-- Batch (application root) -->
    <D type="Car_Rental" .../>    <!-- Document type reference -->
    <D type="Hotel" .../>
    <D type="Flight" .../>
  </B>
  <D type="Car_Rental">
    <P type="Rental_Agreement" pos="1" min="1" max="1"/>  <!-- required page -->
    <P type="Optional_Insurance" pos="2" min="0" max="1"/> <!-- optional page -->
  </D>
  <P type="Rental_Agreement">
    <F type="Pickup_Date" .../>
    <F type="Total_Cost" .../>
  </P>
  <F type="Pickup_Date">
    <V n="ReqConf">8</V>          <!-- confidence threshold 0-100 -->
    <V n="length">4</V>
  </F>
</S>
```

**`pos`** = default position index; **`min`/`max`** = cardinality constraints on the child type.

### 2.2 Creating Documents and Setting Up Page Files

**URL:** `https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-traveldocs-creating-documents-setting-up-page-files`

- Create a test batch by placing sample images in the `images\` folder
- Run the **CreateDocs** ruleset to generate the runtime batch folder structure
- Examine the `batches\<BatchNumber>\` folder:
  - `tm000001.xml` — the runtime DCO file (reflects current batch state)
  - `*.tif` — individual page images
- At this stage, all pages are assigned `Other` (unclassified) — fingerprints are needed

### 2.3 Adding Fingerprints and Setting Up Recognition

After the document hierarchy is defined, fingerprints are created for each page type:

**Fingerprint workflow:**
1. In Datacap Studio → **Fingerprint** tab → select the page type
2. Load a sample (representative) TIFF image of that page
3. Draw zones for each field to be extracted (defines `Pos<FP_ID>=left,top,right,bottom`)
4. Set OCR parameters per zone (engine, language, character set)
5. Save → creates a `.cco` (zone definition) + `.tif` (template image) pair in `fingerprints\`
6. Add the fingerprint to the fingerprint database

**PageID ruleset** then uses `SetFingerprintParameters` + `PageID` actions to:
1. Compare each incoming page against all stored fingerprints
2. Assign the best-matching page type
3. Assemble pages into documents per the hierarchy rules

**Fingerprint matching parameters (from `C:\Datacap\TravelDocs\dco_TravelDocs\TravelDocs.xml`):**
```xml
<P type="Rental_Agreement">
  <V n="rules">... rs="3" ... rs="4" ...</V>  <!-- ruleset references -->
  <F type="Total_Cost">
    <V n="rules">... rs="9" ...</V>
    <!-- zone positions stored in fingerprint DB, referenced by FP ID -->
  </F>
</P>
```

### 2.4 Setting Up Field Extraction and Validation

**Field extraction** (Recognize task):
- OCR engines read text from each defined zone
- Results populate `field.Text` in the runtime DCO
- Confidence scores are stored in `field.Confidence`

**Field validation** (Validate task):
```
Field-level rules:
  - Required field check (value not empty)
  - Data type check (date format, numeric range)
  - Dictionary lookup (value must be in approved list)
  - Regular expression match
  - Database cross-reference (SQL lookup)

Document-level rules:
  - Cross-field consistency (date A < date B)
  - Computed totals (sum of line items = Invoice_Total)
  - Routing decisions (set Routing_Instructions field)
```

**Validation result codes (DCOStatus):**

| Value | Meaning |
|-------|---------|
| `SCAN_OK` (0) | Field/page/doc passed validation |
| `SCAN_ERROR` (-1) | Field/page/doc failed — needs re-verification |
| `SCAN_VERIFY` (4) | Field needs manual verification |
| `SCAN_NEW` (1) | Newly created/not yet processed |

### 2.5 Updating the Application to Complete Validation

After running a batch through the workflow, Datacap Studio shows the **status** of each
field, page, and document in the batch tree. Iterative development cycle:

1. Run batch → examine `batches\<N>\tm000001.xml` for status values
2. Inspect Rulerunner logs (`C:\Datacap\RRS\Logs\wrrs-*.log`)
3. Adjust rules / zone positions in Studio
4. Re-run the affected task
5. Repeat until all fields reach `SCAN_OK`

**Useful validation actions in Validate.rul (APT example — `C:\Datacap\APT\dco_APT\rules\Validate.rul`):**
```
ValidateFields.Rul.dll     — compiled validation ruleset
ValidationsAndTextAdjustments.rrx — standard validation action library
Lookup.dll                 — database lookup
Validations.dll            — regex, length, format checks
```

### 2.6 Setting Up Export

The **Export** ruleset transfers the verified batch data and images to back-end systems.

**Standard export action libraries available at `C:\Datacap\RRS\`:**

| Library / DLL | Export destination |
|---------------|--------------------|
| `IBMFileNetP8.rrx` | FileNet P8 Content Manager (new 9.1.10 library) |
| `ExportToIBMCM.Rul.dll` | IBM Content Manager / OnDemand |
| `ExportToFileNet.Rul.dll` | FileNet P8 (legacy, replaced by IBMFileNetP8) |
| `ExportToDatabase.rrx` | SQL database |
| `ExportToText.rrx` | Delimited text file |
| `ExportToXML.rrx` | XML export |
| `ExportToCSV.Rul.dll` | CSV file |
| `DCCMIS.dll` | CMIS-compliant repositories |
| `ExportToBox.Rul.dll` | IBM Box |
| `DCSTConnector.dll` | SharePoint |

> ⚠️ **9.1.10 breaking change:** `FileNetP8.dll` / `FileNetP8.rrx` have been **removed**.
> Applications must migrate to `IBMFileNetP8.rrx`. See the deprecation list in the 9.1.10
> What's New documentation.

---

## 3. Coding Maintenance Applications
**URL:** `https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-coding-maintenance`

A **maintenance application** is a special Datacap application used for administrative tasks:
monitoring batch status, sending alert emails, purging old batches, etc.

- Built using the **Datacap Maintenance Manager** tool
- Default ruleset structure is auto-generated, then simplified
- Typical use: add rulesets with actions that check the status of batches within a specified
  application workflow and email the results to an administrator
- Can be scheduled to run automatically via Rulerunner

---

## 4. Automating Capture Application Workflow
**URL:** `https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-automating-capture-application-workflow`

### 4.1 Background Task Automation with Rulerunner

**Rulerunner** (`RRProcessor.exe`, located in `C:\Datacap\RRS\`) is the Datacap background
processing engine.

**How Rulerunner works:**
- Monitors the job queue (engine database) for pending batches
- When a batch is pending for an automated task, Rulerunner picks it up and executes
  the task's ruleset
- Manual tasks (e.g., NVerify) are skipped — they wait for operator action in the client

**Rulerunner configuration (Application Manager → Rulerunner tab):**
```
Tasks marked as automatic:  VScan, PageID, Recognize, Validate, Export
Tasks marked as manual:     NVerify (operator verification)
```

**9.1.10 Rulerunner enhancements:**
- **Automatic `RRProcessor.exe` restart** after each task execution — resets memory,
  prevents unpredictable behaviour during extended processing runs
- **Configurable logging** of Task XML and Process IDs via new RR registry setting
- **Extended Checking** registry setting for advanced TMS diagnostic logging

**Rulerunner log location:** `C:\Datacap\RRS\Logs\wrrs-<ProcessID>.log`  
**Main log:** `C:\Datacap\RRS\Logs\wrrs.log`

### 4.2 Automatic Fingerprint Generation

You can add a function to your application to generate fingerprints automatically from
unrecognised pages.

**Use case:** When a new vendor invoice format arrives that has no matching fingerprint,
the `AutomaticDocumentFingerprinting.rrx` action library (at `C:\Datacap\RRS\`) can:
1. Detect the unrecognised page type
2. Create a new fingerprint entry automatically
3. Optionally notify an operator to review the new fingerprint

---

## 5. Parts of a Datacap Application (Source Control)
**URL:** `https://www.ibm.com/docs/en/datacap/9.1.9?topic=applications-parts-datacap-application`
*(Confirmed applicable to 9.1.10 — same topic structure)*

A Datacap application is primarily a **collection of files**. Understanding which files
belong in source control is important for CI/CD and environment promotion.

### Component Classification

| Component | Location | Source Control? |
|-----------|----------|-----------------|
| SetupDCO XML | `dco_<AppName>/<AppName>.xml` | ✅ Yes |
| Rulesets (`.rul` files) | `dco_<AppName>/rules/*.rul` | ✅ Yes |
| Ruleset collection | `dco_<AppName>/rules/collection.xml` | ✅ Yes |
| Custom action DLL source | `*.cs`, `*.csproj`, `*.rrx` | ✅ Yes |
| Fingerprint templates | `fingerprints/*.cco`, `fingerprints/*.tif` | ✅ Yes (if not in FP Service) |
| Application config | `<AppName>.app` | ✅ Yes (as env template) |
| Task set XML files | `dco_<AppName>/*.set.xml` | ✅ Yes |
| Settings/paths INI | `dco_<AppName>/Settings.ini` | ✅ Yes (without credentials) |
| Batch directories | `batches/` | ❌ No — runtime data |
| Image input folder | `images/` | ❌ No — runtime data |
| Export output folder | `export/` | ❌ No — runtime output |
| Compiled DLLs | `rules/*.dll` | ❌ No — build artifacts |
| Admin/Engine databases | `*.mdb` / SQL | ❌ No — use DB scripts |
| Fingerprint database | `*Fingerprint.mdb` | Separate — manage via FP Service |

### Custom Actions (9.1.10)

A user can create custom actions that expand the capabilities of the application:

- Written in **C#** (.NET Framework 4.8, x86) using **Visual Studio 2022**
- Implemented as **COM-visible DLLs**
- Declared via a paired **`.rrx` file** (action declarations for Datacap Studio)
- Deployed to `dco_<AppName>/rules/` and registered with `regsvr32`

> ⚠️ **VBScript deprecation:** Microsoft will remove VBScript ~2027. All new custom
> actions MUST be C#. Existing VBScript actions should be migrated using the DDK 9.1.10
> templates from [github.com/ibm-ecm/datacap-developer-kit](https://github.com/ibm-ecm/datacap-developer-kit).

---

## 6. Application Development Tools

| Tool | Purpose | Location |
|------|---------|----------|
| **Datacap Studio** | Primary development IDE — DCO, rulesets, fingerprints, workflow | `C:\Datacap\DStudio\DStudio.exe` |
| **FastDoc** | Simplified configuration wizard for standard applications | `C:\Datacap\FastDoc\` |
| **Application Wizard** | Generates initial application scaffold from templates | Built into Studio |
| **Fingerprint Maintenance Tool** | Manage fingerprint database entries | `C:\Datacap\<App>\dco_<App>\Fingerprint Maintenance Tool.exe` |
| **Rulerunner (RRProcessor)** | Background task engine | `C:\Datacap\RRS\` |
| **Batch Pilot** | Debug tool — step through rulesets against a live batch | Integrated in Studio |
| **Visual Studio 2022** | Custom C# action development | External — DDK from GitHub |
| **Visual Studio 2019** | DDK panel UI design/testing (Datacap Desktop is 32-bit) | External |

---

## 7. Key Action Libraries Reference (`C:\Datacap\RRS\`)

Confirmed from live directory scan of the installed 9.1.10 server:

### Image Processing
| Library | Purpose |
|---------|---------|
| `ImageEnhancement.Rul.dll` | Image pre-processing (deskew, noise removal, binarisation) |
| `ImageCreate.Rul.dll` | Create/convert image files |
| `Image_Convert.Rul.dll` | PDF↔TIF conversion |
| `ImageUtilities.rrx` | General image utilities |
| `DCImageFix.rrx` | Image quality fix |
| `TiffMultipageMerge.rrx` | Merge multi-page TIFFs |

### Recognition
| Library | Purpose |
|---------|---------|
| `IdentifyPages.Rul.dll` | Page identification (fingerprint-based) |
| `RecognizePagesAndFields.Rul.dll` | OCR recognition |
| `RecognitionOCRA.dll` | OCR/A engine |
| `RecognitionOCRPL.dll` | OCR/PL engine (handprint, multi-Rulerunner in 9.1.10) |
| `Populate_Fields_Using_Keywords.Rul.dll` | Keyword-based field extraction |
| `Locate.dll` / `LocateText.dll` | Text location search |
| `PatternMatch.dll` | Regex / pattern matching |
| `Barcode.rrx` | Barcode reading |
| `Intellocate.dll` | Intelligent field location |
| `Flex.dll` | FlexID / learning-based recognition |
| `Zones.dll` / `ZonesAndLineItems.rrx` | Zone extraction + line items |
| `watsonx_ai.dll` | IBM watsonx.ai LLM extraction |

### Validation
| Library | Purpose |
|---------|---------|
| `ValidateFields.Rul.dll` | Field validation ruleset |
| `Validations.dll` | Data type, length, format validation |
| `ValidationsAndTextAdjustments.rrx` | Extended validation + text normalisation |
| `Lookup.dll` / `LookupDatabase.dll` | Database lookup validation |
| `Valid.dll` | Core validation engine |

### Export
| Library | Purpose |
|---------|---------|
| `IBMFileNetP8.rrx` | **FileNet P8 (new in 9.1.10 — replaces FileNetP8.dll)** |
| `ExportToIBMCM.Rul.dll` | IBM Content Manager |
| `ExportToBox.Rul.dll` | IBM Box |
| `ExportToDatabase.rrx` | SQL database |
| `ExportToText.rrx` | Delimited text |
| `ExportToXML.rrx` | XML |
| `ExportToCSV.Rul.dll` | CSV |
| `DCCMIS.dll` | CMIS repositories |
| `DCSTConnector.dll` | SharePoint |
| `Export.dll` | Core export engine |

### Import / Scan
| Library | Purpose |
|---------|---------|
| `ImportFiles.Rul.dll` | Import files from folder / email / Box |
| `VScan.dll` | Virtual scan (file import, PDF conversion) |
| `Email.dll` / `ewsmail.rrx` | Email import (EWS) |
| `Email.MSGraph.rrx` | Email import via MS Graph API |
| `mvscan.rrx` | Multi-value scan |

### Workflow / Utilities
| Library | Purpose |
|---------|---------|
| `CreateDocuments.Rul.dll` | Create document hierarchy instances |
| `SplitBatch.rrx` | Split batches |
| `RuleRunnerLogic.rrx` | Rulerunner control logic |
| `Statistics.rrx` | Batch/processing statistics |
| `AutomaticDocumentFingerprinting.rrx` | Auto-generate fingerprints |
| `ApplicationObjects.rrx` | Application object manipulation |
| `Redact.dll` | PII redaction |
| `WebService.dll` | REST/SOAP web service calls |
| `FileIO.rrx` | File system operations |

---

## 8. Deprecated / Removed in 9.1.10

The following action libraries were removed in 9.1.10 (previously deprecated):

| Removed | Replacement |
|---------|-------------|
| `FileNetP8.dll` / `FileNetP8.rrx` | `IBMFileNetP8.rrx` |
| Legacy image conversion actions | `ImageUtilities.rrx` or `Image_Convert.Rul.dll` |
| Legacy VBScript custom actions (deprecated path) | C# custom actions via DDK 9.1.10 |

---

## 9. Key Development References

| Resource | URL |
|----------|-----|
| IBM Docs 9.1.10 — Developing Applications | https://www.ibm.com/docs/en/datacap/9.1.10?topic=developing-applications |
| IBM Docs 9.1.10 — Planning Capture Apps | https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-planning-capture |
| IBM Docs 9.1.10 — Developing Capture Apps | https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-developing-capture |
| IBM Docs 9.1.10 — Automating Workflow | https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-automating-capture-application-workflow |
| IBM Docs 9.1.10 — Coding Maintenance Apps | https://www.ibm.com/docs/en/datacap/9.1.10?topic=applications-coding-maintenance |
| IBM Datacap Developer Kit (GitHub) | https://github.com/ibm-ecm/datacap-developer-kit |
| IBM Docs 9.1.10 — What's New | https://www.ibm.com/docs/en/datacap/9.1.10?topic=documentation-whats-new-in-datacap-version-9110 |
| openc.co.uk 9.1.10 Summary | https://www.openc.co.uk/2026/01/13/ibm-datacap-9-1-10-whats-new/ |
| IBM Community 9.1.10 Announcement | https://community.ibm.com/community/user/blogs/neil-parrott/2025/12/05/datacap-9110-is-generally-available |
