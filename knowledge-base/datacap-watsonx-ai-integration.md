# IBM Datacap — watsonx.ai Integration Patterns

> Applies to **IBM Datacap 9.1.10** with the **`watsonx_ai`** action library  
> Source reference: installed sample apps `watsonxai` and `WatsonaiRedaction` at `C:\Datacap\`

---

## Overview

The `watsonx_ai` action library (`net:watsonx_ai.Actions`) connects a Datacap Rulerunner task
directly to an IBM watsonx.ai LLM endpoint.  It sends page text (from OCR output) as part of a
prompt and writes the model response into DCO fields or batch variables.

Two primary use cases are supported and demonstrated by the installed sample apps:

| Use Case | Sample App | Description |
|----------|-----------|-------------|
| **Classification (PageID)** | `watsonxai` | Ask the model to classify a page; map the text response to a `SetPageType` call |
| **KVP Extraction** | `watsonxai`, `WatsonaiRedaction` | Ask the model to extract field values by key; auto-populate fields via `LLMKey` |
| **Redaction support** | `WatsonaiRedaction` | Ask the model to return comma-separated named entities; post-process into redaction fields |
| **Free-form Q&A** | `watsonxai` | Ask any question about the page; write the answer to any DCO variable |

> **No fingerprints required for classification.** The LLM can classify document types from
> page text alone — setup takes minutes instead of the hours needed to create fingerprint templates.

---

## Prerequisites

1. An **IBM watsonx.ai** account (free tier available at <https://www.ibm.com/products/watsonx-ai>)
2. A **Project ID** associated with a watsonx.ai service instance
3. An **API key** for authentication
4. The `watsonx_ai` action library DLL present in the Rulerunner environment
   (`C:\Datacap\RRS\watsonx_ai.Rul.dll` or equivalent)

---

## Action Library Namespace

All actions use the namespace `net:watsonx_ai.Actions` in `.rul` XML files.

---

## Core Actions Reference

### Configuration Actions (call once per function, before the query actions)

| Action | Key Parameter | Notes |
|--------|--------------|-------|
| `SetEndpointURL` | `LLMURL` | Default: `https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29` |
| `SetModel` | `Model` | Model ID string, e.g. `mistralai/mistral-small-3-1-24b-instruct-2503` |
| `SetProjectID` | `NewProjectID` | Smart parameters supported: `@APPVAR(values/gen/Project_Id)` |
| `SetAPIKey` | `APIKey` | Smart parameters supported: `@APPVAR(values/gen/APIKey)` |
| `SetMaximumNewTokens` | `MaximumNewTokens` | Set to the model's maximum (e.g. `4096`). Match to selected model. |
| `SetEnhancedLogging` | `Enabled` | `1` = on, `0` = off. Writes prompt/response detail to the RRS log. |

### Query Actions

| Action | Key Parameters | Description |
|--------|---------------|-------------|
| `AskAQuestionUsingPageText` | `Question`, `Target`, `Format` | Sends OCR page text + question to the model; writes response to `Target` DCO path |
| `AskAFreeFormQuestion` | `Question`, `Target`, `Format` | Sends question only (no page text); writes response to `Target` |
| `AskForPageValuesUsingKeys` | `Question`, `Format` | Reads `LLMKey` attribute from all fields on the current page; sends a single structured prompt; populates all fields automatically |

**`Target` parameter** accepts any smart parameter expression:
- `@X.MyBatchVar` — batch-level variable
- `@P\FieldName` — field on the current page
- A plain field name relative to current page context (e.g. `Names`)

**`Format` parameter** controls how OCR text is formatted in the prompt:
- `""` (empty) — default text format
- `"1"` — structured layout format (better for KVP extraction from tabular documents)
- `"False"` — disable page text inclusion (for free-form prompts)

---

## Pattern 1 — LLM-Based Page Classification

Replace or supplement fingerprint-based PageID with zero-shot LLM classification.

### Workflow Position

Runs inside the **PageID** task profile, after OCR recognition (`Recognize` action) and CCO
creation (`CreateCcoFromLayout`, `NormalizeCCO`, `CreateTextFile`).

### Ruleset Structure

```xml
<ruleset name="watsonx.ai_PageID">
  <rule name="Other Rule">

    <!-- Function 1: OCR the page -->
    <func name="Recognize Page">
      <a ns="net:RecognitionOCRPL.OCRPActions" name="Recognize"/>
      <a ns="net:SharedRecognitionTools.Actions" name="CreateCcoFromLayout"/>
      <a ns="net:SharedRecognitionTools.Actions" name="NormalizeCCO"/>
      <a ns="net:SharedRecognitionTools.Actions" name="CreateTextFile"/>
      <a ns="com:Datacap.Libraries.RuleRunnerLogic.Actions" name="GoToNextFunction"/>
    </func>

    <!-- Function 2: Ask the model to classify -->
    <func name="Classify With Watson">
      <a ns="net:watsonx_ai.Actions" name="SetEndpointURL">
        <p name="LLMURL" type="string"
           v="https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetModel">
        <p name="Model" type="string" v="mistralai/mistral-small-3-1-24b-instruct-2503"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetProjectID">
        <p name="NewProjectID" type="string" v="@APPVAR(values/gen/Project_Id)"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetAPIKey">
        <p name="APIKey" type="string" v="@APPVAR(values/gen/APIKey)"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetMaximumNewTokens">
        <p name="MaximumNewTokens" type="string" v="4096"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="AskAQuestionUsingPageText">
        <p name="Question" type="string"
           v="Classify the text in this document. The returned page classification must be
              exactly one of the following: &quot;Invoice&quot;, &quot;PurchaseOrder&quot;,
              &quot;Unknown&quot;. Only respond with the exact answer."/>
        <p name="Target" type="string" v="@X.LLMPageType"/>
        <p name="Format" type="string" v=""/>
      </a>
      <a ns="com:Datacap.Libraries.RuleRunnerLogic.Actions" name="GoToNextFunction"/>
    </func>

    <!-- Function 3+: Test each classification and call SetPageType -->
    <func name="Test For Invoice">
      <a ns="com:Datacap.Libraries.ValidationsAndTextAdjustments.Actions" name="IsValueInText">
        <p name="Target" type="string" v="@X.LLMPageType"/>
        <p name="Value"  type="string" v="Invoice"/>
        <p name="CaseSensitive" type="string" v="False"/>
      </a>
      <a ns="com:Datacap.Libraries.ApplicationObjects.Actions" name="SetPageType">
        <p name="Type" type="string" v="Invoice"/>
      </a>
    </func>

    <func name="Test For PurchaseOrder">
      <a ns="com:Datacap.Libraries.ValidationsAndTextAdjustments.Actions" name="IsValueInText">
        <p name="Target" type="string" v="@X.LLMPageType"/>
        <p name="Value"  type="string" v="PurchaseOrder"/>
        <p name="CaseSensitive" type="string" v="False"/>
      </a>
      <a ns="com:Datacap.Libraries.ApplicationObjects.Actions" name="SetPageType">
        <p name="Type" type="string" v="PurchaseOrder"/>
      </a>
    </func>

  </rule>
