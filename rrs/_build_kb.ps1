function Get-NodeText($node) {
    if (-not $node) { return "" }
    if ($node -is [System.Xml.XmlElement]) { return $node.InnerText }
    return [string]$node
}

function Strip-Xml($text) {
    if (-not $text) { return "" }
    $text = $text -replace '<[^>]+>', ' '
    $text = $text -replace '&lt;', '<'
    $text = $text -replace '&gt;', '>'
    $text = $text -replace '&amp;', '&'
    $text = $text -replace '\s+', ' '
    return $text.Trim()
}

function Clean-Node($node) {
    return Strip-Xml(Get-NodeText($node))
}

$rrxFiles = Get-ChildItem -Path ".\rrs" -Filter "*.rrx" | Sort-Object Name
$allLibs = @()

foreach ($file in $rrxFiles) {
    try {
        [xml]$xml = Get-Content $file.FullName -Encoding UTF8
        $ns = $xml.rrx.namespace
        $ver = $xml.rrx.v
        $coms = @($xml.rrx.com)
        foreach ($com in $coms) {
            $comRef = $com.ref
            if (-not $comRef) { continue }
            $comQi = (Strip-Xml(Get-NodeText($com.qi))).TrimStart(": ")
            $methods = @($com.method)
            $actionList = @()
            foreach ($m in $methods) {
                if (-not $m.name) { continue }
                $params = @($m.p) | Where-Object { $_ -is [System.Xml.XmlElement] -and $_.name } | ForEach-Object {
                    $pQi = Strip-Xml($_.qi)
                    if ($pQi) { "$($_.name): $pQi" } else { $_.name }
                }
                $lvl     = Clean-Node($m.lvl)
                $ret     = Clean-Node($m.ret)
                $qi      = (Strip-Xml(Get-NodeText($m.qi))).TrimStart(": ")
                $ap      = Clean-Node($m.ap)
                $example = ""
                $hNode   = $m.h
                if ($hNode -is [System.Xml.XmlElement]) {
                    $hXml = $hNode.InnerXml
                    if ($hXml -match '<e>(.*?)</e>') {
                        $example = Strip-Xml($Matches[1])
                    }
                }
                $actionList += [PSCustomObject]@{
                    Name       = $m.name
                    QuickInfo  = $qi
                    Params     = if($params){ ($params -join "; ") } else { "" }
                    SmartParam = if($ap -and $ap -notmatch "^None") { "Yes" } else { "" }
                    Level      = $lvl
                    Returns    = $ret
                    Example    = $example
                }
            }
            $allLibs += [PSCustomObject]@{
                File        = $file.Name
                Namespace   = $ns
                Version     = $ver
                ComRef      = $comRef
                Description = $comQi
                Actions     = $actionList
            }
        }
    } catch {
        Write-Host "ERROR $($file.Name): $($_.Exception.Message)"
    }
}

$fence = '```'
$lines = [System.Collections.Generic.List[string]]::new()

$lines.Add("# Datacap Action Library Knowledge Base")
$lines.Add("")
$lines.Add("> **Purpose**: Validate Datacap actions used in application rulesets and generate new Datacap applications.")
$lines.Add("> Extracted from IBM Datacap 9.1.10 RRX action library documentation files.")
$lines.Add("> Use this file to verify action names, parameters, levels, and return values when writing or reviewing ruleset logic.")
$lines.Add("")
$lines.Add("---")
$lines.Add("")
$lines.Add("## Table of Contents")
$lines.Add("")

$libGroups = $allLibs | Group-Object Namespace
foreach ($grp in ($libGroups | Sort-Object Name)) {
    $ns = $grp.Name
    if (-not $ns) { continue }
    $anchor = $ns.ToLower() -replace '[^a-z0-9]', '-'
    $totalActions = ($grp.Group | ForEach-Object { @($_.Actions).Count } | Measure-Object -Sum).Sum
    $lines.Add("- [$ns](#$anchor) - $totalActions actions")
}

