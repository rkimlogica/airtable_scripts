console.log(`Hello, ${base.name}!`);

// 
let table = base.getTable('tblBL8vrWNOme0BCc'); //Client Notification Table
let inputConfig = input.config();
let airtableRecordId = inputConfig.airtableRecordId;
let Case_Style = inputConfig.Case_Style;
console.log(`caseStyle: ${Case_Style}`)
let shortCaseStyle = inputConfig.shortCaseStyle;
console.log(`shortCaseStyle ${shortCaseStyle}`);
let dueDateInitRequest = inputConfig.dueDateInitRequest;
console.log(`dueDateInitRequest: ${dueDateInitRequest}`);
let Logica_ID_from_Link_to_Intake_Case_Info = inputConfig.Logica_ID_from_Link_to_Intake_Case_Info;
console.log(`Logica_ID_from_Link_to_Intake_Case_Info: ${Logica_ID_from_Link_to_Intake_Case_Info}`);
let Loss_Date = inputConfig.Loss_Date;
console.log(`Loss_Date: ${Loss_Date}`);
let Attorney = inputConfig.Attorney;
console.log(`Attorney: ${Attorney}`);
let Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info = inputConfig.Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info;
console.log(`Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info: ${Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info}`);
let paraEmail = inputConfig.paraEmail;
console.log(`paraEmail: ${paraEmail}`);
let ccEmailInternal = inputConfig.ccEmailInternal;
let lerEmail = 'ler@logicaratio.com';
ccEmailInternal.push(lerEmail);
console.log(`ccEmailInternal: ${ccEmailInternal}`)
let specialMessage = inputConfig.specialMessage+'\n';
specialMessage = checkNull(specialMessage);
console.log(`Special Message: ${specialMessage}`);
let triageIDList = inputConfig.triageIDList;
console.log(`triageIDList:`)
console.log(triageIDList);
let triageNameList = inputConfig.triageNameList;
console.log(`triageNameList:`);
console.log(triageNameList);

let emailCaseInfo = `Thanks for sending this over. We recommend the following experts to opine on the treatment noted below for you. All designation materials are attached for your review. \n\n`+
 `**Case Style:** ${Case_Style}\n`+
    `**Date of Loss:** ${Loss_Date}\n`+
    `**Attorney Info:** \n`+
    `${Attorney}\n`+
    `${Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info}\n`+
    `**Case Style ID: ${Case_Style} ${Logica_ID_from_Link_to_Intake_Case_Info}**\n\n`;
