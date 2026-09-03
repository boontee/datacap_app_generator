# IBM Datacap 9.1.10 — Development Best Practices

> **Latest release:** IBM Datacap **9.1.10** (GA December 19, 2025)  
> **Key shift:** VBScript is deprecated — all new custom actions must be written in **C# (.NET)** using Visual Studio 2022.

---

## 1. Application Architecture Overview

A Datacap application is primarily a **collection of files** rooted at `C:\Datacap\<AppName>\`.

```
C:\Datacap\<AppName>\
├── <AppName>.app                   ← Application Manager config file
├── dco_<AppName>\                  ← Setup DCO (Document Hierarchy)
│   ├── <AppName>.xml               ← Document/Page/Field definitions
│   ├── rules\                      ← Rulesets (.rul) and collection.xml
│   │   ├── collection.xml
│   │   ├── PageID.rul
│   │   ├── Recognition.rul
│   │   ├── Extraction.rul
│   │   ├── Validation.rul
│   │   └── Export.rul
│   └── *.bpp / *.ini               ← Batch processing profiles
├── batches\                        ← Runtime batch folders (not in source control)
├── fingerprints\                   ← Fingerprint DB and CCO/TIFF templates
├── images\                         ← Input image staging folder
└── export\                         ← Export output folder
```

### Key configuration files

| File | Purpose |
|------|---------|
| `<AppName>.app` | Application Manager file — defines all paths, DB connections, workflow |
| `dco_<AppName>/<AppName>.xml` | SetupDCO — defines Batch/Document/Page/Field hierarchy |
| `rules/collection.xml` | Ruleset registry — lists all .rul files available to Studio |
| `fingerprints/` | Fingerprint database and page template images |
| `datacap.xml` | Global Datacap server config (references all registered apps) |

---

## 2. Document Hierarchy

Every application has a **4-level hierarchy**:

```
Batch
 └── Document (document type, e.g. "Passport", "Invoice")
      └── Page (page type, e.g. "FrontPage", "BackPage")
           └── Field (data element, e.g. "InvoiceNumber", "DateOfBirth")
```

- The **SetupDCO XML** (`dco_<AppName>/<AppName>.xml`) defines the *classes* (types).
- The **runtime batch** (in `batches\`) creates *instances* of those classes as each batch is processed.
- Rules are attached at any level: batch, document, page, or field.

---

## 3. Workflow Structure

A workflow is composed of:

```
Workflow
 └── Job (e.g. "MainJob")
      ├── Task 1: VScan       ← Image acquisition / PDF conversion
      ├── Task 2: PageID      ← Fingerprint matching, document classification
      ├── Task 3: Recognize   ← OCR, zone extraction
      ├── Task 4: NVerify     ← Manual verification (human review)
      ├── Task 5: Validate    ← Business rule validation
      └── Task 6: Export      ← Export to FileNet P8, CMIS, DB, etc.
```

Each task links to a **Task Profile** → **Rulesets** → **Rules** → **Actions**.

---

## 4. Ruleset Design Principles

- Keep rulesets **focused and single-purpose** (e.g. `PageID`, `Recognition`, `Validation`, `Export`).
- Use **compiled rulesets** (DDK Custom Rulesets) for reusable logic across applications.
- Assign rules at the correct hierarchy level — avoid running page-level logic at batch level.
- Use **smart parameters** (`@Variable`, `@ProcessDir`, `@BatchDir`) instead of hard-coded paths.
- Prefer the **application service** over hard-coded connection strings in `.ini` / `.bpp` files.

---

## 5. Custom Action Development (C# / .NET)

### 5.1 Prerequisites
- **IBM Datacap Developer Kit (DDK)** — download from [ibm-ecm/datacap-developer-kit](https://github.com/ibm-ecm/datacap-developer-kit)
- **Visual Studio 2022** (build/compile) + **Visual Studio 2019** (DDK panel design/UI testing)
- Target **.NET Framework 4.x** (COM-visible DLL)
- Reference DLLs from the DDK:
  - `TDCOLib.dll` — DCO object model (batch/document/page/field)
  - `RRXLib.dll` — Rulerunner interface (`iRRXnet`)
  - `dcrroLib.dll` — Rulerunner state (`IRRState`)

### 5.2 Project structure
```
MyDatacapActions\
├── MyDatacapActions.csproj      ← Class library, COM-visible, x86
├── MyDatacapActions.rrx         ← Action declarations for Datacap Studio
├── Actions\
│   ├── ValidationActions.cs
│   ├── ExportActions.cs
│   └── Common.cs                ← Base class with DCO helpers
└── Properties\
    └── AssemblyInfo.cs          ← [assembly: ComVisible(true)]
