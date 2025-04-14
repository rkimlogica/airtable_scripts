# Logica Invoice Calculator Airtable Script

## Purpose

This script automates the calculation of invoice amounts for clients and payment amounts for experts based on data associated with a specific report record in the "TRIAGE/Report Dashboard" table within Airtable. It applies various predefined business rules related to pricing, services, page counts, rush fees, and special conditions (like LLS clients or hourly experts).

## How it Works (High-Level Flow)

1.  **Initialization:** The script starts when triggered, receiving the `airtableRecordId` of the target report and other input parameters.
2.  **Data Gathering:** It fetches the specified report record and related data, including selected invoice products, page/image/facility counts, time spent, client/expert details, and override flags. It also fetches corresponding rate information from the "Client Law (Requester) Firm - MDB" and "Logica Experts - MDB" tables.
3.  **Pre-Checks & Preparation:**
    *   Determines if the report has already been invoiced (via `Invoice Task & Status`). If yes, it stops further processing.
    *   Calculates the business days between estimate approval and due date (`rushDueDateInBizDays`) and **immediately updates** this value on the record.
    *   Determines special conditions like LLS cases (`isLLS`), hourly experts (`isExpertHourly`), imaging-only reports (`isImgingOnly`), re-reads (`isImgReRead`), and rare specialties (`isRareSpecialty`).
4.  **Conditional Calculation:**
    *   If the `Invoice Client Override` flag is **not** checked, it proceeds to calculate the client invoice amount.
    *   If the `Invoice Expert Override` flag is **not** checked, it proceeds to calculate the expert payment amount.
5.  **Calculation Execution:** The `calculateClientInvoice` and `calculateExpertInvoice` functions apply specific business rules based on the selected products and other data points (detailed below).
6.  **Record Update:** The script updates the original report record with:
    *   Calculated client invoice amount (`Calculated Invoice Amount`).
    *   Calculated expert payment amount (`Calculated Expert Invoice Amount`).
    *   Detailed explanations of how each amount was calculated (`Client Invoice Explain`, `Expert Invoice Explain`).
    *   The calculated additional page fee for the client (`Calculated Additional Page Fee`).
7.  **Product List Update (Conditional):** If the calculations determined that an "Additional Pages" fee applies or certain hourly products were used, the script updates the `Client Invoice Product` multi-select field on the record to accurately reflect the final set of billable items.

## Key Business Rules & Logic

### General Rules

*   **Overrides:** If `Invoice Client Override` or `Invoice Expert Override` is checked on the report record, the respective calculation is skipped.
*   **Invoice Status:** If the `Invoice Task & Status` is 'Invoiced' or 'Paid', all calculations are skipped.
*   **Rush Fees (Expert):** A rush fee product is only charged to the expert if the calculated `rushDueDateInBizDays` is less than 5. Client rush fees are charged based on the product selected, regardless of the calculated days.
*   **LLS Cases:** Identified if `trueServiceLine` input contains 'LLS'.
    *   **Expert:** Specific product names are prefixed with "MDJW " using `appendMDJWPrefix` before looking up rates in the expert's record. Certain LLS products are charged per facility (`numFacToOpine`).
    *   **Client:** Certain LLS "Billing Only" products are charged per facility (`numFacToOpine`).
*   **Hourly Experts:** Identified if `Network for Billing` contains "Hourly". This can influence how certain products (like "Surgeon/Rare Specialty A+") are calculated.
*   **Page Counts:**
    *   Client calculations generally use `totPageCount` (Base + Submitted Rollup).
    *   Expert calculations generally use `plaintiffPageCount` (Base + Binder Rollup).

### Client Invoice Calculation (`calculateClientInvoice`)