</ruleset>
```

### Key Points

- The question must enumerate **every valid page type** as a constrained list — this limits
  hallucination and makes downstream `IsValueInText` mapping reliable.
- Use `@X.LLMPageType` (batch-level variable) to hold the raw model response between functions.
- A separate `<func>` per document type is the standard pattern — it matches the way the
  `watsonxai` sample app works and is easier to extend.
- Pages that do not match any test function remain as `Other` — ensure an `Other` page type
  exists in the SetupDCO XML to handle unclassified pages.

---

## Pattern 2 — LLM-Based KVP Extraction (Automatic via LLMKey)

The `AskForPageValuesUsingKeys` action reads the `LLMKey` variable from every field on the
current page in SetupDCO XML, constructs a single structured prompt, calls the model once, and
writes the values back to the matching fields automatically.

### SetupDCO XML — LLMKey Configuration

Each extractable field must carry a `<V n="LLMKey">` element:

```xml
<F type="InvoiceNumber">
  <V n="LLMKey">Invoice Number</V>
  <V n="rules"><![CDATA[<in /><out />]]></V>
</F>
<F type="VendorName">
  <V n="LLMKey">Vendor Name</V>
  <V n="rules"><![CDATA[<in /><out />]]></V>
</F>
<F type="TotalAmount">
  <V n="LLMKey">Total Amount Due</V>
  <V n="rules"><![CDATA[<in /><out />]]></V>
