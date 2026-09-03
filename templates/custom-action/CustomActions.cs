// Licensed Materials - Property of IBM
// IBM Datacap 9.1.10 — Custom Action Library Template
// Build with: Visual Studio 2022, .NET Framework 4.x, x86, COM-visible DLL
//
// DEPLOYMENT:
//   1. Build → copy .dll + .rrx to C:\Datacap\<AppName>\dco_<AppName>\rules\
//   2. Register:  regsvr32 CustomActions.dll
//   3. Restart Datacap Studio

using System;
using System.Runtime.InteropServices;
using TDCOLib;       // TDCO.DLL  — DCO object model
using dclogXLib;     // dclogX.DLL — logging

namespace CustomActions
{
    // ─────────────────────────────────────────────────────────────────────────
    // Validation Actions
    // Attach at: Field or Document level (see .rrx for declarations)
    // ─────────────────────────────────────────────────────────────────────────
    [ComVisible(true)]
    [ProgId("CustomActions.ValidationActions")]
    [Guid("A1B2C3D4-0000-0000-0000-000000000001")]   // ← Replace with a real GUID
    [ClassInterface(ClassInterfaceType.None)]
    public class ValidationActions
    {
        // Injected by Rulerunner before each action call
        public IDCO  CurrentDCO { get; set; }
        public IDCO  RootDCO    { get; set; }
        public IDCLog RRLog     { get; set; }

        // ── Action: ValidateRequiredField ─────────────────────────────────────
        // Level: Field
        // Marks the field as SCAN_ERROR if its extracted value is blank.
        public bool ValidateRequiredField()
        {
            try
            {
                if (CurrentDCO.ObjectType() != Level.Field)
                {
                    RRLog.WriteEx(LogLevel.LOG_WARNING,
                        "ValidateRequiredField must run at Field level.");
                    return false;
                }

                string value = (CurrentDCO.Text ?? string.Empty).Trim();
                if (string.IsNullOrEmpty(value))
                {
                    CurrentDCO.Status = (int)DCOStatus.SCAN_ERROR;
                    RRLog.WriteEx(LogLevel.LOG_ERROR,
                        $"[ValidateRequired] Field '{CurrentDCO.ID}' is required but empty.");
                    return false;
                }

                RRLog.WriteEx(LogLevel.LOG_DEBUG,
                    $"[ValidateRequired] '{CurrentDCO.ID}' = '{value}' — OK");
                return true;
            }
            catch (Exception ex)
            {
                RRLog.WriteEx(LogLevel.LOG_ERROR,
                    $"[ValidateRequired] Exception: {ex.Message}");
                return false;
            }
        }

