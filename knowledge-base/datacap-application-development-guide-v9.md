# IBM Datacap Application Development Guide — Version 9

> Source: `ibm-datacap-application-development-guide-9.pdf` (SC27-6375-00)  
> Applies to: Datacap Version 9 (and all subsequent releases until revised)  
> VBScript support was deprecated in 9.1.10 — all new custom actions must be C# / Visual Studio 2022.

---

## Table of Contents
1. [Application Architecture](#1-application-architecture)
2. [Document Hierarchy](#2-document-hierarchy)
3. [Datacap Workflow](#3-datacap-workflow)
4. [Document Input / Scanning](#4-document-input--scanning)
5. [Page Identification](#5-page-identification)
6. [Image Enhancement](#6-image-enhancement)
7. [Rule Execution Order](#7-rule-execution-order)
8. [Document Assembly and Integrity](#8-document-assembly-and-integrity)
9. [Data Recognition](#9-data-recognition)
10. [Data Validation](#10-data-validation)
11. [Data Verification](#11-data-verification)
12. [Data Export](#12-data-export)
13. [Application Debugging](#13-application-debugging)
14. [Line Item Grids](#14-line-item-grids)
15. [Smart Parameters — Full Reference](#15-smart-parameters--full-reference)
16. [Standard Variable Reference](#16-standard-variable-reference)
17. [Text Matching](#17-text-matching)
18. [Pattern Matching](#18-pattern-matching)
19. [Workflow Automation and Rulerunner](#19-workflow-automation-and-rulerunner)
20. [Conditional Branching and Splitting](#20-conditional-branching-and-splitting)
21. [Web Client and Remote Scanning](#21-web-client-and-remote-scanning)
22. [Fingerprint Management](#22-fingerprint-management)
23. [Action Library Summaries](#23-action-library-summaries)

---

## 1. Application Architecture

### Business Requirements Checklist
Before opening Datacap Studio, define:
- **Document types** and **page types** in the batch
- **Required document structure** (e.g., one Itinerary + one or more Receipts per batch)
- **Fields** for each page type
- **Permissible field values** (e.g., dictionary of valid car types)
- **Business validation rules** (e.g., total flight cost = sum of leg costs)
- **Data export format** (text file, database, XML, ECM repository)

### General Architecture
```
Datacap Server  ─── Engine DB (SQL Server)
      │          ─── Admin DB (SQL Server)
      │
 Rulerunner Service (RRS)  ──  C:\Datacap\RRS\*.dll  (action libraries)
      │
 Application folder:  C:\Datacap\<AppName>\
      ├── <AppName>.app      (application config — INI format)
      ├── <AppName>.xml      (SetupDCO — document hierarchy definition)
      ├── rulesets\          (workflow logic)
      ├── images\            (fingerprint library)
      ├── dictionaries\      (lookup lists)
      └── Batches\           (runtime batch folders)
```

---

## 2. Document Hierarchy

### Levels
| Level | DCO Object | XML Element |
|-------|-----------|-------------|
| Batch | Batch | `<batch>` |
| Document | Document | `<dcotype name="…" type="Document">` |
| Page | Page | `<dcotype name="…" type="Page">` |
| Field | Field | `<dcotype name="…" type="Field">` |

### SetupDCO XML Structure
The `<AppName>.xml` (SetupDCO) file describes the hierarchy:
```xml
<batch>
  <dcotype name="BatchRoot" type="Batch">
    <dcotype name="RentalAgreement" type="Document">
      <dcotype name="Rental_Agreement" type="Page">
        <dcotype name="CustomerName"   type="Field"/>
        <dcotype name="Car_Type"       type="Field"/>
        <dcotype name="Total_Cost"     type="Field"/>
      </dcotype>
    </dcotype>
    <dcotype name="ReceiptDocument" type="Document">
      <dcotype name="Receipt"         type="Page">
        <dcotype name="Amount"         type="Field"/>
      </dcotype>
    </dcotype>
  </dcotype>
</batch>
```

### Page Type Versions
- A page can have **multiple versions** (e.g., `Receipt_v1`, `Receipt_v2`).
- All versions share the same fields — they differ only in fingerprint / layout.
- Versions are handled in Datacap Studio under the Zones tab.

### Sharing Field Definitions
Fields that appear on multiple page types can be defined once on a shared parent and **linked** (not copied) to child page types. This ensures a single update propagates everywhere.

---

## 3. Datacap Workflow

### Components
```
Workflow
  └── Jobs  (logical processing phases, e.g. Scan, PageID, Recognize, Verify, Export)
        └── Tasks  (executable units assigned to Rulerunner or a web client)
              └── Task Profiles  (collection of rulesets)
                    └── Rulesets  (named groups of rules)
                          └── Rules  (ordered list of actions)
                                └── Actions  (individual DLL calls)
```

### Task Profiles and Rulesets
- A **Task Profile** attaches a set of rulesets to a task.
- Rulesets are ordered; each can be set to run at Batch, Document, Page, or Field level.
- Standard task profiles: `PageID`, `Recognize`, `Validate`, `Verify`, `Export`.

### Rulesets, Rules, and Actions
- A **Ruleset** has a DCO level (Batch / Document / Page / Field) and contains **Rules**.
- A **Rule** is executed against each DCO node at the specified level.
- Each Rule contains one or more **Actions** (calls to functions in action library DLLs).
- Actions return `true` (continue) or `false` (stop rule / change status).

---

## 4. Document Input / Scanning

### Input Methods
| Method | Description |
|--------|-------------|
| **VScan** | Picks up image files from a folder (virtual scanning) |
| **Local scan** | Directly drives a TWAIN/ISIS scanner |
| **Remote scan** | Browser-based scan via Datacap Web Client |
| **Email** | `Imail` or `Ewsmail` action libraries pull from mailbox |
| **MV Scan** | `mvscan` polls a watch folder on a schedule |

### VScan Ruleset (typical)
```
Scan task → VScan ruleset:
  SetSourceDirectory(@APPPATH(VScanSourceDir))
  SetImageType(TIF)
  Scan()
```

### Runtime Batch Folder
After scanning, each batch has a folder:
```
C:\Datacap\<AppName>\Batches\<YYYYMMDD_HHMMSS_BatchID>\
  ├── BATCH.XML        (runtime DCO hierarchy)
  ├── <page>.tif       (scanned/converted images)
  └── <page>.xml       (page data files — created during PageID)
```

---

## 5. Page Identification

### Methods (in priority order)
| Method | Action Library | When to use |
|--------|---------------|-------------|
| **Fingerprint matching** | Autodoc | Structured, repeating forms |
| **Structure-based** | Autodoc | When forms vary slightly |
| **Text matching** | Locate | Semi-structured / free-form |
| **Barcode** | Barcode_P / Barcode_X | Documents with printed barcodes |
| **Pattern matching** | PatternMatch | When layout shifts but key anchors exist |
| **Manual** | rrunner | Operator-assigned in web client |

### Fingerprint Matching
1. Create **fingerprint classes** (one per page type).
2. Add sample images as **fingerprints** to each class.
3. The `FindFingerprint` action compares the scanned page against stored fingerprints.
4. Confidence threshold is set via `SetFingerprintFailureThreshold`.

Key fingerprint actions:
| Action | Purpose |
|--------|---------|
| `FindFingerprint` | Match page to a fingerprint class |
| `FindBlackFingerprint` | Use dark-background fingerprints |
| `SetFingerprintDir` | Set path to fingerprint library |
| `SetFingerprintSearchArea` | Restrict search to a page region |
| `SetFingerprintFailureThreshold` | Minimum confidence to accept |
| `CreateFingerprint` | Programmatically create a fingerprint |
| `SetPageFingerprintID` | Explicitly assign fingerprint ID to a page |
| `UpdateFingerprintStats` | Update hit/miss statistics |

### Structure-Based Page Identification
- Relies on the document hierarchy definition.
- `CheckAllIntegrity` verifies that assembled documents match expected structure.

### Fingerprint XML Files (FPXML)
- Alternative storage: fingerprint data stored in `.fpx` XML files instead of the database.
- Enabled via `FPXMLUsed` / `ReadZonesFPX` / `WriteZonesFPX` actions.
- Useful for source-control and multi-server deployments.

---

## 6. Image Enhancement

### When to Apply
- **Before fingerprinting**: enhance the fingerprint template images
- **During PageID**: apply same settings to incoming scans
- Use `DCImageFix` action library: `ImageEnhance`, `LoadSettings`, `LoadSettings_FingerprintID`

### Typical Enhancements
- Deskew, despeckle, binarize, border removal
- Settings are stored in an `.iif` settings file

---

## 7. Rule Execution Order

### Association of Rules with Objects
Rules are attached at any level of the DCO hierarchy:
- **Batch-level rule**: executes once per batch
- **Document-level rule**: executes once per document
- **Page-level rule**: executes once per page
- **Field-level rule**: executes once per field

### Execution Order Within a Task Profile
1. Rulesets are processed in the order listed in the task profile.
2. Within a ruleset, rules execute top-to-bottom.
3. If an action returns `false`, the current rule stops; the next rule in the ruleset begins.
4. **`ProcessChildren`** action causes the engine to descend into child DCO nodes.
5. **`SkipChildren`** prevents descent.

### Execution for Page Identification
```
PageID task profile execution:
  For each page in the batch:
    1. Run Batch-level rules (if any)
    2. Run Page-level rules  → FindFingerprint → SetPageType
    3. If fingerprint found: Run Field-level rules for that page type
```

### Summary of Rule Execution
| Scenario | Order |
|----------|-------|
| Page identification | Page rules, then field rules if page matched |
| Validation | Field rules for each field on each page |
| Batch-close rules | After all documents processed |

---

## 8. Document Assembly and Integrity

### Structured vs. Hierarchy-Based Documents
- **Structured**: page order is fixed (e.g., page 1 = cover, page 2 = details)
- **Hierarchy-based**: pages identified by type; assembled in any order

### Document Assembly Process
1. `CreateDocuments` action creates Document nodes in BATCH.XML
2. `CheckAllIntegrity` verifies each document matches the expected hierarchy
3. On failure: batch can branch to a manual correction task

### CheckAllIntegrity Action
- Checks that every document has all required page types
- Returns false if integrity fails → triggers condition flag for branching

### Document Integrity Problem Management
- Set condition flag via `Task_RaiseCondition`
- Define job router to branch the batch to an `IntegrityFix` task
- Operator resolves issues in Datacap Web Client; batch re-routes to PageID

---

## 9. Data Recognition

### Recognition Flow
```
Page image  →  Recognition zones (defined in fingerprint)
            →  OCR/ICR engine reads zone
            →  Result stored in field's CCO (character-level data)
            →  CCO snapped to DCO (BATCH.XML field values)
```

### Zone Definition
- Zones are drawn on the fingerprint image in the **Zones tab** of Datacap Studio.
- Each zone is linked to a field in the DCO hierarchy.
- Zone position is stored relative to the fingerprint anchor points.

### Recognition Engines
| Library | Engine | Best for |
|---------|--------|----------|
| `OCR_S` | ABBYY FineReader | Printed text, high accuracy |
| `OCR_A` | Nuance OmniPage | Legacy; printed text |
| `OCR_N` | Nuance | Printed text |
| `ICR_C` | Parascript | Handwritten text |
| `ICR_P` | Postal recognition | Postal/address fields |

### Key Recognition Actions
| Action | Description |
|--------|-------------|
| `RecognizePageFieldsOCR_S` | Recognize all zones on a page (ABBYY) |
| `RecognizeFieldOCR_S` | Recognize a single field zone |
| `RecognizePageOCR_S` | Full-page recognition (no zones needed) |
| `RecognizeToPDF` | Create searchable PDF alongside recognition |
| `RegisterPageFields` | Apply zone positions to current page image |
| `SnapCCOtoDCO` | Transfer CCO recognition results into DCO fields |

### Dynamic Locale Support
- Set language for OCR via the `hr_locale` variable or `SetLanguageCC` action.
- Supported language codes: `eng`, `fra`, `deu`, `spa`, `ita`, `por`, `rus`, `jpn`, etc. (full list in PDF pp. 63–64).

### Check Box (OMR) Recognition
| Method | Action | Variables Required |
|--------|--------|-------------------|
| OCR/A | `RecognizeFieldOCR_A` | Parent field with `MultiPunch`, child fields |
| Pixel threshold | `RecogOMRThreshold` | `DensityString`, threshold values |
| Pattern | Zone drawing on checkbox area | — |

Steps for checkbox setup:
1. Create a **parent field** with `MultiPunch = 1`.
2. Create **child fields** for each option.
3. Set `SELECT` variable on each child to the option value.
4. Attach the OMR recognition action at the parent field level.

### Autofield (Medical Claims)
- `MC_Identify.AutoField` reads pre-printed HCFA/UB form layouts.
- Uses `ReadDCOSetup`, `ReadPageSetup`, `SetFormType` to configure.

---

## 10. Data Validation

### Validation Goals
1. Check data format validity (dates, currency, numeric)
2. Validate calculated fields (e.g., sum of line items = total)
3. Show failures to an operator for correction
4. Use external data sources (lookup DB, dictionary)
5. Manage errors (set field/page status)

### Field Status Codes
| Code | Meaning |
|------|---------|
| 0 | OK |
| 4 | Validation failed |
| 8 | Recognition failed |
| 16 | Operator override |
| 32 | Field empty / not recognized |

### Validation Actions (from `Validations` library)
| Action | Purpose |
|--------|---------|
| `IsFieldDate` | Check field is a valid date |
| `IsFieldCurrency` | Check field is currency format |
| `IsFieldEmpty` | True if field has no value |
| `IsFieldFilled` | True if field has a value |
| `Calculate` | Evaluate mathematical expression |
| `CalculateFields` | Multi-field arithmetic |
| `CompareFields` | Compare two field values |
| `CopyField` / `CopyFieldToField` | Copy field data |
| `TrimSpaces` | Remove leading/trailing spaces |
| `ConvertToUpperCase` / `ConvertToLowerCase` | Case conversion |
| `ReplaceChars` | Replace character sequences |
| `IsPatternInField` | Regex match in field value |
| `IsFieldLengthMax` / `IsFieldLengthMin` | Length constraints |

### Lookup Database Validation
1. Create ODBC data source pointing to a lookup table.
2. In Datacap Studio: attach a Lookup to the field (`Lookup` variable = `DSN|TABLE|COLUMN`).
3. Use `Lookup.OpenConnection`, `ExecuteSQL`, `PopulateWithResult` in a validation rule.
4. Alternatively use `SmartSQL` for parameterized queries.

### Dictionary Validation
1. Create dictionary file (plain text, one value per line).
2. Attach to field via `DICT` variable.
3. `PIC_ValidateField` or `Validations.FieldContainsValue` checks against the dictionary.

---

## 11. Data Verification

### Overview
Verification is the human review step where operators correct recognition/validation failures.

### Verification Clients
| Client | Description |
|--------|-------------|
| **Datacap Web Client** | Browser-based; most common |
| **Datacap Desktop** | Thick-client for high-volume |
| **VeriFine** | Batch-tree restructuring + verification |
| **AIndex** | Manual page ID + multi-pass verification |
| **AVerify** | Web client with manual anchoring |
| **ImgEnter** | Key-from-image data entry |
| **ProtoId** | Manual page identification and batch restructuring |

### Confidence Levels and Page Status
- Each recognized field has a **Confidence** value (0–100).
- Fields below the page's `ReqConf` threshold are flagged for operator review.
- `Confidence` page variable = lowest field confidence on the page.
- Pages with `Status = 4` (validation failure) are always presented to the operator.

### Overriding Validation Failures
- `SetIsOverrideable` marks a field so that operator can override a failed validation.
- Default: operator can override; use `SetIsOverrideable(0)` to prevent.

### Skipping Verification
- A task can be configured to skip verification entirely if all fields meet confidence threshold.
- Use `SkipVerify` condition in task routing.

---

## 12. Data Export

### Export Methods
| Library | Target |
|---------|--------|
| `Export` | Delimited text file |
| `ExportDB` | ODBC database (INSERT/UPDATE) |
| `ExportXML` | Custom XML file |
| Connector actions | ECM repositories (FileNet, IBMCM, SharePoint, CMIS) |

### Text File Export (Export library)
Typical export ruleset:
```
SetExportPath(@APPPATH(ExportDir))
SetFileName(@BATCHID)
SetCSV(,)           ← comma separator
ExportAllFields()   ← one row per page
CloseExportFile()
```
Key Export actions:
| Action | Purpose |
|--------|---------|
| `SetExportPath` | Output folder |
| `SetFileName` | Output file name |
| `SetCSV` | Set column separator |
| `ExportAllFields` | Export all field values on current page |
| `ExportFieldValue` | Export a specific field value |
| `ExportSmartParameter` | Export result of a smart parameter |
| `BlankFields` / `BlankLines` | Output blank when field is empty |
| `NewLine` | Write a new line |
| `Text` | Output a literal string |
| `CloseExportFile` | Finalize and close |
| `LineItem_ExportElements` | Export all line items from a grid |

### Database Export (ExportDB library)
```
ExportOpenConnection(@APPPATH(ExportDSN))
SetTableName(RentalData)
ExportFieldToColumn(CustomerName, CustName)
ExportFieldToColumn(Car_Type, CarType)
ExportBatchIDToColumn(BatchID)
AddRecord()
ExportCloseConnection()
```

### XML Export (ExportXML library)
```
xml_SetExportPath(@APPPATH(XMLDir))
xml_SetFileName(@BATCHID)
xml_NewNode(Batch)
  xml_NewNode(Document)
    xml_SetNodeValue(CustomerName, @F\CustomerName)
    xml_SetAttributeValue(id, @ID)
  xml_CommitNode()
xml_CommitNode()
xml_SaveFile()
```

### Connector Actions
| Connector | Key Actions |
|-----------|------------|
| FileNet P8 | `FNP8_Login`, `FNP8_SetURL`, `FNP8_SetDocClassId`, `FNP8_Upload` |
| IBM CM | `IBMCM_Logon`, `IBMCM_CreateItem`, `IBMCM_SetAttributeValue`, `IBMCM_UploadDCO_DOC` |
| SharePoint | `SP_Login`, `SP_SetUrl`, `SP_SetContentType`, `SP_Upload` |
| CMIS | `CMISLogin`, `CMISSetDocUploadType`, `CMISUploadFile` |
| Email | `SendEMail`, `SetMailServer`, `SetRecipients`, `SetSubject` |

---

## 13. Application Debugging

### Log Files
| Log | Location | Content |
|-----|----------|---------|
| RRS service log | `C:\Datacap\dclogX.log` | All rule execution; most detailed |
| Task log | Batch folder `\log\` | Per-task execution trace |
| Web client log | IIS log + browser dev tools | Client-side errors |

### Enable RRS Logging
In Rulerunner Manager → Logging tab → check "Enable logging".  
Log level: `0` = errors only, `3` = verbose (all actions).

### Datacap Studio Test Tab
- Load a batch directly in Studio.
- Set **breakpoints** on any action (Generic, Before, After, On Error).
- **Single-step** through rule execution.
- Inspect field values and DCO status at any breakpoint.
- View live log output in the Test tab log pane.

### Breakpoint Types
| Type | Fires |
|------|-------|
| Generic | Every time action is reached |
| Before | Before action executes |
| After | After action executes |
| On Error | When action returns false |

---

## 14. Line Item Grids

### Document Hierarchy for Grids
- Add a **repeating page type** under the document (e.g., `FlightCoupons`).
- Under it, add a **line item field group** (e.g., `LineItem`) containing individual fields.
- The DCO hierarchy: `Document → FlightCoupons (Page) → LineItem[n] → {Date, Route, Cost}`.

### Recognition Rules for Line Items
1. Use `Zones.FindLineItems` or `Zones.ScanLineItem` to detect line boundaries.
2. Use `Zones.PopulateZNLineItemField` / `PopulateZNLineItemFieldDynamic` to fill fields.
3. `Zones.ScanDetails` / `ScanDetailsByLines` for tabular data.

### Removing Non-Line Items
- After recognition, use `Validations.DeleteChildType` or field-level rules to remove header/footer rows that are not actual line items.

### Exporting Line Item Data
```
// Database export of line items:
ExportOpenConnection(…)
SetTableName(LineItems)
LineItem_ExportElements()   ← iterates all child line items
ExportCloseConnection()
```

For XML export, use `Zones.ScanDetails` in combination with `xml_NewNode` / `xml_SetNodeValue` at field level, iterating over each child.

---

## 15. Smart Parameters — Full Reference

Smart parameters allow action arguments to reference runtime values dynamically.  
**Format**: `@KEYWORD` or `@KEYWORD(argument)`  
**Concatenation**: use `+` to join multiple parts — e.g., `@APPPATH(OutputDir)+\+@BATCHID+.xml`

---

### 15.1 Special Variables — Application Configuration

#### `@APPPATH(<key_path>)`
Returns the **value** of the specified key from the application's `.app` configuration file, interpreted as a **file path** (appended to the application folder path if relative).

```
@APPPATH(FingerprintDir)
→ e.g. C:\Datacap\TravelDocs\images\fingerprints
```

#### `@APPVAR(<key_path>)`
Returns the **value** of the specified key from the `.app` file as a **plain string** (no path expansion).

```
@APPVAR(ExportDSN)
→ e.g. Driver={SQL Server};Server=localhost;Database=TravelExport
```

**Storing secrets**: Add keys like `ExportPwd` to the `.app` file using Datacap Studio's Application Properties. Never hard-code passwords in rules.

---

### 15.2 Special Variables — Runtime Hierarchy

#### `@BATCHID`
Unique identifier of the current batch (alphanumeric string assigned at batch creation).

#### `@ID`
ID of the **current DCO object** being processed (batch, document, page, or field).

#### `@STATUS`
Status value of the current DCO object (integer — see field status codes in section 10).

#### `@VALUE`
Text value of the current field. For non-field levels, returns empty.

#### `@VAR(<variable_name>)`
Value of a **named variable** on the current DCO object.  
Example: `@VAR(Confidence)` → returns the Confidence variable of the current page.

#### `@P\<field_name>[.<variable_name>]`
Navigate to a **field on the current page** (sibling field).  
- `@P\CustomerName` → value of CustomerName field on current page  
- `@P\CustomerName.Confidence` → Confidence variable of CustomerName

#### `@F\<field_name>[.<variable_name>]`
Navigate to a **field** anywhere in the current document (first match by name).  
- `@F\TotalCost` → value of TotalCost wherever it appears in the document

#### `@B\<field_name>[.<variable_name>]`
Navigate to a **field** anywhere in the current **batch**.

#### `@D\<field_name>[.<variable_name>]`
Navigate to a **field** in the current **document** (equivalent to `@F` when already at document level).

#### `@P.<variable_name>`
Value of a **page-level variable** on the current page.  
Example: `@P.IMAGEFILE` → image file path for the current page.

#### `@F.<variable_name>`
Value of a **field-level variable** on the current field (without specifying field name).

---

### 15.3 Navigation Syntax

| Syntax | Meaning |
|--------|---------|
| `@B` | Batch root |
| `@D` | Current document |
| `@P` | Current page |
| `@F` | Current field |
| `.` | Access a variable on the current object — e.g., `@P.Confidence` |
| `\<name>` | Descend to a child node by name — e.g., `@B\TotalCost` |
| `+` | Concatenate — e.g., `@APPPATH(Out)+\+@BATCHID` |

---

### 15.4 Special Variables — Job and Task Information

#### `@JOBID`
Numeric ID of the currently executing job.

#### `@JOBNAME`
Name of the currently executing job (as defined in the workflow).

#### `@OPERATOR`
Windows username of the operator processing the current task.

#### `@STATION`
Workstation name (computer name) where the task is running.

#### `@TASKID`
Numeric ID of the current task.

#### `@TASKNAME`
Name of the current task.

---

### 15.5 Miscellaneous Special Variables

#### `@CHR(<unicode_value>)`
Returns the character for the given Unicode code point.  
Example: `@CHR(9)` → tab character.

#### `@DATE(<format>)`
Current date in the specified format string.  
Example: `@DATE(YYYYMMDD)` → `20250120`.

#### `@DCO(<property_name>)`
Returns a DCO object property (application-level configuration property).

#### `@DICT_VALUE(<field>)`
Returns the **value** from the dictionary attached to the named field (the current dictionary entry).

#### `@DICT_WORD(<field>)`
Returns the **word/key** from the dictionary attached to the named field.

#### `@DICT_VINDEX(<csv_string>)`
Returns the index (position) of the current field value within the comma-separated list.

#### `@DICT_WINDEX(<csv_string>)`
Returns the index of the current field word within the comma-separated list.

#### `@EMPTY`
An empty string. Useful when an action requires a parameter but you want to pass nothing.

#### `@PATH(<key>)`
Constructs a path using a key from the `.app` file (similar to `@APPPATH` but for general path building).

#### `@PILOT(<property_name>)`
Returns a value from the **Pilot** (batch-level metadata) object.

#### `@PROJECTDIR`
Full path to the application project folder.  
Example: `C:\Datacap\TravelDocs\`

#### `@PROCESSDIR`
Full path to the **current batch's processing folder** (the runtime batch folder).  
Example: `C:\Datacap\TravelDocs\Batches\20250120_143022_B00001\`

#### `@STRING(<string_value>)`
Treats the argument as a literal string (escapes any special characters).  
Use when a literal `@` needs to be passed to an action.

#### `@TIME(<format>)`
Current time in the specified format.  
Example: `@TIME(HH:MM:SS)`.

#### `@TYPE`
Returns the DCO type name of the current object (e.g., `RentalAgreement`, `Receipt`).

---

### 15.6 Smart Parameter Actions

These actions in the `rrunner` library manipulate smart parameter values:

| Action | Description |
|--------|-------------|
| `rr_Get(variable, smartparam)` | Read a smart parameter value into a variable |
| `rrSet(variable, value)` | Set a variable to a literal or smart parameter value |
| `rrCopy(dest_var, src_var)` | Copy one variable's value to another |
| `rrAppend(variable, value)` | Append a value to a variable |
| `rrPrepend(variable, value)` | Prepend a value to a variable |
| `rrCompare(variable, value)` | True if variable equals value (case-insensitive) |
| `rrCompareCase(variable, value)` | True if variable equals value (case-sensitive) |
| `rrCompareNot(variable, value)` | True if variable does NOT equal value |
| `rrCompareNotCase(variable, value)` | True if variable does NOT equal value (case-sensitive) |
| `rrCompareCaseLength(var, val, len)` | Compare first `len` characters |
| `rrCompareNotCaseLength(var,val,len)` | Not-equal, first `len` characters |
| `rr_WriteNode(path, value)` | Write a value to a DCO node path |
| `rr_AbortBatch` | Mark the batch as failed and stop processing |

---

## 16. Standard Variable Reference

These variables exist on DCO objects and are set/read by actions. They are accessed via `@VAR(<name>)` or directly in the Zones tab.

### Variables on All Object Types
| Variable | Type | Description |
|----------|------|-------------|
| `STATUS` | Int | Current processing status (0=OK, 4=fail, 8=recog fail, etc.) |
| `TYPE` | String | DCO type name |
| `rules` | String | Semicolon-separated list of attached rulesets |
| `MAX_TYPES` | Int | Maximum number of child types allowed |
| `MIN_TYPES` | Int | Minimum number of child types required |
| `MESSAGE` | String | Error or informational message text |
| `hr_locale` | String | Locale for OCR language (e.g., `eng`, `fra`) |

### Batch Variables
| Variable | Description |
|----------|-------------|
| `LAST_RR_PROFILE` | Name of the last Rulerunner task profile executed |

### Document Variables
| Variable | Description |
|----------|-------------|
| `DD` | Document data — general metadata |

### Page Variables
| Variable | Description |
|----------|-------------|
| `Confidence` | Lowest field confidence on the page (0–100) |
| `DATAFILE` | Path to the page data XML file (`.xml`) |
| `IMAGEFILE` | Path to the page image file (`.tif`) |
| `Fingerprint Created` | Set to `1` when a fingerprint has been auto-generated |
| `Image_Offset` | Pixel offset if image has been cropped |
| `PatternConfidence` | Confidence returned by pattern matching |
| `PD` | Page data — general metadata |
| `ScanSrcPath` | Original source path of the scanned image |
| `TEMPLATE IMAGE` | Path to the fingerprint template image |
| `TemplateID` | Fingerprint template identifier |

### Field Variables
| Variable | Description |
|----------|-------------|
| `DataType` | Expected data type (`Alpha`, `Numeric`, `Currency`, `Date`) |
| `DensityString` | OMR pixel density values (for threshold-based checkbox) |
| `DICT` | Path to the dictionary file attached to this field |
| `Index` | Position index of this field in its parent |
| `Label` | Display label for the field in verification clients |
| `Lookup` | ODBC connection string for lookup validation |
| `LookupEx` | Extended lookup (stored proc or complex query) |
| `MaxLength` | Maximum character length |
| `METRIC` | Metric used for confidence scoring |
| `MultiLine` | `1` if field can contain multiple lines |
| `MultiPunch` | `1` if field is a checkbox group parent |
| `PatternMatch` | Pattern matching configuration string |
| `PictureString` | Picture format mask (e.g., `AAAA-9999`) |
| `Position` | Zone position string `left,top,right,bottom` |
| `Pos<templateID>` | Zone position for a specific fingerprint template |
| `ReadOnly` | `1` if field cannot be edited by operator |
| `RecogStatus` | Status code from recognition engine |
| `RecogType` | Recognition type (`OCR`, `ICR`, `OMR`, `Barcode`) |
| `ReqConf` | Required confidence threshold for this field |
| `SELECT` | Value to assign if this checkbox option is selected |
| `ShowChar` | `1` if individual characters should be shown during verify |
| `Sticky` | `1` if value persists from batch to batch |
| `Text` | Field text value (same as `@VALUE`) |
| `Zone_Offset` | Zone position adjustment offset |

---

## 17. Text Matching

### Page Identification with Text Matching
- Use `Locate.FindKeyList` to search for a keyword list on a page.
- If keywords found → `SetPageType` to the matching page type.
- More flexible than fingerprinting for variable-format documents.

### Locating Field Data with Text Matching
Text matching navigates the OCR word list to find and extract values:

| Category | Actions |
|----------|---------|
| **Find by keyword** | `FindKeyList`, `FindKeyList_InZone`, `FindNextKeyList`, `FindLastKeyList` |
| **Find by regex** | `FindRegExList`, `FindRegExList_InZone`, `FindNextRegExList`, `FindLastRegExList` |
| **Find by DB lookup** | `FindDBList`, `FindDBList_InZone`, `FindNextDBList` |
| **Navigate words** | `GoRightWord`, `GoLeftWord`, `GoAboveWord`, `GoBelowWord`, `GoDownLine`, `GoUpLine` |
| **Get text** | `GetZoneText`, `SelectSnippet` |
| **Write back** | `UpdateField`, `UpdateDCOField` |
| **Validate** | `IsAlpha`, `IsCurrency`, `IsDateValue`, `IsNumber`, `IsValue`, `IsValue_RegEx` |

### Text Matching Workflow
```
1. FindKeyList("Invoice Number")     ← locate the anchor keyword
2. GoRightWord()                     ← move cursor to the right
3. SelectSnippet()                   ← capture the word
4. UpdateField(InvoiceNumber)        ← write to DCO field
```

### Regular Expressions
- `FindRegExList` accepts a regex pattern.
- `IsValue_RegEx` validates a field value against a regex.
- `RegExFind` / `RegExFindNext` for repeated matches.
- Patterns follow standard regex syntax.

### Keyword Lists
- Stored as plain text files, one keyword per line.
- Referenced via `AddKeyList(filename)`.
- Multiple keyword lists can be aggregated with `AggregateKeyList`.

### Text Matching Limitations
- Works best on machine-printed text.
- Handwritten fields should use ICR zones instead.
- Accuracy depends on OCR quality of the input image.

---

## 18. Pattern Matching

### Overview
Pattern matching identifies pages when the form layout shifts (e.g., different print runs) but fixed anchor elements are present.

### Two Types
| Type | Library | Identification action | Recognition action |
|------|---------|-----------------------|--------------------|
| Geometric | `PatternMatch` | `PatternMatch_Identify` | `pat_RegisterZones` |
| Text-based | `PatternMatch` | `pat_RecogMatch_Id` | anchor offsets |

### Geometric Pattern Matching
1. Define **anchor objects** — fixed graphic elements (lines, logos) on the page.
2. `PatternMatch_Identify` finds anchors and calculates the transformation (shift/rotation).
3. `pat_RegisterZones` adjusts all field zone positions based on the transformation.
4. Normal recognition actions then read the (adjusted) zones.

Key actions:
| Action | Purpose |
|--------|---------|
| `PatternMatch_Identify` | Match page using geometric anchor objects |
| `PatternMatch_Fingerprint` | Create a pattern match fingerprint |
| `PatternMatch_PageType` | Assign page type after pattern match |
| `pat_RegisterZones` | Apply anchor-based zone adjustment |
| `pat_RecogMatch_Id` | Text-based pattern match identification |
| `pat_ReleasePageAnchors` | Release anchor memory after processing |
| `SetMatchConfidence` | Set minimum confidence for match acceptance |
| `MatchPattern` | Basic pattern comparison |

### Anchor Object Setup
- Anchor objects are defined in the fingerprint XML.
- Multiple anchors improve accuracy (use at least 2 for rotation correction).
- `pat_RegisterZones` supports field adjustment based on multiple anchor offsets.

### Auto Registration with FindFingerprint
- `FindFingerprint` with `SetFingerprintSearchArea` can act as the first-pass anchor detection before calling `pat_RegisterZones`.

---

## 19. Workflow Automation and Rulerunner

### Rulerunner (RRS) Overview
- The **Rulerunner Service** (`RRS`) processes batches automatically in the background.
- Configured in **Rulerunner Manager** (separate application).
- Monitors queues and processes tasks without operator intervention.

### Rulerunner Configuration
1. Open Rulerunner Manager.
2. Add the application.
3. Define **background tasks** — each maps a job+task to an execution schedule or queue trigger.
4. Set logging level (off, errors, verbose).
5. Enable the **Job Monitor** to view batch status.

### Rulerunner Operation
- RRS polls the Engine DB for batches in the `Ready` state for its configured tasks.
- On finding a batch, it locks it, runs the task, and updates status.
- Multiple RRS instances can run in parallel for throughput.

### `ProcessChildren` vs `SkipChildren`
| Action | Effect |
|--------|--------|
| `ProcessChildren` | Descend into child nodes and run the current ruleset |
| `SkipChildren` | Do not process children; move to next sibling |
| `GoToNextFunction` | Skip remaining rules in current ruleset; go to next function in the task |

---

## 20. Conditional Branching and Splitting

### Branching vs Splitting
| Operation | Description |
|-----------|-------------|
| **Branch** | Route the entire batch to a different job/task |
| **Split** | Extract one or more documents into a new, separate batch |

### Condition Flags
- Conditions are named flags set with `Task_RaiseCondition("<condition_name>")`.
- In the job router, define a **branch rule**: if condition `X` is raised → go to job `Y`.
- Conditions are evaluated after the task completes.

### Defining a Condition and Action
```
// In a rule, at document level:
Task_RaiseCondition(IntegrityFailure)

// In the job router configuration:
Condition: IntegrityFailure  →  Job: ManualFix, Task: IntegrityTask
```

### Special Condition Jobs
- **Unidentified pages**: route to a `ManualPageID` job.
- **Document integrity failures**: route to an `IntegrityFix` job.
- **Operator supervisor review**: split document to a `SupervisorReview` job.

### Batch Splitting (`SplitBatch`)
```
// Rule attached to a document:
SplitBatch()   ← moves current document into a new batch
Task_RaiseCondition(SplitOccurred)

// Job router:
SplitOccurred → Job: SupervisorQueue, Task: SupervisorVerify
```

---

## 21. Web Client and Remote Scanning

### Moving Tasks to the Web
- Configure task as a **web task** in Datacap Application Manager.
- Assign a web client (VeriFine, AVerify, AIndex, ProtoId, ImgEnter, or default Datacap Web Client).

### Remote Scanning
1. Install the Datacap Thin Client scan software on the remote workstation.
2. Configure the scan profile (scanner type, image settings).
3. User scans via the browser; images uploaded to the server.
4. `Vscan.Scan` or remote scan task processes the upload.

### Start Panel (Drop-down Lists)
- A **start panel** is an HTML/ASPX page presented before scanning.
- Use `Export.GetProfileString` or `rrunner.rrSet` to populate dynamic drop-down values.
- Validation rules can run on start-panel data before the batch is created.

### VeriFine Configuration
- Allows operator to restructure batch tree (move pages between documents).
- Configure via `VeriFine.config` in the application's web folder.
- Set `AllowBatchEdit = true` to enable restructuring.

### AIndex Multi-Pass Verification
- Supports **two-pass** and **double-blind** data entry.
- Operators enter the same data independently; discrepancies are flagged.
- Configure passes in the AIndex task settings.

---

## 22. Fingerprint Management

### Fingerprint Database vs FPXML
| Mode | Storage | Pros |
|------|---------|------|
| Database | SQL table in Engine DB | Default; centralized |
| FPXML | `.fpx` XML files on disk | Source-controllable; multi-server friendly |

### Fingerprint Maintenance Tool
- Standalone GUI tool: `C:\Datacap\FingerprintMaintenanceTool.exe`
- View, import, export, and delete fingerprints.
- Actions: `FingerprintMaintenance.OpenDatabase`, `DeleteFingerprint`, `SetFingerprintFolder`.

### Automatic Fingerprint Generation
- Attach `Autodoc.CreateFingerprint` in the Verify task profile.
- After an operator verifies and submits a batch, the page fingerprint is created automatically.
- Subsequent similar pages are identified without manual fingerprint creation.

### Fingerprint XML Actions
| Action | Purpose |
|--------|---------|
| `ReadZonesFPX` | Load zone positions from `.fpx` file |
| `WriteZonesFPX` | Save zone positions to `.fpx` file |
| `WriteZoneFPX` | Save a single zone |
| `SetDetailsAndLineitemPairFPX` | Configure detail/line item zone pairing |
| `SetDirectoryFPX` | Set path for `.fpx` files |
| `FPXMLUsed` | Enable FPXML mode |

---

## 23. Action Library Summaries

### Global Actions (in every task)
| Action | Description |
|--------|-------------|
| `AddChildDCONode` | Add a new child node to the DCO hierarchy at runtime |
| `ProcessChildren` | Descend into child nodes |
| `SkipChildren` | Skip child node processing |
| `GoToNextFunction` | Skip to next ruleset in the task profile |
| `SetReturnValue` | Set the return value (true/false) for the current action |
| `SetTaskStatus` | Set the status of the current task |
| `SetBatchPriority` | Set priority of the current batch in the queue |
| `SetOperatorID` | Override the operator ID |
| `SetStationID` | Override the station ID |

### Library Quick Reference

| Library | DLL | Key Purpose |
|---------|-----|-------------|
| `Autodoc` | autodoc.dll | Fingerprint creation/matching |
| `Barcode_P` | barcode_p.dll | PDF417, DataMatrix, QR barcodes |
| `Barcode_X` | barcode_x.dll | 1D/2D barcodes |
| `CC` | cc.dll | Cognitive classification (AI-based page ID) |
| `CMISClient` | cmisclient.dll | CMIS-compliant ECM export |
| `Convert` | convert.dll | Convert Office/PDF/images to TIFF |
| `DCImageFix` | dcimagefx.dll | Image enhancement |
| `DCO` | DCO.dll | DCO hierarchy manipulation |
| `dcpdf` | dcpdf.dll | PDF creation from TIFF |
| `Email` | email.dll | SMTP email sending |
| `Ewsmail` | ewsmail.dll | Exchange Web Services email polling |
| `Export` | export.dll | Text/CSV file export |
| `ExportDB` | exportdb.dll | ODBC database export |
| `ExportXML` | exportxml.dll | XML file export |
| `FileIO` | fileio.dll | File system operations |
| `FileNetIDM` | filenetidm.dll | FileNet Image Services |
| `FileNet P8` | fnp8.dll | FileNet P8 Content Engine |
| `FingerprintMaintenance` | fpmaint.dll | Fingerprint DB management |
| `FPXML` | fpxml.dll | Fingerprint XML file management |
| `IBMCM` | ibmcm.dll | IBM Content Manager |
| `ICR_C` | icr_c.dll | Handwriting recognition (Parascript) |
| `ICR_P` | icr_p.dll | Postal/address recognition |
| `ImageConvert` | imageconvert.dll | TIFF/JPEG conversion and merging |
| `Imail` | imail.dll | IMAP/POP3 email polling |
| `Imprint` | imprint.dll | Image annotation and redaction |
| `Intellocate` | intellocate.dll | AI-based zone location |
| `Invoice (APT)` | APTCustom.dll | Datacap APT invoice processing |
| `IOverlay` | ioverlay.dll | Image overlay |
| `Locate` | locate.dll | Text matching and data location |
| `Lookup` | lookup.dll | ODBC lookup database |
| `MC_Identify` | mc_identify.dll | Medical claims form identification |
| `MC_Validation` | mc_validation.dll | Medical claims validation |
| `Maintenance Manager` | maint_mgr.dll | Batch administration and query |
| `mvscan` | mvscan.dll | Monitored folder scanning |
| `OCR_A` | ocr_a.dll | Nuance OmniPage recognition |
| `OCR_N` | ocr_n.dll | Nuance recognition |
| `OCR_S` | ocr_s.dll | ABBYY FineReader recognition |
| `OCR_SR` | ocr_sr.dll | ABBYY structured recognition |
| `OpenTextFaxServer` | otfax.dll | OpenText fax server integration |
| `PatternMatch` | patternmatch.dll | Geometric/text-based pattern ID |
| `Picture` | picture.dll | Picture string format/validate |
| `POLR` | polr.dll | Pattern-oriented line recognition |
| `Recog_Shared` | recog_shared.dll | Shared recognition utilities |
| `rrunner` | rrunner.dll | Core workflow actions (Smart Param) |
| `SPExport` | spexport.dll | SharePoint export |
| `Split` | split.dll | Batch splitting |
| `TifMerge` | tifmerge.dll | TIFF file merging |
| `Validations` | validations.dll | Data validation and transformation |
| `Vote` | vote.dll | Multi-engine OCR voting |
| `Vscan` | vscan.dll | Virtual scanning from folder |
| `Web Services` | webservices.dll | SOAP/REST web service calls |
| `Zones` | zones.dll | Zone-based text extraction and line items |

### DCO Actions (detailed)
| Action | Level | Description |
|--------|-------|-------------|
| `CreateDocuments` | Batch | Create Document nodes from identified pages |
| `CreateFields` | Page | Create Field nodes dynamically |
| `DeleteFields` | Page | Remove Field nodes |
| `ChkConfidence` | Page/Field | Check confidence against threshold |
| `ChkDCOStatus` | Any | Check status value |
| `ChkDCOType` | Any | Check DCO type name |
| `ChkIntegrity` | Document | Check document structure integrity |
| `ClearDCO` | Any | Clear values and status |
| `CopyPD2DD` | Document | Copy page data to document data |
| `RemoveDocumentStructure` | Document | Remove document and its pages |
| `SetDCOStatus` | Any | Set status code |
| `SetDCOType` | Any | Change DCO type |
| `SetDocStatus` | Document | Set document status |
| `SetDocumentType` | Document | Assign document type name |
| `SetFldConfidence` | Field | Override field confidence value |
| `SetPageFingerprintID` | Page | Assign fingerprint ID |
| `SetPageStatus` | Page | Set page status code |
| `SetPageTemplateID` | Page | Assign template ID |
| `SetPageType` | Page | Assign page type name |
| `CountPagesToDocumentVar` | Document | Count pages into a variable |
| `IsDocumentCountMoreThan` | Batch | True if document count exceeds N |
| `IsFirstDocumentInBatch` | Document | True if this is the first document |
| `JoinPreviousDocument` | Document | Merge with previous document |
| `PropagateToAltText` | Field | Copy value to alternate text |
| `ClearAltText` | Field | Clear alternate text |

### rrunner Actions (detailed)
| Action | Description |
|--------|-------------|
| `AbortOnError` | If any action returns false, abort the batch |
| `CheckAllIntegrity` | Verify all documents match expected structure |
| `CheckDocCount` | Assert document count |
| `CheckPageCount` | Assert page count |
| `DebugMode_ON/OFF` | Enable/disable debug logging |
| `PilotMessage_Set` | Set a message on the Pilot (batch metadata) object |
| `PilotMessage_Clear` | Clear Pilot message |
| `ProcessChildren` | Process child nodes |
| `SkipChildren` | Skip child nodes |
| `rr_AbortBatch` | Abort the current batch |
| `rr_Get` | Read a smart parameter into a variable |
| `rr_WriteNode` | Write a value to a DCO path |
| `rrAppend` | Append to a variable |
| `rrCompare` / `rrCompareCase` | Compare variable to value |
| `rrCompareNot` / `rrCompareNotCase` | Not-equal comparison |
| `rrCopy` | Copy variable value |
| `rrPrepend` | Prepend to a variable |
| `rrSet` | Set variable value |
| `SetBatchPriority` | Set batch priority |
| `SetOperatorID` | Set operator ID |
| `SetReturnValue` | Set action return value |
| `SetStationID` | Set station ID |
| `SetTaskStatus` | Set task completion status |
| `SkipChildren` | Skip child processing |
| `Status_Preserve_ON/OFF` | Preserve/restore DCO status across actions |
| `Task_NumberOfSplits` | Count splits in current task |
| `Task_RaiseCondition` | Raise a named condition flag for job routing |

---

## 24. Autodoc — Detailed Action Reference

The `Autodoc` library handles all fingerprint-based page identification. Actions run at **Page** level unless noted.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `BlankPagesIDBySize` | `minWidth, minHeight` | Marks pages as blank if image dimensions are below the specified thresholds (pixels). Returns false if page is below threshold. |
| `CalculateOffset` | _(none)_ | Calculates the positional offset of the current page image relative to the fingerprint template. Stores offset in `Image_Offset`. |
| `CreateFingerprint` | `pageType, [templateID]` | Creates a new fingerprint entry in the fingerprint library using the current page image. Used in auto-fingerprint generation rulesets attached to the Verify task. |
| `DeleteFingerprint` | `fingerprintID` | Removes the fingerprint with the given ID from the library. |
| `FindBlackFingerprint` | `[threshold]` | Matches pages with dark/inverted backgrounds against the fingerprint library. Returns false if no match. |
| `FindFingerprint` | `[searchArea]` | Compares the current page image against all fingerprints in the active library. Sets `TemplateID` and `PatternConfidence` on success. Returns false if below threshold. |
| `FindTemplate` | `templateID` | Searches for a specific fingerprint template by ID. Returns false if not found. |
| `MergeCCOs_ByType` | `type` | Merges CCO (character-level data) objects from multiple recognition passes into a single CCO for the named type. |
| `SetApplicationID` | `appID` | Overrides the application ID used when querying the fingerprint database. Useful when sharing fingerprints across applications. |
| `SetFilter_HostName` | `hostName` | Restricts fingerprint lookup to fingerprints registered from the named host. |
| `SetFilter_PageType` | `pageType` | Restricts fingerprint lookup to fingerprints for the named page type only. |
| `SetFingerprint` | `templateID` | Explicitly assigns a fingerprint template ID to the current page without performing a match. |
| `SetFingerprintDir` | `path` | Sets the directory path for the fingerprint image library. Typically `@APPPATH(FingerprintDir)`. |
| `SetFingerprintFailureThreshold` | `confidence (0–100)` | Sets the minimum confidence score required for a fingerprint match to be accepted. Default is typically 70. |
| `SetFingerprintSearchArea` | `left, top, right, bottom` | Restricts the region of the page image used during fingerprint matching. Coordinates are in pixels from the top-left of the image. |
| `SetFingerprintWebServiceURL` | `url` | Sets the URL of a remote fingerprint web service (for distributed architectures). |
| `SetMaxOffset` | `pixels` | Sets the maximum allowable positional offset (in pixels) between the scanned page and the fingerprint template before the match is rejected. |
| `SetProblemValue` | `status` | Sets the DCO status value to assign to a page when fingerprint matching fails. Default is `8` (recognition failed). |
| `SetSearchArea` | `left, top, right, bottom` | Defines the image area to search within for anchor/fingerprint elements. |
| `SetTemplateDir` | `path` | Sets the directory containing fingerprint template images. |
| `UpdateFingerprintStats` | _(none)_ | Updates the fingerprint database with hit/miss statistics for the current match result. Helps tune threshold values. |

### Typical PageID Ruleset Using Autodoc
```
SetFingerprintDir(@APPPATH(FingerprintDir))
SetFingerprintFailureThreshold(70)
SetFingerprintSearchArea(0, 0, 500, 300)
FindFingerprint()
```
If `FindFingerprint` returns true, `TemplateID` is set and downstream rules use it for zone registration.

---

## 25. Validations — Detailed Action Reference

The `Validations` library runs at **Field** level unless noted. It is the primary library for data cleansing, format checking, and business rule enforcement.

### String Manipulation
| Action | Parameters | Description |
|--------|-----------|-------------|
| `AddLeadingZeros` | `length` | Pads field value with leading zeros to the specified total length. |
| `AddTrailingZeros` | `length` | Pads field value with trailing zeros to the specified total length. |
| `AddPaddingToStart` | `char, length` | Prepends `char` until value reaches `length`. |
| `AddPaddingToEnd` | `char, length` | Appends `char` until value reaches `length`. |
| `AddPaddingToLeft` | `char, length` | Same as `AddPaddingToStart`. |
| `AddPaddingToRight` | `char, length` | Same as `AddPaddingToEnd`. |
| `AllowOnlyChars` | `charSet` | Removes any character not present in `charSet` from the field value. Example: `AllowOnlyChars(0123456789)`. |
| `AppendFromField` | `sourceField` | Appends the value of `sourceField` (on the same page) to the current field. |
| `AppendToField` | `targetField, value` | Appends `value` to `targetField`. |
| `ConvertToUpperCase` | _(none)_ | Converts field value to all uppercase. |
| `ConvertToLowerCase` | _(none)_ | Converts field value to all lowercase. |
| `DeleteAllAlpha` | _(none)_ | Removes all alphabetic characters from the field value. |
| `DeleteAllNumeric` | _(none)_ | Removes all numeric characters from the field value. |
| `DeleteAllPunct` | _(none)_ | Removes all punctuation characters. |
| `DeleteAllMiscChars` | _(none)_ | Removes all non-alphanumeric, non-space characters. |
| `DeleteAllSysChars` | _(none)_ | Removes system/control characters. |
| `DeleteLCSpaces` | _(none)_ | Removes leading and trailing spaces (same as `TrimSpaces`). |
| `DeleteSelectedChars` | `charSet` | Removes every character in `charSet` from the field value. |
| `FilterFieldSelectedChars` | `charSet` | Keeps only characters in `charSet`; removes all others. |
| `InsertChars` | `position, chars` | Inserts `chars` at the given 0-based `position` in the field value. |
| `InsertDecimalPoint` | `position` | Inserts a decimal point at `position` from the right. Example: `InsertDecimalPoint(2)` → `1234` becomes `12.34`. |
| `LeftTruncate` | `length` | Keeps only the leftmost `length` characters. |
| `RightTruncate` | `length` | Keeps only the rightmost `length` characters. |
| `TruncateFromStart` | `count` | Removes `count` characters from the start of the value. |
| `TruncateFromEnd` | `count` | Removes `count` characters from the end of the value. |
| `ReplaceChars` | `find, replace` | Replaces all occurrences of `find` with `replace` in the field value. |
| `ReplaceValueAtPosition` | `position, length, replacement` | Replaces `length` characters starting at `position` with `replacement`. |
| `SplitFieldValueLeft` | `separator` | Keeps the part of the field value to the left of `separator`. |
| `SplitFieldValueRight` | `separator` | Keeps the part of the field value to the right of `separator`. |
| `SplitFieldValuePreserveStart` | `separator` | Splits on `separator`, preserves the left portion, discards right. |
| `SplitFieldValuePreserveEnd` | `separator` | Splits on `separator`, preserves the right portion, discards left. |
| `TrimSpaces` | _(none)_ | Removes leading and trailing whitespace. |

### Field Value Assignment
| Action | Parameters | Description |
|--------|-----------|-------------|
| `AssignFieldDefault` | `defaultValue` | Sets field value to `defaultValue` only if the field is currently empty. |
| `CopyField` | `sourceField` | Copies value from `sourceField` (same page) into the current field. |
| `CopyFieldToField` | `sourceField, targetField` | Copies value from `sourceField` to `targetField` (both on the same page). |
| `DateStampField` | `format` | Sets the field value to the current date in the given format (e.g., `YYYYMMDD`). |
| `TimeStampField` | `format` | Sets the field value to the current time in the given format. |
| `EmptyFieldValue` | _(none)_ | Clears the field value (sets it to empty string). |
| `ResetField` | _(none)_ | Clears both the field value and resets its status to 0 (OK). |

### Arithmetic and Calculation
| Action | Parameters | Description |
|--------|-----------|-------------|
| `Calculate` | `expression` | Evaluates a mathematical expression and stores the result in the current field. Supports `+`, `-`, `*`, `/`. Field names in the expression are resolved to their current values. Example: `Calculate(@F\Subtotal + @F\Tax)`. |
| `CalculateDateDifference` | `field1, field2, unit` | Calculates the difference between two date fields. `unit` can be `D` (days), `M` (months), `Y` (years). Result stored in current field. |
| `CalculateFields` | `expression` | Like `Calculate` but allows referencing multiple fields by name across the page. |
| `SumFields` | `fieldPattern` | Sums all fields whose names match `fieldPattern` (supports wildcard `*`). Result stored in current field. |
| `ConvertFieldToCurrency` | `[decimalPlaces]` | Formats the field value as currency, inserting decimal point and removing non-numeric characters. |
| `FormatNumberToLocale` | `locale` | Formats numeric field value according to the specified locale's number format conventions. |

### Comparison and Branching
| Action | Parameters | Description |
|--------|-----------|-------------|
| `CompareFields` | `field1, field2` | Returns true if the values of `field1` and `field2` are equal. Used to validate cross-field consistency. |
| `FieldContainsValue` | `value` | Returns true if the current field value equals `value`. Case-insensitive. |
| `FailRuleSet` | _(none)_ | Forces the current ruleset to fail, setting field status to 4. Use at the end of a validation rule to mark a field invalid. |

### Boolean / Status Checks
| Action | Parameters | Description |
|--------|-----------|-------------|
| `IsFieldEmpty` | _(none)_ | Returns true if field has no value. |
| `IsFieldFilled` | _(none)_ | Returns true if field has a non-empty value. |
| `IsThisFieldEmpty` | `fieldName` | Returns true if the named sibling field is empty. |
| `IsThisFieldFilled` | `fieldName` | Returns true if the named sibling field has a value. |
| `IsVariableEmpty` | `variableName` | Returns true if the named variable on the current object is empty. |
| `IsVariableFilled` | `variableName` | Returns true if the named variable on the current object has a value. |
| `IsFieldHidden` | _(none)_ | Returns true if the field's status is hidden (status bit 1 set). |
| `IsFieldCurrency` | `[format]` | Returns true if field value is valid currency. |
| `IsFieldDate` | `format` | Returns true if field value is a valid date matching `format` (e.g., `MM/DD/YYYY`). |
| `IsFieldDateEqualOrAfter` | `dateValue, format` | Returns true if field date ≥ `dateValue`. |
| `IsFieldDateEqualOrBefore` | `dateValue, format` | Returns true if field date ≤ `dateValue`. |
| `IsFieldDateUpToToday` | `format` | Returns true if field date is today or earlier (not a future date). |
| `IsFieldDateWithinRange` | `startDate, endDate, format` | Returns true if field date falls within the specified range. |
| `IsFieldDateWithinXDays` | `days, format` | Returns true if field date is within `days` days of today. |
| `IsFieldDateWithReformat` | `inputFormat, outputFormat` | Validates date and reformats it from `inputFormat` to `outputFormat`. |
| `IsFieldGreaterOrEqual` | `value` | Returns true if field numeric value ≥ `value`. |
| `IsFieldLessOrEqual` | `value` | Returns true if field numeric value ≤ `value`. |
| `IsFieldLengthMax` | `maxLen` | Returns true if field value length ≤ `maxLen`. |
| `IsFieldLengthMin` | `minLen` | Returns true if field value length ≥ `minLen`. |
| `IsFieldMatching` | `pattern` | Returns true if field value matches the regex `pattern`. |
| `IsFieldPercentAlpha` | `percent` | Returns true if at least `percent`% of characters are alphabetic. |
| `IsFieldPercentNumeric` | `percent` | Returns true if at least `percent`% of characters are numeric. |
| `IsFieldPercentNonNumeric` | `percent` | Returns true if at least `percent`% of characters are non-numeric. |
| `IsPatternInField` | `pattern` | Returns true if `pattern` (regex) is found anywhere in the field value. |
| `IsSupportedImageFile` | `path` | Returns true if the file at `path` is a supported image format. |
| `IsMatchingJobID` | `jobID` | Returns true if the current job ID matches `jobID`. |
| `IsMaxOMRChecked` | `maxCount` | Returns true if the number of checked OMR children ≤ `maxCount`. |
| `IsMinOMRChecked` | `minCount` | Returns true if the number of checked OMR children ≥ `minCount`. |

### Object / DCO Manipulation (Validations Library)
| Action | Parameters | Description |
|--------|-----------|-------------|
| `CheckSubFields` | `[pattern]` | Validates that all child fields (optionally matching `pattern`) have acceptable status. |
| `DeleteChildType` | `typeName` | Removes all child DCO nodes of the specified type from the current object. Used to remove spurious line items. |
| `DeleteParentObj` | _(none)_ | Removes the current object's parent from the DCO hierarchy. |
| `HasChildOfType` | `typeName` | Returns true if the current object has at least one child of the named type. |

### Variable Access
| Action | Parameters | Description |
|--------|-----------|-------------|
| `GetJobID` | `variableName` | Stores the current job ID as a variable on the current object. |
| `ReadCurrentObjVariable` | `variableName` | Reads the value of `variableName` from the current DCO object into an internal buffer. |
| `ReadFieldValue` | `fieldName` | Reads the value of the named sibling field into an internal buffer for use by subsequent actions. |
| `ReadPageVariableValue` | `variableName` | Reads the value of `variableName` from the parent page object. |
| `SaveAsCurrentObjVariable` | `variableName` | Saves the current field value as `variableName` on the current DCO object. |
| `SaveAsPageVariable` | `variableName` | Saves the current field value as `variableName` on the parent page object. |

### Address / Name Parsing
| Action | Parameters | Description |
|--------|-----------|-------------|
| `ParseMultilineAddress` | `street, city, state, zip` | Parses a multi-line address field into separate named child fields. |
| `ParseName` | `first, last, [middle]` | Parses a full-name field into first, last, and optional middle name fields. |

### Miscellaneous
| Action | Parameters | Description |
|--------|-----------|-------------|
| `MessageBox` | `message` | Displays a message box during Studio test execution. Not for production use. |
| `SetIsOverrideable` | `0 or 1` | Sets whether the operator can override a failed validation. `0` = locked, `1` = overrideable (default). |

---

## 26. Locate — Detailed Action Reference

The `Locate` library provides text-matching and word-cursor navigation against the OCR result (CCO) of the current page. All actions operate on the **Page** or **Field** level.

### Keyword List Management
| Action | Parameters | Description |
|--------|-----------|-------------|
| `AddKeyList` | `filename` | Loads a keyword list file (one keyword per line) into the active keyword set. Path relative to application folder. |
| `AggregateKeyList` | `filename` | Like `AddKeyList` but merges into a shared aggregate list used by all subsequent find operations. |
| `DefaultValue` | `value` | Sets the value to assign to the field if no match is found. Prevents empty field status. |
| `FilterIt` | `filterType` | Applies a filter to the current word cursor result (e.g., remove noise characters). |

### Finding Words and Keywords
| Action | Parameters | Description |
|--------|-----------|-------------|
| `FindKeyList` | `[zone]` | Searches the full page CCO for any keyword in the active keyword list. Returns true on first match, positions cursor there. |
| `FindKeyList_InZone` | `left, top, right, bottom` | Like `FindKeyList` but restricts search to the specified pixel zone. |
| `FindNextKeyList` | _(none)_ | Continues a `FindKeyList` search from the current cursor position. Returns false when no more matches. |
| `FindLastKeyList` | _(none)_ | Finds the last occurrence of any keyword in the list. |
| `FindLastKeyList_InZone` | `left, top, right, bottom` | Last-occurrence keyword search within a zone. |
| `WordFind` | `word` | Searches the page CCO for the exact word. Case-insensitive by default. |
| `WordFind_InZone` | `word, left, top, right, bottom` | `WordFind` restricted to a zone. |
| `WordFindNext` | `word` | Finds the next occurrence of `word` after the current cursor position. |
| `WordFindNext_InZone` | `word, left, top, right, bottom` | `WordFindNext` restricted to a zone. |
| `WordFind_Offset` | `word, offsetX, offsetY` | Finds `word` and shifts the cursor by the given pixel offset. |

### Regular Expression Searching
| Action | Parameters | Description |
|--------|-----------|-------------|
| `FindRegExList` | `pattern` | Searches the page for text matching the regex `pattern`. Positions cursor at first match. |
| `FindRegExList_InZone` | `pattern, left, top, right, bottom` | Regex search within a zone. |
| `FindNextRegExList` | `pattern` | Continues regex search from current cursor position. |
| `FindNextRegExList_InZone` | `pattern, left, top, right, bottom` | Next regex match within zone. |
| `FindLastRegEx` | `pattern` | Finds the last regex match on the page. |
| `FindLastRegEx_InZone` | `pattern, left, top, right, bottom` | Last regex match within zone. |
| `FindLastRegExList` | `pattern` | Same as `FindLastRegEx` for list-based patterns. |
| `FindLastRegExList_InZone` | `pattern, left, top, right, bottom` | Last regex list match within zone. |
| `RegExFind` | `pattern` | Returns true if `pattern` is found anywhere in the current word. |
| `RegExFind_InZone` | `pattern, left, top, right, bottom` | Regex find within zone. |
| `RegExFindNext` | `pattern` | Next regex match from current position. |
| `RegExFindNext_InZone` | `pattern, left, top, right, bottom` | Next regex match within zone. |
| `IsValue_RegEx` | `pattern` | Returns true if the current word/snippet matches `pattern`. Used as a post-find validation. |

### Database-Driven Search
| Action | Parameters | Description |
|--------|-----------|-------------|
| `FindDBList` | `dsn, query` | Executes `query` against ODBC `dsn` and searches page CCO for any returned value. Positions cursor at match. |
| `FindDBList_InZone` | `dsn, query, left, top, right, bottom` | `FindDBList` within a zone. |
| `FindNextDBList` | _(none)_ | Next match from a previous `FindDBList`. |
| `FindNextDBList_InZone` | `left, top, right, bottom` | Next DB match within zone. |

### Cursor Navigation
| Action | Parameters | Description |
|--------|-----------|-------------|
| `GoRightWord` | _(none)_ | Moves cursor to the next word to the right on the same line. |
| `GoLeftWord` | _(none)_ | Moves cursor to the next word to the left on the same line. |
| `GoAboveWord` | _(none)_ | Moves cursor to the nearest word above the current position. |
| `GoBelowWord` | _(none)_ | Moves cursor to the nearest word below the current position. |
| `GoUpLine` | _(none)_ | Moves cursor up one text line. |
| `GoDownLine` | _(none)_ | Moves cursor down one text line. |
| `GoFirstLine` | _(none)_ | Moves cursor to the first word on the first line of the page. |
| `GoLastLine` | _(none)_ | Moves cursor to the last word on the last line. |
| `GoFirstWord` | _(none)_ | Moves cursor to the very first word on the page. |
| `GoLastWord` | _(none)_ | Moves cursor to the very last word on the page. |
| `ScanRT` | _(none)_ | Scans right-to-left from the current cursor position (for RTL languages). |

### Capturing and Writing Results
| Action | Parameters | Description |
|--------|-----------|-------------|
| `SelectSnippet` | `[wordCount]` | Captures the word(s) at the current cursor position. Default is 1 word. Use `wordCount` > 1 to capture multiple. |
| `GetZoneText` | `left, top, right, bottom` | Extracts all OCR text within the specified pixel zone. Stores result as the snippet. |
| `UpdateField` | `fieldName` | Writes the current snippet to the named sibling field on the current page. |
| `UpdateDCOField` | `path` | Writes the snippet to the DCO field at the specified path (e.g., `@P\FieldName`). |
| `ValueInField` | `fieldName` | Returns true if the current snippet value equals the value already in `fieldName`. |
| `ValueInField_Fuzzy` | `fieldName, threshold` | Returns true if the current snippet is within `threshold` edit-distance of `fieldName`'s value. |
| `ValueInField_RegEx` | `fieldName, pattern` | Returns true if `fieldName`'s value matches `pattern`. |

### Word Group and Merge
| Action | Parameters | Description |
|--------|-----------|-------------|
| `GroupWords` | `count` | Groups the next `count` words into a single token. |
| `GroupWordsLEFT` | `count` | Groups `count` words to the left of the cursor. |
| `GroupWordsRIGHT` | `count` | Groups `count` words to the right of the cursor. |
| `MergeWordLF` | _(none)_ | Merges the word at the cursor with the word on the line below. |
| `MergeWordRT` | _(none)_ | Merges the word at the cursor with the word to its right. |

### Type Validation (word-level)
| Action | Parameters | Description |
|--------|-----------|-------------|
| `IsAlpha` | _(none)_ | Returns true if current word is entirely alphabetic. |
| `IsNumber` | _(none)_ | Returns true if current word is entirely numeric. |
| `IsCurrency` | _(none)_ | Returns true if current word looks like a currency value. |
| `IsDateValue` | `format` | Returns true if current word matches the date `format`. |
| `IsValue` | `value` | Returns true if current word equals `value`. |
| `MaxLength` | `len` | Returns true if current word length ≤ `len`. |
| `MinLength` | `len` | Returns true if current word length ≥ `len`. |

### Zone Definition Helpers
| Action | Parameters | Description |
|--------|-----------|-------------|
| `SetRect` | `left, top, right, bottom` | Sets a rectangular search zone for subsequent _InZone operations. |

---

## 27. Zones — Detailed Action Reference

The `Zones` library provides zone-based text extraction and line-item detection. It bridges the raw CCO (OCR result) and the DCO field structure. Runs at **Page** or **Field** level.

### Zone Loading and Registration
| Action | Parameters | Description |
|--------|-----------|-------------|
| `LoadZones` | `[templateID]` | Loads field zone definitions from the fingerprint for the specified template. Must be called before any zone-based recognition. |
| `ReadZones` | _(none)_ | Reads zone positions from the page data file (`.xml`). Equivalent to `LoadZones` but uses the stored data file. |
| `RegisterPage` | `[maxOffset]` | Aligns the current page image against the fingerprint template, computing the registration offset. Stores offset in `Image_Offset`. |
| `AnchorPage` | `anchorZone` | Uses a specific zone as the anchor for page registration rather than full-page comparison. |
| `InheritParentPosition` | _(none)_ | Copies zone position data from the parent page to the current field. Used when child fields inherit the parent's zone. |
| `AdjustZonesToImageOffset` | _(none)_ | Shifts all loaded zone positions by the current `Image_Offset` value to compensate for page skew or shift. |
| `CalculateLocalOffset` | `zoneField` | Calculates a local offset based on a reference field zone, for fine-tuned zone adjustment. |
| `MCCOPositionAdjust` | `xOffset, yOffset` | Manually shifts the CCO position by the specified pixel offsets. |

### Text Extraction from Zones
| Action | Parameters | Description |
|--------|-----------|-------------|
| `GetZoneText` | `left, top, right, bottom` | Extracts all OCR text within the specified pixel zone. Result is stored for use by `UpdateField`. |
| `PopulateZNField` | `fieldName` | Reads text from the field's defined zone and writes it to `fieldName` in the DCO. |
| `LoadBlockCCO` | `left, top, right, bottom` | Loads the CCO block (character data) from the specified pixel region. |
| `CreateBlockCCO` | `left, top, right, bottom` | Creates a new CCO block from the specified image region. |
| `MergeZones` | `zone1, zone2` | Merges two zone regions into one combined zone. |
| `PadZone` | `fieldName, padding` | Expands the zone for `fieldName` by `padding` pixels on all sides. |
| `ZoneImage_SaveAs` | `fieldName, filePath` | Saves the image snippet from the field's zone to `filePath`. |

### Zone Boundary Setters
These actions constrain how zone boundaries are determined:

| Action | Parameters | Description |
|--------|-----------|-------------|
| `ZoneTOP_ImageTop` | _(none)_ | Sets the top boundary of all zones to the top edge of the image. |
| `ZoneTOP_UpperBound` | `pixels` | Sets the top zone boundary to `pixels` from the top of the image. |
| `ZoneTOP_LowerBound` | `pixels` | Sets the top zone boundary floor. |
| `ZoneBOTTOM_ImageBottom` | _(none)_ | Sets the bottom boundary of all zones to the bottom edge of the image. |
| `ZoneBOTTOM_UpperBound` | `pixels` | Sets the upper bound for the bottom zone edge. |
| `ZoneBOTTOM_LowerBound` | `pixels` | Sets the lower bound for the bottom zone edge. |
| `ZoneLEFT_ImageLeft` | _(none)_ | Sets the left boundary to the left edge of the image. |
| `ZoneLEFT_LeftBound` | `pixels` | Sets the leftmost allowed left boundary. |
| `ZoneLEFT_RightBound` | `pixels` | Sets the rightmost allowed left boundary. |
| `ZoneRIGHT_ImageRight` | _(none)_ | Sets the right boundary to the right edge of the image. |
| `ZoneRIGHT_LeftBound` | `pixels` | Sets the leftmost allowed right boundary. |
| `ZoneRIGHT_RightBound` | `pixels` | Sets the rightmost allowed right boundary. |

### Line Item Detection and Extraction
| Action | Parameters | Description |
|--------|-----------|-------------|
| `FindLineItems` | `[topZone, bottomZone]` | Detects line boundaries in the page image between `topZone` and `bottomZone` using whitespace analysis. Sets up an internal line list for scanning. |
| `FindZoneLineItems` | `zoneField` | Finds line item boundaries within the zone defined for `zoneField`. |
| `FindDataBlocks` | `[minHeight]` | Detects contiguous text blocks on the page. Returns false if none found. |
| `FindBlocks_WhiteSpace` | `threshold` | Finds text blocks by detecting whitespace gaps larger than `threshold` pixels. |
| `FindRegExBlocks` | `pattern` | Finds text blocks whose content matches the regex `pattern`. |
| `ScanLineItem` | `fieldList` | Scans the current line item row and populates the fields named in `fieldList`. One call per line item row. |
| `ScanDetails` | `fieldList` | Scans a detail section (multi-column tabular data) and populates named fields. |
| `ScanDetailsByLines` | `fieldList, lineCount` | Scans exactly `lineCount` lines of detail data. |
| `ScanDetailsByVSpace` | `fieldList, vSpace` | Scans detail rows separated by vertical space of at least `vSpace` pixels. |
| `PopulateZNLineItemField` | `fieldName` | Populates a single line item field from the current scanned line. |
| `PopulateZNLineItemFieldDynamic` | `fieldName, zoneExpr` | Populates a line item field using a dynamically computed zone expression. |
| `SetEOL` | `char` | Sets the end-of-line delimiter character for detail scanning. |
| `SetEOL_CRLF` | _(none)_ | Sets CRLF as the end-of-line delimiter. |

---

## 28. Export / ExportDB / ExportXML — Detailed Action Reference

### 28.1 Export Library (Text / CSV Output)

The `Export` library writes delimited or fixed-width text files. Actions run at **Page** or **Field** level inside a loop over pages/fields.

#### File Setup
| Action | Parameters | Description |
|--------|-----------|-------------|
| `SetExportPath` | `path` | Sets the output directory for the export file. Typically `@APPPATH(ExportDir)`. |
| `SetFileName` | `name` | Sets the base filename (without extension). Typically `@BATCHID`. |
| `SetExtensionName` | `ext` | Sets the file extension. Default is `.txt`. |
| `SetCSV` | `delimiter` | Sets the field delimiter character. Common values: `,` (CSV), `@CHR(9)` (tab), `|` (pipe). |
| `SetFill` | `char` | Sets the fill character for fixed-length output. Default is space. |
| `SetSpaceFill` | _(none)_ | Sets the fill character to space (resets from zero-fill). |
| `SetZeroFill` | _(none)_ | Sets the fill character to zero (`0`) for numeric fields. |
| `SetFixedLength` | `length` | Sets field output to fixed length. Shorter values are padded; longer values are truncated. |
| `SetJustified` | `L or R` | Sets text justification for fixed-length output. `L` = left-justified, `R` = right-justified. |
| `SetIgnoreFieldStatus` | `0 or 1` | If `1`, exports fields regardless of their status (even failed fields). Default `0`. |
| `SetOMR_Separator` | `char` | Sets the separator character between OMR (checkbox) option values. |
| `SetElementSeparator` | `char` | Sets the separator between line item elements. |

#### Writing Field Values
| Action | Parameters | Description |
|--------|-----------|-------------|
| `ExportAllFields` | _(none)_ | Exports all fields on the current page as one row, using the configured delimiter. Must be at Page level. |
| `ExportFieldValue` | `fieldName` | Exports the value of the named field. |
| `ExportMYValue` | _(none)_ | Exports the current field value (field-level; "MY" = current). |
| `ExportSmartParameter` | `smartParam` | Evaluates and exports a smart parameter expression. Example: `ExportSmartParameter(@BATCHID)`. |
| `ExportToBatchDir` | `filename` | Exports output to a file in the batch's runtime folder rather than the configured export path. |
| `BatchVariable_ExportValue` | `variableName` | Exports the value of a batch-level variable. |
| `DocumentVariable_ExportValue` | `variableName` | Exports the value of a document-level variable. |
| `PageVariable_ExportValue` | `variableName` | Exports the value of a page-level variable. |
| `Variable_ExportValue` | `variableName` | Exports the value of a variable on the current object. |
| `Variable_IsValue` | `variableName, value` | Returns true if the named variable equals `value`. Used to conditionally export. |
| `DCOProperty` | `propertyName` | Exports the value of the named DCO property (application-level config). |

#### Line Item Export
| Action | Parameters | Description |
|--------|-----------|-------------|
| `LineItem_AddElement` | `fieldName` | Adds the named field's value as a line item element. |
| `LineItem_BlankFields` | _(none)_ | Outputs blank values for all line item element positions. |
| `LineItem_ClearElements` | _(none)_ | Clears all accumulated line item elements. |
| `LineItem_ExportElements` | _(none)_ | Writes all accumulated line item elements as one row in the export file. |
| `LineItem_SmartParameter` | `smartParam` | Adds the result of a smart parameter as a line item element. |

#### File Structure
| Action | Parameters | Description |
|--------|-----------|-------------|
| `NewLine` | _(none)_ | Writes a newline character, ending the current row. |
| `Text` | `literal` | Writes a literal string to the output file. |
| `Filler` | `char, count` | Writes `count` repetitions of `char` (padding or separator). |
| `FixedLenLJ` | `value, length` | Writes `value` left-justified in a field of `length` characters. |
| `FixedLenRJ` | `value, length` | Writes `value` right-justified in a field of `length` characters. |
| `BlankFields` | `count` | Outputs `count` empty field placeholders (with delimiters). |
| `BlankLines` | `count` | Outputs `count` blank lines. |
| `BPilot` | `propertyName` | Exports a Pilot property value. |
| `CloseExportFile` | _(none)_ | Flushes and closes the export file. Must be called at end of export ruleset. |

#### Date / Time / Profile
| Action | Parameters | Description |
|--------|-----------|-------------|
| `GetDATE` | `format` | Writes the current date in the specified format. |
| `GetTime` | `format` | Writes the current time in the specified format. |
| `GetProfileString` | `section, key` | Reads a value from a `.ini` profile file and writes it to the export. |
| `ResetFieldVariables` | _(none)_ | Resets all field variable export accumulators. |
| `SaveFilePathAsVariable` | `variableName` | Saves the current export file's full path as a variable on the current object. |

---

### 28.2 ExportDB Library (ODBC Database Output)

Runs at **Page** or **Field** level inside the Export task. Writes one record per page or document to an ODBC database.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `ExportOpenConnection` | `connectionString` | Opens an ODBC connection. `connectionString` can be a DSN, full connection string, or `@APPVAR(ExportDSN)`. |
| `ExportCloseConnection` | _(none)_ | Closes the ODBC connection. Call after all records have been written. |
| `SetTableName` | `tableName` | Sets the target table for INSERT statements. |
| `AddRecord` | _(none)_ | Executes the INSERT statement for the current row. Call after all column mappings. |
| `ExportFieldToColumn` | `fieldName, columnName` | Maps the value of DCO field `fieldName` to database column `columnName`. |
| `ExportBatchIDToColumn` | `columnName` | Maps the current batch ID to `columnName`. |
| `ExportSmartParamToColumn` | `smartParam, columnName` | Evaluates `smartParam` and maps the result to `columnName`. |
| `ExportPropertyToColumn` | `propertyName, columnName` | Maps a DCO property value to `columnName`. |
| `ExportToColumn` | `value, columnName` | Maps a literal value to `columnName`. |
| `ExportNodeXMLToColumn` | `nodePath, columnName` | Maps the XML string of a DCO subtree to `columnName`. Useful for storing document data as XML in a database column. |

**Typical ExportDB Ruleset:**
```
ExportOpenConnection(@APPVAR(ExportDSN))
SetTableName(InvoiceData)
ExportBatchIDToColumn(BatchID)
ExportSmartParamToColumn(@OPERATOR, ProcessedBy)
ExportFieldToColumn(InvoiceNumber, InvNum)
ExportFieldToColumn(VendorName, Vendor)
ExportFieldToColumn(TotalAmount, Amount)
AddRecord()
ExportCloseConnection()
```

---

### 28.3 ExportXML Library (XML File Output)

Runs at **Batch / Document / Page / Field** level. Builds a structured XML file by nesting nodes as rules execute at each DCO level.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `xml_SetExportPath` | `path` | Sets the output directory for the XML file. |
| `xml_SetFileName` | `name` | Sets the output filename (without `.xml` extension). |
| `xml_NewNode` | `nodeName` | Opens a new XML element `<nodeName>`. Call at the appropriate DCO level. |
| `xml_CommitNode` | _(none)_ | Closes the most recently opened XML element. |
| `xml_SetNodeValue` | `nodeName, value` | Sets the text content of `<nodeName>`: `<nodeName>value</nodeName>`. `value` can be a smart parameter. |
| `xml_SetAttributeValue` | `attrName, value` | Adds an attribute to the most recently opened element: `<element attrName="value">`. |
| `xml_SaveFile` | _(none)_ | Writes the accumulated XML content to disk. Must be called at the end of the batch-level rule. |

**Typical ExportXML Ruleset (multi-level):**
```
// Batch-level rule:
xml_SetExportPath(@APPPATH(XMLExportDir))
xml_SetFileName(@BATCHID)
xml_NewNode(Batch)
xml_SetAttributeValue(id, @BATCHID)
ProcessChildren()
xml_CommitNode()   ← closes <Batch>
xml_SaveFile()

// Document-level rule:
xml_NewNode(Document)
xml_SetAttributeValue(type, @TYPE)
ProcessChildren()
xml_CommitNode()   ← closes <Document>

// Page-level rule:
xml_NewNode(Page)
xml_SetAttributeValue(type, @TYPE)
ProcessChildren()
xml_CommitNode()   ← closes <Page>

// Field-level rule:
xml_SetNodeValue(@TYPE, @VALUE)   ← <FieldName>value</FieldName>
```

---

## 29. FileIO — Detailed Action Reference

The `FileIO` library performs file system operations. Runs at **Batch** or **Page** level.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `CheckFreeDiskSpace` | `path, minMB` | Returns true if available disk space at `path` is at least `minMB` megabytes. |
| `CopyDirectory` | `source, dest` | Copies the directory tree at `source` to `dest`. |
| `CopyFile` | `source, dest` | Copies a single file from `source` to `dest`. |
| `DeleteDirectory` | `path` | Deletes the directory at `path` and all its contents. |
| `DeleteFile` | `path` | Deletes the file at `path`. Returns false if file does not exist. |
| `GetFileSize` | `path, variableName` | Stores the file size (bytes) of `path` as `variableName` on the current object. |
| `GetProfileString` | `iniPath, section, key, variableName` | Reads a value from the INI file at `iniPath` and stores it as `variableName`. |
| `IsDirectoryPresent` | `path` | Returns true if the directory exists. |
| `IsFilePresent` | `path` | Returns true if the file exists. |
| `IsFileReadOnly` | `path` | Returns true if the file is marked read-only. |
| `IsProfilePresent` | `iniPath, section, key` | Returns true if the INI key exists. |
| `RenameFile` | `oldPath, newPath` | Renames (or moves) a file. |
| `SetFileReadOnly` | `path, 0 or 1` | Sets (`1`) or clears (`0`) the read-only attribute on a file. |
| `SetProfileString` | `iniPath, section, key, value` | Writes `value` to `key` in `section` of the INI file at `iniPath`. Creates the file/section/key if needed. |
| `SplitFileName` | `path, dirVar, nameVar, extVar` | Splits a full file path into directory, filename, and extension, stored as variables. |

---

## 30. Vscan — Detailed Action Reference

The `Vscan` library creates batches by scanning image files from a watched folder. Runs at **Batch** level in the Scan task.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `SetSourceDirectory` | `path` | Sets the folder to monitor for incoming image files. Typically `@APPPATH(VScanSourceDir)`. |
| `SetImageType` | `type` | Restricts ingestion to files of the specified type. Values: `TIF`, `JPG`, `PNG`, `BMP`, `PDF`, `ALL`. |
| `SetAlternateImageNames` | `0 or 1` | If `1`, uses alternate naming convention for multi-page documents. |
| `SetFastMode` | `0 or 1` | If `1`, skips image validation for faster throughput. |
| `SetMailSourceFolder` | `path` | Sets a mail-drop folder as the source (for email-attached images). |
| `SetMaxImageFiles` | `count` | Limits the number of image files processed per batch run. |
| `SetMultiPageTiff` | `0 or 1` | If `1`, treats multi-page TIFF files as a single document. |
| `SetSortOrder` | `order` | Sets the order in which files are processed. Values: `Name`, `Date`, `None`. |
| `SearchInSubdirectory` | `0 or 1` | If `1`, also scans subdirectories of the source folder. |
| `Scan` | _(none)_ | Executes the scan: reads image files from the source directory and creates batch entries. Core action of every Scan task. |
| `AddDocument` | `path` | Manually adds a specific file to the current batch. |
| `CopyFile` | `source, dest` | Copies an image file during scan processing. |
| `DeleteImageFile` | `path` | Deletes a source image file after it has been added to the batch. |
| `MoveImageFileToDirectory` | `path, destDir` | Moves an image file to `destDir` after processing. |

**Typical Vscan Scan task ruleset:**
```
SetSourceDirectory(@APPPATH(ScanInputDir))
SetImageType(TIF)
SetMultiPageTiff(1)
SetSortOrder(Date)
SetMaxImageFiles(500)
Scan()
```

---

## 31. Convert — Detailed Action Reference

The `Convert` library converts non-TIFF documents (PDF, Word, Excel, HTML, etc.) to TIFF images for Datacap processing. Runs at **Page** or **Batch** level in a Convert task (before PageID).

### Common Actions (all sub-libraries)
| Action | Parameters | Description |
|--------|-----------|-------------|
| `SetNamePattern` | `pattern` | Sets the naming pattern for converted output files. |
| `ExceptionSetFileTypes` | `typeList` | Sets file types that trigger the exception handler instead of normal conversion. |
| `ExceptionSetHandler` | `handlerDLL` | Sets the DLL to handle conversion exceptions. |
| `ExceptionSetVariableName` | `varName` | Stores exception details in `varName`. |
| `ExceptionSetTaskCondition` | `condition` | Raises `condition` flag when an exception occurs. |

### PDF Sub-Library
| Action | Parameters | Description |
|--------|-----------|-------------|
| `PDFDocumentToImage` | _(none)_ | Converts a PDF file to TIFF images (one TIFF per page). Core convert action for PDF input. |
| `PDFConversionMethod` | `method` | Sets conversion method: `0` = rasterize, `1` = extract embedded images. |
| `PDFBitDepth` | `bits` | Sets output bit depth: `1` (B&W), `8` (grayscale), `24` (color). |
| `PDFCompression` | `type` | Sets TIFF compression: `CCITT4`, `LZW`, `JPEG`, `None`. |
| `PDFGrayscale` | `0 or 1` | If `1`, forces grayscale output. |
| `PDFHorizontalResolution` | `dpi` | Sets horizontal DPI for rasterized output. Typical: `300`. |
| `PDFVerticalResolution` | `dpi` | Sets vertical DPI for rasterized output. Typical: `300`. |
| `PDFQuality` | `0–100` | Sets JPEG quality when compression is JPEG. |

### Excel Sub-Library
| Action | Parameters | Description |
|--------|-----------|-------------|
| `ExcelWorkbookToImage` | _(none)_ | Converts an Excel workbook to TIFF images. |
| `ExcelAutoFitColumns` | `0 or 1` | Auto-fits column widths before conversion. |
| `ExcelAutoFitRows` | `0 or 1` | Auto-fits row heights before conversion. |
| `ExcelPrintQuality` | `dpi` | Sets print resolution for Excel conversion. |
| `ExcelTiffCompression` | `type` | Sets TIFF compression for Excel output. |
| `ExcelScalingFactor` | `percent` | Scales the spreadsheet to `percent` of normal size before conversion. |

### Word Sub-Library
| Action | Parameters | Description |
|--------|-----------|-------------|
| `WordDocumentToImage` | _(none)_ | Converts a Word document to TIFF images. |
| `WordPrintQuality` | `dpi` | Sets print resolution. |
| `WordTiffCompression` | `type` | Sets TIFF compression. |

### Images Sub-Library
| Action | Parameters | Description |
|--------|-----------|-------------|
| `ImageToTIFF` | _(none)_ | Converts non-TIFF image files (BMP, PNG, JPG) to TIFF. |
| `ImageDefaultDPI` | `dpi` | Sets the default DPI when the source image has no embedded resolution. |
| `ImageFileTypesToConvert` | `typeList` | Comma-separated list of file types to convert. |
| `ImageMonoThreshold` | `0–255` | Sets the threshold for converting color/grayscale to monochrome. |
| `ImageMonoType` | `type` | Binarization method: `Threshold`, `Dithering`, `ErrorDiffusion`. |

---

## 32. Barcode_P / Barcode_X — Detailed Action Reference

### Barcode_P (2D Barcodes — PDF417, DataMatrix, QR)
Runs at **Page** level.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `ReadBarCodeBP` | `[zone]` | Reads all barcodes on the page. Stores first result. |
| `GetBarcodeBP` | `index` | Retrieves barcode value at `index` (0-based) from last read. |
| `GetAllBarcodesBP` | _(none)_ | Returns all detected barcode values as a delimited list. |
| `Get2DCodeBP` | `type` | Reads a specific 2D barcode type: `PDF417`, `QR`, `Aztec`. |
| `GetDataMatrixCodeBP` | _(none)_ | Reads a DataMatrix barcode specifically. |
| `IdentifyByBarcodesBP` | `pageType` | Sets page type to `pageType` if a matching barcode is found. |
| `MatchBarcodeBP` | `value` | Returns true if any barcode on the page equals `value`. |
| `MatchBarcodePrefixBP` | `prefix` | Returns true if any barcode starts with `prefix`. |
| `SetMinimumConfidenceBP` | `confidence` | Sets minimum confidence for barcode detection acceptance. |

### Barcode_X (1D Barcodes — Code 39, Code 128, EAN, etc.)
Runs at **Page** level.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `ReadBarCode` | `[zone]` | Reads all 1D barcodes on the page. |
| `GetBarCode` | `index` | Retrieves barcode value at `index`. |
| `MatchBarcode` | `value` | Returns true if a barcode matches `value` exactly. |

---

## 33. OCR Engines — Detailed Action Reference

### 33.1 OCR_S (ABBYY FineReader — Recommended)

The primary OCR engine in Datacap 9.1.x. Runs in 64-bit mode. All actions at **Page** or **Field** level.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `RecognizePageFieldsOCR_S` | _(none)_ | Recognizes all zones defined on the current page. Result stored in field CCOs. Primary recognition action. |
| `RecognizePageOCR_S` | _(none)_ | Performs full-page recognition without predefined zones. Stores full-page CCO. |
| `RecognizeFieldOCR_S` | `fieldName` | Recognizes only the zone for `fieldName`. Useful for single-field re-recognition. |
| `RecognizeFieldVoteOCR_S` | `fieldName` | Recognizes a field and submits result to the voting pool (for multi-engine voting). |
| `RecognizePageFields2CCO_OCR_S` | _(none)_ | Recognizes page fields and stores result in both the primary and alternate CCO. |
| `RecognizePageOCR_S_2TextFile` | `filePath` | Recognizes full page and saves text to `filePath` alongside normal processing. |
| `RecognizeToFile_OCR_S` | `filePath` | Saves the OCR result as a text file at `filePath`. |
| `RecognizeToPDF` | `[outputPath]` | Creates a searchable PDF from the current page alongside normal TIFF processing. |
| `RecognizeDocToPDF` | `[outputPath]` | Creates a searchable PDF for the entire document. |
| `RotateImage` | `degrees` | Rotates the page image by `degrees` (90, 180, 270) before recognition. |
| `SetEngineTimeout` | `seconds` | Sets maximum time allowed for OCR engine processing per page. |
| `SetFastTradeOffOCR_S` | `0 or 1` | If `1`, uses a faster but slightly less accurate recognition mode. |
| `SetLegacyDecompositionOCR_S` | `0 or 1` | Enables legacy page layout analysis mode for older form types. |

### 33.2 OCR_A (Nuance OmniPage — Legacy)

| Action | Parameters | Description |
|--------|-----------|-------------|
| `RecognizePageFieldsOCR_A` | _(none)_ | Recognize all page zones using Nuance OmniPage. |
| `RecognizePageOCR_A` | _(none)_ | Full-page Nuance recognition. |
| `RecognizeFieldOCR_A` | `fieldName` | Single field recognition. |
| `RecognizeFieldVoteOCR_A` | `fieldName` | Recognition with voting. |
| `RecognizeBarcodeOCR_A` | _(none)_ | Reads barcode using OmniPage barcode engine. |
| `RecognizeToALTOOCR_A` | `filePath` | Saves recognition to ALTO XML format. |
| `RecognizeToPDFOCR_A` | `[path]` | Creates searchable PDF. |
| `OCRA_ConvertImage2BW` | _(none)_ | Converts page image to black & white before recognition. |
| `SetAutoRotationOCR_A` | `0 or 1` | Enables automatic page rotation detection. |
| `SetFastModeOCR_A` | `0 or 1` | Enables fast (lower accuracy) mode. |
| `SetConfCalculationParamsOCR_A` | `params` | Configures confidence calculation parameters. |
| `ReleaseEngineOCR_A` | _(none)_ | Releases the OmniPage engine instance. Call at end of task. |
| `RotateImageOCR_A` | `degrees` | Rotates image before recognition. |

### 33.3 ICR_C (Parascript Handwriting Recognition)

| Action | Parameters | Description |
|--------|-----------|-------------|
| `RecognizePageFieldsICR_C` | _(none)_ | Recognizes all handwritten zones on the page. |
| `RecognizeFieldICR_C` | `fieldName` | Recognizes a single handwritten field zone. |
| `RecognizeFieldVoteICR_C` | `fieldName` | Handwriting recognition with voting. |
| `RecognizePageFields2CCO_ICR_C` | _(none)_ | Recognizes to dual CCO. |
| `RecognizePageICR_C` | _(none)_ | Full-page handwriting recognition. |
| `RecognizePageToPDFICR_C` | `[path]` | Creates PDF from handwriting recognition. |
| `RecognizePageFieldsICR_CEx` | `params` | Extended recognition with additional parameters. |
| `EnableLoggingICR_C` | `0 or 1` | Enables/disables ICR_C engine logging. |

---

## 34. Recog_Shared — Detailed Action Reference

`Recog_Shared` provides utilities shared across all recognition engines. Runs at **Page** level.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `AnalyzeImage` | _(none)_ | Analyzes the page image for skew, noise level, and other quality metrics. |
| `CCONormalization_OFF` | _(none)_ | Disables CCO normalization (keep raw character bounding boxes). |
| `CreateTextFile` | `filePath` | Creates a plain-text file from the current page's CCO data. |
| `IsBlankPage` | `[threshold]` | Returns true if the page has fewer than `threshold` ink pixels (effectively blank). |
| `RecogContinueOnFailure` | `0 or 1` | If `1`, continues processing even if the OCR engine reports a failure. |
| `RecogOMRThresh` | `threshold` | Sets the pixel threshold for OMR (checkbox) detection. |
| `RecogOMRThreshold` | `threshold, background` | Sets OMR threshold and background density. More precise than `RecogOMRThresh`. |
| `RegisterPageFields` | _(none)_ | Applies the registered zone positions to the current page image. Must be called after `RegisterPage` / `LoadZones`. |
| `ReleaseImage` | _(none)_ | Releases the in-memory page image after recognition. Frees memory for high-volume processing. |
| `RotateTio` | `degrees` | Rotates the page image without modifying zone positions (for display adjustment). |
| `SetAdjustFieldToChars` | `0 or 1` | If `1`, adjusts field bounding boxes to fit actual character extents. |
| `SetFingerprintRecogPriority` | `priority` | Sets recognition priority for fingerprint-identified pages. Higher = faster queue. |
| `SetFullPageRecogArea` | `left, top, right, bottom` | Restricts full-page recognition to the specified pixel region. |
| `SetOutOfProcessRecogTimeout` | `seconds` | Sets the timeout for out-of-process recognition calls. |
| `SetRecogFailureRetryDelay` | `ms` | Sets the delay (milliseconds) before retrying a failed recognition. |
| `SnapCCOtoDCO` | _(none)_ | Transfers character-level recognition data (CCO) into the DCO field values. Must call after recognition. |
| `SnapDCOtoCCO` | _(none)_ | Writes DCO field values back into the CCO (for display in verification). |
| `SnapFieldtoChars` | `fieldName` | Snaps a specific field's CCO data to its DCO value. |
| `UseOutOfProcessRecog` | `0 or 1` | If `1`, runs recognition engine in a separate process for isolation. |

---

## 35. DCO Library — Full Action Reference

The `DCO` library directly manipulates the runtime DCO hierarchy. Actions run at their respective DCO levels.

| Action | Level | Parameters | Description |
|--------|-------|-----------|-------------|
| `ChkConfidence` | Page / Field | `threshold` | Returns true if the object's confidence ≥ `threshold`. |
| `ChkDCOStatus` | Any | `status` | Returns true if the current object's status equals `status`. |
| `ChkDCOType` | Any | `typeName` | Returns true if the current object's type name equals `typeName`. |
| `ChkIntegrity` | Document | _(none)_ | Returns true if the document matches its expected DCO structure. |
| `ChkLastDCOType` | Any | `typeName` | Returns true if the last processed child's type matches `typeName`. |
| `ClearAltText` | Field | _(none)_ | Clears the alternate text value from the current field. |
| `ClearDCO` | Any | _(none)_ | Clears field values, resets status to 0, and removes CCO data. |
| `CopyPD2DD` | Document | _(none)_ | Copies page-level data variables to the parent document-level variables. |
| `CountPagesToDocumentVar` | Document | `variableName` | Counts the total pages in the current document and stores the count as `variableName`. |
| `CreateDocuments` | Batch | _(none)_ | Assembles Document nodes in BATCH.XML from identified pages. Typically called in the CreateDocs task. |
| `CreateFields` | Page | `typeName, count` | Dynamically creates `count` child Field nodes of type `typeName` on the current page. |
| `DeleteFields` | Page | `typeName` | Removes all Field nodes of type `typeName` from the current page. |
| `IsDocumentCountMoreThan` | Batch | `count` | Returns true if the batch contains more than `count` documents. |
| `IsFirstDocumentInBatch` | Document | _(none)_ | Returns true if this is the first document in the batch. |
| `JoinPreviousDocument` | Document | _(none)_ | Merges the current document into the previous document (appends pages). |
| `PropagateToAltText` | Field | _(none)_ | Copies the field's primary text value to its alternate text slot. |
| `RemoveDocumentStructure` | Document | _(none)_ | Removes the document node and all its children from the DCO hierarchy. |
| `SetDCOStatus` | Any | `status` | Sets the status code of the current object. |
| `SetDCOType` | Any | `typeName` | Changes the type name of the current object. |
| `SetDocStatus` | Document | `status` | Sets the document-level status. |
| `SetDocumentType` | Document | `typeName` | Assigns a document type name. |
| `SetFldConfidence` | Field | `confidence` | Overrides the field's confidence value. |
| `SetPageFingerprintID` | Page | `fingerprintID` | Assigns a specific fingerprint ID to the page (skips matching). |
| `SetPageStatus` | Page | `status` | Sets the page-level status code. |
| `SetPageTemplateID` | Page | `templateID` | Assigns a fingerprint template ID to the page. |
| `SetPageType` | Page | `typeName` | Assigns a page type name (used by PageID rules to identify pages). |

---

## 36. dcpdf / TifMerge / ImageConvert — Reference

### 36.1 dcpdf (PDF Creation from TIFF)

Creates PDF output from Datacap's TIFF images. Runs at **Document** or **Page** level in an Export task.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `dcpdf_CreateTiffFromPDF` | _(none)_ | Converts the current PDF file to TIFF for Datacap processing. Inverse of PDF creation. |
| `dcpdf_CreateTiffFromPDF_CreateDocs` | _(none)_ | Converts PDF to TIFF and creates document nodes for each page. |
| `dcpdf_MakePDFDoc` | `outputPath` | Creates a multi-page PDF from the document's TIFF pages at `outputPath`. |
| `dcpdf_SetApplication` | `appName` | Sets the PDF application metadata field. |
| `dcpdf_SetAuthor` | `author` | Sets the PDF author metadata. |
| `dcpdf_SetTitle` | `title` | Sets the PDF title metadata. |
| `dcpdf_SetSubject` | `subject` | Sets the PDF subject metadata. |
| `dcpdf_SetKeywords` | `keywords` | Sets PDF keywords metadata. |
| `dcpdf_SetProducer` | `producer` | Sets the PDF producer string. |
| `dcpdf_SetImageBitcount` | `bits` | Sets bit depth for images embedded in the PDF: `1`, `8`, or `24`. |
| `dcpdf_SetImageCompression` | `type` | Sets PDF image compression: `CCITT4`, `JPEG`, `LZW`, `None`. |
| `dcpdf_SetImageGrayscale` | `0 or 1` | Forces grayscale images in the PDF. |
| `dcpdf_SetImageQuality` | `0–100` | Sets JPEG quality for embedded images. |
| `dcpdf_SetImageResolution` | `dpi` | Sets image resolution in the PDF. |
| `dcpdf_MaxSizeToReconvert` | `bytes` | Re-converts PDFs larger than `bytes` to reduce file size. |
| `dcpdf_UseAltConversionMethod` | `0 or 1` | Uses an alternate PDF generation method for compatibility. |

### 36.2 TifMerge (TIFF File Merging)

Merges multiple single-page TIFF files into a single multi-page TIFF.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `TifMerge_SetFilePath` | `path` | Sets the output directory for merged TIFF files. |
| `TifMerge_SetFileName` | `name` | Sets the output filename for the merged TIFF. |
| `TifMerge_MergeImages` | _(none)_ | Merges all pages of the current document into a single multi-page TIFF. |
| `TifMerge_MyImage` | _(none)_ | Adds the current page's image to the merge accumulator. |
| `TifMerge_ExportToBatchDir` | _(none)_ | Saves the merged TIFF to the batch directory instead of a separate output path. |
| `TifMerge_PreserveCompression` | `0 or 1` | If `1`, preserves the original TIFF compression type in the output. |
| `TifMerge_CheckStatus` | _(none)_ | Returns true if the current page has an acceptable status for inclusion in the merge. |

### 36.3 ImageConvert (TIFF/JPEG Conversion)

Converts between image formats, appends images, and changes color depth.

| Action | Parameters | Description |
|--------|-----------|-------------|
| `ConvertToTIFF` | _(none)_ | Converts the current page image to TIFF format. |
| `ConvertToJPEG` | _(none)_ | Converts the current page image to JPEG. |
| `AppendImage` | `path` | Appends the image at `path` to the current page's image. |
| `AppendAllImages` | _(none)_ | Appends all images in the batch to a single output file. |
| `AppendAllImages_ByType` | `type` | Appends only images of the specified page type. |
| `AppendImage_StartAsNew` | `path` | Starts a new output file and appends `path` as the first image. |
| `SetTIFFCompression` | `type` | Sets TIFF compression: `CCITT4`, `LZW`, `JPEG`, `None`. |
| `SetGrayScale` | `0 or 1` | Converts output to grayscale. |
| `SetDeleteOriginal` | `0 or 1` | If `1`, deletes the source image after conversion. |
| `SetLuminanceFactor` | `factor` | Sets the luminance adjustment factor for color-to-grayscale conversion. |
| `SetChrominanceFactor` | `factor` | Sets the chrominance factor for color conversion. |

---

## 37. Medical Claims / APT — Reference

### 37.1 Medical Claims Actions

| Library | Actions | Purpose |
|---------|---------|---------|
| `MC_Identify` | `AutoField`, `FindFields`, `ReadDCOSetup`, `ReadPageSetup`, `SetFormType`, `SetMaxTolerantDistance` | Identifies HCFA-1500 (4010/5010 Professional) and UB-04 (4010/5010 Institutional) claim forms |
| `MC_Validation` | 25+ actions (see below) | Validates medical claims fields per HIPAA rules |

Key `MC_Identify` actions:
| Action | Description |
|--------|-------------|
| `SetFormType(Professional)` or `SetFormType(Institutional)` | Selects the claim form type for recognition. |
| `AutoField` | Auto-detects and populates all fields from the standard form layout. |
| `ReadDCOSetup` | Reads field definitions from the SetupDCO for the claim form. |
| `ReadPageSetup` | Reads page-level configuration for the claim recognition engine. |
| `SetMaxTolerantDistance(pixels)` | Sets the pixel tolerance for field location matching on variable-quality scans. |

Key `MC_Validation` actions:
| Action | Description |
|--------|-------------|
| `AddCenturyTo2YearDigit` | Converts 2-digit year to 4-digit (e.g., `24` → `2024`). |
| `CalculateHCFALineCharges` | Calculates line-item charges on the HCFA-1500 form. |
| `CalculateUBLineCharges` | Calculates line charges on the UB-04 form. |
| `CheckDocID` | Validates the document identifier format. |
| `CommonParseAddress` | Parses a US address into components. |
| `CommonValAddress` | Validates a US address format. |
| `FilterPID` | Filters patient identifier fields. |
| `FormatFieldLengths` | Ensures claim fields meet HIPAA length requirements. |
| `InheritSnippets` | Copies field data from prior recognition pass. |
| `MC_ReadZones` | Reads recognition zone positions for the current form type. |
| `ParseConditionCodes` | Parses UB-04 condition codes. |
| `ParseEPSDT` | Parses EPSDT (Early Periodic Screening) field. |
| `ParseLastFirstIniNames` | Parses "Last, First M." name format. |
| `ParseNDC` | Parses National Drug Code. |
| `SetConf(confidence)` | Sets the confidence value for validated medical claims fields. |
| `ValidateNPI` | Validates a National Provider Identifier (10-digit). |
| `ValProcedureCode` | Validates CPT/HCPCS procedure codes. |
| `ValRequiredCode` | Validates required fields have values. |
| `TransformLI` | Transforms line-item data for UB/HCFA normalization. |

### 37.2 Datacap APT (Accounts Payable) Actions

The APT application uses a custom action library for invoice processing.

| Group | Key Actions | Purpose |
|-------|------------|---------|
| `APT_Localization` | _(locale config actions)_ | Configure locale-specific number/date formats for invoice recognition |
| `APTCustom` | _(core APT actions)_ | Core APT invoice processing (vendor match, PO match, GL coding) |
| `ConcatLineValues` | _(line item concatenation)_ | Concatenates line item field values |
| `Documents` | _(document-level APT actions)_ | Document-level APT processing |
| `FlexID` | _(flexible page ID)_ | Flexible vendor-specific page identification |
| `Intellocate_Learning` | _(learning engine)_ | Machine learning-based field location for new vendors |
| `PageID` | _(APT page ID)_ | APT-specific page identification using vendor database |
| `PreVerifySetup` | _(pre-verification)_ | Prepares batch for APT verification workflow |
| `Redaction` | _(APT redaction)_ | Redacts sensitive APT data (bank account numbers, etc.) |

---

*End of IBM Datacap Application Development Guide Reference — Version 9 (Full Edition)*
