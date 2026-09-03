# IBM Datacap Application — Canonical File & Folder Structure

> Applies to **IBM Datacap 9.1.10** (and 9.1.9+)

---

## Root Application Folder

```
C:\Datacap\<AppName>\
│
├── <AppName>.app                       ← Application Manager configuration
│   (XML file, edited via Application Manager GUI)
│
├── datacap.xml                         ← Datacap server global registry
│   (references all registered applications)
│
├── dco_<AppName>\                      ─────────────────────────────────────
│   │                                   ← SetupDCO: Document Hierarchy + Rules
│   ├── <AppName>.xml                   ← Document/Page/Field class definitions
│   │
│   ├── rules\                          ← Ruleset (.rul) files
│   │   ├── collection.xml              ← Registry of all .rul files
│   │   ├── PageID.rul                  ← Page identification / fingerprint matching
│   │   ├── Recognition.rul             ← OCR / zone recognition
│   │   ├── Extraction.rul              ← Data extraction rules
│   │   ├── Validation.rul              ← Business rule validation
│   │   ├── Export.rul                  ← Export to back-end (FileNet, CMIS, DB)
│   │   ├── CustomActions.dll           ← Custom C# action DLL (deployed here)
│   │   └── CustomActions.rrx           ← Action declarations for Studio
│   │
│   ├── <AppName>_MainJob.bpp           ← Batch Processing Profile (workflow tasks)
│   └── Settings.ini                    ← Application-level settings (use sparingly)
│
├── batches\                            ─────────────────────────────────────
│   └── <BatchNumber>\                  ← Runtime batch (NOT in source control)
│       ├── tm000001.xml                ← Runtime DCO (batch hierarchy state)
│       ├── *.tif                       ← Page images
│       └── *.log                       ← Batch log
│
├── fingerprints\                       ─────────────────────────────────────
│   ├── Fingerprint.mdb                 ← Fingerprint database (Access) or SQL
│   ├── <DocType>_<PageType>.cco        ← Zone definition file per page template
│   └── <DocType>_<PageType>.tif        ← Reference template image
│
├── images\                             ← Input image staging (scanned / imported)
│   └── *.tif / *.pdf
│
└── export\                             ← Export output staging
    └── <BatchNumber>\
```

---

## SetupDCO XML Schema

File: `dco_<AppName>/<AppName>.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<batch name="<AppName>" type="Batch">

  <!-- Batch-level variables -->
  <variable name="BatchStatus" value="0" />
  <variable name="ProcessDir"  value="C:\Datacap\<AppName>\dco_<AppName>" />

  <!-- Document type definition -->
  <document name="Invoice" type="Document" description="Supplier Invoice">

    <!-- Page type definition -->
    <page name="InvoicePage" type="Page" description="Main invoice page">

      <!-- Field definitions -->
      <field name="InvoiceNumber"  type="Field" datatype="AlphaNumeric" required="true"  />
      <field name="InvoiceDate"    type="Field" datatype="Date"         required="true"  />
      <field name="VendorName"     type="Field" datatype="Alphabetic"   required="false" />
      <field name="TotalAmount"    type="Field" datatype="Numeric"      required="true"  />
      <field name="CurrencyCode"   type="Field" datatype="AlphaNumeric" required="false" />
    </page>

    <page name="LineItemPage" type="Page" description="Invoice line items">
      <field name="LineDescription" type="Field" datatype="AlphaNumeric" required="false" />
      <field name="LineAmount"      type="Field" datatype="Numeric"      required="false" />
    </page>

  </document>

  <!-- Second document type -->
  <document name="PurchaseOrder" type="Document" description="Purchase Order">
    <page name="POPage" type="Page" description="PO main page">
      <field name="PONumber"   type="Field" datatype="AlphaNumeric" required="true" />
      <field name="PODate"     type="Field" datatype="Date"         required="true" />
      <field name="Requester"  type="Field" datatype="Alphabetic"   required="false" />
      <field name="POAmount"   type="Field" datatype="Numeric"      required="false" />
    </page>
  </document>

</batch>
```

---

## collection.xml — Ruleset Registry

File: `dco_<AppName>/rules/collection.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<collection>
  <ruleset name="PageID"      file="PageID.rul"      />
  <ruleset name="Recognition" file="Recognition.rul" />
  <ruleset name="Extraction"  file="Extraction.rul"  />
  <ruleset name="Validation"  file="Validation.rul"  />
  <ruleset name="Export"      file="Export.rul"      />
</collection>
```

---

## Workflow Task Profiles

Typical standard task sequence:

| Task | Ruleset | Level | Purpose |
|------|---------|-------|---------|
| `VScan` | ScanTask | Batch | Image acquisition, PDF→TIF conversion |
| `PageID` | PageID | Page | Fingerprint match → classify page type |
| `Recognize` | Recognition | Page | OCR — extract text from zones |
| `NVerify` | (no ruleset) | Document | Human verification UI |
| `Validate` | Validation | Document/Field | Business rules validation |
| `Export` | Export | Batch | Export to FileNet P8, DB, folder, etc. |

---

## Application Manager (.app) Key Sections

```
[Main]
BatchDir   = C:\Datacap\<AppName>\batches
ImageDir   = C:\Datacap\<AppName>\images
ExportDir  = C:\Datacap\<AppName>\export
FPDir      = C:\Datacap\<AppName>\fingerprints

[Datacap]
AdminDB    = DSN=<AppName>_Admin
EngineDB   = DSN=<AppName>_Engine
Server     = <DatacapServerName>

[Workflow]
SetupDCO   = C:\Datacap\<AppName>\dco_<AppName>\<AppName>.xml
Locale     = C:\Datacap\<AppName>\dco_<AppName>\locale
Rules      = C:\Datacap\<AppName>\dco_<AppName>\rules
```

> **Best practice:** Use the **Application Manager GUI** to edit `.app` files — never edit by hand on production.

---

## Source Control Inclusion Matrix

| Path | Include? | Reason |
|------|----------|--------|
| `dco_<AppName>/` | ✅ Yes | All rules, XML, config |
| `fingerprints/` | ✅ Yes | Template images + zone files |
| Custom action source (`*.cs`, `*.rrx`, `*.csproj`) | ✅ Yes | Build from source |
| `<AppName>.app` | ✅ Yes (template) | Use env variables for paths |
| `batches/` | ❌ No | Runtime data |
| `images/` | ❌ No | Input staging |
| `export/` | ❌ No | Output staging |
| Compiled DLLs | ❌ No | Build artifacts |
