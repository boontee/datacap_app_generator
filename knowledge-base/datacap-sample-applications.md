# IBM Datacap — Sample Applications Catalogue

> Source: `C:\Datacap\` — 7 installed sample applications + 2 application templates

---

## Sample Applications Overview

| Application | Domain | Classification Method | AI/LLM? | Notable Features |
|-------------|--------|-----------------------|---------|-----------------|
| **TravelDocs** | Travel expense documents | Fingerprint | No | IBM tutorial app; line items, grids, OMR checkboxes, dictionary lookups |
| **APT** | Accounts Payable (Invoices) | Fingerprint + FlexID | No | Most complete production sample; vendor lookup, line items, routing, redaction, multi-language |
| **watsonxai** | Mixed business docs | AI/LLM (watsonx) | ✅ Yes | LLMKey-driven extraction; Invoice, Bank Statement, Waybill, BOL, Utility Bill |
| **WatsonaiRedaction** | Mixed docs + PII redaction | AI/LLM (watsonx) | ✅ Yes | Extends watsonxai; adds Medical, Title, Benefits, Loan docs; Watson AI Redaction |
| **GoldenDemo** | Government / Motor Vehicle forms | Fingerprint + Barcode | No | 20+ document types; OMR, barcode page ID, SSN redaction fields, lookup |
| **Vet** | Veterans benefits forms | Fingerprint | No | EMR form processing; PII fields (SSN, DOB, address) |
| **AutomationDocumentProcessing** | Generic document processing | Barcode | No | Simplest template; barcode-based page ID; PDF native support |

---

## Application Templates (C:\Datacap\Templates\)

| Template | Purpose |
|----------|---------|
| **FormTemplate** | Base template for fixed-format form processing (fingerprint-based) |
| **LearningTemplate** | Template for FlexID/Learning-based extraction (variable-format docs) |

---

## Application Details

---

### 1. TravelDocs — `C:\Datacap\TravelDocs\`

**Purpose:** IBM official tutorial application. Processes travel expense documents.

**Document Hierarchy:**
```
Batch: TravelDocs
├── Document: Car_Rental
│   ├── Page: Rental_Agreement
│   │   ├── Field: Pickup_Date, Pickup_Location, Return_Date, Return_Location
│   │   ├── Field: Car_Type  (dictionary lookup → Car_Types)
│   │   ├── Field: Options   (OMR checkboxes: Nav_System, Child_Seat, Fuel_Service)
│   │   └── Field: Total_Cost
│   ├── Page: Optional_Insurance
│   │   └── Fields: CDW, PAI, PEP, ELP  (all OMR checkboxes with _Option sub-fields)
│   └── Page: Optional_Insurance_Details
│       └── Fields: Coverage (grid), Coverage_TotalCost
├── Document: Hotel
│   └── Page: Room_Receipt
│       └── Fields: Arrival_Date, Departure_Date, Total_Cost
│   └── Page: Meals
│       └── Fields: Meals_Total, Meals_Grid → Meals_Line_Item (Date, Description, Cost)
│   └── Page: Other_Charges
│       └── Fields: Other_Charges_Total, Other_Charges_Grid → Other_Charges_Line_Item
│                  (Date, Category, Quantity, Unit_Cost, Total, Validation)
└── Document: Flight
    └── Page: Air_Ticket
        └── Fields: Outbound_From/To/Date, Return_From/To/Date
                   Airfare, Taxes, Total_Cost, Vendor_Logo