```

### 5.3 Minimal C# custom action skeleton

```csharp
using System;
using System.Runtime.InteropServices;
using TDCOLib;
using dclogXLib;

namespace MyDatacapActions
{
    [ComVisible(true)]
    [Guid("YOUR-GUID-HERE")]
    [ClassInterface(ClassInterfaceType.None)]
    public class ValidationActions
    {
        // --- Injected by Rulerunner ---
        public IDCO CurrentDCO { get; set; }
        public IDCO RootDCO    { get; set; }
        public IDCLog RRLog    { get; set; }

        /// <summary>
        /// Validates that a required field is not empty.
        /// Attach at: Field level
        /// </summary>
        public bool ValidateRequiredField()
        {
            try
            {
                if (CurrentDCO.ObjectType() != Level.Field)
                {
                    RRLog.WriteEx(dclogXLib.LogLevel.LOG_WARNING,
                        "ValidateRequiredField: must run at Field level.");
                    return false;
                }

                string value = CurrentDCO.Text.Trim();
                if (string.IsNullOrEmpty(value))
                {
                    CurrentDCO.Status = (int)DCOStatus.SCAN_ERROR;
                    RRLog.WriteEx(dclogXLib.LogLevel.LOG_ERROR,
                        $"Field '{CurrentDCO.ID}' is required but empty.");
                    return false;
                }

                RRLog.WriteEx(dclogXLib.LogLevel.LOG_DEBUG,
                    $"Field '{CurrentDCO.ID}' validated OK: '{value}'");
                return true;
            }
            catch (Exception ex)
            {
                RRLog.WriteEx(dclogXLib.LogLevel.LOG_ERROR,
                    $"ValidateRequiredField exception: {ex.Message}");
                return false;
            }
        }

        /// <summary>
        /// Iterate all pages of the current document and log field values.
        /// Attach at: Document level
        /// </summary>
        public bool LogDocumentFields()
        {
            try
            {
                if (CurrentDCO.ObjectType() != Level.Document)
                    return false;

                for (int p = 0; p < CurrentDCO.NumOfChildren(); p++)
                {
                    IDCO page = CurrentDCO.GetChild(p);
                    for (int f = 0; f < page.NumOfChildren(); f++)
                    {
                        IDCO field = page.GetChild(f);
                        RRLog.WriteEx(dclogXLib.LogLevel.LOG_DEBUG,
                            $"  Page[{p}].{field.ID} = '{field.Text}'");
                    }
                }
                return true;
            }
            catch (Exception ex)
            {
                RRLog.WriteEx(dclogXLib.LogLevel.LOG_ERROR,
                    $"LogDocumentFields exception: {ex.Message}");
                return false;
            }
        }
    }
}
```

### 5.4 RRX declaration file (`.rrx`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<RRX>
  <Library name="MyDatacapActions" description="Custom Validation and Export Actions">
    <Class name="ValidationActions" progid="MyDatacapActions.ValidationActions">
      <Action name="ValidateRequiredField"
              description="Validates the current field is not empty."
              level="Field" />
      <Action name="LogDocumentFields"
              description="Logs all field values for the current document."
              level="Document" />
    </Class>
  </Library>
</RRX>
```

### 5.5 Deployment
1. Build the solution → produces `MyDatacapActions.dll`
2. Copy `MyDatacapActions.dll` **and** `MyDatacapActions.rrx` to `C:\Datacap\<AppName>\dco_<AppName>\rules\`
3. Register the COM DLL: `regsvr32 MyDatacapActions.dll`
4. Restart Datacap Studio — the actions appear in the **Action Library** panel.

---

## 6. DCO API Quick Reference

### Navigate the hierarchy

```csharp
// From any level, navigate UP
IDCO batch    = RootDCO;
IDCO doc      = batch.GetChild(0);           // first document
IDCO page     = doc.GetChild(0);             // first page of document
IDCO field    = page.GetChild("InvoiceNum"); // field by name