// we need to retrieve Triage report data for every reports
// following for loop will create reports list.  We will sort by Plainfiff.
let reportsList = [];
for (let i = 0; i < triageIDList.length; i++) {
  let triageId = triageIDList[i];
  let triageTable = base.getTable('tblyD3wgYf8VRxNqE');
  let triageView = triageTable.getView('viwjvkMpDN8UUFlVX');
  let triageQuery = await triageView.selectRecordsAsync({fields: ['ExpertEmail',
      'Expert Due Date',
      'Expert',
      'Client Request "Deliverable Specifics"',
      'Requested Deliverable "Type of Work Product"',
      'Expert Due Date',
      'Expert Secure File Share Link',
      'Facilities to Opine',
      'Plaintiff ID (Triage Side)',
      'Plaintiff Name CAPS',
      'Client Law Firm Address',
      'ALL Facilities for Plaintiff',
      'ALL Providers for Plaintiff',
      'Facilities to Opine-Medical Necessity',
      'Facilities to Opine-Billing',
      'Facilities to Opine-Future-Treatment',
      'Facilities to Opine-Causation',
      'Calculated Invoice Amount',
    ],});
  let triageRecord = triageQuery.getRecord(triageId);
  let expertEmail = triageRecord.getCellValue('ExpertEmail');
  console.log(`expertEmail: ${expertEmail}`);
  let expertDueDate = triageRecord.getCellValue('Expert Due Date');
  console.log(`expertDueDate: ${expertDueDate}`);
  let expert = triageRecord.getCellValue('Expert');
  console.log(expert);
  let expertLastName = getLastName(expert[0].name);
  console.log(`expert name: ${expert}`);
  let Client_Request_Deliverable_Specifics = extractNamesUsingForOf(triageRecord.getCellValue('Client Request "Deliverable Specifics"'));
  console.log(`Client_Request_Deliverable_Specifics: ${Client_Request_Deliverable_Specifics}`);
  let Requested_Deliverable_Type_of_Work_Product = extractNamesUsingForOf(triageRecord.getCellValue('Requested Deliverable "Type of Work Product"'));
  console.log(`Requested_Deliverable_Type_of_Work_Product: ${Requested_Deliverable_Type_of_Work_Product}`);
  let Expert_Due_Date = triageRecord.getCellValue('Expert Due Date');
  console.log(`Expert_Due_Date: ${Expert_Due_Date}`);
  let Expert_Secure_File_Share_Link = triageRecord.getCellValue('Expert Secure File Share Link');
  console.log(`Expert_Secure_File_Share_Link: ${Expert_Secure_File_Share_Link}`);
  let Facilities_to_Opine = triageRecord.getCellValue('Facilities to Opine');
  console.log(`Facilities_to_Opine: ${Facilities_to_Opine}`);
  let Plaintiff_ID_Triage_Side = triageRecord.getCellValue('Plaintiff ID (Triage Side)');
  console.log(`Plaintiff_ID_Triage_Side: ${Plaintiff_ID_Triage_Side}`);
  let Plaintiff_Name_CAPS = triageRecord.getCellValue('Plaintiff Name CAPS');
  console.log(`Plaintiff_Name_CAPS: ${Plaintiff_Name_CAPS}`);
  let calculatedInvoiceAmt = triageRecord.getCellValue('Calculated Invoice Amount');
  console.log(`Calculated Invoice Amount: ${calculatedInvoiceAmt}`);

  let Client_Law_Firm_Address = triageRecord.getCellValue('Client Law Firm Address');
  console.log(`Client_Law_Firm_Address: ${Client_Law_Firm_Address}`);
  let ALL_Facilities_for_Plaintiff = triageRecord.getCellValue('ALL Facilities for Plaintiff');
  console.log(`ALL_Facilities_for_Plaintiff: ${ALL_Facilities_for_Plaintiff}`);
  let ALL_Providers_for_Plaintiff = triageRecord.getCellValue('ALL Providers for Plaintiff');
  console.log(`ALL_Providers_for_Plaintiff: ${ALL_Providers_for_Plaintiff}`);
  let facilitiesOpineMedNecessity = extractNamesUsingForOf(triageRecord.getCellValue('Facilities to Opine-Medical Necessity'));
  console.log(`facilitiesOpineMedNecessity: ${facilitiesOpineMedNecessity}`);
  let facilitiesOpineBilling = extractNamesUsingForOf(triageRecord.getCellValue('Facilities to Opine-Billing'));
  console.log(`facilitiesOpineBilling: ${facilitiesOpineBilling}`);
  let facilitiesOpineTreatment = extractNamesUsingForOf(triageRecord.getCellValue('Facilities to Opine-Future-Treatment'));
  console.log(`facilitiesOpineTreatment: ${facilitiesOpineTreatment}`);
  let facilitiesOpineCausation = extractNamesUsingForOf(triageRecord.getCellValue('Facilities to Opine-Causation'));
  console.log(`facilitiesOpineCausation: ${facilitiesOpineCausation}`);


  let numberedALL_Facilities_for_Plaintiff = createNumberedListString(ALL_Facilities_for_Plaintiff);
  let numberedALL_Providers_for_Plaintiff = createNumberedListString(ALL_Providers_for_Plaintiff);
  let numberedFacilities_to_Opine = createNumberedListString(Facilities_to_Opine);
  let numberedFacilitiesOpineMedNecessity = createNumberedListString(facilitiesOpineMedNecessity);
  let numberedFacilitiesOpineBilling = createNumberedListString(facilitiesOpineBilling);
  let numberedFacilitiesOpineCausation = createNumberedListString(facilitiesOpineCausation);
  let numberedFacilitiesOpineTreatment = createNumberedListString(facilitiesOpineTreatment);


  let emailBodyReport =
    `**Expert Assigned** Dr. ${expertLastName},\n`+
    `**Review Type:** ${Client_Request_Deliverable_Specifics}\n`+
    `**Deliverable:** ${Requested_Deliverable_Type_of_Work_Product}\n`;
    // if numberedFacilitiesOpineMedNecessity is empty, we will not show it.
    if( numberedFacilitiesOpineMedNecessity !== '- N/A' && numberedFacilitiesOpineMedNecessity !== ''){
      emailBodyReport += `**Opining on medical necessity:**\n ${numberedFacilitiesOpineMedNecessity}\n`;
    }
    if( numberedFacilitiesOpineBilling !== '- N/A' && numberedFacilitiesOpineBilling !== ''){
      emailBodyReport += `**Opining on reasonableness of cost of the incurred treatment:**\n ${numberedFacilitiesOpineBilling}\n`;
    }
    if( numberedFacilitiesOpineCausation !== '- N/A' && numberedFacilitiesOpineCausation !== ''){
      emailBodyReport += `**Opining on causation:**\n ${numberedFacilitiesOpineCausation}\n`;
    }
    if( numberedFacilitiesOpineTreatment !== '- N/A' && numberedFacilitiesOpineTreatment !== ''){
      emailBodyReport += `**Opining on future treatment:**\n ${numberedFacilitiesOpineTreatment}\n`;
    }
    emailBodyReport += `**Fees for Review:** \$${calculatedInvoiceAmt}\n`+
    `\n`;
  
  reportsList.push(
    {
      "Plaintiff_ID_Triage_Side": Plaintiff_ID_Triage_Side,
      "Plaintiff_Name_CAPS": Plaintiff_Name_CAPS,
      "expertLastName": expertLastName,
      "emailBodyReport": emailBodyReport
    }
  );

}