*   **Rate Source:** "Client Law (Requester) Firm - MDB" table, based on the `Requestor Firm from Intake`.
*   **Product Iteration:** Calculates cost based on each selected `Client Invoice Product`.
*   **Product-Specific Logic Highlights:**
    *   **Imaging (MRI/CT, X-Ray):** Rate * count. *No "first one free" discount*. Skipped entirely if it's an Imaging Re-Read report (`isImgReRead`).
    *   **Hourly (General):** Uses the *Client's* "Hourly Rate" * `numExpertHours`. Applies to products like "Consultation/Pre-Litigation Review per hour", "Verbal per hour", "Deposition additional time", etc.
    *   **Hourly (Specific Product Rate):** Uses the *Product's* specific rate * `numExpertHours`. Applies to "Wrongful Death Review per hour", "Life Care Plan Review per hour".
    *   **Depo Prep:** Product Rate * `numDepoExpertPrepHours`.
    *   **Facility-Based (Coding):** Rate * number of relevant facilities (`numHospiFacBillCoding`, `numNonHospiFacBillCoding`).
    *   **Per Page Products:** Rate * `totPageCount`. Applies to "Chronology or Record Processing Fee Per page", "Indexing + Summary/Narrative Fee Per page".
    *   **Radiologist Re-Read/Causality:** Base product rate + additional charges if total images > 2 (calculated based on client's image rates).
    *   **Additional Claimant/Body Part:** Rate * count (`numPlaintiffs - 1` or `imeNumBodyPartsGtThan1`).
    *   **Schedule A Billing Only:** Base rate + additional per-facility charges if `numFacToOpine` exceeds the client's `numBaseFacilityCount`.
*   **Additional Page Fee (Client):**
    *   **Trigger:** Calculated if `totPageCount` > `basePageCount` (from client record) + 20 page tolerance, AND the report type doesn't inherently skip page fees (e.g., Billing Only, Depo, IME).
    *   **Page Count Used:** `totPageCount`, potentially adjusted for duplicates.
    *   **Duplicate Handling:** Based on `invoicingDuplicateComment` input:
        *   `'No charge'`: Subtracts `duplicatePageCount` from `totPageCount` before calculating the fee.
        *   `'$1/page Charge'`: Subtracts `duplicatePageCount` from `totPageCount` AND adds (`duplicatePageCount` * $1) directly to the total invoice amount.
        *   `'Full Charge'`: Uses `totPageCount` as is.
    *   **Rates:** Different rates per set (`pagesPerAddlSet`, usually 100) apply based on:
        *   Client: "City of Houston Legal Department" (uses `extra250PageFee` and specific base count/page set size).
        *   Specialty: "Spine" or Rare Specialty (uses `extra100PageFeeSpine`).
        *   Specialty: "Chiro" (uses `extra100PageFeeChiro`).
        *   Default: (uses `extra100PageFee`).
    *   **Calculation:** `multiple = Math.ceil(additionalPages / pagesPerAddlSet)` (or similar logic for COH), then `Fee = multiple * rate`.

### Expert Payment Calculation (`calculateExpertInvoice`)

*   **Rate Source:** "Logica Experts - MDB" table, based on the `Expert` name.
*   **Product Iteration:** Calculates cost based on each selected `Client Invoice Product` (potentially modified for LLS).
*   **Product-Specific Logic Highlights:**
    *   **Imaging (MRI/CT, X-Ray):** Rate * count. A "first one free" discount applies (first MRI or X-Ray encountered is not charged) *unless* it's an imaging-only report (`isImgingOnly`).
    *   **Hourly (General):** Uses the *Product's* specific rate * `numExpertHours`. Applies to "Life Care Plan Review per hour", "Consultation/Pre-Litigation Review per hour", etc.
    *   **Hourly (Expert Rate):** Uses the *Expert's* "Hourly Rate" * `numExpertHours`. Applies if "Hourly" product is selected or for certain complex cases with hourly experts.
    *   **Depo Prep:** Product Rate * `numDepoExpertPrepHours`.
    *   **Facility-Based (Coding):** Rate * number of relevant facilities.
    *   **IME Exam:** Uses the expert's standard "IME Exam - One Body Part" rate, regardless of the specific IME product selected.
    *   **Court Testimony:** Specific testimony products (e.g., "Court Testimony Chiro Half Day") are mapped to generic "Court Testimony Half Day - 4hrs" or "Court Testimony - Full Day - >8 hrs" rates from the expert's record.
    *   **Additional Claimant/Body Part:** Rate * count.
    *   **LLS Per Facility:** Rate * `numFacToOpine` for specific LLS products.
*   **Additional Page Fee (Expert):**
    *   **Trigger:** Calculated if `plaintiffPageCount` > `basePageCount` (from expert record) + tolerance (`Math.round(pagesPerAddlSet/10)`), AND the report type doesn't inherently skip page fees. Special check for COH client (`plaintiffPageCount < basePageCountCOH` skips).
    *   **Page Count Used:** `plaintiffPageCount`.
    *   **Rates:** Different rates per set (`pagesPerAddlSet`, usually 100) apply based on:
        *   Client: "City of Houston Legal Department" (uses `payPerAddlpageCOH` and specific base count/page set size).
        *   Specialty: "Spine" or Rare Specialty (uses `payPerAddlpage`).
        *   Default: (uses `payPerAddlpage`).
    *   **Calculation:** `additionalPages = plaintiffPageCount - basePageCount`. `multiple = Math.ceil((additionalPages-(pagesPerAddlSet*0.1)) / pagesPerAddlSet)` (or similar logic for COH). This includes a 10% buffer on the *additional pages* before calculating multiples. Then `Fee = multiple * rate`.

### Invoice Product List Update (`updateClientInvoiceProducts`)

*   **Trigger:** Runs if `isInvoiceProductListModified` flag was set during calculations (typically by additional page fees or specific hourly product calculations).
*   **Action:** Rebuilds the `Client Invoice Product` list by:
    *   Copying existing products.
    *   Removing any pre-existing "Additional Pages" type products.
    *   Adding the newly calculated "Additional Pages" product (if applicable) and potentially "Hourly" products.
*   **Result:** Updates the multi-select field on the record.

## Inputs

*   **Script Input Config:**
    *   `airtableRecordId`: The ID of the report record in "TRIAGE/Report Dashboard" to process.
    *   `invoicingDuplicateComment`: Instruction ('Full Charge', '$1/page Charge', 'No charge') for handling duplicate pages in client invoice.
    *   `duplicatePageCount`: Number of duplicate pages identified.
    *   `numFacToOpine`: Number of facilities reviewed (used for LLS and Schedule A client logic).
    *   `trueServiceLine`: Service line information (used to identify LLS cases).
*   **Airtable Data:**
    *   From "TRIAGE/Report Dashboard" record: `Client Invoice Product`, page counts, image counts, facility counts, hours, dates, overrides, expert/client names, `Invoice Task & Status`, `Network for Billing`, etc.
    *   From "Client Law (Requester) Firm - MDB": Client-specific rates, base page counts, page set sizes, hourly rates, schedule type.
    *   From "Logica Experts - MDB": Expert-specific rates, base page counts, page set sizes, hourly rates, LLS rates.

## Outputs (Updated fields on the Report Record)

*   `Calculated Invoice Amount`: Total calculated amount to invoice the client.
*   `Calculated Expert Invoice Amount`: Total calculated amount to pay the expert.
*   `Client Invoice Explain`: Text field detailing the client invoice calculation steps.
*   `Expert Invoice Explain`: Text field detailing the expert payment calculation steps.
*   `Calculated Additional Page Fee`: The calculated additional page fee portion of the client invoice.
*   `Client Rush Due Date - Date Estimate Approved in Business Days`: Calculated business days (updated immediately after fetching data).
*   `Client Invoice Product`: Multi-select field, potentially updated to add/replace "Additional Pages" or "Hourly" products.

## Dependencies / Environment

*   Airtable Base with the following tables and fields configured as expected by the script:
    *   `TRIAGE/Report Dashboard`
    *   `Client Law (Requester) Firm - MDB`
    *   `Logica Experts - MDB`
*   Airtable Scripting App environment.

## Helper Functions

*   `calcNumOfWorkingDays(fromDate, endDate)`: Calculates business days between two dates, excluding weekends and a hardcoded list of US holidays. Returns -1 for invalid dates.
*   `appendMDJWPrefix(productName)`: Adds "MDJW " prefix to specific product names for LLS expert rate lookups based on hardcoded rules.
*   `containsSubstring(array, substring)`: Checks if any string element within the input array contains the given substring.
*   `removeDoubleQuotes(string)`: Removes leading/trailing double quotes from a string.
*   `writeToInvoiceExplain(string)` / `writeToExpertInvoiceExplain(string)`: Appends calculation details to the respective explanation strings and logs to console.
*   `updateClientInvoiceProducts()`: Handles the logic for updating the `Client Invoice Product` field.

## Important Notes

*   The `calcNumOfWorkingDays` function relies on a **hardcoded list of holidays**. This list needs periodic updates (e.g., annually).
*   Specific client names (e.g., "City of Houston Legal Department") trigger unique pricing logic.
*   Specific client schedule types (e.g., "(A) Standard Fee Schedule (A) - 2025") trigger unique pricing logic.
*   Tolerance rules and page count sources for additional page fees differ significantly between client invoicing and expert payment.
*   The script assumes field names and product names match exactly what's defined in the code. Changes in Airtable field/product names may break the script.