```

**Key Patterns demonstrated:**
- Multi-page documents with optional pages (`min="0" max="1"`)
- OMR (Optical Mark Recognition) checkboxes with sub-fields
- Grid/line-item field hierarchies (nested `<F>` inside `<F>`)
- Dictionary lookups (`<SQL flist=... dsn="*/lookupdb:cs">SELECT ...`)
- `Sticky_Field` and `Text_Field` patterns

**Rules:** PageID, Recognition, Extraction, Validation, Export, ExportDB, ExportXML  
**Multi-language:** Yes (cs, de, el, es, fr, hr, hu, it, ja, nl, pl, pt-br, ro, ru, sk, sv, tr, zh)

---

### 2. APT — `C:\Datacap\APT\` (Accounts Payable)

**Purpose:** Production-grade Accounts Payable invoice processing. Most feature-rich sample.

**Document Hierarchy:**
```
Batch: APT
├── Document: Invoice
│   ├── Page: Main_Page
│   │   ├── Fields: Vendor, Vendor_Number, Remittance_Zip
│   │   ├── Fields: Invoice_Number, Invoice_Date, PO_Number
│   │   ├── Fields: Shipping, Invoice_Type (dict: PO/Non-PO/Credit)
│   │   ├── Fields: Taxes → TaxLineitem (Tax_Type, Tax_Value)
│   │   ├── Fields: Invoice_Total, Routing_Instructions (dict)
│   │   ├── Field:  Details → Lineitem (ItemID, ItemDesc, Qty, Price, LineTotal, POLineNum)
│   │   ├── Field:  Browse → Page_No → TIFF
│   │   └── Field:  ExportImage
│   ├── Page: Trailing_Page
│   ├── Page: Attachment_Separator
│   └── Page: Attachment
└── Document: Separator
    └── Page: Document_Separator
```

**Key Patterns demonstrated:**
- Vendor lookup: `SELECT VendorName,VendorZip,VendorID FROM VendorTable WHERE VendorName like '@@Vendor@@%'`
- Multi-level line items (Details → Lineitem → sub-fields)
- Tax line items (Taxes → TaxLineitem)
- Document separator pages
- Attachment handling
- FlexID compiled ruleset (FlexID.rul + FlexID.rrx)
- Custom RRX libraries: `APTCustom.RRX`, `APT_Localization.RRX`, `Redaction.rrx`, `ConcatLineValues.RRX`
- Full export + statistics + routing rules
- Multi-language support

**Custom DLLs:** `ImageEnhancement.Rul.dll` (image pre-processing)

---

### 3. watsonxai — `C:\Datacap\watsonxai\`

**Purpose:** Demonstrates IBM watsonx.ai LLM-powered field extraction. Uses `LLMKey` attribute on fields.

**Document Hierarchy:**
```
Batch: watsonxai
├── Document: DocInvoice → Page: Invoice
│   Fields: InvoiceNum (LLMKey="Invoice Number"), BillToName, BillToAddress
│           Date (LLMKey="Invoice Date"), ShipTo, SubTotal, Tax, Total
│           MyLineItem (LLMKey="Line Items")
├── Document: DocBank → Page: BankStatement
│   Fields: ClientName, ClientStreet/City/State/Zip
│           StatementDate, OpeningBalance, ClosingBalance
│           ClientNumber, BSBNumber, Accelerator, StatementNumber, LineItems
├── Document: DocWaybil → Page: Waybill
│   Fields: MAWBNumber, ShipperName, ShipperAccount
│           ConsigneeName, ConsigneeAccount, Origin, Destination
│           Currency, DeclairedValueCarriage, DeclairedValueCustoms
│           Flight1Date, Flight2Date, ReferenceNumbers, HandlingInformation
│           WaybillLineItem (LLMKey="Line Items")
├── Document: DocBOL → Page: BillofLading
│   Fields: BOLDate, BOLNumber, BOLShipper, BOLCustomer
└── Document: DocUtility → Page: Utility
    Fields: UtilityCustomer, UtilityBillDate, UtilityDueDate
            UtilityAccount, UtilityDue