</F>
```

The `LLMKey` value is the **natural-language label** the model is asked to find. Use clear,
unambiguous labels that match typical document terminology.

### Extraction Ruleset Structure

```xml
<ruleset name="watsonx.ai_Data_Extraction">
  <rule name="PageRule">

    <func name="Extract Values">
      <!-- Clear the saved LLM JSON before extracting -->
      <a ns="com:Datacap.Libraries.RuleRunnerLogic.Actions" name="rrSet">
        <p name="Source" type="string" v="-Extract"/>
        <p name="Target" type="string" v="@X.SaveLLMjson"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetMaximumNewTokens">
        <p name="MaximumNewTokens" type="string" v="4096"/>
      </a>
      <!-- Single action populates all fields with LLMKey attributes -->
      <a ns="net:watsonx_ai.Actions" name="AskForPageValuesUsingKeys">
        <p name="Question" type="string" v=""/>
        <p name="Format"   type="string" v="1"/>
      </a>
      <a ns="com:Datacap.Libraries.RuleRunnerLogic.Actions" name="GoToNextFunction"/>
    </func>

    <func name="Stop">
      <a ns="com:Datacap.Libraries.RuleRunnerLogic.Actions" name="SetReturnValue">
        <p name="ReturnValue" type="string" v="true"/>
      </a>
    </func>

  </rule>
</ruleset>
```

### Key Points

- The `rrSet` action with `Source="-Extract"` clears the saved JSON state from any prior page —
  always include it at the start of the extraction function.
- The `Format="1"` parameter sends text in a structured layout that improves KVP accuracy for
  tabular documents (invoices, statements).
- The model is called **once per page** regardless of how many fields have `LLMKey` — this is
  efficient compared to calling `AskAQuestionUsingPageText` per field.
- Fields without an `LLMKey` value are skipped by this action.

---

## Pattern 3 — Free-Form Question per Field

Use `AskAQuestionUsingPageText` when a specific field needs a targeted question rather than
the automatic key-based approach.

```xml
<func name="Ask Question">
  <a ns="net:watsonx_ai.Actions" name="SetMaximumNewTokens">
    <p name="MaximumNewTokens" type="string" v="4096"/>
  </a>
  <a ns="net:watsonx_ai.Actions" name="AskAQuestionUsingPageText">
    <p name="Question" type="string"
       v="What is the invoice number? Provide only the value, no explanation."/>
    <p name="Target"   type="string" v="@P\InvoiceNumber"/>
    <p name="Format"   type="string" v=""/>
  </a>
  <a ns="com:Datacap.Libraries.RuleRunnerLogic.Actions" name="GoToNextFunction"/>
</func>
```

Use this pattern when:
- A field requires domain-specific phrasing that `LLMKey` cannot express concisely.
- You need a different model or token limit for one field.
- You are extracting from a section of the page that benefits from a targeted question.

---

## Pattern 4 — Redaction (WatsonaiRedaction Pattern)

Ask the model to identify named entities; split the comma-separated response into individual
redaction fields (`Name0`–`Name9`).

### SetupDCO Fields

```xml
<P type="Medical">
  <F type="Names"  pos="0" min="0" max="0"/>   <!-- raw comma-separated response -->
  <F type="Name0"  pos="0" min="0" max="0"/>
  <F type="Name1"  pos="0" min="0" max="0"/>
  <!-- ... up to Name9 -->
</P>
```

Each `Name0`–`Name9` field drives a separate redaction rule to redact the matched value on the
page image.

### Extraction Ruleset

```xml
<func name="Extract Names for Redaction">
  <a ns="com:Datacap.Libraries.ApplicationObjects.Actions" name="CheckDCOType">
    <p name="ExpectedType" v="Medical"/>
  </a>
  <a ns="net:watsonx_ai.Actions" name="SetModel">
    <p name="Model" type="string" v="mistralai/mistral-small-3-1-24b-instruct-2503"/>
  </a>
  <a ns="com:Datacap.Libraries.RuleRunnerLogic.Actions" name="rrSet">
    <p name="Source" type="string" v="-Extract"/>
    <p name="Target" type="string" v="@X.SaveLLMjson"/>
  </a>
  <a ns="net:watsonx_ai.Actions" name="SetMaximumNewTokens">
    <p name="MaximumNewTokens" type="string" v="4096"/>
  </a>
  <a ns="net:watsonx_ai.Actions" name="AskAQuestionUsingPageText">
    <p name="Question" type="string"
       v="From the text, return only the human names in a comma-separated list,
          without explanation:"/>
    <p name="Target"   type="string" v="Names"/>
    <p name="Format"   type="string" v="False"/>
  </a>
