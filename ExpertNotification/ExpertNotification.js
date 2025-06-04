console.log(`Hello, ${base.name}!`);
let table = base.getTable('Case Specific Builder');
let inputConfig = input.config();
let airtableRecordId = inputConfig.airtableRecordId;
let expertEmail = inputConfig.expertEmail;
console.log(`expertEmail: ${expertEmail}`)
let Case_Style = inputConfig.Case_Style;
console.log(`caseStyle: ${Case_Style}`)
let shortCaseStyle = inputConfig.shortCaseStyle;
console.log(`shortCaseStyle ${shortCaseStyle}`);
let expertDueDate = inputConfig.expertDueDate;
console.log(`expertDueDate: ${expertDueDate}`)
let expert = inputConfig.expert;
let expertLastName = getLastName(expert[0]);
console.log(`expert name: ${expert}`);
let Logica_ID_from_Link_to_Intake_Case_Info = inputConfig.Logica_ID_from_Link_to_Intake_Case_Info;
console.log(`Logica_ID_from_Link_to_Intake_Case_Info: ${Logica_ID_from_Link_to_Intake_Case_Info}`);
let Client_Request_Deliverable_Specifics = inputConfig.Client_Request_Deliverable_Specifics;
console.log(`Client_Request_Deliverable_Specifics: ${Client_Request_Deliverable_Specifics}`);
let Requested_Deliverable_Type_of_Work_Product = inputConfig.Requested_Deliverable_Type_of_Work_Product;
console.log(`Requested_Deliverable_Type_of_Work_Product: ${Requested_Deliverable_Type_of_Work_Product}`);
let Expert_Due_Date = inputConfig.Expert_Due_Date;
console.log(`Expert_Due_Date: ${Expert_Due_Date}`);
let Expert_Secure_File_Share_Link = inputConfig.Expert_Secure_File_Share_Link;
console.log(`Expert_Secure_File_Share_Link: ${Expert_Secure_File_Share_Link}`);
let Facilities_to_Opine = inputConfig.Facilities_to_Opine;
console.log(`Facilities_to_Opine: ${Facilities_to_Opine}`);
let Plaintiff_ID_Triage_Side = inputConfig.Plaintiff_ID_Triage_Side;
console.log(`Plaintiff_ID_Triage_Side: ${Plaintiff_ID_Triage_Side}`);
let Plaintiff_Name_CAPS = inputConfig.Plaintiff_Name_CAPS;
console.log(`Plaintiff_Name_CAPS: ${Plaintiff_Name_CAPS}`);
let Loss_Date = inputConfig.Loss_Date;
console.log(`Loss_Date: ${Loss_Date}`);
let Attorney = inputConfig.Attorney;
console.log(`Attorney: ${Attorney}`);
let Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info = inputConfig.Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info;
console.log(`Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info: ${Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info}`);
let ccEmailInternal = inputConfig.ccEmailInternal;
let lerEmail = 'ler@logicaratio.com';
ccEmailInternal.push(lerEmail);
console.log(`ccEmailInternal: ${ccEmailInternal}`)

let Client_Law_Firm_Address = inputConfig.Client_Law_Firm_Address;
console.log(`Client_Law_Firm_Address: ${Client_Law_Firm_Address}`);
let ALL_Facilities_for_Plaintiff = inputConfig.ALL_Facilities_for_Plaintiff;
console.log(`ALL_Facilities_for_Plaintiff: ${ALL_Facilities_for_Plaintiff}`);
let ALL_Providers_for_Plaintiff = inputConfig.ALL_Providers_for_Plaintiff;
console.log(`ALL_Providers_for_Plaintiff: ${ALL_Providers_for_Plaintiff}`);
let facilitiesOpineMedNecessity = inputConfig.facilitiesOpineMedNecessity;
console.log(`facilitiesOpineMedNecessity: ${facilitiesOpineMedNecessity}`);
let facilitiesOpineBilling = inputConfig.facilitiesOpineBilling;
console.log(`facilitiesOpineBilling: ${facilitiesOpineBilling}`);


let specialMessage = inputConfig.specialMessage+'\n';
specialMessage = checkNull(specialMessage);
console.log(`Special Message: ${specialMessage}`)

let numberedALL_Facilities_for_Plaintiff = createNumberedListString(ALL_Facilities_for_Plaintiff);
let numberedALL_Providers_for_Plaintiff = createNumberedListString(ALL_Providers_for_Plaintiff);
let numberedFacilities_to_Opine = createNumberedListString(Facilities_to_Opine);

// generate email body
//`${linkText}:\n${linkUrl}`
let emailBody = 
`Hello Dr. ${expertLastName},\n`+
`Are you available to review this case? \n`+
specialMessage+
`\n`+
`Case Style ID: ${Case_Style} ${Logica_ID_from_Link_to_Intake_Case_Info}\n`+
`\n`+
`Review Type: ${Client_Request_Deliverable_Specifics}\n`+
`\n`+
`Deliverable: ${Requested_Deliverable_Type_of_Work_Product}\n`+
`\n`+
`Due Date: ${Expert_Due_Date}\n`+
`\n`+
`Link to Casefiles:  \n`+
`${Expert_Secure_File_Share_Link}\n`+
`\n`+
`Request: Please review the following records and provide a Report / CA to address medical necessity and reasonableness of cost of the incurred treatment.\n`+
`Please opine on\n${numberedFacilities_to_Opine}\n`+
`\n`+
`Plaintiff ID/Name: ${Plaintiff_ID_Triage_Side}-${Plaintiff_Name_CAPS}\n`+
`\n`+
`Case Style: ${Case_Style}\n`+
`\n`+
`Date of Loss: ${Loss_Date}\n`+
`Attorney Info: \n`+
`${Attorney}\n`+
`${Requestor_Client_Law_Firm_from_Link_to_Intake_Case_Info}\n`+
`${Client_Law_Firm_Address}\n`+
`\n`+
`Conflict Check:\n`+
`Facilities:\n`+
`${numberedALL_Facilities_for_Plaintiff}\n`+
`\n`+
`Providers:\n`+
`${numberedALL_Providers_for_Plaintiff}\n`

const mailToLink = generateMailtoLink({
  to: expertEmail,
  cc: ccEmailInternal,
  subject: `Case Request - ID ${Logica_ID_from_Link_to_Intake_Case_Info} - ${shortCaseStyle} - Due: ${expertDueDate}`,
  body: emailBody
});

console.log(`mailTo: ${mailToLink}`);

// update all record
await table.updateRecordAsync(
    airtableRecordId, {
        'Expert Notification Email': mailToLink,
        '✳️Generate Expert Notification Email':{name: 'Finished'},
        'Email Body':emailBody
    }
);
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
    return "";
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