```

**Key Patterns demonstrated:**
- `<V n="LLMKey">Invoice Number</V>` — maps field to watsonx.ai LLM prompt key
- AI-based classification (no fingerprints required)
- `pl_writingStyle` batch variable for LLM prompting
- VScan.script for scanning/import workflow

---

### 4. WatsonaiRedaction — `C:\Datacap\WatsonaiRedaction\`

**Purpose:** Extends watsonxai with Watson AI-powered PII redaction. Adds 4 more document types.

**Additional Document Types (beyond watsonxai):**
```
├── Document: DocMedical → Page: Medical
│   Fields: Names (LLMKey), Name0–Name9  (PII extraction for redaction)
├── Document: DocTitle → Page: Title
│   Fields: Make, Year (LLMKey="Model Year"), VIN (LLMKey="Vehicle Identification Number")
├── Document: DocBenefits → Page: Benefits
│   Fields: EmployeeName, EmployeeAddress, EmployeeSSN, EmployeeDOB
└── Document: DocLoan
    ├── Page: LoanDocCoversheet
    │   Fields: Product, LoanName, CommitmentAmount, EffectiveDate
    └── Page: LoanAgreement
        Fields: Borrower, Guarantor, Lender
```

**Redaction Fields (batch-level):**
```
Field: Redact_Social Security Number  (IsRedaction=1, ReasonCode GUID)
Field: Redact_Credit Card Number      (IsRedaction=1)
Field: Redact_Confidential            (IsRedaction=1)
Field: Redact_Intellectual property   (IsRedaction=1)
```

**Key Patterns demonstrated:**
- `<V n="IsRedaction">1</V>` field flag for redaction
- `<V n="ReasonCode">{GUID}</V>` and `<V n="ReasonCodeName">SSN</V>` for redaction type
- AI-driven name entity detection for PII (Names, Name0–Name9 pattern)
- Watson AI Redaction action library integration

---

### 5. GoldenDemo — `C:\Datacap\GoldenDemo\`

**Purpose:** Comprehensive demo showcasing 20+ government / motor vehicle document types. Used for demonstrations.

**Document Types:**
```
SMMA-12  — Municipal employee membership form (OMR gender, marital status, pay frequency)
SMMA-14  — Beneficiary designation form (OMR, line item tables)
VR-005   — Vehicle registration (FirstName, LastName, Address, LicenseNumber)
VR-102   — Vehicle form (Year, MakeOfVehicle)
VR-103   — Vehicle form
VR-129/167/197/210/003/009/018/048/471 — Various vehicle registration forms
DR-15A   — Order of suspension (DLNumber, Race, WGT, LicenseClass)
CP29-0646 / CP32-0256 — Compliance forms
CertLetter — Hearing certification letter (HearingLocation, DOB, OAHCaseNumber)
TrafficCitation — Traffic citation
AdviceRights — Advice of rights
DrivingExtension — Driving privilege extension
SuspensionLetter — License suspension letter
I9       — USCIS Form I-9 (barcode: "USCIS Form-I9 EEV")
ReliefFund — HR relief fund (barcode: "HR1")
Check    — Bank check (CheckNumber, PayTo, Amount, RoutingNumber, AccountNumber, Signed OMR)
Invoice  — Generic invoice
```

**Key Patterns demonstrated:**
- `<V n="BarcodePageID">True</V>` — barcode-based document identification
- `<V n="BarcodeIdentify">HR1</V>` on page — maps barcode value to page type
- `<V n="base">Document</V>` / `<V n="base">Page</V>` — document type inheritance
- SSN database lookup across fields
- Redaction fields (`Redact_*`) for SSN, Credit Card, Confidential, IP
- Complex OMR (gender, marital status, pay frequency, signatures)
- SMMA-14 has nested grid/line-item tables for beneficiary designations
- `PAGE_WIDTH` / `PAGE_HEIGHT` constraints on specific page types
- `Profiler.script` for batch profiling

---

### 6. Vet — `C:\Datacap\Vet\`

**Purpose:** Veterans benefit form processing. Simple two-document-type application.

**Document Hierarchy:**
```
Batch: Vet
├── Document: Document
│   └── Page: Page   (generic unclassified)
└── Document: EMRFORM
    └── Page: EMRPAGE
        Fields: FIrstName LastName Mid Initial
                Date of Birth, Country Of Residence, Address
                City, ZIP Code, Phone No, Social Security No
                Email Address, Vetaran Deceased
                Name, Relationship, Age
                Assistance Type, Amount Needed