// we now need to sort the reportsList based on Plaintiff ID
sortReports(reportsList);
// combine to email body

let emailBody=emailCaseInfo;
for (let i = 0; i < reportsList.length; i++) {
  let report = reportsList[i];
  emailBody += `**Plaintiff ID/Name: ${report.Plaintiff_ID_Triage_Side}-${report.Plaintiff_Name_CAPS}**\n`+report.emailBodyReport;
}


let mailToLink = generateMailtoLink({
  to: paraEmail,
  cc: ccEmailInternal,
  subject: `Case Request - ${shortCaseStyle} - ID ${Logica_ID_from_Link_to_Intake_Case_Info} - Due: ${dueDateInitRequest}`,
  body: 'PASTE_EMAIL_BODY_HERE'
});

console.log(`mailTo: ${mailToLink}`)
mailToLink = handleNullString(mailToLink);

if(mailToLink.length > 2000){
  
  // update all record
  await table.updateRecordAsync(
      airtableRecordId, {
          'Client Notification Email': 'Email too Long '+mailToLink.length+ 'characters',
          '✳️Generate Client Notification Email':{name: 'Too Long'},
          'Email Body':emailBody
      }
  );
}else{
  
  // update all record
  await table.updateRecordAsync(
      airtableRecordId, {
          'Client Notification Email': mailToLink,
          '✳️Generate Client Notification Email':{name: 'Finished'},
          'Email Body':emailBody
      }
  );
}

function handleNullString(str) {
  if (str === null) {
    return "";
  } else {
    return str;
  }
}
/**
 * Checks if the total length of a string is more than a specified limit.
 *
 * @param {string} str The string to check.
 * @param {number} limit The length limit to compare against (default: 2000).
 * @returns {boolean} True if the string's length is greater than the limit, false otherwise.
 */
function isStringLengthGreaterThan(str, limit = 2000) {
  return str.length > limit;
}
function extractNamesUsingForOf(objectArray) {
  const names = [];
  // Check if objectArray is iterable
  if (typeof objectArray?.[Symbol.iterator] !== 'function') {
    console.warn("Input is not iterable. Returning an empty array.");
    return names;
  }

  // The for...of loop iterates over iterable objects (like arrays).
  // It provides a simpler way to iterate over elements of an array.
  for (const obj of objectArray) {
    names.push(obj.name);
  }
  return names;
}