$lines.Add("")
$lines.Add("---")
$lines.Add("")
$lines.Add("## Datacap Ruleset Design Reference")
$lines.Add("")
$lines.Add("### DCO Hierarchy")
$lines.Add("")
$lines.Add($fence)
$lines.Add("Batch")
$lines.Add("  Document")
$lines.Add("    Page")
$lines.Add("      Field")
$lines.Add("        LineItem (child Field)")
$lines.Add($fence)
$lines.Add("")
$lines.Add("### Ruleset Structure")
$lines.Add("")
$lines.Add($fence)
$lines.Add("Ruleset")
$lines.Add("  Rule  (attached to a DCO object: Batch / Document / Page / Field)")
$lines.Add("    Function  (runs if previous Function returned false)")
$lines.Add("      Action  (runs in sequence; stops function if it returns false)")
$lines.Add($fence)
$lines.Add("")
$lines.Add("### Action Return Value Semantics")
$lines.Add("")
$lines.Add("| Return | Effect |")
$lines.Add("|--------|--------|")
$lines.Add("| True | Next action in function runs |")
$lines.Add("| False | Current function stops; next Function in the rule is tried |")
$lines.Add("| Last action True | Rule succeeds; ruleset marked successful |")
$lines.Add("| No remaining Function | Rule fails; ruleset marked failed |")
$lines.Add("")
$lines.Add("### Common Smart Parameter Tokens")
$lines.Add("")
$lines.Add("| Token | Meaning |")
$lines.Add("|-------|---------|")
$lines.Add("| @X | Current DCO object (Text value by default) |")
$lines.Add("| @P | Parent DCO object |")
$lines.Add("| @B | Batch object |")
$lines.Add("| @D | Document object |")
$lines.Add("| @APPPATH(subdir) | Path relative to application directory |")
$lines.Add("| @P.FieldName | Named field on the parent object |")
$lines.Add("")
$lines.Add("### Action Level Reference")
$lines.Add("")
$lines.Add("| Level | Attach Rule To |")
$lines.Add("|-------|---------------|")
$lines.Add("| Batch level | Batch object |")
$lines.Add("| Document level | Document object |")
$lines.Add("| Page level | Page object |")
$lines.Add("| Field level | Field object |")
$lines.Add("")
$lines.Add("---")
$lines.Add("")

foreach ($grp in ($libGroups | Sort-Object Name)) {
    $ns = $grp.Name
    if (-not $ns) { continue }
    $libs = $grp.Group
    $first = $libs[0]
    $lines.Add("## $ns")
    $lines.Add("")
    $lines.Add("**File**: $($first.File)  ")
    $lines.Add("**Version**: $($first.Version)  ")
    $refs = ($libs | ForEach-Object { $_.ComRef } | Where-Object { $_ }) -join ", "
    $lines.Add("**Assembly**: $refs  ")
    $desc = ($libs | ForEach-Object { $_.Description } | Where-Object { $_ }) | Select-Object -First 1
    if ($desc) { $lines.Add("**Description**: $desc") }
    $lines.Add("")
    $allActions = @($libs | ForEach-Object { $_.Actions })
    if (-not $allActions -or $allActions.Count -eq 0) {
        $lines.Add("_No documented actions._")
        $lines.Add("")
        $lines.Add("---")
        $lines.Add("")
        continue
    }
    $lines.Add("### Actions")
    $lines.Add("")
    foreach ($action in $allActions) {
        if (-not $action.Name) { continue }
        $lines.Add("#### $($action.Name)")
        if ($action.QuickInfo) {
            $lines.Add("")
            $lines.Add($action.QuickInfo)
        }
        $lines.Add("")
        if ($action.Level)      { $lines.Add("**Level**: $($action.Level)  ") }
        if ($action.Returns)    { $lines.Add("**Returns**: $($action.Returns)  ") }
        if ($action.SmartParam -eq "Yes") { $lines.Add("**Smart Parameters**: Supported  ") }
        if ($action.Params) {
            $lines.Add("")
            $lines.Add("**Parameters**:")
            foreach ($p in ($action.Params -split "; ")) { $lines.Add("- $p") }
        } else {
            $lines.Add("")
            $lines.Add("**Parameters**: None")
        }
        if ($action.Example) {
            $lines.Add("")
            $lines.Add("**Example**:")
            $lines.Add($fence)
            $lines.Add($action.Example)
            $lines.Add($fence)
        }
        $lines.Add("")
    }
    $lines.Add("---")
    $lines.Add("")
}

