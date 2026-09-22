# Datacap Action Library Knowledge Base

> **Purpose**: Validate Datacap actions used in application rulesets and generate new Datacap applications.
> Extracted from IBM Datacap 9.1.10 RRX action library documentation files.
> Use this file to verify action names, parameters, levels, and return values when writing or reviewing ruleset logic.

---

## Table of Contents

- [ApplicationObjects](#applicationobjects) - 45 actions
- [AutomaticDocumentFingerprinting](#automaticdocumentfingerprinting) - 26 actions
- [Barcode](#barcode) - 10 actions
- [CC](#cc) - 15 actions
- [Convert](#convert) - 68 actions
- [DCImageFix](#dcimagefix) - 3 actions
- [Email.MSGraph](#email-msgraph) - 6 actions
- [Ewsmail](#ewsmail) - 26 actions
- [ExportToDatabase](#exporttodatabase) - 13 actions
- [ExportToText](#exporttotext) - 29 actions
- [ExportToXML](#exporttoxml) - 8 actions
- [FileIO](#fileio) - 21 actions
- [FingerprintMaintenance](#fingerprintmaintenance) - 5 actions
- [IBMCMExtended](#ibmcmextended) - 0 actions
- [IBMFileNetP8](#ibmfilenetp8) - 33 actions
- [ICM](#icm) - 6 actions
- [ImageUtilities](#imageutilities) - 19 actions
- [Imail](#imail) - 16 actions
- [Intellocate](#intellocate) - 5 actions
- [LineItemPagination](#lineitempagination) - 6 actions
- [mvscan](#mvscan) - 17 actions
- [Nenu](#nenu) - 47 actions
- [ocr_sr](#ocr-sr) - 17 actions
- [PictureCharacterValidation](#picturecharactervalidation) - 5 actions
- [RuleRunnerLogic](#rulerunnerlogic) - 37 actions
- [SplitBatch](#splitbatch) - 1 actions
- [Statistics](#statistics) - 4 actions
- [TiffMultipageMerge](#tiffmultipagemerge) - 6 actions
- [ValidationsAndTextAdjustments](#validationsandtextadjustments) - 71 actions
- [VoteUsingComparativeText](#voteusingcomparativetext) - 3 actions
- [ZonesAndLineItems](#zonesandlineitems) - 34 actions

---

## Datacap Ruleset Design Reference

### DCO Hierarchy

```
Batch
  Document
    Page
      Field
        LineItem (child Field)
```

### Ruleset Structure

```
Ruleset
  Rule  (attached to a DCO object: Batch / Document / Page / Field)
    Function  (runs if previous Function returned false)
      Action  (runs in sequence; stops function if it returns false)
```

### Action Return Value Semantics

| Return | Effect |
|--------|--------|
| True | Next action in function runs |
| False | Current function stops; next Function in the rule is tried |
| Last action True | Rule succeeds; ruleset marked successful |
| No remaining Function | Rule fails; ruleset marked failed |

### Common Smart Parameter Tokens

| Token | Meaning |
|-------|---------|
| @X | Current DCO object (Text value by default) |
| @P | Parent DCO object |
| @B | Batch object |
| @D | Document object |
| @APPPATH(subdir) | Path relative to application directory |
| @P.FieldName | Named field on the parent object |

### Action Level Reference

| Level | Attach Rule To |
|-------|---------------|
| Batch level | Batch object |
| Document level | Document object |
| Page level | Page object |
| Field level | Field object |

---

## ApplicationObjects

**File**: ApplicationObjects.rrx  
**Version**: 9.1.10.3  
**Assembly**: Datacap.Libraries.ApplicationObjects.Actions  
**Description**: Actions that create and manipulate DCO objects.

### Actions

#### AddChildDCONode

Adds new Node (Document, Page or Field) to the Runtime DCO

**Level**: All.  
**Returns**: True if the node is successfully created. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- ObjectType
- ID
- Type
- Status
- Index

#### AddChildDCONodeToBatch

Adds new Node (Document, Page or Field) to the Runtime DCO on the batch level

**Level**: All.  
**Returns**: True if the node is successfully created. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- ObjectType
- ID
- Type
- Status
- Index

#### CheckDCOStatus

Confirms that the status of the Document Hierarchy's current object is identical to the status entered as the parameter.

**Level**: All levels.  
**Returns**: True if the DCO status matches the parameter value. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- ExpectedStatus

#### CheckDCOType

Confirms that the status of the Document Hierarchy's current object is identical to the status entered as the parameter.

**Level**: All levels.  
**Returns**: True if the DCO status matches the parameter value. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- ExpectedType

#### CheckDocumentCount

Compares the number of documents to a previously set variable.

**Level**: Batch level.  
**Returns**: True if the actual count is the same as the expected or adjusted count. Otherwise, False.  

**Parameters**: None

#### CheckFieldConfidence

Checks the confidence of all fields on child pages against a minimum acceptable confidence value and sets the page status.

**Level**: Batch, Document or Page.  
**Returns**: True if all fields in all source pages meet the confidence requirement.False if any field on any page has low confidence data, or if the parameters are not Numeric.  
**Smart Parameters**: Supported  

**Parameters**:
- MinimumConfidence
- NewPageStatus
- PageStatusToCheck

#### CheckIntegrity

Checks that the batch meets the document page count requirements.

**Level**: Any level, but usually called at the batch level.  
**Returns**: Returns True if no integrity problems are found. Otherwise, False.  

**Parameters**: None

#### CheckLastDCOType

Checks the type of the previous sibling object.

**Level**: Document, Page or Field.  
**Returns**: True if the Type property of the Document Hierarchy's previous sibling non-skipped object matches the page type attempting to be matched. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- PreviousTypeToMatch
- LevelToCheck
- IgnoreTypes

#### CheckPageCount

Confirms the number of pages in the batch meets the expected count.

**Level**: Batch level.  
**Returns**: True if the actual count is the same as the expected or adjusted count. Otherwise, False.  

**Parameters**: None

#### ClearVariableInFields

Copies the value of the field along with the position and confidence.

**Level**: Page.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- VariableName
- FieldPrefix

#### CopyFieldAndChildren

Copies an entire field object to another page or field.

**Level**: This action can be called on any level as but is typically called on the current page object that contains the field to be copied or on the current field to be copied.  
**Returns**: True if the operation succeeds. False if an error occurs.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- Source

#### CountPagesToVariable

Counts the number of pages in the document.

**Level**: Document level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Variable

#### CreateDocuments

Arranges the contents of a batch into documents based on the Document Integrity rules.

**Level**: Batch level.  
**Returns**: True if successful. Otherwise, False. This action will not create a document structure if a document structure already exists. If there is a need to re-create the document structure, first remove the document structure then call this action.  

**Parameters**: None

**Example**:
```
CreateDocuments()
```

#### CreateFields

Creates the fields for a page and the associated runtime DCO Data file.

**Level**: Any level.  
**Returns**: True if successful. Otherwise, False.  

**Parameters**: None

#### CopyFieldTextConfidenceAndPosition

Copies the value of the field along with the position and confidence.

**Level**: Any level but the parameters must reference a field using smart parameter notation.  
**Returns**: False if the action cannot retrieve the target or source object. Otherwise, True. If the position or confidence cannot be copied, the action will still return True.  
**Smart Parameters**: Supported  

**Parameters**:
- Source
- Target

#### CopyFieldAndPositionToVariable

Copies the value of the field and position to another variable in the same field object for all child objects.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- TextVariable
- PositionVariable

#### DeleteDCOChildOfType

Deletes a child DCO node of the specified type.

**Level**: Document, Page or Field.  
**Returns**: False if the child objects do not exist. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Type

#### DeleteDCOChildWithStatus

Deletes a child DCO node of the specified status.

**Level**: Document, Page or Field.  
**Returns**: True unless an error occurs then False is returned. If no child objects are removed because none of them have a matching status, the action will still return true.  
**Smart Parameters**: Supported  

**Parameters**:
- Status

#### DeleteDCOParent

Deletes the parent DCO node of the current node.

**Level**: Document, Page, and Field. The calling object must have a parent node and a grandparent node.  
**Returns**: False if a parent object cannot be found, the grandparent cannot be found or if the deletion of the parent object fails. Otherwise, True.  

**Parameters**: None

#### DeleteDCOChildrenWithVariableValue

Removes immediate children that contain a variable with a specific value.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- VariableName: The variable to test on the child object.
- VariableValue: The value that indicates the child is to be deleted.

**Example**:
```
DeleteDCOChildrenWithVariableValue("original_source_image", "yes")
```

#### DeleteDCOChildren

Deletes all child objects from the calling object of the Document Hierarchy.

**Level**: All.  
**Returns**: True if successful, otherwise False.  

**Parameters**: None

#### DeleteDCOChildrenAndVariables

Clears all variables and child objects of the current object.

**Level**: All.  
**Returns**: True if all child objects and their variables are removed, otherwise False.  

**Parameters**: None

#### DeleteDCOVariable

Deletes the specified DCO variable

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- VariableName
- ObjectType

#### HasDCOChildOfType

Returns true if the current object has a child of the specified type.

**Level**: All.  
**Returns**: True if the current object contains a child or children specified of the type specified by the parameter. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Type

#### IsDocumentCountMoreThan

Counts the number of documents and returns true or false if the count is exceeded.

**Level**: Any level.  
**Returns**: if returnTrueIfMore is true, the action returns true if the document count exceeds the parameter, otherwise false is returned. if returnTrueIfMore is false, the action returns false if the document count exceeds the parameter, otherwise true is returned.  
**Smart Parameters**: Supported  

**Parameters**:
- Count
- ReturnTrueIfMore

#### IsFirstDocumentInBatch

Checks to see if this is the first document in the batch.

**Level**: Document, Page or Field.  
**Returns**: True if on the first document, or the current object in the first document. Otherwise False.  

**Parameters**: None

#### IsFirstPageInBatch

Checks to see if this page is the first in the batch.

**Level**: Page Level Only.  
**Returns**: True if it is the first page. Otherwise False.  

**Parameters**: None

#### IsMultiPageDocument

Checks if the current document object has multiple pages.

**Level**: Document, page or field level.  
**Returns**: False, if called at the Batch level, the document object cannot be found, or if the document does not have more than 1 child. Otherwise, True.  

**Parameters**: None

**Example**:
```
IsMultiPageDocument()
```

#### IsSinglePageDocument

Checks if the current document contains a single page.

**Level**: Document, page or field level.  
**Returns**: False, if called at the Batch level, the document object cannot be found, or if the document has more than 1 child. True, if the document contains one page.  

**Parameters**: None

#### JoinDocumentWithPreviousDocument

Combines the previous document into the current document.

**Level**: Document Level Only.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Type

#### MoveBatchPageToPreviousDocument

Moves the current page without a document structure into a document object.

**Level**: Page Level, but will execute only if the page's parent is the batch level object.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- NewDocumentType

#### PageIDBySequenceTypes

Assigns a type to all pages of type 'Other' from a list of types.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- SequenceTypes: A comma separated list of page types to assign.

#### PageIDByVariableChange

Assigns page types using a main and trailing page paradigm based on the value of a DCO variable.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- VariableToWatch: The name of the variable to check in each page object.
- MainPageType: The type to assign to the first page of the document.
- TrailingPageType: The type to assign to all trailing pages in the document.

#### PopulateTaxType

Loads the search terms for the Taxes field.

**Level**: Field Level. The Taxes/TaxLineitem/Tax_Value field in APT.  
**Returns**: Always TRUE.  
**Smart Parameters**: Supported  

**Parameters**:
- Types

**Example**:
```
PopulateTaxType("Sales,VAT,GST")
```

#### PromotePageToDocument

Converts a page object to a document object.

**Level**: Page level only. The page must be a direct child of the batch object.  
**Returns**: Returns false if the NewDocumentType parameter is blank or if an error occurs, otherwise true.  
**Smart Parameters**: Supported  

**Parameters**:
- NewDocumentType
- NewDocumentID

#### RefreshFields

Updates the Data file for a page in a batch with new fields and also preserves the data for previously created fields.

**Level**: Page level.  
**Returns**: True if successful. Otherwise, False.  

**Parameters**: None

#### RemoveDocumentStructure

Removes the document hierarchy from the batch.

**Level**: Batch level.  
**Returns**: Always True.  

**Parameters**: None

#### SetDCOStatus

Assigns a value to the Status property of the current object of the Document Hierarchy.

**Level**: All.  
**Returns**: False if the input parameter is not an integer, otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- Type

#### SetDCOType

Assigns a value to the Type property of the current object of the Document Hierarchy.

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Type

#### SetDocumentStatus

The action assigns a status to the current document node or parent document node.

**Level**: Document, Page or field level.  
**Returns**: False if the input parameter is not an integer, otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- Type

#### SetDocumentType

The action assigns a type to the current document or parent document object of the Document Hierarchy.

**Level**: Page and Field levels.  
**Returns**: False if the current DCO node is not a page or a field or if the provided field does not have a parent object. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Type

#### SetFieldConfidence

Sets the confidence for all characters in a field to the same value.

**Level**: Any level.  
**Returns**: Always True. If the target input parameter is invalid, no confidence levels are changed and a message is logged.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- NewConfidence

#### SetObjectID

Renames the target dco node with a new object ID.

**Level**: All.  
**Returns**: False if the action cannot locate the target object. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- NewID
- TargetObject

#### SetPageStatus

The action assigns a page status to the current page or the parent page object of the Document Hierarchy.

**Level**: Page or field level.  
**Returns**: False if the input parameter is not an integer, otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- Type

#### SetPageType

Assigns a Page Type to the current Page or parent Page object of the Document Hierarchy.

**Level**: Page and Field levels.  
**Returns**: False if the current DCO node is not a page or a field or if the provided field does not have a parent object. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Type

---

## AutomaticDocumentFingerprinting

**File**: AutomaticDocumentFingerprinting.rrx  
**Version**: 9.1.9.10  
**Assembly**: Datacap.Libraries.AutomaticDocumentFingerprinting.Actions  
**Description**: Identifies pages and assigns types and fingerprints through fingerprint matching.

### Actions

#### CalculateOffset

Sets the standard Offset value to be used when matching source pages to fingerprints.

**Level**: Page level only.  
**Returns**: False if the action is not applied at the Page level or an error occurs. Otherwise, True.  

**Parameters**: None

#### AddAndSetFingerprint

Creates a fingerprint for the current source page with a specified class type.

**Level**: Page level only.  
**Returns**: False if the rule with this action is not bound to a Page object of the Document Hierarchy; if the current page does not have an Image file; if a CCO fingerprint file has not been created or if the fingerprint's two files cannot be created in the fingerprint directory. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FingerprintClass

#### AddFingerprint

Creates a fingerprint for the current source page.

**Level**: Page level only.  
**Returns**: False if the rule with this action is not bound to a Page object of the Document Hierarchy; if the current page does not have an Image file; if a CCO fingerprint file has not been created or if the fingerprint's two files cannot be created in the fingerprint directory. Otherwise, True.  

**Parameters**: None

#### DeleteFingerprint

Deletes the current page's fingerprint.

**Level**: Page level only.  
**Returns**: Always returns True. Under certain conditions the action will be unable to delete the fingerprint but will still return True. For example if the action is not applied at the Page level or if the current page does not have an fingerprint template set. Please review the action log file if DeleteFingerprint does not perform as expected.  

**Parameters**: None

#### CheckForStickyFingerprint

Checks if a new fingerprint applies to a follow on page in the same batch.

**Level**: Page level.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
CheckForStickyFingerprint()
```

#### FindBlackFingerprint

Attempts to match black forms to fingerprints in the fingerprints directory of an application.

**Level**: Page level only.  
**Returns**: False if the action is not applied at the Page level or if the first parameter is False and a fingerprint match does not occur. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- AddFingerprintIfNotFound
- PageType

#### FindFingerprint

Attempts to match the current page to a fingerprint and creates a new fingerprint if a match does not occur.

**Level**: Page level only.  
**Returns**: False if the action is not applied at the Page level, or if the parameter is False and a fingerprint match does not occur. Otherwise, True. If a new Fingerprint cannot be added, the action still returns True.  
**Smart Parameters**: Supported  

**Parameters**:
- AddFingerprintIfNotFound
- PageType

#### IdentifyBlankPagesBySize

Uses the Image file's size to determine if the file represents a 'blank' page.

**Level**: Batch, Document, or Page levels.  
**Returns**: False if the MaximumSize or PageType parameter is invalid, the rule with this action is bound to a Field object of the Document Hierarchy or if an error occurs. Returns true if one or more child pages are identified as a "blank" page because the file size is smaller than the specified size.  
**Smart Parameters**: Supported  

**Parameters**:
- MaximumSize
- PageType
- PageToEvaluate

#### IsFingerprintClass

Test that the fingerprint belongs to the specified class.

**Level**: Page Level.  
**Returns**: False, if there is an error or if the current page's fingerprint ID does not exist in the specified class.  
**Smart Parameters**: Supported  

**Parameters**:
- FingerprintDatabase: The connection to the fingerprint database.
- ClassName: Test for the fingerprint class name.

#### MergeCCOsByType

Merges the Fingerprint files (.cco) associated with Page objects of the Document Hierarchy.

**Level**: Document, Page or Field.  
**Returns**: False if a Fingerprint file (.cco) for one of the Page Types is not available or if an error occurs while merging. Otherwise, True. If none of the pages match the specified page type, the action will still return True.  
**Smart Parameters**: Supported  

**Parameters**:
- TypesToMerge

#### MergeLayoutByType

Merges the layout files (*layout.xml) associated with Page objects of the Document Hierarchy.

**Level**: Document level only.  
**Returns**: False if a layout file (*layout.xml) for one of the Page Types is not available or if the merged layout cannot be created. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- TypesToMerge

#### SetFilterClassName

Sets the Fingerprint Class filter for the identification (matching) algorithm.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- ClassName

#### SetFilterPageType

Sets the Page Type filter for the identification (matching) algorithm.

**Level**: All levels, but generally at the Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- PageType

#### SetFingerprint

Sets a newly created fingerprint's Fingerprint Class and Fingerprint Class ID values.

**Level**: Page level only.  
**Returns**: False if either parameter is invalid. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FingerprintClass
- FingerprintID

#### SetFingerprintDirectory

Sets the Fingerprint directory of your application.

**Level**: All levels.  
**Returns**: Returns True, if successful. Otherwise, False and sets the batch to an abort state.  
**Smart Parameters**: Supported  

**Parameters**:
- Directory

#### SetFingerprintSearchArea

Controls the portion of the current page that will be used to find a matching fingerprint.

**Level**: All levels, but generally at the Page level.  
**Returns**: False if the first parameter is missing or is not numeric. Also returns False if the second parameter is not numeric. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- MatchStart
- MatchEnd

#### SetFingerprintWebServiceApplicationID

Use this action to specify unique application ID.

**Level**: Batch, Document, or Page levels.  
**Returns**: False if action SetFingerprintWebServiceURL() has not been called. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- ApplicationID

#### SetFingerprintWebServiceFailureThreshold

Uses this action to specify percentage of fingerprint upload failures to ignore.

**Level**: Batch, Document, or Page levels.  
**Returns**: Returns False when: The fingerprint service is not configured using action SetFingerprintWebServiceURL(). Returns False and aborts the batch when: The input parameter is not an integer value from 0 to 100. If the percentage of fingerprints that failed to load is greater than the threshold. If no fingerprints have been loaded and at least one has failed to load. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- IgnorePercent

#### SetFingerprintWebServiceURL

Provides the Uniform Resource Locator (URL) that is a link to a pre-established Fingerprint Service.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- URL

#### SetMaximumMatchingOffset

Sets the Maximum Offset value while matching source pages to fingerprints.

**Level**: All levels.  
**Returns**: False if the parameter is invalid. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- MaximumOffset

#### SetMinimumMatchingTolerance

Uses the decimal value you supply as a parameter to set a minimum Matching Tolerance Rating.

**Level**: All, but generally at the Page level.  
**Returns**: False if the parameter is missing or the parameter is not numeric. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Minimum: The minimum matching tolerance level.

#### SetPageFingerprintID

Assigns a value to the FingerprintID property of the selected Page object of the Document Hierarchy.

**Level**: Page level.  
**Returns**: True if the rule is applied at the Page level. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- FingerprintID: The fingerprint ID to associate with the page.

#### UpdateFingerprintStatistics

Updates the Fingerprint hit statistics.

**Level**: Page level.  
**Returns**: False if called from any level other than Page level, or the Fingerprint database is not accessible. Otherwise, True.  

**Parameters**: None

#### XMLReadZones

Loads position information for current fingerprint.

**Level**: Page or Field level.  
**Returns**: False, if the fingerprint xml cannot be loaded or if SetFingerprintDirectory has not been called to set the location of the fingerprint XML files. Otherwise, True.  

**Parameters**: None

#### XMLSetDetailsAndLineitemPair

Sets the type of the special Details and Lineitem fields.

**Level**: Any level.  
**Returns**: True.  
**Smart Parameters**: Supported  

**Parameters**:
- DetailFieldType: The type for the current page's detail field, if one exists.
- LineitemFieldType: The type for the current page's line item field, if one exists.

#### XMLWriteZones

Writes position information for all fields of the page.

**Level**: Page level only.  
**Returns**: False, if there is a problem saving to fingerprint XML file or if not called at the page level, if the page does not have a fingerprint assigned, or a fingerprint directory has not been set. Otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- FingerprintHostName: Target fingerprint class name.
- FingerprintHostID: Target fingerprint host ID.
- FingerprintPageType: Target fingerprint page type.

---

## Barcode

**File**: Barcode.rrx  
**Version**: 9.1.9.5  
**Assembly**: Datacap.Libraries.Barcode.Actions  
**Description**: Reads barcodes from a page or field.

### Actions

#### GetAllBarcodes

Searches all the barcodes on the current page and writes them to the calling object's GetBarCodeList variable.

**Level**: Page and field level.  
**Returns**: True if the action is called at the page level or field level. Otherwise, False. In addition the calling object's value and variable "GetBarCode" will be filled with the bar code value. This action also stores barcode information such as confidence, coordinates, code name, and size. If the object's barcode settings are set to read more than one barcode, and more than one barcode is found, barcodes are also stored in the variable "GetBarCodeX" where "X" is the index of the barcode found.  
**Smart Parameters**: Supported  

**Parameters**:
- BarcodeSeparator

#### GetBarcode

Recognizes arbitrary 1D or 2D codes.

**Level**: Page or Field level only.  
**Returns**: True if the action is called at the page level or field level. Otherwise, False. In addition the calling object's value and variable "GetBarCode" will be filled with the bar code value. This action also stores barcode information such as confidence, coordinates, code name, and size. If the object's barcode settings are set to read more than one barcode, and more than one barcode is found, barcodes are also stored in the variable "GetBarCodeX" where "X" is the index of the barcode found.  

**Parameters**: None

#### GetDataMatrixBarcode

Recognizes Data Matrix codes

**Level**: Page or Field level only.  
**Returns**: True if the action is called at the page level or field level. Otherwise, False. In addition the calling object's value and variable "GetBarCode" will be filled with the bar code value. This action also stores barcode information such as confidence, coordinates, code name, and size. If the object's barcode settings are set to read more than one barcode, and more than one barcode is found, barcodes are also stored in the variable "GetBarCodeX" where "X" is the index of the barcode found.  

**Parameters**: None

#### GetPDF2DBarcode

Recognizes PDF-417 codes.

**Level**: Page or Field level only.  
**Returns**: True if the action is called at the page level or field level. Otherwise, False. In addition the calling object's value and variable "GetBarCode" will be filled with the bar code value. This action also stores barcode information such as confidence, coordinates, code name, and size. If the object's barcode settings are set to read more than one barcode, and more than one barcode is found, barcodes are also stored in the variable "GetBarCodeX" where "X" is the index of the barcode found.  

**Parameters**: None

#### IdentifyOtherPagesByBarcode

Updates the current page type if a barcode match is found.

**Level**: Batch level.  
**Returns**: True.  
**Smart Parameters**: Supported  

**Parameters**:
- BarcodePageMappings
- LastPageTypeMappings
- MappingsDelimiter
- KeyValueSeparator
- CaseSensitive
- DefaultPageType

#### IdentifyPageByBarcode

Updates the current page type if a barcode match is found.

**Level**: Page level.  
**Returns**: True, if a match is found. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- BarcodePageMappings
- MappingsDelimiter
- KeyValueSeparator
- CaseSensitive

#### MatchAnyBarcode

Searches all the barcodes on the current page and checks if one matches the value you enter as a parameter.

**Level**: Page level and field level.  
**Returns**: True if the action is called at the page level or field level and one of the barcode values on the page matches the parameter value (parameter value must not be empty). Otherwise, False. In addition the calling object's value and variable "GetBarCode" will be filled with the bar code value. This action also stores barcode information such as confidence, coordinates, code name, and size. If the object's barcode settings are set to read more than one barcode, and more than one barcode is found, barcodes are also stored in the variable "GetBarCodeX" where "X" is the index of the barcode found.  
**Smart Parameters**: Supported  

**Parameters**:
- ExpectedBarcodeValue

#### MatchBarcodePrefix

Searches all the barcodes on the current page and checks if one matches the value you enter as a parameter.

**Level**: Page level and field level.  
**Returns**: True if the action is called at the page level or field level and one of the barcode values on the page matches the parameter value (parameter value must not be empty). Otherwise, False. In addition the calling object's value and variable "GetBarCode" will be filled with the bar code value. This action also stores barcode information such as confidence, coordinates, code name, and size. If the object's barcode settings are set to read more than one barcode, and more than one barcode is found, barcodes are also stored in the variable "GetBarCodeX" where "X" is the index of the barcode found.  
**Smart Parameters**: Supported  

**Parameters**:
- ExpectedBarcodePrefix

#### MatchFirstBarcode

Tests the first barcode found with the value specified by the parameter.

**Level**: Page level only.  
**Returns**: True if the first barcode on the page has a value that matches the parameter. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- ExpectedBarcodeValue

#### SetBarcodeMinimumConfidence

Changes the default confidence for successful barcode recognition.

**Level**: Page or Field level only. Must be set on the object that calls the action to read the barcode.  
**Returns**: False if the confidence value cannot be set either because it is invalid or an error occurs or if the action is called at a level other than page or field. Otherwise, True  
**Smart Parameters**: Supported  

**Parameters**:
- MinimumConfidence

---

## CC

**File**: cc.rrx  
**Version**: 9.1.5.10  
**Assembly**: Datacap.Libraries.CC.Actions  
**Description**: IBM Content Classification Actions.

### Actions

#### FindFingerprintCC

This action should not be used, as it is scheduled to be removed in future versions. It has been replaced by ClassifyCC.

**Level**: Page level.  
**Returns**: True, if the classification is successful. Otherwise, False.  

**Parameters**: None

#### ClassifyCC

Finds the closest matching document type and assigns the page type to the page.

**Level**: Page level.  
**Returns**: True, if the fingerprint is found. Otherwise, False.  

**Parameters**: None

#### SetKnowledgeBaseCC

Sets the name of the Content Classication Knowledge Base to use to classify documents.

**Level**: All.  
**Returns**: False, if the parameter is empty. Otherwise, True.  

**Parameters**:
- KnowledgeBaseName: The name of the IBM Content Classification Knowledge Base. This parameter is required and cannot be empty. Smart parameters are supported.

#### SetProblemValueCC

Sets the minimum score for fingerprint matching.

**Level**: All.  
**Returns**: True if the parameter value is between the valid range of zero to one (0.0 and 1.0) Otherwise, False.  

**Parameters**:
- MinScore: Minimum score for fingerprint matching. Valid values are fractional values between zero and one (for example: 0.0 and 1.0)

#### SetLanguageCC

Sets the language used in the specified Knowledge Base.

**Level**: All.  
**Returns**: Always True.  

**Parameters**:
- LanguageName: The name of the language used in the specified Knowledge Base

#### SetListenerURLCC

Sets the URL of the CC Listener that will be used for classification.

**Level**: All.  
**Returns**: True, if the service URL is successfully set. Otherwise, False. Note that this action does not test that the CC Listener exists and is running.  

**Parameters**:
- URL: The URL of the CC Listener that will be used for classification. Smart parameters are supported.

#### SetDecisionPlanCC

Sets the name of the Content Classification Decision Plan to use to classify text.

**Level**: All.  
**Returns**: False, if the parameter is empty. Otherwise, True.  

**Parameters**:
- DecisionPlanName: Sets he name of the IBM Content Classification Decision Plan. This parameter is required and cannot be empty.

#### SetDecisionPlanFieldsCC

Sets the Decision Plan fields separated by comma

**Level**: All.  
**Returns**: False, if the parameter is empty. Otherwise, True.  

**Parameters**:
- DPFields: Comma separated list of content field names to be extracted from the content classification decision plan. This parameter is required and cannot be empty.

**Example**:
```
SetDecisionPlanFieldsCC("Title,Loan,Loan Type")
```

#### ClassifyTextCC

Classifies blocks on the page

**Level**: All.  
**Returns**: True, if no problem occurs. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- TextToClassify

#### RunDecisionPlanForBlocksCC

Runs a previously set decision plan on selected block types of a layout xml file.

**Level**: Page.  
**Returns**: False, if a decision plan name is not specified, or the action is not called at the page level, or a connection to the Content Classification server cannot be established. Otherwise, True.  

**Parameters**:
- blockTypes: Comma separated values of block types to send to decision plan. Supported block types are Block, Table, Header , Footer, Title, H1, H2, H3, and Barcode. Smart parameters are supported.

#### RunDecisionPlanForTextCC

Classifies blocks on the page

**Level**: All.  
**Returns**: False, if a decision plan name is not specified, or the action is not called at the page level, or a connection to the Content Classification server cannot be established. Otherwise, True.  

**Parameters**:
- TextToClassify: Text to be classified. Smart parameters supported.

#### ClassifySeparateBlocksCC

Classifies blocks on the page

**Level**: All.  
**Returns**: True, if no problem occurs. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**: None

**Example**:
```
ClassifySeparateBlocksCC()
```

#### RunDecisionPlanCC

Runs decision plan on top of the page

**Level**: Page level.  
**Returns**: False, if a decision plan name is not specified, or the action is not called at the page level, or a connection to the Content Classification server cannot be established. Otherwise, True.  

**Parameters**: None

#### RunDecisionPlanForFileInVariableCC

Classifies blocks on the page

**Level**: Page level.  
**Returns**: True, if no problem occurs. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- VariableName: Variable name with the file for decision plan
- Extension: Extension of the file for decision plan

**Example**:
```
RunDecisionPlanForFileInVariableCC("XML","xml")
```

#### UpdateKnowledgeBaseCC

Updates the CC Knowledge Base.

**Level**: Page level.  
**Returns**: True if the IBM Content Classification Knowledge Base is successfully updated. Otherwise, False.  

**Parameters**: None

---

## Convert

**File**: Convert.rrx  
**Version**: 9.1.10.75  
**Assembly**: Datacap.Libraries.Convert.Common, Datacap.Libraries.Convert.Word, Datacap.Libraries.Convert.Excel, Datacap.Libraries.Convert.Outlook, Datacap.Libraries.Convert.Zip, Datacap.Libraries.Convert.Tiff, Datacap.Libraries.Convert.Pdf, Datacap.Libraries.Convert.PdfFRE, Datacap.Libraries.Convert.Images, Datacap.Libraries.Convert.Html, Datacap.Libraries.Convert.Rtf, Datacap.Libraries.Convert.Txt  
**Description**: Convert Actions Shared Settings

### Actions

#### DeleteSourceImagePages

Removes source image dco pages.

**Level**: Batch  
**Returns**: True, if the action is successful.False, if an error is encountered.  

**Parameters**: None

#### SetChildPageType

Allows the configuration of created child pages when a document is split.

**Level**: All.  
**Returns**: Always true.  

**Parameters**:
- Type: The type that will be assigned to child pages created from a conversion action. Smart parameters are supported.

#### SetNamePattern

Changes default naming pattern for converted files.

**Level**: All.  
**Returns**: True, if the setting is successful.False, if the setting is rejected.  
**Smart Parameters**: Supported  

**Parameters**:
- PatternType: A single positive numeric value.

#### SetNamePatternFileCheck

Configures file checking behavior in naming pattern for converted files.

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- fileCheck

**Example**:
```
SetNamePatternFileCheck(False)
```

#### ExceptionSetHandler

Sets the type of exception handling to be used during batch processing failure.

**Level**: Any level.  
**Returns**: True, if a valid parameter is specified. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- handler: Exception handler type.

**Example**:
```
ExceptionSetHandler(0)
```

#### ExceptionSetFileTypes

Sets the file types to be monitored for exception handling.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**:
- types: List of file extensions to monitor, comma delimited.

#### ExceptionSetVariableName

Sets the runtime document hierarchy variable to be incremented upon exception.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**:
- varName: Variable to be incremented. Smart Parameters are supported.

#### ExceptionSetTaskCondition

Sets the task condition to be raised upon exception.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**:
- taskCondition: Zero-based task condition index.

#### WordDocumentToImage

Converts a page with *.doc or *.docx file to a page or pages in TIFF format.

**Level**: Page or Document level. If called on a page level object, then each new single page TIF file created from the source Word document will be associated with a new DCO page object that is at the same level as the parent DCO page from which the page was created. If called on a document level object, then each new single page TIF file will be associated with a new DCO page object that is a child page of the parent document object. For example, if the file is associated with a page object, then the DCO structure will be created like this example: ˂page "Other"˃ TM000001.doc (source page object) ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.doc) ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.doc) ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.doc) ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.doc) If the file is associated with a document object, then the DCO structure would be created like this example: ˂Document "Invoice"˃ TM000001.tif (source document object) - ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.doc) - ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.doc) - ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.doc) - ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.doc)  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not a Word Document or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### WordDocumentToPdf

Converts *.doc or *.docx files to PDF document format.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a PDF document.False, if the current page is not a Word Document or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

**Example**:
```
WordDocumentToPdf()
```

#### WordMonochromeQuality

Adjusts binarization settings used by WordDocumentToImage.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- method
- threshold

#### WordPrintQuality

Adjusts the resolution of the image output by WordDocumentToImage.

**Level**: Page level.  
**Returns**: False if the parameter is invalid. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- dpi

#### WordTiffCompression

Sets the compression used in the TIFF output by WordDocumentToImage.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- tiffCompression

#### ExcelWorkbookToImage

Converts a page with *.xls or *.xlsx file to a page or pages in TIFF format.

**Level**: Page or Document level. If called on a page level object, then each new single page TIF file created from the source Excel file will be associated with a new DCO page object that is at the same level as the parent DCO page from which the page was created. If called on a document level object, then each new single page TIF file will be associated with a new DCO page object that is a child page of the parent document object. For example, if the file is associated with a page object, then the DCO structure will be created like this example: ˂page "Other"˃ TM000001.xlsx (source page object) ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.xlsx) ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.xlsx) ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.xlsx) ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.xlsx) If the file is associated with a document object, then the DCO structure would be created like this example: ˂Document "Invoice"˃ TM000001.xlsx (source document object) - ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.xlsx) - ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.xlsx) - ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.xlsx) - ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.xlsx)  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not an Excel Workbook or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### ExcelWorkbookToPdf

Converts *.xls or *.xlsx files to PDF document format.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a PDF document.False, if the current page is not an Excel Document or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

**Example**:
```
ExcelWorkbookToPdf()
```

#### ExcelWorkbookToImageEx

Converts a page with *.xls or *.xlsx file to a page or pages in TIFF format.

**Level**: Page or Document level. If called on a page level object, then each new single page TIF file created from the source Excel file will be associated with a new DCO page object that is at the same level as the parent DCO page from which the page was created. If called on a document level object, then each new single page TIF file will be associated with a new DCO page object that is a child page of the parent document object. For example, if the file is associated with a page object, then the DCO structure will be created like this example: ˂page "Other"˃ TM000001.xlsx (source page object) ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.xlsx) ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.xlsx) ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.xlsx) ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.xlsx) If the file is associated with a document object, then the DCO structure would be created like this example: ˂Document "Invoice"˃ TM000001.xlsx (source document object) - ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.xlsx) - ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.xlsx) - ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.xlsx) - ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.xlsx)  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not an Excel Workbook or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  
**Smart Parameters**: Supported  

**Parameters**:
- maxOutputPages
- startingSheet
- singleSheetOutput

#### ExcelPrintQuality

Adjusts the resolution of the image output by ExcelWorkbookToImage.

**Level**: Page level.  
**Returns**: False if the parameter is invalid. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- dpi

#### ExcelTiffCompression

Sets the compression used in the TIFF output by ExcelWorkbookToImage.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- tiffCompression

#### ExcelPrintBlankPage

Determines if blank pages are created when converting Excel Workbook to TIFF.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- blankPage

#### ExcelOrientationToPortrait

Forces the orientation of Excel files to portrait for ExcelWorkbookToImage.

**Level**: Page level.  
**Returns**: Always True.  

**Parameters**: None

#### ExcelOrientationToLandscape

Forces the orientation of Excel files to landscape for ExcelWorkbookToImage.

**Level**: Page level.  
**Returns**: Always True.  

**Parameters**: None

#### ExcelScalingFactor

Forces the print scaling of Excel Workbook to a specific value for ExcelWorkbookToImage.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- percent

#### ExcelShapeMinArea

Specifies the minimum area required for shape rendering by ExcelWorkbookToImage.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- minShapeArea

#### ExcelPrintGridlines

Enables or disables gridlines when converting Excel files to TIFF.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- gridlines

#### ExcelAutoFitColumns

Sets the automatic sizing of all columns for Excel Workbook converted to TIFF.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- autoFitColumns

#### ExcelAutoFitRows

Sets the automatic sizing of all rows for Excel Workbook converted to TIFF.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- autoFitRows

#### OutlookMessageToImageAndAttachment

Converts a *.msg or *.eml file to a page or pages in TIFF format.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not an Outlook Message or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### OutlookMessageToAttachmentOnly

Extracts attachments from *.msg or *.eml to pages without converting the MSG to a TIFF.

**Level**: Page level.  
**Returns**: True, if the attachments are successfully extracted from the message, or if the message contains no attachments.False, if the current page is not an Outlook Message or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### OutlookPrintQuality

Adjusts the resolution of the image output by OutlookMessageToImageAndAttachment.

**Level**: Page level.  
**Returns**: False if the parameter is invalid. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- dpi

#### OutlookTiffCompression

Sets the compression used in the TIFF output by OutlookMessageToImageAndAttachment.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- tiffCompression

#### OutlookAttachmentTypeIndicator

Determines if an email attachment type is set based on the extension or mime type.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- typeIndicator: Controls how attachment files are named.

#### OutlookKeepEmbeddedImages

Sets the flag to keep embedded images in the TIFF output by OutlookMessageToImageAndAttachment.

**Level**: Page level.  
**Returns**: Always True.  

**Parameters**: None

#### ZipUnPack

Extracts each file within a ZIP archive into separate files.

**Level**: Page level.  
**Returns**: True, if the contents of the ZIP file is successfully extracted.False, if the current page is not a PDF or if there is a failure in the extraction. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the extraction, the batch will be set to abort.  

**Parameters**: None

#### ZipPassword

Sets the password for Password protected archives that will be used by ZipUnPack.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- pwd

#### ZipOverwrite

Controls overwriting files when extracting from ZIP archives.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- overwrt

#### SplitMultipageTiff

Creates separate images for each page in a multipage Tiff file.

**Level**: Page or Document level. If called on a page level object, then each new single page TIF file created from the source multi-page TIF will be associated with a new DCO page object that is at the same level as the parent DCO page from which the page was created. If called on a document level object, then each new single page TIF file will be associated with a new DCO page object that is a child page of the parent document object. For example, if the file is associated with a page object, then the DCO structure will be created like this example: ˂page "Other"˃ TM000001.tif (source page object) ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.tif) ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.tif) ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.tif) ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.tif) If the file is associated with a document object, then the DCO structure would be created like this example: ˂Document "Invoice"˃ TM000001.tif (source document object) - ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.tif) - ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.tif) - ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.tif) - ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.tif) If the current page image is a multi-page tiff, the variable SplitPageCount will be added on a parent DCO storing the count of pages split from the parent image. If the image is not a multi-page image, the variable SplitPageCount will not be created. This variable can be used to control rule logic using the action rrCompareNumeric or other types of evaluation. It can also be used to identify whether the parent image is a multi-page tiff or a single page tiff. Additionally the variable original_source_image added on parent image DCO xml, set to the value "yes". The value "yes" denotes the parent image is a multi-page tiff and individual image files have been created.  
**Returns**: True, if the file is successfully converted to a TIFF document. The action returns True for both single and multi-page TIFF files.False, if the current page is not a TIFF or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### SplitTIFFCompression

Sets the compression method used in the TIFF output by SplitMultipageTiff.

**Level**: Page level.  
**Returns**: True, if the compression setting was successful.False, if the compression setting used is not a supported type.  
**Smart Parameters**: Supported  

**Parameters**:
- compressionTypeColor
- compressionTypeBW

#### SplitTIFFPageRange

Allows a subset of pages to be extracted from a multi page TIF.

**Level**: Page level.  
**Returns**: Always True. If the specified pages are not within the tif, then they will not be created.  
**Smart Parameters**: Supported  

**Parameters**:
- pageRange

#### PDFDocumentToImage

Create a TIFF image for each page in a PDF file.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not a PDF or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### PDFBitDepth

Sets the bit depth of the image output by PDFDocumentToImage.

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- p_iVal

#### PDFCompression

Sets the compression method used in the TIFF output by PDFDocumentToImage.

**Level**: All  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- p_iVal

#### PDFConversionMethod

Sets the conversion method used in the TIFF output by PDFDocumentToImage.

**Level**: All  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- p_iVal

#### PDFGrayscale

Sets the output by PDFDocumentToImage to be grayscale.

**Level**: All  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- p_bVal

#### PDFHorizontalResolution

Sets the output horizontal resolution for PDFDocumentToImage.

**Level**: All  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- p_iVal

#### PDFQuality

Sets the conversion quality for PDFDocumentToImage.

**Level**: All  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- p_iVal

#### PDFVerticalResolution

Sets the output vertical resolution for PDFDocumentToImage.

**Level**: All  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- p_iVal

#### PDFFREDocumentToImage

Converts an PDF file to TIFF format.

**Level**: Page or Document level. If called on a page level object, then each new single page TIF file created from the source PDF will be associated with a new DCO page object that is at the same level as the parent DCO page from which the page was created. If called on a document level object, then each new single page TIF file will be associated with a new DCO page object that is a child page of the parent document object. For example, if the PDF is associated with a page object, then the DCO structure will be created like this example: ˂page "Other"˃ TM000001.pdf (source page object) ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.pdf) ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.pdf) ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.pdf) ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.pdf) If the PDF is associated with a document object, then the DCO structure would be created like this example: ˂Document "Invoice"˃ TM000001.pdf (source document object) - ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.pdf) - ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.pdf) - ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.pdf) - ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.pdf)  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not a supported Image type or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  
**Smart Parameters**: Supported  

**Parameters**:
- resolution: The resolution of extracted images.
- compressionBW: The compression of extracted black and white image files.
- compressionColor: The compression of extracted color image files.
- compressionGray: The compression of extracted grayscale image files.
- extensionBW: The file extension of extracted black and white image files.
- extensionColor: The file extension of extracted color image files.
- extensionGray: The file extension of extracted grayscale image files.
- convertMode: Preserve colors on images or convert all to black and white.
- useFastBinarization: Use fast image binarization algorithm when convertMode is set to preserve colors.
- jpegQuality: Jpeg quality of the of images extracted with JPEG compression.

#### PDFFREReleaseEngine

Releases resources used by the conversion engine.

**Level**: Any level. Typically at the Batch close.  
**Returns**: Always True.  

**Parameters**: None

#### ImageToTIFF

Converts an Image file to TIFF format.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not a supported Image type or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### ImageMonoType

Sets the method to use when converting color images to black and white tiffs.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Mono

#### ImageDefaultDPI

Sets the default dpi (dots per inch) when converting images that do not have an embedded dpi value.

**Level**: Page level.  
**Returns**: False if there is a failure to set the default X or Y dpi value, otherwise True.  

**Parameters**:
- X: Horizonal dpi (X axis). A positive numeric value normally ranging from 96 to 300
- Y: Vertical dpi (Y axis). A positive numeric value normally ranging from 96 to 300

#### ImageMonoThreshold

Sets the threshold value when converting Image to 1 bit tiff using threshold type conversion.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- thresh: A positive numeric value from 1 to 255.

#### ImageFileTypesToConvert

Sets the file extension values of image types to convert to tiff.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- fileextensions: A CSV string of file extensions that defines the image types that will be converted.

#### HtmlToImage

Converts a page with *.htm or *.html file to a page or pages in TIFF format.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not an Html Document or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### HtmlToPdf

Converts *.htm or *.html files to PDF document format.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a PDF document.False, if the current page is not an Html Document or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

**Example**:
```
HtmlToPdf()
```

#### HtmlLayout

Sets custom layout settings for HtmlToImage.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- sMargins
- tableFit
- tableBorders
- cellShading
- clearBackground

#### HtmlPrintQuality

Adjusts the resolution of the image output by HtmlToImage.

**Level**: Page level.  
**Returns**: False if the parameter is invalid. Otherwise, True.  

**Parameters**:
- dpi: A single positive numeric value for the dots per inch (dpi) of the output image.

#### HtmlTiffCompression

Sets the compression used in the TIFF output by HtmlToImage.

**Level**: Page level.  
**Returns**: Always True.  

**Parameters**:
- tiffCompression: A parameter of one of the following values to set the TIFF compression:

#### RtfToImage

Converts a page with *.rtf file to a page or pages in TIFF format.

**Level**: Page or Document level. If called on a page level object, then each new single page TIF file created from the source Excel file will be associated with a new DCO page object that is at the same level as the parent DCO page from which the page was created. If called on a document level object, then each new single page TIF file will be associated with a new DCO page object that is a child page of the parent document object. For example, if the file is associated with a page object, then the DCO structure will be created like this example: ˂page "Other"˃ TM000001.rtf (source page object) ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.rtf) ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.rtf) ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.rtf) ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.rtf) If the file is associated with a document object, then the DCO structure would be created like this example: ˂Document "Invoice"˃ TM000001.rtf (source document object) - ˂page "Other"˃ TM000002.tif (new page object, page 1 of TM000001.rtf) - ˂page "Other"˃ TM000003.tif (new page object, page 2 of TM000001.rtf) - ˂page "Other"˃ TM000004.tif (new page object, page 3 of TM000001.rtf) - ˂page "Other"˃ TM000005.tif (new page object, page 4 of TM000001.rtf)  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not a Rtf Document or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### RtfToPdf

Converts *.rtf files to PDF document format.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a PDF document.False, if the current page is not an Rtf Document or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### RtfPrintQuality

Adjusts the resolution of the image output by RtfToImage.

**Level**: Page level.  
**Returns**: False if the parameter is invalid. Otherwise, True.  

**Parameters**:
- dpi: A single positive numeric value for the dots per inch (dpi) of the output image.

#### RtfTiffCompression

Sets the compression used in the TIFF output by RtfToImage.

**Level**: Page level.  
**Returns**: Always True.  

**Parameters**:
- tiffCompression: A parameter of one of the following values to set the TIFF compression:

#### TxtToImage

Converts a page with *.txt file to a page or pages in TIFF format.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a TIFF document.False, if the current page is not a Txt Document or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

#### TxtToPdf

Converts *.txt files to PDF document format.

**Level**: Page level.  
**Returns**: True, if the file is successfully converted to a Pdf document.False, if the current page is not an Txt Document or if there is a failure in the conversion. If the number of input files/pages exceeds the maximum allowed or if there is a failure in the conversion, the batch will be set to abort.  

**Parameters**: None

**Example**:
```
TxtToPdf()
```

#### TxtFontName

Adjusts the font name of text in the image output by TxtToImage.

**Level**: Page level.  
**Returns**: False if the parameter is invalid. Otherwise, True.  

**Parameters**:
- fontName: Font name to be used in the output image.

#### TxtFontSize

Adjusts the font size of text in the image output by TxtToImage.

**Level**: Page level.  
**Returns**: False if the parameter is invalid. Otherwise, True.  

**Parameters**:
- fontSize: Font size to be used in the output image.

#### TxtPrintQuality

Adjusts the resolution of the image output by TxtToImage.

**Level**: Page level.  
**Returns**: False if the parameter is invalid. Otherwise, True.  

**Parameters**:
- dpi: A single positive numeric value for the dots per inch (dpi) of the output image.

#### TxtTiffCompression

Sets the compression used in the TIFF output by TxtToImage.

**Level**: Page level.  
**Returns**: Always True.  

**Parameters**:
- tiffCompression: A parameter of one of the following values to set the TIFF compression:

---

## DCImageFix

**File**: DCImageFix.rrx  
**Version**: 9.1.0.1  
**Assembly**: Datacap.Libraries.ImageFix.Actions  

### Actions

#### ImageEnhance

**Level**: Page or Field Level.  
**Returns**: False if the parameter is not 3 or 4 alphanumeric characters, or if there is an exception encountered while enhancing the image. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- BackupFileExtension

#### LoadSettings

**Level**: All.  
**Returns**: False if the ImageFix Settings file that you specify as a parameter is not found. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- BackupFileExtension

**Example**:
```
LoadSettings(C:\ParentDir\Invoice\Process\ImageFix.ini) ImageEnhance(tio)
```

#### LoadSettings_FingerprintID

**Level**: Page level only.  
**Returns**: False if a fingerprint-specific Settings file does not exist. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FingerprintsFolderPath

**Example**:
```
LoadSettings_FingerprintID() ImageEnhance(tio)
```

---

## Email.MSGraph

**File**: Email.MSGraph.rrx  
**Version**: 9.1.9.2  
**Assembly**: Datacap.Libraries.Email.MSGraph.Actions  
**Description**: Email.MSGraph action library

### Actions

#### ms_login

Login to Office 365 using the Microsoft Graph API.

**Level**: All levels.  
**Returns**: True, if the login succeeds. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- clientId
- tenantId
- username
- password

#### ms_login_ClientSecret

Login to Office 365 with a Client Secret using the Microsoft Graph API.

**Level**: All levels.  
**Returns**: True, if the login succeeds. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- clientId
- tenantId
- clientSecret
- impersonatedUserId

#### ms_SetMessage

Set Message using the Microsoft Graph API.

**Level**: All levels.  
**Returns**: False if the mail object cannot be initialized. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- to
- cc
- bcc
- subject
- body

#### ms_SetAttachment

Set Attachment using the Microsoft Graph API.

**Level**: All levels.  
**Returns**: False if the file does not exist or cannot be attached. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- path

#### ms_SendMail

Send Mail using the Microsoft Graph API.

**Level**: All levels.  
**Returns**: False if the rule does not include a previous ms_SetMessage() action, or if the email cannot be sent. Otherwise, True.  

**Parameters**: None

#### ms_logout

Disconnect from the Office 365 mail service.

**Level**: All levels.  
**Returns**: Always True.  

**Parameters**: None

---

## Ewsmail

**File**: ewsmail.rrx  
**Version**: 9.1.9.36  
**Assembly**: ewsmail.CDCewsmail  
**Description**: Exchange EWS main input actions - import image attachments from email messages

### Actions

#### ex_ews_version

Select the Exchange Server version.

**Level**: Batch level, Open event.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- version

#### ex_HTTP_timeout

Specifies the maximum time to wait for an HTTP request or response from Exchange Server.

**Level**: Batch level Open event only.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nSecs

#### ex_SortByDate

Sort emails by received date

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bSort: A boolean value that enables or disables sorting of emails before ingestion

#### ex_reject_types

Specifies file extensions for attachments to reject.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- extensions

#### ex_load_properties_option

Option to flag.

**Level**: Batch level Open event only.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nOption

#### ex_login

Specifies the the Exchange Server and mail account

**Level**: Batch level, open event.  
**Returns**: True, if the login succeeds. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- hostname: URL of Exchange Web Service, ends with /Exchange.asmx (Smartparameters are supported)
- username: Username@Org for mail account and organization (blank to use Windows Authentication, Smartparameters are supported)
- password: Password for mail account (blank if none or Windows Authentication, Smartparameters are supported )

**Example**:
```
ex_login("mymailserver/Exchange.asmx", "Username@Org", "password")
```

#### ex_scan

Poll the specified mail server for incoming email with image attachments

**Level**: Batch level Open event only.  
**Returns**: Returns False if the operation fails, and the action will also pause before returning based on the configured abort time configured by ex_abort_time. Otherwise, True. If no selected emails were available, the action returns True and also pauses before returning based on the wait time configured using ex_wait_time.  

**Parameters**: None

#### ex_scan_graph

Poll the specified mail server for incoming email with image attachments

**Level**: Batch level Open event only.  
**Returns**: Returns False if the operation fails, and the action will also pause before returning based on the configured abort time configured by ex_abort_time. Otherwise, True. If no selected emails were available, the action returns True and also pauses before returning based on the wait time configured using ex_wait_time.  

**Parameters**: None

#### ex_logout

Disconnect from the mail server

**Level**: Batch level Open or Close event only.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
ex_logout()
```

#### ex_logout_graph

Disconnect from the mail server

**Level**: Batch level Open or Close event only.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
ex_logout_graph()
```

#### ex_types

Specifies valid image attachment extensions

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- extensions

#### ex_wait_time

Specifies the maximum time to wait for input emails for a single batch.

**Level**: Batch level Open event only.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nSecs

#### ex_abort_time

Specifies the delay time before returning when a batch aborts.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nSecs

#### ex_max_docs

Specifies maximum number of emails to include in a single batch.

**Level**: Batch level Open event only.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nDocs: The maximum number of emails in a batch.

#### ex_done_folder

Specifies folder for successfully imported emails

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- folder: Destination folder for successfully imported emails

#### ex_problem_folder

Specifies folder for problem emails

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- folder: Destination folder for problem email

#### ex_EMLOption

Creates a one page document per email containing an .eml file.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- folder: Optional - use a nonzero value to store one .eml file per email.

#### ex_AcceptMixedAttachments

Ingest emails with selected attachment types, even if non-selected attachment types are included

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bMixedOK: A boolean value that enables ingestion of emails with both allowed and disallowed attachment types

#### ex_AcceptNoAttachments

Ingest emails without attachments, even if attachment types are specified

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bNoAttachOK: A boolean value that enables ingestion of emails with no attachments

#### ex_login_O365_OAuth

Login to Office 365 with OAuth using EWS.

**Level**: Batch level, open event.  
**Returns**: True, if the login succeeds. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- clientId
- tenantId
- username
- password

#### ex_login_O365_OAuth_Graph

Login to Office 365 with OAuth using Microsoft Graph API.

**Level**: Batch level, open event.  
**Returns**: True, if the login succeeds. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- clientId
- tenantId
- username
- password

#### ex_login_O365_OAuth_ClientSecret

Login to Office 365 with OAuth with Client Secret using EWS.

**Level**: Batch level, open event.  
**Returns**: True, if the login succeeds. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- clientId
- tenantId
- clientSecret
- impersonatedUserId

#### ex_login_O365_OAuth_ClientSecret_Graph

Login to Office 365 with OAuth using Microsoft Graph API.

**Level**: Batch level, open event.  
**Returns**: True, if the login succeeds. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- clientId
- tenantId
- clientSecret
- impersonatedUserId

#### ex_SetProxy

Allows optional specification of proxy service settings.

**Level**: Any level, typically batch level.  
**Returns**: False, if the proxyPort is not numeric, otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- proxyURL
- proxyPort
- proxyUsername
- proxyPassword

#### ex_SetProxy_FullURL

Allows optional specification of proxy service settings with Full URL.

**Level**: Any level, typically batch level.  
**Returns**: False, if proxy settings fails, otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- proxyFullURL
- proxyUsername
- proxyPassword

#### ex_SetTopFolder

Sets the top folder where search would start

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- root: A boolean value that sets the top folder to root

---

## ExportToDatabase

**File**: ExportToDatabase.rrx  
**Version**: 9.1.9.2  
**Assembly**: Datacap.Libraries.ExportToDatabase.Actions  
**Description**: Saves batch data into a database.

### Actions

#### AddRecord

Inserts assembled data into the database table specified by a previous SetTableName action.

**Level**: All, but generally used at the Page or Field level.  
**Returns**: False if there is no connection to the database; if an error occurs when the action attempts to add the record to the database; or if a SetTableName action was not previously used. Otherwise, True.  

**Parameters**: None

#### DatabaseCloseConnection

Closes an open connection to your Export database.

**Level**: All, but generally used as part of a separate ruleset at the Batch level.  
**Returns**: True, even if the connection is already closed.  

**Parameters**: None

#### DatabaseOpenConnection

Opens a connection to the database specified as the parameter.

**Level**: All, but generally used at the Batch level.  
**Returns**: True if the connection opens. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- strConnectionString

#### SetTableName

Sets the name of the table in your database to which the data is to be exported.

**Level**: All.  
**Returns**: Returns False only if the first parameter contains an invalid table name and a value of 1 is specified as a second parameter. Otherwise, this action always returns True.  
**Smart Parameters**: Supported  

**Parameters**:
- TableName

#### ExportBatchIDToColumn

Stores the current batch ID into the database.

**Level**: All, but generally at the Page or Field level.  
**Returns**: False if the second parameter is set to "1" and the parameters do not identify a valid database column. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Column
- SQLFormatValue

#### ExportToColumn

A field-level action that exports the captured value of the current Field object from the page's Data file to a target column within a previously designated table of an open Export database.

**Level**: Field level only.  
**Returns**: False if:1. There is no connection to the database.2. The column identified by the parameters does not exist.3. A SetTableName action was not previously used. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Column
- SQLFormatValue

#### ExportFieldToColumn

A page-level action that extracts the captured value of a Field object from the Data file of the current page, and specifies its target location within a table of the Export database.

**Level**: Page level only.  
**Returns**: False if:1. There is no connection to the database.2. The database column specified as a parameter does not exist.3. The Field object identified by the parameter does not exist.4. A SetTableName action was not used previously. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Field
- Column
- SQLFormatValue

#### ExportSmartParamToColumn

Adds the evaluated value of a smart parameter to a column of the Export database

**Level**: All, but generally at the Page or Field level.  
**Returns**: False if:1. There is no connection to the database.2. The column identified by the parameter does not exist.3. A SetTableName action was not previously used. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- SmartField
- Column
- SQLFormatValue

**Example**:
```
ExportSmartParamToColumn("@P\MyField.TYPE","EXPDBCOLUM")
```

#### ExportNodeXMLToColumn

Exports the value of the XML property of the bound object (node) of the Document Hierarchy to a column of the Export database.

**Level**: All, but generally at the Page or Field level.  
**Returns**: False if:1. There is no connection to the database.2. The column identified by the parameter does not exist.3. A SetTableName action was not previously used.4. The smart parameter path does not point to a valid object of the Document Hierarchy. If the smart parameter path is invalid then the Null/Blank value get inserted into table and action returns true. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- SmartParameter Path
- Column
- SQLFormatValue

**Example**:
```
ExportNodeXMLToColumn("@P\MyField","MYDBCOLUM")
```

#### ExportPropertyToColumn

Adds the value of a property (variable) of the selected object to a column of the Export database

**Level**: All, but generally used at the Page or Field level.  
**Returns**: False if:1. There is no connection to the Export database.2. The column of the database does not exist.3. The property (variable) identified by the parameter does not exist.4. A SetTableName action was not used previously. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- PropertyName
- Column
- SQLFormatValue

#### StatisticsAddToDatabaseTotals

Calculates page type classification and field recognition accuracy statistics.

**Level**: Batch.  
**Returns**: False, if the database connection does not exist or if an error occurs. Otherwise, True. If the database connection does not exist, the batch will be set to the "Abort" state.  

**Parameters**: None

**Example**:
```
StatisticsAddToDatabaseTotals()
```

#### StatisticsCompareFieldsText

Calculates page type classification and field recognition accuracy statistics.

**Level**: Batch.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- SaveStatusVariableName: Optional. If provided, the action will also save the object status using the variable name provided.

#### StatisticsSaveFieldsText

Stores the current recognition and page classification results prior to verification.

**Level**: Batch.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
StatisticsSaveFieldsText()
```

---

## ExportToText

**File**: ExportToText.rrx  
**Version**: 9.1.6  
**Assembly**: Datacap.Libraries.ExportToText.Actions  
**Description**: Creates a plain text data file using application data

### Actions

#### CloseExportFile

Closes the currently opened export file.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**: None

#### ExportAllPageFields

Exports all field values on the current page, including values of Line Item Detail sub-fields - with exceptions.

**Level**: Page level.  
**Returns**: False if the action is not used at the Page level. Otherwise, True.  

**Parameters**: None

#### ExportBlankCSVFields

Inserts blank fields into the Export file, adjacent to the current field.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Count

#### ExportCurrentField

Exports the current field value to the Export file.

**Level**: Field level.  
**Returns**: False if there is an error, otherwise True.  

**Parameters**: None

#### ExportFillerCharacters

Adds a string of filler characters to the Export.

**Level**: All levels.  
**Returns**: False if the first parameter is not numeric or if there is an error. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Count
- CharactersToExport

#### ExportPageField

Exports the specified Field object's value to the Export file.

**Level**: Page level.  
**Returns**: False if the parameter is not a Field object's name or if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FieldToExport

#### ExportPageFieldFixedLengthLeftJustified

Exports a specified number of characters from a field's left end (left-justified.)

**Level**: Page level.  
**Returns**: False if either parameter is invalid or if the action is called at the wrong level. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FieldToExport
- FixedLength

#### ExportPageFieldFixedLengthRightJustified

Exports a specified number of characters from a field's right end (right-justified.)

**Level**: Page level.  
**Returns**: False if either parameter is invalid or if the action is called at the wrong level. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FieldToExport
- FixedLength

#### ExportText

Exports a value to the Export file.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Text

#### ExportTextNotJustified

Exports an evaluated smart parameter value to the Export file.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Text

#### LineItemAddElement

Includes the specified Line Item Field object as an element of a Line Item Array.

**Level**: The parent field that contains the child Line Item field.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- FieldName

#### LineItemAddBlankFields

Includes the specified number of blank fields as elements of a Line Item Array.

**Level**: The parent field that contains the child Line Item field.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Count

#### LineItemAddSmartParameter

Add a smart parameter algorithm as an element of a Line Item Array.

**Level**: The parent field that contains the child Line Item field.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- SmartParameter

#### LineItemClearElements

Clears values in the Line Item Array.

**Level**: The parent Field object of the Document Hierarchy that contains a child Line Item field, such as you may typically find in an invoice application.  
**Returns**: Always True.  

**Parameters**: None

#### LineItemExportElements

Exports the captured values in a page's Line Item Array that have been populated with LineItemAddElement actions.

**Level**: The parent field that contains the child Line Item sub-fields.  
**Returns**: Always True.  

**Parameters**: None

#### ResetFieldExportSettings

Resets the variables of the bound Field object of the Document Hierarchy.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**: None

#### SaveExportFilePathAsVariable

Saves the path and name of your Export file to the variable specified by the parameter.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- VariableName

#### SetCSVElementSeparator

Ensures that all exported values are delimited by a separator designated as the parameter.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- CustomSeparator

#### SetCSVMode

Formats exported values to be delimited by a comma separator.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- CSVMode

#### SetExportDirectory

Specifies the path to the Export file's location. Alternatively, you can use a Smart Parameter to identify a Paths.ini file that has a set of path parameters for your application - see the Parameters and Details sections below.

**Level**: All  
**Returns**: True if the path specified by the parameter exists or can be created. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- ExportDirectoryPath

#### SetExportFileEncoding

**Level**: Any.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Encoding

#### SetExportFileName

Assigns a name to the current Export file.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- ExportFileName

#### SetFillCharacter

Sets the filler character to be used to expand the current value of a field in the export file.

**Level**: Any level.  
**Returns**: False if more than one character is entered as a parameter or if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FixedLengthFillCharacter

#### SetFixedLength

Uses the Numeric value you enter as a parameter to establish a fixed length of a value exported from the current field.

**Level**: Any level.  
**Returns**: False if the parameter is not an integer or if there is an error. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- RequiredTextLength

#### SetIgnoreFieldStatus

Any field with this status will not be included in the export file.

**Level**: Any level.  
**Returns**: False if the parameter is not numeric or if there is an error. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- StatusToIgnore

#### SetJustifiedExportMode

Right-justifies or left-justifies exported values.

**Level**: Any level.  
**Returns**: False if the parameter is not an "R" or "L", or if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- JustifyMode

#### SetOMRSeparator

For multi-punch OMR fields, uses the parameter's value as the separator character.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Separator

#### StartNewLine

Starts a new line in your Export file.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**: None

#### WriteBlankLines

Inserts blank lines into the Export file.

**Level**: All level.  
**Returns**: False, if the parameter is not an integer or if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- LineCount

---

## ExportToXML

**File**: ExportToXML.rrx  
**Version**: 1.0.0  
**Assembly**: Datacap.Libraries.ExportToXML.Actions  
**Description**: Description of action library

### Actions

#### XMLSaveFile

**Level**: Batch, Document or Page level.  
**Returns**: True if the file is created successfully. Otherwise, False.  

**Parameters**: None

**Example**:
```
XMLSaveFile()
```

#### XMLSetExportPath

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- StrParam

#### XMLSetFileName

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- StrParam

#### XMLNewNode

**Level**: All.  
**Returns**: True if parent node exists. False if duplicate root node is declared, or parent NodeID does not exist.  
**Smart Parameters**: Supported  

**Parameters**:
- NewNodeID
- ParentID

#### XMLSetNodeValue

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- NodeID
- NodeValue

#### XMLSetAttributeValue

**Level**: All.  
**Returns**: False if the node does not exist. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- NodeID
- AttrID
- AttrValue

#### XMLSetFileEncodingAsASCII

**Level**: Any.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- ASCIIEncoding

#### XMLCommitNode

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- StrParam

**Example**:
```
XMLCommitNode("LineTotal")
```

---

## FileIO

**File**: FileIO.rrx  
**Version**: 9.1.9.17  
**Assembly**: Datacap.Libraries.FileIO.Actions  
**Description**: File and directory manipulation actions.

### Actions

#### CCOBackup

Makes a copy of the CCO of the first document page.

**Level**: Document Level only.  
**Returns**: Always True.  

**Parameters**: None

#### CCORestore

Copies the saved CCO file over the existing CCO file for the first page of the document.

**Level**: Document Level only.  
**Returns**: Always True.  

**Parameters**: None

#### CopyFile

Copies a file.

**Level**: All levels.  
**Returns**: True, if the file is successfully copied. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- sourcefile
- targetfile
- overwrite

#### DeleteFile

Deletes a file.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- filename

#### ReadTextFile

Reads a text file.

**Level**: All levels.  
**Returns**: True if the text file exists and was successfully read, otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- filename
- target

#### DeleteDirectory

Deletes a directory and optionally deletes subdirectories

**Level**: Any level.  
**Returns**: If the directory is deleted, the action always returns True. If a failure occurs when deleting a directory, the action will return the value of FailureReturnValue. This allows you to determine if the action should return True or False on a directory failure. Depending on the application, it may make sense to ignore a delete failure so this action can be set to always return true.  
**Smart Parameters**: Supported  

**Parameters**:
- Directory
- Recursive
- FailureReturnValue

#### CopyDirectory

Copies a directory and its subdirectories

**Level**: Any level.  
**Returns**: If a failure occurs when coping a directory, the action will return false. If some of the files have been copied prior to the failure, those files will remain.  
**Smart Parameters**: Supported  

**Parameters**:
- SourceDirectory
- DestDirectory
- Recursive

#### CheckFreeDiskSpace

Checks the size of the available disk space.

**Level**: Any level.  
**Returns**: Returns False if the threshold is specified and the amount of free disk space is less than the specified value, if the target variable is provided but cannot be set, or if the drive letter is invalid. Otherwise True is returned.  
**Smart Parameters**: Supported  

**Parameters**:
- DriveLetter
- Threshold
- TargetVariable

#### GetFileSize

Obtains the size of a file and stores it in the specified variable.

**Level**: All levels.  
**Returns**: False, if the target variable is blank. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- filename
- targetVariable

#### GetProfileString

Reads a key value from a settings file.

**Level**: All levels.  
**Returns**: True, if the settings file exists and the target variable is valid. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- filename
- section
- key
- targetVariable

#### IsDirectoryPresent

Determines if the specified directory exists and optionally creates it.

**Level**: All levels.  
**Returns**: If testExistence is True, the action will return True if the directory exists or if the directory did not exist but was successfully created. If testExistence is False, the action will return True if the directory does not exist. This allows you to perform negative tests that will return true when a directory does not exist. If an error occurs, the action will return false.  
**Smart Parameters**: Supported  

**Parameters**:
- directoryName
- create
- testExistence

#### IsFilePresent

Determines if the specified file exists.

**Level**: All levels.  
**Returns**: If testExistence is True, the action will return true if the file exists. If testExistence is false, the action will return true if the file does not exist. If an error occurs, the action will return false.  
**Smart Parameters**: Supported  

**Parameters**:
- filename
- testExistence

#### IsFileReadOnly

Tests the read only attribute of a file.

**Level**: All levels.  
**Returns**: If testForReadOnly is true, the action will return true if the file is read only. If testForReadOnly is false, the action will return true if the file is not read only. If an error occurs, or if the file does not exist, the action will return false.  
**Smart Parameters**: Supported  

**Parameters**:
- filename
- testForReadOnly

#### IsProfilePresent

Tests that a profile exists and that a specific section and key exists within it.

**Level**: All levels.  
**Returns**: True, if testExistence is true and the section and key is found within the profile and the key has an assigned value. True, if testExistence is false and the section or key is not found within the profile or the key value is blank. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- filename
- section
- key
- testExistence

#### RenameFile

Renames or moves the specified file.

**Level**: All levels.  
**Returns**: True, if the file is successfully renamed or moved. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- oldName
- newName
- overwrite

#### RenameImagesToStandardNames

Renames images and page objects to the standard TMxxxxxxx convention

**Level**: Batch level.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
RenameImagesToStandardNames()
```

#### SetFileReadOnly

Sets or removes the read only attribute from a file or set of files.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- readonly
- filename

#### SetProfileString

Writes a value to a profile file, typically called an INI file.

**Level**: All levels.  
**Returns**: True, if the value is written to the profile. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- filename
- section
- key
- value

#### SplitFileName

Splits a file name into user specified variables.

**Level**: All levels.  
**Returns**: False, if the structure of the file name or path is invalid. Otherwise, True. The file does not need to exist for this action to succeed.  
**Smart Parameters**: Supported  

**Parameters**:
- inputFilename
- rootPathVariable
- pathVariable
- fileVariable
- extVariable

#### SwapPageImages

Swaps two files that correspond to the current page file.

**Level**: Page or field level.  
**Returns**: False, if called at the wrong level, if the file cannot be found or if an error occurs. True, if the file are interchanged.  
**Smart Parameters**: Supported  

**Parameters**:
- extention1: The extension of the file to interchange.
- extension2: The extension of the file to interchange.

#### ZipOcrResults

Creates a ZIP file containing recognition results for every page of the document.

**Level**: Document level  
**Returns**: True, if the zip file is created successfully otherwise False.  

**Parameters**: None

---

## FingerprintMaintenance

**File**: FingerprintMaintenance.rrx  
**Version**: 8.0.1.2  
**Assembly**: Datacap.Libraries.FingerprintMaintenance.Actions  
**Description**: Actions to automate fingerprint deletion.

### Actions

#### OpenDatabase

Opens a connection to the fingerprint database.

**Level**: Any level.  
**Returns**: True if the connection is established. False if the connection is not established.  
**Smart Parameters**: Supported  

**Parameters**:
- ConnectionString: Fingerprint database connection string.

#### SetFingerprintFolder

Specifies the folder containing the fingerprint files.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Folder: Folder containing the fingerprints.

#### DeleteFingerprint

Deletes specified fingerprint.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- ID: ID of fingerprint to delete

**Example**:
```
DeleteFingerprint("1002")
```

#### DeleteFingerprints

Deletes all fingerprints returned by the SQL statement in the parameter

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- SQL: SQL statement to return a recordset of fingerprints to be deleted

**Example**:
```
Access - DeleteFingerprints("SELECT * FROM Template WHERE tp_LastHit < dateadd("d",-30,NOW)") SQL - DeleteFingerprints("SELECT * FROM Template WHERE tp_LastHit < dateadd(d,-2,GETDATE())") Oracle - DeleteFingerprints("SELECT * FROM Template WHERE tp_LastHit < TRUNC(SYSDATE) - 30")
```

#### CloseDatabase

Closes connection to the fingerprint database and saves the Setup DCO.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
CloseDatabase()
```

---

## IBMCMExtended

**File**: IBMCMExtended.rrx  
**Version**: 8.1.0.0  

_No documented actions._

---

## IBMFileNetP8

**File**: IBMFileNetP8.rrx  
**Version**: 9.1.10.2  
**Assembly**: Datacap.Libraries.IBMFileNetP8.Actions  
**Description**: Uploads and downloads documents from an IBM FileNet P8 repository.

### Actions

#### P8AddRedactionsToP8Document

Adds redactions to a P8 document

**Level**: Page level.  
**Returns**: False, if an error occurs or if the action is run on any level that is not page level. Otherwise, True.  

**Parameters**: None

#### P8CreateFolder

Creates a folder on the P8 repository.

**Level**: All levels.  
**Returns**: False, if the parameter is invalid, the set up information is invalid, or the folder cannot be created. Otherwise, True. Note: If the action returns False, the task is set to a status of “Aborted”.  
**Smart Parameters**: Supported  

**Parameters**:
- FolderPath: The name of the folder to create on the P8 system. Do not include the folder path, only specify the folder name.

#### P8Login

Provide the URL and login credentials for the P8 repository.

**Level**: All, but generally at the Batch level.  
**Returns**: False, the FileNet P8 client software is not installed, if the login credentials are incorrect, or an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FileNetURL: The URL for the FileNet P8 repository server.
- LoginName: The user ID the application uses for the FileNet P8 connection.
- Password: The password for the specified login name.

#### P8SearchAndDownload

Locates documents on the FileNet repository and downloads them to the batch or a directory.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  

**Parameters**: None

#### P8SetDefineSecurityParentage

Configures how a file's security is determined.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Inherit: Inherit parent security: True/False.

#### P8SetDestinationFolder

Sets the destination folder for the documents being uploaded.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Destination: An existing folder on the FileNet server.

#### P8SetDocumentClassAndTitle

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- ClassID: The P8 Document Class ID.
- Title: The document title.

#### P8SetFileType

Identifies the type of files to upload to P8

**Level**: All levels.  
**Returns**: Always returns True.  
**Smart Parameters**: Supported  

**Parameters**:
- FileExtension: The file type to upload to P8.

**Example**:
```
P8SetFileType(".tif")
```

#### P8SetKeyProperty

Configures the value of the search property used by the P8UpdateProperties action.

**Level**: Batch, Document or Page level.  
**Returns**: False, if either parameter is blank or if the value parameter is invalid. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- PropertyName: The property name (symbolic name) of a document in FileNet P8 repository.
- PropertyValue: The corresponding value of the property.

#### P8SetLocale

Configures the locale for the P8 server.

**Level**: All, but generally at the Batch level.  
**Returns**: False, an error occurs. Otherwise, True. This action does not validate that the provided locale is valid or accepted by the P8 server. Refer to the FileNet P8 documentation for information about supported locales.  
**Smart Parameters**: Supported  

**Parameters**:
- LocaleID: Locale value accepted by the FileNet P8 Web Service.

**Example**:
```
P8SetLocale("en_US")
```

#### P8SetMultiplePageDocuments

Instructs the P8Upload action to create a single or multiple page P8 document.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Enabled: Enable multiple page documents when uploading: True/False.

#### P8SetMultipleValueProperty

Sets a P8 multiple value property.

**Level**: All levels.  
**Returns**: False, if the ID or Value parameters are missing or if the specified property is not a multi-value property. Otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- PropertyID: The P8 identifier that supports multiple values.
- PropertyValue: A value enclosed within single quotes are treated as string literal.
- PropertyType: Optional property type, defaults to string.

#### P8SetOverrideCheckoutOnUpdateContent

Controls the behavior of the P8UpdateContent action.

**Level**: All levels.  
**Returns**: True, if valid value ("True" or "False") is passed. False, if invalid value is passed or if an error occurs.  
**Smart Parameters**: Supported  

**Parameters**:
- Override: Checkout document for content update: True/False.

#### P8SetProperty

Sets the specified P8 property ID to a value with an optional type.

**Level**: All levels.  
**Returns**: False, if either parameter is blank or if the value parameter is invalid. Otherwise True. Note: If the action returns False, the action sets the task to finish with a status of “Abort”. Invalid property settings may not be detected or reported until P8Upload is run.  
**Smart Parameters**: Supported  

**Parameters**:
- PropertyID: The name of an existing document property in the FileNet library (equivalent to a document index field).
- PropertyValue: The value to assign to the associated Property ID. A value enclosed within single quotes are treated as string literal.
- PropertyType: Optional property type, defaults to string.

#### P8SetRetry

Sets the number of automatic upload retries for the P8Upload action.

**Level**: Any level.  
**Returns**: False, if a non-numeric parameter specified or if an error occurs. Otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- NumberOfRetries: Number of attempts to upload files.

#### P8SetSearchAndDownloadStatusProperty

Indicates if a document has already been downloaded.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True. The existence of the property on the document class is not verified until the action P8SearchAndDownload is called.  
**Smart Parameters**: Supported  

**Parameters**:
- Status: FileNet property to use for download status tracking.

#### P8SetSearchClass

Configures the document class for the P8SearchAndDownload action.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- ClassName: The name (symbolic FileNet P8 name) of the class of document to search for in FileNet P8.

#### P8SetSearchCurrentVersionOnly

Limits the P8SearchAndDownload action to the current document version only.

**Level**: All levels.  
**Returns**: True  
**Smart Parameters**: Supported  

**Parameters**:
- CurrentVersionOnly: Only include current document versions when searching: True/False.

#### P8SetSearchDownloadDirectory

Sets the directory where files downloaded from P8 are placed by the P8SearchAndDownload action.

**Level**: All levels.  
**Returns**: False, if the parameter is blank or an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- DirectoryPath: The full directory path indicating where to place the files downloaded from P8.

#### P8SetSearchFolderRestriction

Restricts the P8 folder used in a subsequent P8SearchAndDownload action.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True. The folder path is not validated by this action.  
**Smart Parameters**: Supported  

**Parameters**:
- P8SearchFolderPath: The path of the P8 folder where the search is performed by P8SearchAndDownload.

#### P8SetSearchIncludeDocumentsWithoutContent

Indicates if documents without content are to be included in search results.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Include: Include empty documents in search results: True/False.

#### P8SetSearchIncludeSubClasses

Configures if subclasses should be included in search results.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- IncludeSubclasses: Include subclasses in the document search: True/False.

#### P8SetSearchMaximumItems

Configures the maximum results returned from P8SearchAndDownload.

**Level**: All levels.  
**Returns**: False, if parameter is not an integer or if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- MaximumSearchResults: Maximum number of documents to download.

#### P8SetSearchOrderBy

Configures the results order for the P8SearchAndDownload action.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- OrderBy: Orders the search results, ASC/DESC.

#### P8SetSearchWhereClause

Sets the SQL where clause for the P8SearchAndDownload action.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- WhereClause: The clause used in the search query by P8SearchAndDownload.

#### P8SetTargetClassID

Configures a target class of ObjectStore or FileStore.

**Level**: All levels.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- ObjectID: Repository type: ObjectStore/FileStore.

**Example**:
```
P8SetTargetClassID("ObjectStore")
```

#### P8SetTargetObjectID

Configures the P8 object ID for the P8Upload action.

**Level**: All, but generally at the Batch level.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- ObjectID: The P8 Object Store name to use for uploads and downloads.

#### P8SetTimeout

Configures the timeout for the P8Upload action.

**Level**: All, but generally at the Batch level.  
**Returns**: False, if the parameter is not valid or if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Timeout: Upload timeout in milliseconds.

#### P8SetUploadFileNameVariable

Changes the P8Upload action to look for filenames in a specific variable instead of the associated page file.

**Level**: Batch, Document or Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- DCOVariable: Name of DCO variable containing the upload file name.

#### P8UpdateContent

Updates the content of a document in a FileNet P8 repository as a new version.

**Level**: Document and Page level. To ensure proper handling of P8 documents with multiple content elements, this action must be run at Document level and with FNP8_MultiPageDocs("True").  
**Returns**: False, if an error occurs, or if the action is run on any level that is not document or page level. Otherwise, True. If successful, the DCO variable "Doc_ID" is created on each uploaded page with the value of the FileNet object identifier for the new version of the document.  

**Parameters**: None

#### P8UpdateProperties

Updates an existing FileNet P8 document's properties values using the data passed into the SetProperty action.

**Level**: Batch, Document or Page level.  
**Returns**: Action returns True if the update is successfully; False if the action is unable to update the document.  

**Parameters**: None

#### P8Upload

Uploads images to P8 based on the previous configuration actions.

**Level**: Batch, Document or Page level.  
**Returns**: False, if the upload is not successful, or the action was applied to the Field level. Otherwise, True. If successful, the DCO variable "Doc_ID" is created on each page uploaded and set to the FileNet document identifier. Note: If the action returns False, the task to set to the status of “Aborted”.  

**Parameters**: None

#### P8UploadDirectory

Uploads files that are external to the batch.

**Level**: Batch or Document level.  
**Returns**: False, if the upload is not successful. Otherwise, True. Note: If the action returns False, the action directs the Rulerunner task to finish with a status of “Aborted”.  
**Smart Parameters**: Supported  

**Parameters**:
- SourceFolder: The full path of the source folder that contains the images to be uploaded to FileNet.
- DeleteAfterUpload: Delete files from disk after upload: True/False.

---

## ICM

**File**: ICM.rrx  
**Version**: 8.1.0.8  
**Assembly**: Datacap.Libraries.CC.Actions  
**Description**: IBM Content Classification Actions. This action library has been replaced by CC.rrx.

### Actions

#### FindFingerprintICM

This action has been replaced by FindFingerprintCC in CC.rrx.


**Parameters**: None

#### SetKnowledgeBaseICM

This action has been replaced by SetKnowledgeBaseCC in CC.rrx.


**Parameters**: None

#### SetProblemValueICM

This action has been replaced by SetProblemValueCC in CC.rrx.


**Parameters**: None

#### SetLanguageICM

This action has been replaced by SetLanguageCC in CC.rrx.


**Parameters**: None

#### SetListenerURLICM

This action has been replaced by SetListenerURLCC in CC.rrx


**Parameters**: None

#### UpdateKnowledgeBaseICM

This action has been replaced by UpdateKnowledgeBaseCC in CC.rrx.


**Parameters**: None

---

## ImageUtilities

**File**: ImageUtilities.rrx  
**Version**: 9.1.10.11  
**Assembly**: Datacap.Libraries.ImageUtilities.Actions  
**Description**: Actions that adjust and convert images.

### Actions

#### AnnotateImage

Places text onto an image, starting at a specified coordinate..

**Level**: Page level.  
**Returns**: False if there is an error. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- DisplayText
- xCoordinate
- yCoordinate
- FontName
- FontSize
- Opaque
- WidthAdjustment

#### AppendAllDocumentImages

Appends all of the images in the document to the first page.

**Level**: Document level.  
**Returns**: True, if all of the TIFF images within the document have been appended to the end of the first TIFF image. Otherwise, False. This action can fail if too many images are appended together. It is recommended that the number of images appended are kept to a limited number of images.  

**Parameters**: None

#### AppendAllDocumentImagesByType

Appends all of the images of a specific type within a document.

**Level**: Document level.  
**Returns**: True, if all of the TIFF images that match the specified type within the document have been appended to the end of the first matching TIFF image. Otherwise, False. This action can fail if too many images are appended together. It is recommended that the number of images appended are kept to a limited number of images.  
**Smart Parameters**: Supported  

**Parameters**:
- TypeToMerge

#### AppendImageSetAsFirst

Sets the current page as the first page for a concatenated file.

**Level**: Page level.  
**Returns**: True, if the image file exists for the current page and if it is a TIFF file. Otherwise, False.  

**Parameters**: None

#### AppendImageToFirst

Concatenates the current image to the bottom of an existing image.

**Level**: Page level.  
**Returns**: True, if the current page is successfully concatenated with the previous page. Otherwise, False.  

**Parameters**: None

#### ClipFieldToNewImage

Clips the field on the Image file to a separate Image file containing only the image from field's coordinates.

**Level**: Field level only.  
**Returns**: False if either parameter is invalid or if the new page cannot be created. Otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- NewImagePageType
- NewImageStatus

#### ClipFieldToNewImageFileOnly

Clips the field on the Image file to a separate Image file containing only the image sized from a field's zone with a user determined file name.

**Level**: Page or field level. If called on a field, the field must have a parent page object.  
**Returns**: True if the operation is successful, else False if an error occurred.  
**Smart Parameters**: Supported  

**Parameters**:
- FieldName
- FileName

#### ConvertLossyToLosslessImage

Converts images with lossy compression to TIFs with lossless compression.

**Level**: Page level.  
**Returns**: False, if an error occurs. True, If the image is converted, if the image does not need conversion, or if the file is not a supported type.  
**Smart Parameters**: Supported  

**Parameters**:
- BackupIdentifier: Creates a backup image with a tag identifying it as the original input image. Default: .originalInput
- MakeAllTIF: If True, additionally converts any non-TIF images to TIFs with lossless compression. Default: False

#### EqualizeUnbalancedImage

Adjusts a non-isotropic image into an isotropic image.

**Level**: Page level only.  
**Returns**: False if the parameter is not numeric or if the rule containing the action is not bound to a Page object of the Document Hierarchy. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- AdjustmentCutoff

#### IsSupportedImageFile

Checks the current page file extension to determine if it is a supported format.

**Level**: Page level.  
**Returns**: True, if parameter is valid, the action is called at the page level and the page's IMAGEFILE variable (set at scan time by the scan tasks) points to a file whose format is supported (can be displayed) by the Image view control. Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- LoadImage

#### OverlayCurrentImageOnBackgroundImage

Combines the current image with the image file specified by the SetBackgroundImage action into a new image replacing the current image. This action is used to reinstate a form background that was 'dropped out' during scanning.

**Level**: Page level only.  
**Returns**: False if the action is not applied to a Page object, if it cannot locate the Background Image file, or if the action encounters an error. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- BackgroundImageFileName
- Halo

#### RedactCoordinates

Redacts the current page image at specific coordinates or on a field, allowing optional text on the redacted area.

**Level**: Page and Field level.  
**Returns**: True if the area is redacted. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- FillColor
- NewText
- TopLeftX
- TopLeftY
- BottomRightX
- BottomRightY
- BackupFileNameSuffix

#### RedactField

Redacts the area on the page based on the zone position of the current field.

**Level**: Page or field level. If called on a field, the field must have a parent page object.  
**Returns**: True if the operation is successful, otherwise False if an error occurred.  
**Smart Parameters**: Supported  

**Parameters**:
- FieldName
- Color
- BackupPostFileName

#### RescaleImage

Adjusts image for the current page to the specified size.

**Level**: Page level only, and the page must refer to a valid single page image file  
**Returns**: True if the operation is successful, else False if any error occurred.  
**Smart Parameters**: Supported  

**Parameters**:
- ImageHeight
- ImageWidth
- ImageDPI

#### SaveImageAs

Saves a new copy of the image, allowing adjustment of image type, color depth and compression.

**Level**: Page level only, and the page must refer to a valid single page image file  
**Returns**: True if the operation is successful, else False if any error occurred.  
**Smart Parameters**: Supported  

**Parameters**:
- NewFileType
- NewColorDepth
- Palette
- Dither
- BackupSuffix
- DeleteOriginal

#### SaveImageAsSettingsJPEG

Configures the settings used when saving an image as a JPEG image.

**Level**: Page level only, and the page must refer to a valid single page image file  
**Returns**: True if the operation is successful, else False if any error occurred.  
**Smart Parameters**: Supported  

**Parameters**:
- Quality
- Grayscale
- Progressive

#### SaveImageAsSettingsTIFF

Configures the setting when saving an image as a TIFF image.

**Level**: Page level only, and the page must refer to a valid single page image file  
**Returns**: True if the operation is successful, else False if any error occurred.  
**Smart Parameters**: Supported  

**Parameters**:
- Compression

#### SetImageDPIByWidth

Adjusts the dpi of the image and optionally resizes based on the expected physical size.

**Level**: Page level only, and the page must refer to a valid single page image file  
**Returns**: True if the operation is successful, otherwise False if any error occurred.  
**Smart Parameters**: Supported  

**Parameters**:
- ImageWidth
- ImageDPI
- Rescale

#### SaveImageInformation

Obtains the properties of an image and stores them in user variables within the DCO.

**Level**: Page level only, and the page must refer to a valid single page image file.  
**Returns**: True if the operation is successful, else False if any error occurred.  
**Smart Parameters**: Supported  

**Parameters**:
- ImageWidth
- ImageHeight
- ImageDPIX
- ImageDPIY
- PhysicalImageWidth
- PhysicalImageHeight
- ColorDepth
- Compression

---

## Imail

**File**: imail.rrx  
**Version**: 9.0.1.24  
**Assembly**: dcjmail.CDCjmail  
**Description**: IMAP email import actions - import image attachments from email messages.

### Actions

#### im_login

Specifies the IMAP mail server URL and login credentials.

**Level**: Batch level Open event only.  
**Returns**: True, if the login succeeds. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- hostname
- username
- password

#### im_SetProxy

Allows optional specification of proxy service settings.

**Level**: Any level, typically batch level.  
**Returns**: False, if the proxyPort is not numeric, otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- hostname
- proxyPort
- proxyType
- proxyUsername
- proxyPassword

#### im_scan

Poll the specified mail server for incoming emails with image attachments.

**Level**: Batch level Open event only.  
**Returns**: Returns False if the operation fails, and pauses before returning. Otherwise, True. If no selected emails were available, the action returns True and pauses before returning. Action returns when timeout is reached, or the requested number of emails have been processed.  

**Parameters**: None

#### im_logout

Disconnect from the mail server.

**Level**: Batch level Open or Close event only.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
im_logout()
```

#### im_types

Specifies valid file extensions for attachments to ingest.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- extensions

#### im_reject_types

Specifies file extensions for attachments to reject.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- extensions

#### im_wait_time

Specifies the maximum time to wait for input emails for a single batch.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nSecs

#### im_abort_time

Specifies the delay time before returning when a batch aborts.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nSecs

#### im_max_docs

Specifies maximum number of emails to include in a single batch.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nDocs

#### im_done_folder

Specifies the IMAP folder for successfully imported emails.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- folder

#### im_problem_folder

Specifies the IMAP folder for problem emails.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- folder

#### im_UseSSL

Connect to IMAP Server via SSL encrypted channel

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bUseSSL: A boolean value that enables or disables SSL communication

#### im_StoreEML

Store one .eml file per message, rather than one file per attachment

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bStoreEML: A boolean value that enables storing each email message as an .eml file

#### im_AcceptMixedAttachments

Ingest emails with selected attachment types, even if non-selected attachment types are included

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bMixedOK: A boolean value that enables ingestion of emails with both allowed and disallowed attachment types

#### im_AcceptNoAttachments

Ingest emails without attachments, even if attachment types are specified

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bNoAttachOK: A boolean value that enables ingestion of emails with no attachments

#### im_SortByDate

Sort emails by received date

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bSort: A boolean value that enables or disables sorting of emails before ingestion

---

## Intellocate

**File**: Intellocate.rrx  
**Version**: 9.1.6  
**Assembly**: Datacap.Libraries.Intellocate.Actions  
**Description**: Actions that manipulates zones and assign page types

### Actions

#### SetZones

**Level**: Page level only.  
**Returns**: False if a fingerprint match has not occurred, or if the Document Hierarchy file (.xml) cannot be saved. Otherwise, True.  

**Parameters**: None

#### SetDetailZone

**Level**: Page level only.  
**Returns**: Always True.  

**Parameters**: None

#### AdjustZones

**Level**: Page level only.  
**Returns**: False if a fingerprint match has not occurred and a Template ID value has not been assigned to the current page, or if the Document Hierarchy file cannot be saved. Otherwise, True.  

**Parameters**: None

#### IsPageDataMissing

**Level**: Page level only.  
**Returns**: True if the current page does not have page data. Otherwise, False.  

**Parameters**: None

#### AssignPageType

**Level**: Page level only.  
**Returns**: False if the numeric value cannot be retrieved from the fingerprint database or if there is no connection to the fingerprint database. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- PageType
- ConnectionString

---

## LineItemPagination

**File**: LineItemPagination.rrx  
**Version**: 9.1.0  
**Assembly**: Datacap.Libraries.LineItemPagination.Actions  
**Description**: LineItemPagination Actions for Retrieval of large Number of Line Items

### Actions

#### MoveDetailFilesIntoMain

Move all Detail files into Main file(datafile)

**Level**: Page level only.  
**Returns**: True, if the operation is successful, otherwise False.  

**Parameters**: None

#### DivideDetailsIntoPages

Divide Detail LineItem Section into number of pages

**Level**: Page level only.  
**Returns**: True, if the operation is successful, otherwise False.  

**Parameters**: None

#### JumpToSetOfLineitems

Jump to a Particular Set of Lineitems

**Level**: Page level only.  
**Returns**: False, if the number specified to Jump is invalid or out of range, otherwise True.  

**Parameters**: None

#### DeleteAllDetailPaginations

Delete All of the Details_TMXXXXXX pages from the Batch folder

**Level**: Page level only.  
**Returns**: False, if there are No Detail pages in batch, otherwise True.  

**Parameters**: None

#### PreviousSetOfLineitems

Go To the Previous Set of Lineitems

**Level**: Page level only.  
**Returns**: True, if the operation is successful, otherwise False.  

**Parameters**: None

#### NextSetOfLineitems

Go To the Next Set of Lineitems

**Level**: Page level only.  
**Returns**: True, if the operation is successful, otherwise False.  

**Parameters**: None

---

## mvscan

**File**: mvscan.rrx  
**Version**: 9.1.9.35  
**Assembly**: Datacap.Libraries.mvScan.Actions  
**Description**: MultiThreaded vScan Actions

### Actions

#### set_folder

Specifies the top level folder to search for files to be ingested

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- folderpath: Path to folder containing files to be ingested

#### set_copy_folder

Optional, sets a folder to contain a copy of each ingested file

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- folderpath: Path to folder to contain a copy of each ingested file

#### set_problem_folder

Required, sets folder for any files that cannot be ingested

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- folderpath: Path to folder to contain any files that cannot be ingested

#### scan

Poll the specified folder for files to ingest.

**Level**: Batch level Open event only.  
**Returns**: Returns True. Action returns when timeout is reached, or the requested number of files have been ingested. If no files are ingested, the batch will remain in a pending state. If a serious error occurs, the batch will be placed into an aborted state so the issue can be reviewed.  

**Parameters**: None

#### set_types

Comma-separated list of file extensions to be ingested. Can be specified with or without period. Default is TIF. Overrides set_metadata_types().

**Level**: Batch level Open event only.  
**Returns**: True  
**Smart Parameters**: Supported  

**Parameters**:
- extensions: Comma-separated list of file image file extensions to import

#### set_metadata_types

Specifies metadata trigger file extension or comma-separated list. Overrides set_types().

**Level**: Batch level Open event only.  
**Returns**: True  
**Smart Parameters**: Supported  

**Parameters**:
- extensions: Metadata image file extension(s). If specified, XML metadata files (AKA trigger files) control ingestion of pages into batches, along with associated metadata. If specified, these extensions override any prior call to set_types()

#### set_sort_method

Selects method for sorting files for ingestion

**Level**: Batch level Open event only.  
**Returns**: True  

**Parameters**:
- method: Sort method can be either DATE (default) or NAME. The parameter is not case sensitive.

#### set_wait_time

Specifies interval to wait for additional files to ingest, before finishing a batch which has not reached the specified maximum size or time limits.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nSecs: Time to wait for files to complete a batch.

#### set_abort_time

Specifies delay time if batch aborts

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nSecs: Time to wait before continuing when a serious error occurs.

#### set_move_wait_time

Specifies time to wait for source file to be deleted after move

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nSecs: Number of seconds to wait for source file to be deleted, before failure.

#### set_max_docs

Specifies maximum number of pages in each batch. If Metadata files are used, this is the maximum number of metadata files to import.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nDocs: Number of documents in a batch. Default 100.

#### set_tree_mode

Determines whether subdirectories are included in the scan for files to ingest

**Smart Parameters**: Supported  

**Parameters**:
- bTreeFlag

#### set_delete_empty_folders

Determines whether empty subdirectories will be deleted

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bParam

#### set_min_age

Specifies minimum age of file since last modified

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- nSecs: Number of seconds to wait after file modified before ingesting

#### set_image_validation

Forces TIFF images to be checked before ingesting

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bValidate

#### set_multipage_burst

Forces multipage TIFF images to be split into single pages during ingestion

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bBurst: Nonzero to force bursting of TIFF image files. Default = 0, no bursting.

#### mv_retain_folders

Preserves the directory structure of files in the input folder tree

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- bRetain: Set to True to enable this option, default is False.

---

## Nenu

**File**: nenu.rrx  
**Version**: 9.1.9.36  
**Assembly**: Datacap.Libraries.Nenu.Actions  
**Description**: Logging actions

### Actions

#### LogClear

Clears current Log.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
LogClear()
```

#### LogConfigure

Configures features of aTM logging.

**Level**: Any level.  
**Returns**: True, if logging is successfully configured. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- severity
- filePath
- overwrite
- reflash
- showTime
- showDate
- showSeverity

#### LogWriteRecordSet

Outputs the results of ProcessRunSqlQueryEx to the error log.

**Level**: Any level.  
**Returns**: True, if the write is successful. Otherwise, False.  

**Parameters**: None

#### LogWriteSQLQuery

Outputs the constructed SQL query to the error log.

**Level**: Any level  
**Returns**: True, if the log is successfully written. Otherwise, False.  

**Parameters**: None

#### LogSendEmail

Sends email with log to comma separated list of recipients.

**Level**: Any level.  
**Returns**: True, if the email is sent. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- asattachment
- addressFrom
- addressTo
- subject
- user
- password
- domain
- server
- port

**Example**:
```
LogSendEmail("False","jsmith@somewhere.com", "jdoe@somewhere.com","mmoore@somewhere.com", "", "", "", "", "", "")
```

#### LogWriteEventLog

Writes a message to the Event Log.

**Level**: Any level.  
**Returns**: True, if the event is successfully logged. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- message
- level
- eventID

#### SetupDisconnectAll

Disconnect from all Taskmaster servers.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
SetupDisconnectAll()
```

#### SetupOpenApplication

Creates connection to the application based on default settings.

**Level**: Batch level.  
**Returns**: True, if the application exists in the application service the connection was successful. Otherwise, False.  

**Parameters**: None

#### SetupOpenApplicationEx

Creates connection to the application based on the parameters provided.

**Level**: Batch level.  
**Returns**: True, if the application exists in the application service the connection was successful. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- application
- server
- admin
- engine
- debugFlag
- user
- password
- station

**Example**:
```
SetupOpenApplicationEX("Survey", "", "SurveyAdm.mdb", "SurveyEng.mdb", "False", "", "", "1")
```

#### SetApplication

Specifies the name of the Application used by NENU.

**Level**: Batch level.  
**Returns**: False, if the application name is missing. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- application

#### SetServer

Specifies the name of the Taskmaster Server.

**Level**: Batch level.  
**Returns**: False, if a server name is not specified. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- server

#### SetAdminDB

Specifies the Administration database.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- adminDB

#### SetEngineDB

Specifies the Engine database.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- engineDB

#### SetUser

Action to set a user name to login to the Server.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- user

#### SetPassword

Action to set password to connect to the Server.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- password

#### SetStation

Action to set station ID to connect to the Server.

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- station

#### ProcessChangeBatchStatus

Changes the status of one or more batches.

**Level**: Batch level.  
**Returns**: True, if the batch status is successfully changed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- newStatus

#### ProcessChangeBatchStatusOrder

Changes batch status and order.

**Level**: Batch level.  
**Returns**: True, if the batch status is successfully changed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- newStatus
- newOrder

**Example**:
```
ProcessChangeBatchStatusOrder("hold", "1")
```

#### ProcessChangeBatchStatusTaskOrder

Changes batch status, task and order.

**Level**: Batch level.  
**Returns**: True, if the batch status is successfully changed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- newStatus
- newOrder
- newTask

#### ProcessClearAuditTable

Clears the Audit table located in the admin database.

**Level**: Any level.  
**Returns**: True, if the table is cleared. Otherwise, False.  

**Parameters**: None

**Example**:
```
ProcessClearAuditTable("")
```

#### ProcessClearDebugTable

Clears the Debug table located in the engine database.

**Level**: Any level.  
**Returns**: True, if the table is cleared. Otherwise, False.  

**Parameters**: None

**Example**:
```
ProcessClearDebugTable("")
```

#### ProcessDeleteTaskStatsData

Delete records from Taskstats table.

**Level**: Any level.  
**Returns**: True, if the data deleted successfully. Otherwise False.  

**Parameters**:
- deleteOrphanData: True deletes the records from TaskStats table which are orphan. Orphan records means those records in TaskStats table whose related data from the main tables are already deleted or does not exists.
- station: Optional. If orphan data from TaskStats table to be deleted from specific station. In case nothing is provided then orphan records will be deleted from Taskstats table irrespective of station value.
- taskOperator: Optional. If orphan data from TaskStats table to be deleted which belongs to specific task operator. In case nothing is provided then orphan records will be deleted from Taskstats table irrespective of Task Operator value.
- job: Optional. If orphan data from TaskStats table to be deleted from specific task job for e.g Main Job. In case nothing is provided then orphan records will be deleted from Taskstats table irrespective of Job value.

#### ProcessDeleteBatchesEx

Delete selected batches.

**Level**: Any level.  
**Returns**: True, if the batches are deleted. Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- deleteSubFolders
- preserveEngineDBRecords

#### ProcessDeleteBatchesInBulk

Delete selected batches.

**Level**: Any level.  
**Returns**: True, if the batches are deleted. Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- deleteSubFolders
- preserveEngineDBRecords
- detailDebugLog

#### ProcessMoveBatchesEx

Move selected batches to folder specified in the parameter.

**Level**: Any level.  
**Returns**: True, if the batches are successfully moved. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- pathTo
- moveSubFolders
- preserveEngineDBPaths
- continueOnError

#### ProcessMoveDBRecords

Creates connection to the application based on the parameters provided and moves selected database data to this application.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- application
- server
- admin
- engine
- debugFlag
- user
- password
- station
- deleteOriginal
- targetDBSQLSeparator

#### ProcessResetPendingOrNotify

Resets all selected batches to 'Pending' status.

**Level**: Any level.  
**Returns**: True, if the email is sent. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- threshold
- asattachment
- addressFrom
- addressTo
- subject
- user
- password
- domain
- server
- port

#### ProcessRunSqlQueryEx

Runs the previously defined NENU query.

**Level**: Any level.  
**Returns**: True, if the query is successful and the number of batches identified is within range of specified parameters. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- minRecords
- maxRecords

#### ReportQueryTMUsage

Update the ReportUser Database with the current users.

**Level**: Any level.  
**Returns**: True, if the database update was successful. Otherwise, False.  

**Parameters**: None

**Example**:
```
ReportQueryTMUsage("")
```

#### ReportSetReportingTable

Sets database that contains reports on all processed batches

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- tbName
- batchColumn
- attemptColumn
- doneColumn
- actionColumn

#### ReportSetUsageDBTable

Sets database that contains reports on users logged in to TM

**Level**: Batch level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- tbName
- ipAddressColumn
- jobIDColumn
- portColumn
- processedBathcesColumn
- stationColumn
- taskIDColumn
- userIDColumn
- queryTimeColumn

#### QuerySetSeparator

Sets SQL Date and Time Separator for SQL queries.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- separator

**Example**:
```
QuerySetSeparator("#")
```

#### QuerySetDateFormat

Sets custom Date format for SQL queries.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- dateFormat

**Example**:
```
QuerySetDateFormat("dd-MMM-yy")
```

#### QuerySetDateTimeFormat

Sets custom DateTime format for SQL queries.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- dateTimeFormat

**Example**:
```
QuerySetDateFormat("dd-MMM-yy hh:mm:ss tt")
```

#### QueryClear

Clears the SQL query.

**Level**: Any level.  
**Returns**: True, if the query is cleared. Otherwise, False.  

**Parameters**: None

**Example**:
```
QueryClear("")
```

#### QuerySetJobID

Sets the Job ID for the SQL query.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- jobid

#### QuerySetTaskID

Sets the Task ID for the SQL query.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- taskid

#### QuerySetStatus

Sets the Task status for the SQL query.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- status

#### QuerySetPriority

Sets the Priority for the SQL query.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- priority

#### QuerySetBranch

Sets the minimum number of children for the SQL query.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- children

#### QuerySetOperator

Sets the operator for the SQL query.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- operator

#### QuerySetStation

Sets the station for the SQL query.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- station

#### QuerySetDateRange

Sets Date range for SQL query.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- start
- end
- queryAgeStart

#### QuerySetAge

Selects batches based on age using a date or number of seconds.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- age
- queryAgeStart

#### QuerySetGeneric

Builds an SQL query using the provided column name and value.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- column
- value

#### QuerySetBatchRange

Sets range of batches for SQL query.

**Level**: Any level.  
**Returns**: True, if the query has been successfully set. It does not mean the query has been performed. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- start
- end

#### ProcessInjectBatches

Injects the data from master batch to all batches selected and updates DB.

**Level**: Any level.  
**Returns**: True, if all the all the batches were successfully set. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- masterBatchID

---

## ocr_sr

**File**: ocr_sr.rrx  
**Version**: 9.1.10.43  
**Assembly**: Datacap.Libraries.ScansoftR.Actions  

### Actions

#### SetEngineTimeoutOCR_S

**Level**: Page or Field.  
**Returns**: False if the parameter is not numeric or less than 1. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Seconds

#### SetOutOfProcessTimeoutOCR_S

**Level**: Page or Field.  
**Returns**: False if the parameter is not numeric or less than 1. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Seconds

#### RecognizeFieldOCR_S

**Level**: Field level.  
**Returns**: False if the ruleset with this action is not bound to a Fieldobject of the Document Hierarchy. Otherwise, True.  

**Parameters**: None

**Example**:
```
RecognizeFieldOCR_S()
```

#### RecognizeFieldVoteOCR_S

**Level**: Field only.  
**Returns**: False if the ruleset with this action is not bound to a Field object of the Document Hierarchy. Otherwise, True.  

**Parameters**: None

#### RecognizePageOCR_S

**Level**: Page only.  
**Returns**: False if the ruleset with this action is not bound to a Pageobject of the Document Hierarchy. Otherwise, True.  

**Parameters**: None

#### Recognize

**Level**: Page only.  
**Returns**: False if the ruleset with this action is not bound to a Pageobject of the Document Hierarchy. Otherwise, True.  

**Parameters**: None

#### RecognizePageFieldsOCR_S

**Level**: Page only.  
**Returns**: False if the ruleset with this action is not bound to a Pageobject of the Document Hierarchy. Otherwise, True.  

**Parameters**: None

#### RecognizeToPDFOCR_S

**Level**: Document and Page only.  
**Returns**: False if the rule with this action is not applied to a document or page object, and/or if the parameters are not in the valid range. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- OutputPDFType

#### RotateImageOCR_S

**Level**: Page only.  
**Returns**: False if the ruleset with this action is not bound to a Pageobject of the Document Hierarchy, or if the action cannot locate the image file representing the current page. Otherwise, True.  

**Parameters**: None

#### RotateImageExOCR_S

**Level**: Page level.  
**Returns**: False if the ruleset with this action is not bound to a Pageobject of the Document Hierarchy, or if the action cannot locate the image file specified in the first parameter, or if the rotation mode specified is not within the valid set of values. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- ImagePath: Path to the image file to rotate. If left blank, the current page image file is used by default.
- RotationMode: Type of rotation to apply to the image. Valid values are 0 (Auto), 1 (No Rotation), 2 (90 degree rotation, clockwise), 3 (180 degree rotation, clockwise), 4 (90 degree rotation, counter-clockwise). If left blank, 0(Auto) is used by default.

#### RecognizeToFileOCR_S

**Level**: Page or Document.  
**Returns**: False if a ruleset with this action is bound to a Fieldobject of the Document Hierarchy, or if the parameter is not numeric. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FileType

#### SetOutOfProcessLoggingOCR_S

**Level**: Page or Field.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- EnableLogging

#### SetupAutomaticRetryOCR_S

**Level**: Document, Page or Field.  
**Returns**: False, if the input parameter is invalid, otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- retryCount
- timeout

#### SetRecognitionFailureRetryDelayOCR_S

**Level**: Document, Page or Field.  
**Returns**: False, if the input parameter is invalid, otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- RetryDelay

#### SetContinueOnFailureOCR_S

**Level**: Page or Field.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- ContinueOnFailure

#### UseOutOfProcessRecogOCR_S

**Level**: Page or Field.  
**Returns**: False if the parameter is not numeric or less than 1. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- UseOutOfProcessRecog

#### ReleaseEngineOCR_SR

**Level**: All  
**Returns**: Always True.  

**Parameters**: None

---

## PictureCharacterValidation

**File**: PictureCharacterValidation.rrx  
**Version**: 9.1.7.2  
**Assembly**: Datacap.Libraries.PictureCharacterValidation.Actions  
**Description**: Valdate fields using type patterns

### Actions

#### ApplyPictureString

**Level**: Field level.  
**Returns**: False, if called at the wrong level, if the picture string is longer than the field value or if the field fails the picture string validation. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- PictureString

#### FilterPictureFields

**Level**: All levels.  
**Returns**: Always True. The return value does not reflect if fields have passed or failed validation. This action can operate on multiple fields with a single call, determined by the parent DCO object that is associated with the ruleset that contains this action. This action will process all of child fields and update the field text and confidence values based on the picture string as described in the details section. The results will be shown to the user in a verification panel and can be acted on by subsequent actions on a field by field basis.  

**Parameters**: None

#### FormatPictureFields

**Level**: All levels.  
**Returns**: Always True. The return value does not reflect if fields have passed or failed validation. This action can operate on multiple fields with a single call, determined by the parent DCO object that is associated with the ruleset that contains this action. This action will process all of child fields and update the field text and confidence values based on the picture string as described in the details section. The results will be shown to the user in a verification panel and can be acted on by subsequent actions on a field by field basis.  

**Parameters**: None

#### SetPictureCharacters

**Level**: Any level.  
**Returns**: False, if the parameter input is invalid. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- PictureID
- ValidCharacters

#### ValidatePictureField

**Level**: Field level only.  
**Returns**: False if the field value does not satisfy the field's Picture String criteria. Otherwise True.  

**Parameters**: None

---

## RuleRunnerLogic

**File**: RuleRunnerLogic.rrx  
**Version**: 9.1.10.11  
**Assembly**: Datacap.Libraries.RuleRunnerLogic.Actions  
**Description**: Actions that help control application logic within rulesets

### Actions

#### AddServerGroupToBatch

Assigns a server group to the current batch for use with role-based filtering.

**Level**: Any level  
**Returns**: True if given group can be assigned to the current batch. Otherwise False. If errors happen while attempting to validate the group False is returned. If the parameter IgnoreErrors is True, then the action always returns true.  
**Smart Parameters**: Supported  

**Parameters**:
- GroupName
- IgnoreFailure

#### GoToNextFunction

Always returns false so control will pass to the next function in the rule.

**Level**: All.  
**Returns**: Always False.  

**Parameters**: None

#### IncrementVariable

Adds a numeric value to a DCO variable.

**Level**: All.  
**Returns**: Returns False, if the Amount is not a valid number for the current locale, if an error occurs adding the value or if the Target specification is invalid. Otherwise, True. If the source value is not numeric or does not exist, it will be considered as an initial value of 0 and is not considered an error.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- Amount

#### IsBatchSetToAbort

Returns true if the task has been set to abort due to an eariler action.

**Level**: Any level  
**Returns**: True if the task has been set to abort. Otherwise False.  

**Parameters**: None

#### IsValidServerGroup

Returns true if the provided server group name is valid.

**Level**: Any level  
**Returns**: True if given group can be assigned to the current batch. Otherwise False. If errors happen while attempting to validate the group False is returned.  
**Smart Parameters**: Supported  

**Parameters**:
- GroupName

#### MessageSetTextAndID

Allows for translatable messages that are displayed for failed fields.

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Message
- MessageID

#### MessageSetRuntimeParameter

Allows variable substitution in a user message.

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- TextToPlaceInMessageOrID
- Type
- Index

#### MessageClear

Clears the failure message displayed to the user in the verify panel for this object.

**Level**: All.  
**Returns**: Always True.  

**Parameters**: None

#### MessageSetText

Displays the specified text to the user in the verify panel for failed validations.

**Level**: All, but usually the Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Message

#### NumericMaximum

Given two numeric values, the larger value is saved in the target location.

**Level**: All.  
**Returns**: Returns False, if an error occurs. Otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- Number1
- Number2
- Target

#### NumericMinimum

Given two numeric values, the smaller value is saved in the target location.

**Level**: All.  
**Returns**: Returns False, if an error occurs. Otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- Number1
- Number2
- Target

#### NumericRound

Rounds the target variable to the number of decimal places specified.

**Level**: All.  
**Returns**: Returns False, if the specified target is not a valid number, if the target is invalid or if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- DecimalPlaces

#### NumericTruncate

Truncates a numeric value, removing the decimal portion.

**Level**: All.  
**Returns**: Returns False, if the specified target is not a valid number, if the target is invalid or if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### rrAppend

Appends text to the end of a value.

**Level**: All  
**Returns**: False if the action cannot locate the target object. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Source
- Target

#### rrCompare

Compares two values and returns true if they are identical.

**Level**: All.  
**Returns**: False if the compared values do not match. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Text1
- Text2

#### rrCompareCase

Compares two values and returns true if they are identical. Case sensitivity can be enabled or disabled.

**Level**: All.  
**Returns**: False if the compared values do not match. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Text1
- Text2
- CaseSensitive

#### rrCompareCaseLength

Compares two values and returns true if they are identical. Case sensitivity and the number of characters to compare can be controlled.

**Level**: All.  
**Returns**: False if the compared values do not match. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Text1
- Text2
- CaseSensitive
- Length
- FromStart

#### rrCompareNot

Compares two values and returns false if they are identical.

**Level**: All.  
**Returns**: True if the compared values do not match. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Text1
- Text2

#### rrCompareNotCase

Compares two values and returns false if they are identical. Case sensitivity can be enabled or disabled.

**Level**: All.  
**Returns**: True if the compared values do not match. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Text1
- Text2
- CaseSensitive

#### rrCompareNotCaseLength

Compares two values and returns false if they are identical. Case sensitivity and comparison length can be controlled.

**Level**: All.  
**Returns**: True if the compared values do not match. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Text1
- Text2
- CaseSensitive
- Length
- FromStart

#### rrCompareNumeric

Compares two numeric values and returns true if they meet the requirements of the comparison operator.

**Level**: All.  
**Returns**: False if the parameters to compare are not numeric, if operator is not specified or if the condition is not satisfied, else will return True.  
**Smart Parameters**: Supported  

**Parameters**:
- Number1
- Operator
- Number2

#### rrContains

Returns true if the text is a sub-string of a source text.

**Level**: All.  
**Returns**: True if the value of "SearchForValue" is found in the value of "SearchInValue". Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- SearchForValue
- SearchInValue
- CaseSensitive

#### rrGet

Obtains the value of the parameter and stores it in the text value of the current object.

**Level**: All.  
**Returns**: False the parameter is missing. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Source

#### rrPrepend

Appends text to the start of a value.

**Level**: All  
**Returns**: False if the action cannot locate the target object. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Source
- Target

#### rrSet

Copies a value from one locate to another location.

**Level**: All.  
**Returns**: False if the action cannot locate the target object. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Source
- Target

#### SetBatchPriority

Changes the priority for the current batch.

**Level**: All.  
**Returns**: False if the value of the argument is invalid. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Priority

#### SetIsOverrideable

Controls the ability for a verify panel operator to submit a batch that has a failed field.

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- AllowOperatorOverride

#### SetOperatorID

Changes the ID of the operator running the task.

**Level**: All.  
**Returns**: False if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- OperatorID

#### SetReturnValue

Returns true or false based on the parameter.

**Level**: All.  
**Returns**: True, if the action is passed the parameter 'true'. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- ReturnValue

#### SetStationID

Changes the current station ID to a new station ID.

**Level**: All.  
**Returns**: False if setting the value throws an error. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- StationID

#### SetTaskAbortBatch

Sets the current task to an Abort status.

**Level**: All.  
**Returns**: Always True.  

**Parameters**: None

#### SetTaskStatus

Overrides the final status of the task.

**Level**: All.  
**Returns**: False if the parameter is not a valid status value. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- TaskStatus

#### SkipChildrenObjectsAndRules

Prevents rules from being run on any of the current object's children objects.

**Level**: All.  
**Returns**: Always True.  

**Parameters**: None

#### StatusPreserveOff

Allows the status of an object to be set by the final return value of a rule.

**Level**: All.  
**Returns**: Always True.  

**Parameters**: None

#### StatusPreserveOn

Prevents the return value of a rule from changing an object's status.

**Level**: All.  
**Returns**: Always True.  

**Parameters**: None

#### TaskNumberOfSplits

Configures the split count to allow a batch to branch the workflow.

**Level**: All.  
**Returns**: False if the parameter you enter is not Numeric. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- NumberOfSplits

#### TaskRaiseCondition

Controls the next step when a batch is branching to a new workflow.

**Level**: All.  
**Returns**: False if either parameter is not Numeric. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- ChildBatchIndex
- ChildBatchCondition

---

## SplitBatch

**File**: SplitBatch.rrx  
**Version**: 9.1.7.1  
**Assembly**: Datacap.Libraries.SplitBatch.Actions  
**Description**: Creates child batches from an existing batch.

### Actions

#### SplitBatch

**Level**: Batch level only.  
**Returns**: False if an error occurs such as a file that could not be created, etc., and the batch will be set to abort. Otherwise True. If the specified variable is not found in any documents or unbound pages, meaning there is nothing to split, the action is still considered to be successful and will return true. Each child batch split off will generate a condition, which should be configured for Split in the workflow. Any page or document with a blank value for the splitting value will remain in the original "parent" batch.  
**Smart Parameters**: Supported  

**Parameters**:
- SplitIndicatorVariable

---

## Statistics

**File**: Statistics.rrx  
**Version**: 9.1.9.10  

### Actions

#### SaveFieldsText

Save recognized page types and field values after recognition, for accuracy calculations.

**Level**: Batch level.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
SaveFieldsText()
```

#### CompareFieldsText

Calculates page type classification and field recognition accuracy statistics and updates database report tables.

**Level**: Batch level.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
CompareFieldsText()
```

#### IsBatchAborted

Reports if batch is set to abort.

**Level**: Any level.  
**Returns**: True if the batch is set to abort, else False.  

**Parameters**: None

**Example**:
```
IsBatchAborted()
```

#### AddToDBTotals

**Level**: Batch level.  
**Returns**: Always True.  

**Parameters**: None

---

## TiffMultipageMerge

**File**: TiffMultipageMerge.rrx  
**Version**: 9.1.9.2  
**Assembly**: Datacap.Libraries.TiffMultipageMerge.Actions  
**Description**: Merges multiple image into a single multiple page TIFF image.

### Actions

#### AddCurrentPageImageToMultiplePageTIFFImage

Adds each single image to the multi-Image file.

**Level**: Page level.  
**Returns**: False if the action is not called on a rule attached to a page object or if the corresponding image file for the current page cannot be found or is not successfully added to the destination image. Otherwise, True.  

**Parameters**: None

#### MergeToMultiplePageTIFFImage

Merges all pages under a document or batch object into a single multi-page TIFF.

**Level**: Batch or Document.  
**Returns**: False if the action cannot create the multi-Image file or if there are no eligible pages to merge. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- TypesToMerge

#### SetMergeOutputDirectory

Sets the path for the image file.

**Level**: All.  
**Returns**: False if the specified drive does not exist or the path cannot be created. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- OutputDirectory

#### SetMergeFileName

Sets the name of the multi-Image file (.tif) to be created.

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- MultiPageFileName

#### SetPreserveCompression

Determines the output compression type for merged images.

**Level**: Any.  
**Returns**: True.  
**Smart Parameters**: Supported  

**Parameters**:
- PreserveCompression

#### SetStatusToIncludeOrExclude

Filters merged pages based on the page and document status.

**Level**: Any.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- AcceptablePageStatuses
- DisregardPageStatuses
- AcceptableDocStatuses
- DisregardDocStatuses

---

## ValidationsAndTextAdjustments

**File**: ValidationsAndTextAdjustments.rrx  
**Version**: 9.1.9.7  
**Assembly**: Datacap.Libraries.ValidationsAndTextAdjustments.Actions  
**Description**: Description of action library

### Actions

#### AddAllLineitemTaxesToTaxField

Adds all tax values from detail structure into Tax field.

**Level**: The close event of TaxLineitem detail field in APT.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
AddAllLineitemTaxesToTaxField()
```

#### AddPaddingCharacterToStart

Extends a field or variable to a specified length using a specific padding character.

**Level**: Any Level.  
**Returns**: False if one of the parameters is invalid or if the target string specified is invalid; otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- PadCharacter
- MaximumLength

#### AddPaddingCharacterToEnd

Extends a field or variable to a specified length using a specific padding character.

**Level**: Any Level.  
**Returns**: False if one of the parameters is invalid or if the target string specified is invalid; otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- PadCharacter
- MaximumLength

#### AddToErrorMessage

**Level**: Field level.  
**Returns**: Always False.  
**Smart Parameters**: Supported  

**Parameters**:
- p1: Error message text.

**Example**:
```
AddToErrorMsg("Vendor Number cannot be blank.")
```

#### AddToLineItemDetailErrorMessage

**Level**: Field level. Specifically, it must be a line item detail field.  
**Returns**: Always False.  
**Smart Parameters**: Supported  

**Parameters**:
- p1: Error message text.

**Example**:
```
AddToLineItemDetailErrorMessage("Description cannot be blank.")
```

#### AllowOnlyCharacters

Filters out characters not contained in the allowed set.

**Level**: Field level.  
**Returns**: False, if called on the wrong level. Otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- AllowedCharacters

#### AlterDateByDay

Adds or subtracts days from a date text.

**Level**: Field level.  
**Returns**: Always, True.  
**Smart Parameters**: Supported  

**Parameters**:
- target: A smart parameter that specifies the target field or variable to update.
- days: The number of days to add to the date.

#### CalculateDateDifference

Calculates a date difference in days, months, quarters or years.

**Level**: Any level.  
**Returns**: False, If the format of either date is invalid. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- StartDate
- EndDate
- TargetVariable
- DateProperty

#### CalculateFields

Performs numeric calculations on fields and evaluates the result.

**Level**: Page or Field level.  
**Returns**: True if the expression evaluates to True. False if the expression evaluates to False or the expression is not valid (eg. a field's value is not numeric).  
**Smart Parameters**: Supported  

**Parameters**:
- Equation
- DecimalDigits
- PreserveStatus

#### CalculateInvoiceTotal

Determines if the Total field is within the tolerance for the data on the page.

**Level**: Must be called on the invoice total field.  
**Returns**: True if the Details, Tax and Shipping fields add up to the Total field value within the specified tolerance value. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Tolerance

#### CalculateLineItemQuantityAndPrice

Determines if the LineTotal field is correct.

**Level**: Must be called on the Invoice_Total field.  
**Returns**: False if the Qty, Price or LineTotal fields do not contain a numeric value.True if the Qty * Price matches the LineTotal value within the specified tolerance. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Tolerance

#### ChangeTextToMixedCase

Changes the text so the first letter of every word is upper-case.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target: A smart parameter that specifies a variable or field.

#### CheckAndSetCurrencyDecimalToPeriod

Changes currency values to have a period decimal separator.

**Level**: Field level.  
**Returns**: False, if an error occurs. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- target: A smart parameter that references a field or variable.

#### CheckSubFields

Checks values in a lineitem.

**Level**: Field level. The parent of the LINEITEM field.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Expression

#### ClearErrorMessage

Removes any previous error messages.

**Level**: Any level.  
**Returns**: Always True.  

**Parameters**: None

#### ConvertFieldToCurrency

Formats a numeric field as currency without a currency symbol.

**Level**: Field level.  
**Returns**: True if the text value is numeric and greater than one character. Otherwise, False.  

**Parameters**: None

#### ConvertToLowerCase

Converts text in a field or variable to lower case.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### ConvertToUpperCase

Converts text in a field or variable to upper case.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### CreateGUID

Creates a globally unique identifier

**Level**: Any level.  
**Returns**: True, if successful, otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### DeleteAllCharactersAlphabetic

Deletes alphabetic characters from a field or variable.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### DeleteAllCharactersMatchingExpression

Deletes all characters in a field or variable that match a regular expression.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- RegularExpression

#### DeleteAllCharactersMiscellaneous

Removes a range of ASCII values from a field or variable.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### DeleteAllCharactersNumeric

Removes all numeric characters from a field.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### DeleteAllCharactersPunctuation

Removes punctuation characters from a field or variable.

**Level**: Any level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### DeleteAllCharactersSelected

Deletes specific characters from a field text value.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- CharactersToDelete
- StartIndex
- Count

#### DeleteAllCharactersSystem

Removes control characters from a field or variable.

**Level**: Any level.  
**Returns**: True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### DeleteLowConfidenceSpaces

Removes spaces from a text field value based on their confidence.

**Level**: Field level.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
DeleteLowConfidenceSpaces()
```

#### FormatNumberToLocale

Guesses at the current numeric format to change a numeric value to match the current locale formatting.

**Level**: Field level.  
**Returns**: True if no errors are encountered. Otherwise, False.  

**Parameters**: None

#### GetSubstringOccurrenceCount

Counts the number of times a character, or substring, occurs within the text.

**Level**: Any level.  
**Returns**: False, if an error occurs, otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- TextToSearch
- Substring
- StorageVariable
- CaseSensitive

#### GetTextLength

Places the numeric length of a text string into a variable.

**Level**: Any level.  
**Returns**: False, if an error occurs, otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- TestString
- StorageVariable

#### GetWorkstationLocale

**Level**: Any level.  
**Returns**: False, if an error occurs, otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- StorageVariable

#### InsertCharacters

Inserts one or more characters into a field text value at a specific position.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- InsertString
- StartIndex
- Count

#### InsertDecimalPoint

Inserts the current locale's decimal separator at a specified position in a field text value.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Position

#### IsDocumentUsingCommaDecimalSeparators

Returns true if the current document has numbers using commas as decimal separators.

**Level**: Any level.  
**Returns**: Returns True if most numerics use a comma as a decimal separator, otherwise False is returned.  

**Parameters**: None

#### IsFieldCurrency

Returns true if the current field's text value is a valid currency for the current locale.

**Level**: Field level.  
**Returns**: True if the current locale's format criteria are met. Otherwise, False.  

**Parameters**: None

#### IsFieldDate

Determines if the current field's text value matches the current locale's default date format.

**Level**: Field level.  
**Returns**: True if the field value matches the date format for the locale. Otherwise, False.  

**Parameters**: None

#### IsFieldDateEqualOrAfter

Returns true if the current field is equal to or after the specified date.

**Level**: Field level.  
**Returns**: False if the date condition is not met, if the action is not applied at the Field level, or either field does not contain a valid date. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Date

#### IsFieldDateEqualOrBefore

Returns true if the current field is equal to or before the specified date.

**Level**: Field level.  
**Returns**: False if the date condition is not met, if the action is not applied at the Field level, or either field does not contain a valid date. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Date

#### IsFieldDateWithinRange

Returns true if the current field text value is between the specified dates.

**Level**: Field Level.  
**Returns**: False if the current field text is not a valid date; if either parameters are not validate dates; or the Text property's Date value is not within the range specified by the parameters. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- StartDate
- EndDate

#### IsFieldDateWithinXDays

Returns true if the current field text value is near the specified date within the day count limit.

**Level**: Field level.  
**Returns**: Falseif the field's value is not a valid date or if the date is out side of the number of days in the parameter; otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Days

#### IsFieldDateWithReformat

Returns true if the field is a valid date that matches the current locale date format and reformats it to a new date pattern.

**Level**: Field level.  
**Returns**: False if the parameter is invalid, or the current field value is not a valid date given the specified format. Otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- NewDateFormat

#### IsFieldPercentAlphabetic

Returns true if a field's text value has the specified percentage of alphabetic characters

**Level**: Field level.  
**Returns**: True if the parameter's minimum requirement is met. Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- Percentage

**Example**:
```
IsFieldPercentAlpha("50") #RPR-1421 returns False IsFieldPercentAlpha("30") #RPR1421 returns True
```

#### IsFieldPercentNonNumeric

Returns true if a field's text value has the specified percentage of non-numeric characters

**Level**: Field level.  
**Returns**: True if the parameter's minimum requirement is met. Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- Percentage

#### IsFieldPercentNumeric

Returns true if a field's text value has the specified percentage of numeric characters

**Level**: Field level.  
**Returns**: True if the parameter's minimum requirement is met. Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- Percentage

#### IsInCharacterSet

Tests that the text only contains characters within the specified list.

**Level**: Any level.  
**Returns**: True if the referenced text contains only characters from the listed character set or if the field is empty. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- CharacterSet
- TextToTest

#### IsLocalDecimalSeparator

Tests the current decimal separator.

**Level**: Any level.  
**Returns**: True if the specified character is the current decimal separator. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- TestChar

#### IsOMRCheckedMaximum

Returns true if the current OMR field has detected selections up to the specified maximum.

**Level**: An OMR Field.  
**Returns**: False if the parameter you enter is not numeric, or the field is not an OMR field.True if the number of OMR boxes checked is less than or equal to the parameter you entered.  
**Smart Parameters**: Supported  

**Parameters**:
- OMRLimit

#### IsOMRCheckedMinimum

Returns true if the current OMR field has detected selections of the specified minimum value.

**Level**: An OMR Field.  
**Returns**: False if the parameter you enter is not numeric, or the field is not an OMR field.True if the number of OMR boxes checked is less than or equal to the parameter you entered.  
**Smart Parameters**: Supported  

**Parameters**:
- OMRLimit

#### IsRegularExpressionPatternInValue

Returns true if a field or variable has a pattern that matches the regular expression.

**Level**: All, but generally at the Field level.  
**Returns**: True if the pattern is found within the field. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- RegularExpression

#### IsUSZipCode

Checks to see if the postal code follows a US format.

**Level**: Any level.  
**Returns**: Returns True if the test for a US ZIP code format passes, otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- PostalCode: Smart parameters are supported.

#### IsValuePercentFuzzy

Returns true if the current field text value matches a pattern using common substitution characters.

**Level**: All but usually field level.  
**Returns**: True, if the pattern matches the source based on the matching requirements, otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Source
- CompareTo
- PerformFuzzyCompare
- MinimumPercentage
- MatchByWord

#### IsTextLength

Returns true if the text in a field or variable satisfies a length condition.

**Level**: Any level but typically at the field level.  
**Returns**: True if the comparison meets the length requirement; Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- Length
- ComparisonOperator

#### IsValueLessOrEqual

Returns true if a numeric comparison on a field or variable is less than or equal to the comparison value.

**Level**: Any level but typically at the field level.  
**Returns**: True if the two values meet the comparison requirement; Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- ComparisonValue

#### IsValueLessOrGreater

Returns true if a numeric comparison on a field or variable meets the condition for the comparison value.

**Level**: Any level but typically at the field level.  
**Returns**: True if the two values meet the comparison requirement; Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- ComparisonValue
- ComparisonOperator

#### IsValueExactMatch

Returns true if the field or value matches the comparison value with our without case sensitivity.

**Level**: All, but generally at the Field level.  
**Returns**: False if the object's target does not contain the parameter's value. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- Value
- CaseSensitive

#### IsValueInText

Returns true if the specified text is a substring text in a field or variable

**Level**: All, but generally at the Field level.  
**Returns**: False if the object's target does not contain the parameter's value. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- Value
- CaseSensitive

#### ReplaceBlankFieldWithCharacter

If the current field is blank, the specified character will be placed into the field.

**Level**: Field level.  
**Returns**: False if it is called at the wrong level or if the parameter is missing, otherwise True.  
**Smart Parameters**: Supported  

**Parameters**:
- Replacement

#### ReplaceCharacters

Replaces specific characters in a field to a replacement character.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Find
- Replacement
- Count

#### ReplaceSubstringFirst

Replaces the First occurance of a substring in a text string with a new substring.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- TextToSearch
- Substring
- Replacement
- CaseSensitive

#### ReplaceSubstringLast

Replaces the last occurance of a substring in a text string with a new substring.

**Level**: All levels.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- TextToSearch
- Substring
- Replacement
- CaseSensitive

#### ReplaceValueAtPosition

Replaces a character in a field at a specific position with a replacement character.

**Level**: Field level.  
**Returns**: True if the character replacement is successful. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Position
- Replacement

#### SetAllFieldLabels

Sets the label display variables from an INI file.

**Level**: Any level, but will only process fields that are descendants of the object upon which you place the action, and the object itself (if it is a field object). Typically, this action would be called at the batch level to ensure that all fields are set within the batch.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- INIFileName: The full path to the INI file containing the field labels.
- AddMissingEntries: True adds the missing entries into the INI file, False will not.

#### SetFieldStatusMessage

A message that appears in verify clients

**Level**: Field level.  
**Returns**: Always False.  
**Smart Parameters**: Supported  

**Parameters**:
- Message: The message to display.

#### SplitFieldValuePreserveStart

Truncates a fields value starting at a specific string or character, keeping the beginning text in the field.

**Level**: Field level.  
**Returns**: True if the separator character is found. Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- SplitAt
- CaseSensitive

#### SplitFieldValuePreserveEnd

Truncates a fields value starting at a specific string or character, keeping the ending text in the field.

**Level**: Field level.  
**Returns**: True if the separator character is found. Otherwise False.  
**Smart Parameters**: Supported  

**Parameters**:
- SplitAt
- CaseSensitive

#### SplitTextIntoVariables

Breaks a field or variable, using a specified character, into multiple DCO variables with each split segment.

**Level**: Any level.  
**Returns**: False if there is an error or if one of the parameters is invalid. Returns true if the text is successfully split. If the field is empty, the action still returns true and the count of variables created will be 0. No additional variables will be created. If the split character is not found in the source string, only one variable will be created which will contain the entire source string and the action will still return true.  
**Smart Parameters**: Supported  

**Parameters**:
- TextToSplit
- NewVariableName
- SplitCharacter

#### SumFields

Sums children of a DCO object that match the specified name.

**Level**: The parent object that contains the child fields or variables that will be summed.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- TypeOrVariable

#### SwitchMMDD

Removes leading or trailing spaces from a field or variable.

**Level**: Field level.  
**Returns**: True, if two separators are found and the values are swapped. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Target: A smart parameter that references a variable or field.
- Separator: The date separator.

#### TrimSpaces

Removes leading or trailing spaces from a field or variable.

**Level**: Any level.  
**Returns**: False if the parameter target does not resolve to field text or to a DCO variable. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target

#### TruncateFromEnd

Truncates a field or variable to the length specified, removing the text on the end.

**Level**: Any level.  
**Returns**: False if the length parameter is not Numeric or if the target does not resolve to field text or to a DCO variable. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- Length

#### TruncateFromStart

Truncates a field or variable to the length specified, removing the text on at the start.

**Level**: Any level.  
**Returns**: False if the length parameter is not Numeric or if the target does not resolve to field text or to a DCO variable. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Target
- Length

---

## VoteUsingComparativeText

**File**: VoteUsingComparativeText.rrx  
**Version**: 9.1.7.1  
**Assembly**: Datacap.Libraries.VoteUsingComparativeText.Actions  
**Description**: Actions that increase or decrease character confidence based on two sets of field data that should be identical.

### Actions

#### ClearAlternateText

Clears character and confidence values from the alternate text index specified by the parameter.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Index

#### PropagateToAlternateText

Copies the character and confidence values from the field's primary index to the index specified by the parameter.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Index

#### VoteField

Checks to see if the data entered for by the first Data Entry operator or recognition, matches the second value.

**Level**: Field level.  
**Returns**: False if the values do not match. Otherwise, True.  

**Parameters**: None

---

## ZonesAndLineItems

**File**: ZonesAndLineItems.rrx  
**Version**: 9.1.10.5  
**Assembly**: Datacap.Libraries.ZonesAndLineItems.Actions  
**Description**: Work with zones and line items.

### Actions

#### AdjustMergedCCOPositions

Adjusts positions in a merged CCO.

**Level**: Page level.  
**Returns**: False if the current document does not consist of more than one source page, or if a page to be merged did not have an associated CCO file created. Otherwise, True.  

**Parameters**: None

**Example**:
```
AdjustMergedCCOPositions()
```

#### AdjustZoneBottomToImageBottom

Expands the zone to the bottom of the current image.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- UseCCO: True: Use the CCO boundaries, False: Use the current image boundaries.

**Example**:
```
AdjustZoneBottomToImageBottom("True")
```

#### AdjustZoneLeftToImageLeft

Expands the zone to the left of the current image.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- UseCCO: True: Use the CCO boundaries, False: Use the current image boundaries.

**Example**:
```
AdjustZoneLeftToImageLeft("True")
```

#### AdjustZoneRightToImageRight

Expands the zone to the right of the current image.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- UseCCO: True: Use the CCO boundaries, False: Use the current image boundaries.

**Example**:
```
AdjustZoneRightToImageRight("True")
```

#### AdjustZoneTopToImageTop

Expands the zone to the top of the current image.

**Level**: Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- UseCCO: True: Use the CCO boundaries, False: Use the current image boundaries.

**Example**:
```
AdjustZoneTopToImageTop("True")
```

#### CalculateBlankInvoiceLineItemDetails

Calculates the value when either the Qty, Price or LineTotal lineitem is empty.

**Level**: Field level. Specifically, the lineitem field under the Details field.  
**Returns**: Always True.  

**Parameters**: None

**Example**:
```
CalculateBlankInvoiceLineItemDetails()
```

#### CallPOLR

Pre-matches invoice line items with a previously processed PO.

**Level**: Page level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- DisplayPOLRPanel
- ADOBDBType

**Example**:
```
CallPOLR("False", "200")
```

#### FindBlocksByRegularExpression

Creates fields that represent rectangular area based on text that matches an expression.

**Level**: Page or Field level. Typically it is used on a Field object.  
**Returns**: False, if no matches are found. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- StartExpression: A regular expression to locate the start of a block.
- EndExpression: An regular expression to locate the end of a block.
- AdjustTop: Integer line adjustment of the start of the block.
- AdjustBottom: Integer line adjustment of the bottom of the block.

#### FindBlocksByWhiteSpace

Creates fields that represent a rectangular area based on blank space between sections of text.

**Level**: Field level. The current field must have 1 child field specified in the SetupDCO.  
**Returns**: False, if no matches are found. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- PixelCount: An integer of the number of pixels required between lines.

#### GenerateDetails

Creates the detail lineitem fields on the page.

**Level**: Field level.  
**Returns**: False, if called on the wrong level. Otherwise, True.  

**Parameters**: None

**Example**:
```
GenerateDetails()
```

#### InheritParentPosition

Provides the current field zone with the zone position of a parent object identified by the parameter.

**Level**: Field level.  
**Returns**: False if the action cannot locate the parent field. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- ParentFieldName

#### LoadCCOFromField

Forces the load of the CCO for this action library.

**Level**: Field Level.  
**Returns**: False, if this action is not called on a field or if the CCO file does not exist. Otherwise, True.  

**Parameters**: None

#### LearnLineItemZones

Adds new zones to the DCO.

**Level**: Page level.  
**Returns**: False, if the setup DCO could not be saved to disk. Otherwise, True.  

**Parameters**: None

**Example**:
```
LearnLineItemZones()
```

#### LearnLineItemZonesFingerprintXML

Adds new zones to the XML fingerprint.

**Level**: Page level.  
**Returns**: False, if the fingerprint XML does not need to be rewritten Otherwise, True.  

**Parameters**: None

#### LoadZonesFromFingerprint

Forces loading of a fingerprint and sets all of the zone positions baased on the fingerprint zones coordinates

**Level**: Page or Field level.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- FingerprintID: The ID of the fingerprint to load.

#### MergeLineItemFieldToPageField

Merges line item values to a page variable

**Level**: Must be on the page object that contains the detail section and the PageFieldName holder of the concatenated values  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- DetailFieldName
- LineItemFieldName
- Delimiter
- PageFieldName

**Example**:
```
MergeLineItemFieldToPageField("Details","Description",",","MyExportField")
```

#### MergePageFieldToDocumentVariable

Copies fields from multiple pages into a parent document variable.

**Level**: Each page must be an immediate child of the document.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- PageFieldName
- Delimiter
- DocumentVariableName

**Example**:
```
MergeLineItemFieldToPageField("Total",",","AllPageTotals")
```

#### MergeZones

Merges the zone from calling field with zone of dco fields passed as smart parameters.

**Level**: Field level.  
**Returns**: False if the calling field does not have a valid position value. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- FieldList

**Example**:
```
MergeZones("@P\5PAddTel,@P\5PAddZip,@P\2PatName")
```

#### PadZone

Pads the zone by the value passed. Number of CSV passed values varies padding value by vector.

**Level**: Field level.  
**Returns**: False if the calling field does not have a valid non zero position.False if there are zero or more than four CSV parameters.False if the SmartParameter value returns as a non-numeric. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Padding: A comma separated list of 1 to 4 integers.

#### PopulateZonedField

Copies a section CCO page text to the current field based on the current field's zone coordinates.

**Level**: Field level.  
**Returns**: True if a value is found. Otherwise, False.  

**Parameters**: None

#### PopulateZonedLineItemField

Copies text from the CCO page text to lineitem fields based on the zone coordinates.

**Level**: Field level.  
**Returns**: True if a value is found or if the calling field has no position information. Otherwise, False.  

**Parameters**: None

**Example**:
```
PopulateZonedLineItemField()
```

#### PopulateZoneLineItemFieldDynamic

Populates line items.

**Level**: Field level.  
**Returns**: True, if there is no field position or if the data was found in a zone. False, if there is a zone defined but it is blank.  

**Parameters**: None

#### ReadZones

Sets the page zones coordinates based on the current fingerprint.

**Level**: Page or Field level.  
**Returns**: Always True.  

**Parameters**: None

#### RemoveLineItemsShorterThanPercentage

Removes line items shorter than the longest line item based on a percentage.

**Level**: Field level, the parent of the LineItems field.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Percentage: A value between 0 and 100

#### ResetField

Clears a field's value and position information.

**Level**: Field level.  
**Returns**: False if not called on the field level. Otherwise, True.  

**Parameters**: None

#### ScanDetails

Creates the lineitem fields in the runtime DCO.

**Level**: Field level.  
**Returns**: True if the current field object contains lines of data. Otherwise, False.  

**Parameters**: None

#### ScanDetailsByLines

Creates the line items using the provided count to determine the number of lines in each row.

**Level**: Field level.  
**Returns**: True if the current field object contains lines of data. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Count: The number of lines in each line item.

#### ScanDetailsByVerticalSpace

Creates the line items using the provided pixel height to determine the number of lines in each row.

**Level**: Field level.  
**Returns**: True if the bound Field object contains lines of data. Otherwise, False.  
**Smart Parameters**: Supported  

**Parameters**:
- Count: The Number of vertical pixels in each lineitem.

#### ScanLineItem

**Level**: Field level.  
**Returns**: False if not called from a Field. Otherwise, True.  

**Parameters**: None

#### ScanLineItemDynamic

Creates the child fields for the current field.

**Level**: Field Level on a field that contains child fields.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- Fields: A comma separated list of any fields that should be ignored.

#### SetDynamicDetailZones

Builds the detail zones

**Level**: Page level.  
**Returns**: False if no children exist or there is an error. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- Field: The name of the bottom field.

#### SetFieldEndOfLineCustom

Sets the End of Line character that will be used to separate data from a zone with multiple lines of text.

**Level**: All.  
**Returns**: Always True.  
**Smart Parameters**: Supported  

**Parameters**:
- EndOfLineDelimiter

#### SetFieldEndOfLineToCRLF

Sets the End Of Line character that will be used to separate data from a zone with multiple lines of text.

**Level**: All.  
**Returns**: Always True  

**Parameters**: None

#### UpdateSetupDCOWithDetailField

Populates the Setup DCO with the runtime configuration.

**Level**: Page level.  
**Returns**: False, if called at the wrong level, if the DCO node cannot be found, if the fingerprint ID is not found, or if the setup DCO cannot be saved. Otherwise, True.  
**Smart Parameters**: Supported  

**Parameters**:
- DetailName: The name of the detail field to update in the Setup DCO.

---

## Ruleset Validation Checklist

Use this checklist when reviewing a Datacap application's rulesets:

- [ ] Every action name matches an entry in this knowledge base
- [ ] Action is applied at the correct DCO level (Batch/Document/Page/Field)
- [ ] Required parameters are provided and correctly typed
- [ ] Smart parameter tokens (@X, @P, @B, @D) are used at valid levels
- [ ] GoToNextFunction is used correctly to force function transitions
- [ ] Validation actions set status to 0/1 and populate the Message variable
- [ ] Export actions run at Batch or Document level, not Page level
- [ ] OCR/fingerprint rulesets run before validation rulesets in the task profile
- [ ] LineItem fields use supported LineItem actions, not plain field actions
- [ ] SetDirectoryFPX and ReadZonesFPX precede any OCR recognition actions

---

## Quick-Reference: Actions by Category

| Category | Library | Key Actions |
|----------|---------|-------------|
| Flow control | RuleRunnerLogic | rrSet, rrGet, GoToNextFunction, rrIf, rrLoop |
| DCO manipulation | ApplicationObjects | SetStatus, SetValue, CreateDocument, DeletePage |
| OCR / recognition | ocr_sr | RecognizePageFieldsOCR_A, RecognizeField |
| Fingerprinting | AutomaticDocumentFingerprinting | MatchFingerprintFPX, ReadZonesFPX, SetDirectoryFPX |
| Zones and line items | ZonesAndLineItems | CopyZone, CreateLineitem, SetZone |
| Validation | ValidationsAndTextAdjustments | IsDate, IsNumeric, IsTextLength, IsRequired |
| File conversion | Convert | PDFFREDocumentToImage, ConvertFiles |
| Export | ExportToDatabase, ExportToXML, ExportToText | ExportToDatabase, ExportXML, ExportToText |
| Image processing | ImageUtilities, DCImageFix | RotateImage, DeskewImage |
| Barcode | Barcode | ReadBarcode1D, ReadBarcode2D |
| Email import | Ewsmail, Imail, Email.MSGraph | GetMailMessages, AttachmentToImage |
| File I/O | FileIO | CopyFile, MoveFile, DeleteFile |
| IBM FileNet P8 | IBMFileNetP8 | CheckInDocument, CheckOutDocument |
| IBM Content Manager | IBMCMExtended | IBMCM_Logon, IBMCM_CreateItem, IBMCM_UploadDCO_Page |
| Statistics (deprecated) | Statistics | SaveFieldsText, CompareFieldsText, AddToDBTotals |
| Logging | Nenu | LogMessage, WriteToLog |
| Batch split | SplitBatch | SplitBatch |

---

*Generated from IBM Datacap 9.1.10 RRX action library files. 2026-09-22*