function checkNull(str) {
str = str.trim();
  console.log(str);
  if(!str){
    return '';
  }
  // 1. Check for null or undefined
  if (str === null || typeof str === 'undefined') {
    return '';
  }

  // 2. Check if it's actually a string type
  //    (If not, you might want to decide if that counts as "blank" for your use case)
  //    For this function, we'll assume non-strings that aren't null/undefined are not "blank"
  //    in the sense of an empty string.
  if (typeof str !== 'string') {
    // console.warn("Warning: isNullOrBlank received a non-string, non-null/undefined value:", str);
    return ''; // Or true, depending on how you want to treat non-strings
  }
  if (str == 'null'){
    return '';
  }

  // 3. Check for empty string or string with only whitespace
  if (str.trim() === ''){
    return '';
  }
  return str.trim();
}
function getLastName(fullName) {
  const parts = fullName.split(',');
  if (parts.length > 0) {
    return parts[0].trim();
  }
  return ""; // Or handle error as needed
}

function createNumberedListString(items) {
  if (!Array.isArray(items)) {
    return "Input must be an array.";
  }

  if (items.length === 0) {
    return "- N/A";
  }

  let numberedListString = "";
  for (let i = 0; i < items.length; i++) {
    // Add the number, a period, a space, and the item.
    numberedListString += (i + 1) + ". " + items[i];
    // Add a newline character if it's not the last item.
    if (i < items.length - 1) {
      numberedListString += "\n";
    }
  }
  return numberedListString;
}
function createNumberedListFromCommaString(commaSeparatedString) {
    // 1. Handle edge cases: null, undefined, not a string, or empty/whitespace-only string
    if (typeof commaSeparatedString !== 'string' || commaSeparatedString.trim() === '') {
        return '';
    }

    // 2. Split the string by commas
    // This will create an array of substrings.
    const itemsArray = commaSeparatedString.split(',');

    // 3. Process each item:
    //    - Trim whitespace from the beginning and end of each item.
    //    - Filter out any empty items that might result from consecutive commas (e.g., "a,,b")
    //      or commas at the beginning/end of the string (e.g., ",a,b,").
    //    - Prepend the number and a period.
    const numberedListItems = itemsArray
        .map(item => item.trim())         // Trim whitespace from each potential item
        .filter(item => item !== '')      // Remove any empty strings
        .map((item, index) => `${index + 1}. ${item}`); // Add numbering (index is 0-based)

    // 4. Join the numbered items with a newline character
    return numberedListItems.join('\n');
}