        // ── Action: ValidateDateField ─────────────────────────────────────────
        // Level: Field
        // Validates that the field value parses as a date (dd/MM/yyyy or MM/dd/yyyy).
        public bool ValidateDateField()
        {
            try
            {
                if (CurrentDCO.ObjectType() != Level.Field)
                    return false;

                string raw = (CurrentDCO.Text ?? string.Empty).Trim();
                if (string.IsNullOrEmpty(raw))
                    return true;  // empty is OK (use ValidateRequiredField for mandatory)

                string[] formats = { "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "d/M/yyyy" };
                if (!DateTime.TryParseExact(raw, formats,
                        System.Globalization.CultureInfo.InvariantCulture,
                        System.Globalization.DateTimeStyles.None, out _))
                {
                    CurrentDCO.Status = (int)DCOStatus.SCAN_ERROR;
                    RRLog.WriteEx(LogLevel.LOG_ERROR,
                        $"[ValidateDate] '{CurrentDCO.ID}' value '{raw}' is not a valid date.");
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                RRLog.WriteEx(LogLevel.LOG_ERROR, $"[ValidateDate] Exception: {ex.Message}");
                return false;
            }
        }

        // ── Action: ValidateNumericField ──────────────────────────────────────
        // Level: Field
        // Validates that the field value is a parseable decimal number.
        public bool ValidateNumericField()
        {
            try
            {
                if (CurrentDCO.ObjectType() != Level.Field)
                    return false;

                string raw = (CurrentDCO.Text ?? string.Empty).Trim();
                if (string.IsNullOrEmpty(raw))
                    return true;

                if (!decimal.TryParse(raw, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out _))
                {
                    CurrentDCO.Status = (int)DCOStatus.SCAN_ERROR;
                    RRLog.WriteEx(LogLevel.LOG_ERROR,
                        $"[ValidateNumeric] '{CurrentDCO.ID}' value '{raw}' is not numeric.");
                    return false;
                }
                return true;
            }
            catch (Exception ex)
            {
                RRLog.WriteEx(LogLevel.LOG_ERROR,
                    $"[ValidateNumeric] Exception: {ex.Message}");
                return false;
            }
        }

        // ── Action: LogDocumentFields ─────────────────────────────────────────
        // Level: Document
        // Writes all page/field values to the batch log for debugging.
        public bool LogDocumentFields()
        {
            try
            {
                if (CurrentDCO.ObjectType() != Level.Document)
                {
                    RRLog.WriteEx(LogLevel.LOG_WARNING,
                        "LogDocumentFields must run at Document level.");
                    return false;
                }

                RRLog.WriteEx(LogLevel.LOG_DEBUG,
                    $"[LogFields] Document: {CurrentDCO.ID} ({CurrentDCO.NumOfChildren()} pages)");

                for (int p = 0; p < CurrentDCO.NumOfChildren(); p++)
                {
                    IDCO page = CurrentDCO.GetChild(p);
                    RRLog.WriteEx(LogLevel.LOG_DEBUG,
                        $"  Page[{p}]: {page.ID} ({page.NumOfChildren()} fields)");

                    for (int f = 0; f < page.NumOfChildren(); f++)
                    {
                        IDCO field = page.GetChild(f);
                        RRLog.WriteEx(LogLevel.LOG_DEBUG,
                            $"    {field.ID} = '{field.Text}' (conf={field.Confidence}, status={field.Status})");
                    }
                }
                return true;
            }
            catch (Exception ex)
            {
                RRLog.WriteEx(LogLevel.LOG_ERROR,
                    $"[LogFields] Exception: {ex.Message}");
                return false;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Export Actions
    // ─────────────────────────────────────────────────────────────────────────
    [ComVisible(true)]
    [ProgId("CustomActions.ExportActions")]
    [Guid("A1B2C3D4-0000-0000-0000-000000000002")]   // ← Replace with a real GUID
    [ClassInterface(ClassInterfaceType.None)]
    public class ExportActions
    {
        public IDCO   CurrentDCO { get; set; }
        public IDCO   RootDCO    { get; set; }
        public IDCLog RRLog      { get; set; }

        // ── Action: BuildExportPayload ────────────────────────────────────────
        // Level: Document
        // Reads all fields from the current document and writes a JSON payload
        // to a batch variable for use by downstream export actions.
        public bool BuildExportPayload()
        {
            try
            {
                if (CurrentDCO.ObjectType() != Level.Document)
                    return false;

                var sb = new System.Text.StringBuilder();
                sb.Append("{");
                bool first = true;

                for (int p = 0; p < CurrentDCO.NumOfChildren(); p++)
                {
                    IDCO page = CurrentDCO.GetChild(p);
                    for (int f = 0; f < page.NumOfChildren(); f++)
                    {
                        IDCO field = page.GetChild(f);
                        if (!first) sb.Append(",");
                        string escaped = (field.Text ?? "").Replace("\"", "\\\"");
                        sb.Append($"\"{field.ID}\":\"{escaped}\"");
                        first = false;
                    }
                }
                sb.Append("}");

                string payload = sb.ToString();

                // Store in a batch-level variable for downstream use
                IDCO batch = RootDCO;
                int varIdx = batch.FindVariable("ExportPayload");
                if (varIdx >= 0)
                    batch.SetVariableValue(varIdx, payload);
                else
                    batch.AddVariable("ExportPayload", payload);

                RRLog.WriteEx(LogLevel.LOG_DEBUG,
                    $"[BuildPayload] Payload: {payload}");
                return true;
            }
            catch (Exception ex)
            {
                RRLog.WriteEx(LogLevel.LOG_ERROR,
                    $"[BuildPayload] Exception: {ex.Message}");
                return false;
            }
        }
    }
}
