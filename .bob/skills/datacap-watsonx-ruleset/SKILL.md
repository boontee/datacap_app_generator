---
name: datacap-watsonx-ruleset
description: Use when generating or debugging IBM Datacap watsonx.ai ruleset files (watsonx.ai_PageID.rul, watsonx.ai_Data_Extraction.rul, CreateDocs.rul, ConvertFiles.rul) — covers the exact XML structure, five hard-won generation rules, and transaction-mode gotchas confirmed in live deployment.
---

# Datacap watsonx.ai Ruleset Generation Guide

Follow these rules **without exception** when generating or editing any `.rul` file that
uses `net:watsonx_ai.Actions` actions in an IBM Datacap 9.1.10 application.

---

## Rule 1 — `watsonx.ai_PageID.rul`: NO `dcomap.open` on the rule element

**The single most commonly regenerated bug.** The `<rule>` element must have only `qi=""`.

```xml
<!-- CORRECT -->
<rule name="Other Rule" id="1" qi="">

<!-- WRONG — pages start as "Other" so this NEVER fires -->
<rule name="Other Rule" id="1" qi="" dcomap.open="P">
```

**Why:** Without `dcomap.open`, the RRS engine infers the map as `P:Other` — exactly the
type every unclassified page has. Adding `dcomap.open="P"` restricts the rule to pages
whose type already matches a named type, so unclassified pages always skip it.

**Contrast:** `watsonx.ai_Data_Extraction.rul` **must** use `dcomap.open="P:<TypeName>"`
so it fires **only** on already-classified pages. The two rulesets have opposite requirements.

---

## Rule 2 — Every LLM-calling task repeats the 5-action setup block

The `watsonx_ai.dll` stores endpoint URL, model, project ID, and API key in process-local
memory. Datacap spawns a **new RRS process** for each task profile execution. Whatever
PageID configured is invisible to the extraction task.

Every function that calls any `net:watsonx_ai.Actions` action must start with:

```xml
<a ns="net:watsonx_ai.Actions" name="SetEndpointURL">
  <p name="LLMURL" type="string" v="https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29"/>
</a>
<a ns="net:watsonx_ai.Actions" name="SetModel">
  <p name="Model" type="string" v="meta-llama/llama-3-3-70b-instruct"/>
</a>
<a ns="net:watsonx_ai.Actions" name="SetProjectID">
  <p name="NewProjectID" type="string" v="<projectGuid>"/>
</a>
<a ns="net:watsonx_ai.Actions" name="SetAPIKey">
  <p name="APIKey" type="string" v="@APPVAR(values/adv/watsonkey)"/>
</a>
<a ns="net:watsonx_ai.Actions" name="SetEnhancedLogging">
  <p name="Enabled" type="string" v="1"/>
</a>
```

This applies to **both** `watsonx.ai_PageID.rul` and `watsonx.ai_Data_Extraction.rul`.
Omitting it from the extraction ruleset causes silent failure — no error, no response.

---

## Rule 3 — `AskAQuestionUsingPageText`: always `Format=""` (never `"1"`)

| Value | Reads from | Works in batch? | Works in transaction? |
|-------|-----------|----------------|----------------------|
| `""` (empty) | `.txt` file written by `CreateTextFile` | ✅ | ✅ |
| `"1"` | In-memory CCO word map | ✅ | ❌ |

**Always generate `Format=""`.**

```xml
<a ns="net:watsonx_ai.Actions" name="AskAQuestionUsingPageText">
  <p name="Question" type="string" v="Classify the text..."/>
  <p name="Target"   type="string" v="@X.LLMPageType"/>
  <p name="Format"   type="string" v=""/>   <!-- ← empty, never "1" -->
</a>
```

`CreateTextFile` in the "Recognize Page" function must precede the LLM call in the same rule.

---

## Rule 4 — `ConvertFiles.rul`: enable the `SplitMultipageTiff` guard

`SplitMultipageTiff` aborts when fed a single-page TIFF if the `CheckDCOStatus` guard that
would skip it is disabled. This crashes the entire `WebTransaction` pipeline (Status 1, no
classification) even before PageID runs.

Enable **only the guard in the "Multipage TIFF Expansion" function**:

```xml
<func name="Multipage TIFF Expansion" disabled="False" rem="Split Multipage tiffs">
  <a ns="com:Datacap.Libraries.ApplicationObjects.Actions" name="CheckDCOStatus" disabled="False">
    <p name="ExpectedStatus" v="49"/>
  </a>
  <a name="SplitMultipageTiff" ns="com:Datacap.Libraries.Convert.Tiff=Datacap.Libraries.Convert.Tiff"/>
  ...
</func>
```

All other `CheckDCOStatus` actions in `ConvertFiles.rul` can remain `disabled="True"`.

---

## Rule 5 — `@X.` DCO variables in transaction mode

`@X.LLMPageType` is set correctly during RRS execution (confirmed by batch-mode RRS logs:
`Setting 'TM000001.LLMPageType' value to 'Invoice'`), but in transaction mode the `@X.`
page-level variable is **not serialised back** into the returned `VScan.xml`.

**Consequence:** When testing classification success via `transaction-run` or
`transaction-get-file`, do **not** check `LLMPageType` — check the `TYPE` field on `<P>`:

```xml
<P id="tm000001">
  <V n="TYPE">Invoice</V>   ← this is set by SetPageType and IS returned
  ...
</P>
```

`TYPE != "Other"` = classification succeeded.  `TYPE = "Other"` = classification failed or
did not run.

---

## Canonical `watsonx.ai_PageID.rul` Structure

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ruleset id="4" name="watsonx.ai_PageID" ver="1" modder="admin.1" qi="">
  <rule name="Other Rule" id="1" qi="">                  <!-- NO dcomap.open -->
    <func name="Recognize Page" qi="">
      <a ns="net:SharedRecognitionTools.Actions" name="SetMaxCharacterHeightTMM">
        <p name="MaxHeightTMM" type="string" v="0"/>
      </a>
      <a ns="net:SharedRecognitionTools.Actions" name="SetMaxCharacterHeightAVG" qi="">
        <p name="AVG" type="string" v="0"/>
      </a>
      <a name="Recognize"          ns="net:RecognitionOCRA.OCRAActions"/>
      <a name="CreateCcoFromLayout" ns="net:SharedRecognitionTools.Actions" qi=""/>
      <a name="NormalizeCCO"        ns="net:SharedRecognitionTools.Actions" qi=""/>
      <a name="CreateTextFile"      ns="net:SharedRecognitionTools.Actions" qi=""/>
      <a name="GoToNextFunction"    ns="com:Datacap.Libraries.RuleRunnerLogic.Actions" qi=""/>
    </func>
    <func name="Classify With Watson" qi="">
      <!-- RULE 2: full setup block required -->
      <a ns="net:watsonx_ai.Actions" name="SetEndpointURL" qi="">
        <p name="LLMURL" type="string" v="https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetModel" qi="">
        <p name="Model" type="string" v="meta-llama/llama-3-3-70b-instruct"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetProjectID" qi="">
        <p name="NewProjectID" type="string" v="<projectGuid>"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetAPIKey" qi="">
        <p name="APIKey" type="string" v="@APPVAR(values/adv/watsonkey)"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetEnhancedLogging" qi="">
        <p name="Enabled" type="string" v="1"/>
      </a>
      <a ns="net:watsonx_ai.Actions" name="SetMaximumNewTokens" qi="">
        <p name="MaximumNewTokens" type="string" v="4096"/>
      </a>
      <!-- RULE 3: Format="" always -->
      <a ns="net:watsonx_ai.Actions" name="AskAQuestionUsingPageText" qi="">
        <p name="Question" type="string" v="Classify the text in this document. The returned page classification must be exactly one of the following: &quot;TypeName1&quot;, &quot;TypeName2&quot;, &quot;Unknown&quot;. Only respond with the exact answer."/>
        <p name="Target"   type="string" v="@X.LLMPageType"/>
        <p name="Format"   type="string" v=""/>
      </a>
      <a name="GoToNextFunction" ns="com:Datacap.Libraries.RuleRunnerLogic.Actions" qi=""/>
    </func>
    <!-- One func per page type -->
    <func name="Test For TypeName1" qi="">
      <a ns="com:Datacap.Libraries.ValidationsAndTextAdjustments.Actions" name="IsValueInText">
        <p name="Target"        type="string" v="@X.LLMPageType"/>
        <p name="Value"         type="string" v="TypeName1"/>
        <p name="CaseSensitive" type="string" v="False"/>
      </a>
      <a ns="com:Datacap.Libraries.ApplicationObjects.Actions" name="SetPageType" qi="">
        <p name="Type" type="string" v="TypeName1"/>
      </a>
    </func>
  </rule>
</ruleset>
```

---

## Canonical `collection.xml` WebTransaction Profile

```xml
<tprofile name="WebTransaction">
  <ruleset id="6"/>    <!-- ConvertFiles     — id must match <ruleset id="6"> in <rsc> -->
  <ruleset id="4"/>    <!-- watsonx.ai_PageID -->
  <ruleset id="9"/>    <!-- CreateDocs        -->
  <ruleset id="3"/>    <!-- watsonx.ai_Data_Extraction -->
</tprofile>
```

**DLL rulesets** (`ImageEnhancement`, `CreateDocuments`) must **not** be passed to
`Transaction/Execute` by their display name. They use a different invocation path and
the endpoint rejects them with `"name=ImageEnhancement"` errors.

---

## Quick Diagnostic Checklist

When a watsonx.ai transaction returns `TYPE=Other` despite Status 0:

1. **Check ConvertFiles** — Did SplitMultipageTiff abort? Look for `SplitPageCount` missing from result XML. Fix: Rule 4.
2. **Check dcomap.open** — Is `dcomap.open="P"` present on the PageID rule? Fix: Rule 1.
3. **Check Format** — Is `Format="1"` in `AskAQuestionUsingPageText`? Fix: Rule 3.
4. **Check LLM setup** — Is the 5-action block present in the PageID function? Fix: Rule 2.
5. **Check classifyPrompt** — Does it list all page type names? Fix: add missing type names.
6. **Check @X. vs TYPE** — Are you reading `LLMPageType` from VScan.xml? Use `TYPE` instead. Fix: Rule 5.