function generateMailtoLink(optionsInput) {
  // Ensure options is a plain object, default to empty object if not.
  // This prevents errors if optionsInput is null, undefined, or a non-object type.
  const options = (optionsInput && typeof optionsInput === 'object' && !Array.isArray(optionsInput) && optionsInput !== null)
                  ? optionsInput
                  : {};

  const {
    to,
    cc,
    bcc,
    subject,
    body
  } = options;

  console.log(`to: ${to}`);
  console.log(`cc: ${cc}`);
  console.log(`bcc: ${bcc}`);
  console.log(`subject: ${subject}`);
  console.log(`body: ${body}`);

  // Process the 'to' field. It's essential.
  let processedToString = "";
  if (to) {
    if (typeof to === 'string') {
      processedToString = to.trim();
    } else if (Array.isArray(to)) {
      processedToString = to
        .filter(email => typeof email === 'string' && email.trim() !== '')
        .map(email => email.trim())
        .join(',');
    } else {
      console.warn("Warning: 'to' parameter was provided but is not a string or an array of strings. It will be treated as invalid.");
      // Keep processedToString as ""
    }
  }

  // After processing, 'to' must resolve to a non-empty string.
  if (!processedToString) { // Checks if it's an empty string after processing or if 'to' was not provided/invalid type
    console.error("Error: 'to' email address(es) are required and must resolve to a non-empty string after processing.");
    return null;
  }

  let mailtoLink = `mailto:${encodeURIComponent(processedToString)}`;

  const queryParams = [];

  // Add CC recipients if provided and valid
  if (cc) {
    let ccString = "";
    if (typeof cc === 'string') {
      ccString = cc.trim(); // Trim if it's a single string
    } else if (Array.isArray(cc)) {
      // Filter out non-strings or empty strings from the array, trim valid ones, then join.
      ccString = cc
        .filter(email => typeof email === 'string' && email.trim() !== '')
        .map(email => email.trim())
        .join(',');
    } else {
      // Log a warning if 'cc' is an unexpected type
      console.warn("Warning: 'cc' parameter was provided but is not a string or an array of strings. It will be ignored.");
    }
    // Only add if ccString has content after processing.
    if (ccString) { // This ensures we don't add 'cc=' if the string is empty after processing
      queryParams.push(`cc=${encodeURIComponent(ccString)}`);
    }
  }

  // Add BCC recipients if provided and valid (similar logic to CC)
  if (bcc) {
    let bccString = "";
    if (typeof bcc === 'string') {
      bccString = bcc.trim();
    } else if (Array.isArray(bcc)) {
      bccString = bcc
        .filter(email => typeof email === 'string' && email.trim() !== '')
        .map(email => email.trim())
        .join(',');
    } else {
      console.warn("Warning: 'bcc' parameter was provided but is not a string or an array of strings. It will be ignored.");
    }
    if (bccString) {
      queryParams.push(`bcc=${encodeURIComponent(bccString)}`);
    }
  }

  // Add subject if provided, is a string, and not empty after trimming
  if (subject && typeof subject === 'string') {
    const trimmedSubject = subject.trim();
    if (trimmedSubject !== '') {
      queryParams.push(`subject=${encodeURIComponent(trimmedSubject)}`);
    }
  }

  // Add body if provided, is a string, and not empty after trimming
  if (body && typeof body === 'string') {
    const trimmedBody = body.trim();
    if (trimmedBody !== '') {
      // Line breaks in the body should be encoded as %0D%0A for broad compatibility
      const encodedBody = encodeURIComponent(trimmedBody).replace(/%0A/g, '%0D%0A');
      queryParams.push(`body=${encodedBody}`);
    }
  }

  // Append query parameters to the mailto link if any exist
  if (queryParams.length > 0) {
    mailtoLink += `?${queryParams.join('&')}`;
  }

  return mailtoLink;
}
function sortReports(reportsList) {
  if (!Array.isArray(reportsList)) {
    console.error("Input is not an array. Cannot sort.");
    return; // Or throw an error
  }

  reportsList.sort((a, b) => {
    // Helper function to safely access properties and handle potential undefined/null
    const getSafeString = (obj, prop) => {
      if (obj && typeof obj[prop] === 'string') {
        return obj[prop].toLowerCase(); // For case-insensitive string comparison
      }
      if (obj && typeof obj[prop] !== 'undefined' && obj[prop] !== null) {
        return String(obj[prop]); // Convert numbers or other types to string for comparison
      }
      return ''; // Default for missing or null properties
    };

    const getSafePrimarySortKey = (obj, prop) => {
        if (obj && typeof obj[prop] !== 'undefined' && obj[prop] !== null) {
            return obj[prop];
        }
        // Define how to handle missing primary sort keys.
        // For numbers, you might want to treat them as 0, Infinity, or -Infinity.
        // For strings, an empty string or a specific placeholder.
        // Here, we'll treat missing Plaintiff_ID_Triage_Side as potentially needing special handling
        // or assuming they sort to one end. For simplicity, let's assume it's a string or number.
        // If it's a number and could be 0, that's fine. If string, empty string.
        return typeof obj[prop] === 'number' ? 0 : '';
    }

    // Primary sort: Plaintiff_ID_Triage_Side
    const plaintiffIdA = getSafePrimarySortKey(a, "Plaintiff_ID_Triage_Side");
    const plaintiffIdB = getSafePrimarySortKey(b, "Plaintiff_ID_Triage_Side");

    if (plaintiffIdA < plaintiffIdB) {
      return -1;
    }
    if (plaintiffIdA > plaintiffIdB) {
      return 1;
    }

    // Secondary sort (if Plaintiff_ID_Triage_Side is the same): expertLastName
    // We'll do a case-insensitive comparison for names
    const lastNameA = getSafeString(a, "expertLastName");
    const lastNameB = getSafeString(b, "expertLastName");

    if (lastNameA < lastNameB) {
      return -1;
    }
    if (lastNameA > lastNameB) {
      return 1;
    }

    // If both primary and secondary keys are the same
    return 0;
  });
}