// Navigate DOWN from CurrentDCO
int childCount = CurrentDCO.NumOfChildren();
IDCO child     = CurrentDCO.GetChild(i);

// Check level
Level level = (Level)CurrentDCO.ObjectType();
// Level.Batch | Level.Document | Level.Page | Level.Field
```

### Read / Write field values

```csharp
string value     = field.Text;               // read extracted value
field.Text       = "corrected value";        // write / override value
int confidence   = field.Confidence;         // 0-100
field.Status     = (int)DCOStatus.SCAN_OK;   // mark as verified
```

### Variables (smart parameters)

```csharp
int idx = CurrentDCO.FindVariable("MyVar");
if (idx >= 0)
    string val = CurrentDCO.GetVariableValue(idx);
CurrentDCO.AddVariable("MyVar", "MyValue");
```

---

## 7. Fingerprint & Document Classification

- **Fingerprints** are stored in the fingerprint database (`fingerprints\` folder).
- Each fingerprint consists of a **CCO file** (zone definitions) and a **TIFF template image**.
- The `PageID` ruleset runs the `SetFingerprintParameters` and `PageID` actions to match incoming pages.
- For multi-page documents, define a **document separator** strategy (barcode, fingerprint, or manual).

---

## 8. OCR Engines (Datacap 9.1.10)

| Engine | Best for |
|--------|---------|
| `OCR/A` | Machine-printed text, high-volume PDF conversion |
| `OCR/PL` | Printed + handwritten text; now supports **multiple Rulerunners** on one machine |
| `OCR/S` | Structured forms |
| ABBYY FineReader | Third-party high-accuracy engine (licensed separately) |
| IBM Document Processing Extension | AI/ML classification and extraction (9.1.9+) |

---

## 9. Integration Patterns

### FileNet P8 Export (9.1.10 — new `IBMFileNetP8` library)
```
Action: IBMFileNetP8.AddDocument
Parameters:
  Server:      https://filenet-server/wsi/FNCEWS40MTOM
  ObjectStore: MyObjectStore
  DocClass:    Invoice
  FolderPath:  /Invoices/@{Year}/@{Month}
```

### REST Web Service from Custom Action
```csharp
using System.Net.Http;

var client = new HttpClient();
var payload = new { invoiceNumber = field.Text, amount = amountField.Text };
var json    = Newtonsoft.Json.JsonConvert.SerializeObject(payload);
var content = new StringContent(json, Encoding.UTF8, "application/json");
var response = await client.PostAsync("https://api.example.com/validate", content);
string result = await response.Content.ReadAsStringAsync();
```

---

## 10. Version History Quick Reference

| Version | GA Date | Key Addition |
|---------|---------|-------------|
| 9.1.9   | Nov 2023 | IBM Document Processing Extension (AI/ML) |
| 9.1.10  | Dec 19, 2025 | VS2022 support, OCR/PL multi-Rulerunner, new IBMFileNetP8 library, VBScript deprecation path |

---

## 11. Source Control Checklist

**Include in source control:**
- `dco_<AppName>/` (all rule files, XML, BPP, INI)
- Custom action DLL source code (`.csproj`, `.cs`, `.rrx`)
- Fingerprint templates (CCO + TIFF)

**Exclude from source control:**
- `batches/` — runtime data
- `images/` — input staging
- `export/` — output data
- Compiled DLLs (build from source)
- Database files

---

## 12. Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Hard-coded paths in `.ini` / `.bpp` | Use smart parameters or Application Service |
| Running page-level actions at batch level | Set correct hierarchy level in ruleset |
| VBScript custom actions (deprecated) | Migrate to C# using DDK 9.1.10 templates |
| Missing `[ComVisible(true)]` on DLL | Add to `AssemblyInfo.cs` and per-class |
| DLL not registered with `regsvr32` | Re-run `regsvr32 <dll>` after each deployment |
| Actions show red in Studio ("do not match RRX") | Ensure `.rrx` `progid` matches the class `ProgId` attribute exactly |
| Multiple Rulerunners failing with OCR/PL | Upgrade to 9.1.10 (multi-Rulerunner support added) |