```

**Key Patterns demonstrated:**
- Mixed field naming (spaces allowed in field type names)
- `<V n="y_tt">16</V>` — handprint recognition type
- Simple 2-document application structure
- PII-sensitive fields (SSN, DOB, phone, email)

---

### 7. AutomationDocumentProcessing — `C:\Datacap\AutomationDocumentProcessing\`

**Purpose:** Generic document processing using barcode-based separation. Simplest/most reusable starting point.

**Document Hierarchy:**
```
Batch: AutomationDocumentProcessing
│   Variables: BarcodePageID=True, BarcodeRegEx=False, BarcodeDelim=","
├── Document: Document
│   ├── Page: Main_Page  (PhysicalWidth=8.5)
│   └── Page: Trailing_Page
├── Document: Separator
│   └── Page: Separator_Sheet  (BarcodeIdentify=ENDDOC)
└── Document: PDFDocument
    └── Page: PDF_File
```

**Batch-level fields:**
```
Field: Group    (batch routing/grouping)
Field: Location (destination routing)
```

**Key Patterns demonstrated:**
- Barcode-based document separation (`BarcodeIdentify=ENDDOC`)
- Native PDF document type (`PDFDocument` / `PDF_File`)
- Batch-level fields for routing/grouping
- Email import task profile (`email import.set.xml`)
- Web scan support (`webscan.set.xml`)
- GetStatus task for batch status monitoring

---

## DCO XML Format Reference

The actual DCO XML uses a compact format with single-character tags:

| Tag | Meaning |
|-----|---------|
| `<S>` | Root `<S>`chema container |
| `<B type="...">` | `B`atch definition |
| `<D type="...">` | `D`ocument type definition |
| `<P type="...">` | `P`age type definition |
| `<F type="...">` | `F`ield type definition |
| `<V n="..." >` | `V`ariable / property |
| `<DICT n="...">` | Dictionary definition |
| `<W v="...">` | Dictionary `W`ord/value |

**Key field variables:**

| Variable | Purpose |
|----------|---------|
| `STATUS` | Default status (-1 = disabled/hidden, 0 = normal) |
| `ReqConf` | Required confidence threshold (0-100) |
| `POSITION` | Default zone position (left,top,right,bottom in pixels) |
| `RecogType` | Recognition type (4 = OMR optical mark recognition) |
| `LLMKey` | watsonx.ai LLM prompt label for this field |
| `DICT` | Dictionary name for lookup/validation |
| `Lookup` | SQL lookup query for database validation |
| `Sticky` | Sticky field value (persists across pages) |
| `BarcodeIdentify` | Barcode value that triggers this page type |
| `IsRedaction` | Marks field as a redaction reason code field |
| `ReasonCode` | GUID for IBM Content Navigator redaction reason |
| `MaxLength` | Maximum allowed field value length |
| `length` | Expected field value length |
| `y_tt` | Handprint recognition type (16 = handprint) |
| `min` / `max` | Min/max occurrences of this child type |
| `pos` | Default position index in document |

---

## Choosing a Starting Point

| Your use case | Best starting application |
|---------------|--------------------------|
| Invoice / AP processing | **APT** — most complete production example |
| AI/LLM extraction (watsonx) | **watsonxai** — LLMKey pattern |
| AI extraction + PII redaction | **WatsonaiRedaction** — extends watsonxai |
| Fixed-format forms with OMR | **TravelDocs** or **GoldenDemo** |
| Government / multi-document demo | **GoldenDemo** |
| Veterans / healthcare PII forms | **Vet** |
| Generic barcode-separated docs | **AutomationDocumentProcessing** |
| New application from scratch | **Templates/FormTemplate** or **LearningTemplate** |