</func>
```

- `CheckDCOType` gates the function so it only runs on the target document type.
- The raw comma-separated list is written to `Names`; downstream rules split it into `Name0`–`Name9`.

---

## Credential Storage Best Practice

Never hard-code API keys or Project IDs in `.rul` files. Store them in the `.app` file under
the `values` section and retrieve with `@APPVAR`:

```xml
<!-- In <AppName>.app -->
<k name="values">
  <k name="gen">
    <k name="Project_Id" v="[encoded]...YOUR-PROJECT-ID...[/encoded]"/>
    <k name="APIKey"     v="[encoded]...YOUR-API-KEY...[/encoded]"/>
  </k>
  <k name="adv">
    <k name="watsonkey" v="[secured]...ENCRYPTED...[/secured]"/>
  </k>
</k>
```

Reference in rules:
```
v="@APPVAR(values/gen/Project_Id)"
v="@APPVAR(values/gen/APIKey)"
```

Use the Datacap Application Manager GUI to set these values — it will encrypt them
automatically as `[encoded]` or `[secured]` blocks.

---

## collection.xml Registration

The `watsonx_ai` rulesets are plain `.rul` files — register them exactly like any other ruleset.
No special `name.dll` attribute is needed.

```xml
<rsapp name="<AppName>">
  <rsc>
    <!-- Standard infrastructure rulesets -->
    <ruleset name.dll="CreateDocuments"    id="CreateDocuments"    depends=""/>
    <ruleset name.dll="Image_Convert"      id="Image_Convert"      depends=""/>
    <ruleset name.dll="IdentifyPages"      id="IdentifyPages"      depends=""/>
    <!-- watsonx.ai rulesets -->
    <ruleset id="4" name="watsonx.ai_PageID"          depends=""/>
    <ruleset id="3" name="watsonx.ai_Data_Extraction" depends=""/>
    <!-- Other rulesets -->
    <ruleset name.dll="ValidateFields"     id="ValidateFields"     depends=""/>
    <ruleset id="7" name="Export"                       depends=""/>
  </rsc>
  <tps>
    <tprofile name="PageID">
      <ruleset id="Image_Convert"/>
      <ruleset id="4"/>               <!-- classification -->
      <ruleset id="CreateDocuments"/>
      <ruleset id="3"/>               <!-- KVP extraction -->
    </tprofile>
    <tprofile name="Validate">
      <ruleset id="ValidateFields"/>
    </tprofile>
    <tprofile name="Export">
      <ruleset id="7"/>
    </tprofile>
  </tps>
</rsapp>
```

> In the `watsonxai` sample app, **classification and extraction both run inside the PageID
> task profile** — there is no separate Extraction task. This keeps the batch flow minimal:
> `VScan → PageID (OCR + classify + extract) → Export`.

---

## Model Selection Notes

| Model | Notes |
|-------|-------|
| `mistralai/mistral-small-3-1-24b-instruct-2503` | Used in both sample apps; good balance of speed and accuracy |
| `meta-llama/meta-llama-3-70b-instruct` | Higher accuracy; higher token cost |
| `google/flan-ul2` | Older model; shown in disabled example functions in sample apps |

- Always set `SetMaximumNewTokens` to the model's documented maximum — the action requires it.
- The `SetModel` action is optional if the project default model is acceptable.
- Use `SetEnhancedLogging(Enabled=1)` during development to see the full prompt and response in
  the Rulerunner log.

---

## Mixing LLM and Traditional Techniques

You do not have to choose between LLM and traditional Datacap techniques exclusively:

| Approach | When to use |
|----------|------------|
| LLM classification + LLM extraction | Highly variable documents with no fixed layout |
| LLM classification + fingerprint zones | Mixed: fast LLM classify, precise zone OCR for extraction |
| Fingerprint classification + LLM extraction | Templates exist but fields are unpredictable in position |
| Fingerprint classification + traditional Locate/regex | Structured forms; maximum determinism, no API dependency |

The `watsonxai` sample app's readme explicitly notes: _"An application could use traditional
fingerprints for classification and use metadata extraction with watsonx.ai. Conversely,
an application could use watsonx.ai for classification and then perform metadata extraction
with traditional Datacap techniques."_