$lines.Add("## Ruleset Validation Checklist")
$lines.Add("")
$lines.Add("Use this checklist when reviewing a Datacap application's rulesets:")
$lines.Add("")
$lines.Add("- [ ] Every action name matches an entry in this knowledge base")
$lines.Add("- [ ] Action is applied at the correct DCO level (Batch/Document/Page/Field)")
$lines.Add("- [ ] Required parameters are provided and correctly typed")
$lines.Add("- [ ] Smart parameter tokens (@X, @P, @B, @D) are used at valid levels")
$lines.Add("- [ ] GoToNextFunction is used correctly to force function transitions")
$lines.Add("- [ ] Validation actions set status to 0/1 and populate the Message variable")
$lines.Add("- [ ] Export actions run at Batch or Document level, not Page level")
$lines.Add("- [ ] OCR/fingerprint rulesets run before validation rulesets in the task profile")
$lines.Add("- [ ] LineItem fields use supported LineItem actions, not plain field actions")
$lines.Add("- [ ] SetDirectoryFPX and ReadZonesFPX precede any OCR recognition actions")
$lines.Add("")
$lines.Add("---")
$lines.Add("")
$lines.Add("## Quick-Reference: Actions by Category")
$lines.Add("")
$lines.Add("| Category | Library | Key Actions |")
$lines.Add("|----------|---------|-------------|")
$lines.Add("| Flow control | RuleRunnerLogic | rrSet, rrGet, GoToNextFunction, rrIf, rrLoop |")
$lines.Add("| DCO manipulation | ApplicationObjects | SetStatus, SetValue, CreateDocument, DeletePage |")
$lines.Add("| OCR / recognition | ocr_sr | RecognizePageFieldsOCR_A, RecognizeField |")
$lines.Add("| Fingerprinting | AutomaticDocumentFingerprinting | MatchFingerprintFPX, ReadZonesFPX, SetDirectoryFPX |")
$lines.Add("| Zones and line items | ZonesAndLineItems | CopyZone, CreateLineitem, SetZone |")
$lines.Add("| Validation | ValidationsAndTextAdjustments | IsDate, IsNumeric, IsTextLength, IsRequired |")
$lines.Add("| File conversion | Convert | PDFFREDocumentToImage, ConvertFiles |")
$lines.Add("| Export | ExportToDatabase, ExportToXML, ExportToText | ExportToDatabase, ExportXML, ExportToText |")
$lines.Add("| Image processing | ImageUtilities, DCImageFix | RotateImage, DeskewImage |")
$lines.Add("| Barcode | Barcode | ReadBarcode1D, ReadBarcode2D |")
$lines.Add("| Email import | Ewsmail, Imail, Email.MSGraph | GetMailMessages, AttachmentToImage |")
$lines.Add("| File I/O | FileIO | CopyFile, MoveFile, DeleteFile |")
$lines.Add("| IBM FileNet P8 | IBMFileNetP8 | CheckInDocument, CheckOutDocument |")
$lines.Add("| Logging | Nenu | LogMessage, WriteToLog |")
$lines.Add("| Batch split | SplitBatch | SplitBatch |")
$lines.Add("")
$lines.Add("---")
$lines.Add("")
$lines.Add("*Generated from IBM Datacap 9.1.10 RRX action library files. $(Get-Date -Format 'yyyy-MM-dd')*")

$lines | Set-Content ".\knowledge-base\datacap_actions_kb.md" -Encoding UTF8
Write-Host "Written $($lines.Count) lines to knowledge-base\datacap_actions_kb.md"

