console.log(`Hello, ${base.name}!  Revision 1`);
let clientInvoiceExplain='';
let expertInvoiceExplain='';
let updatedInvoiceProductList =[];
let isInvoiceProductListModified = false;
var date = new Date();
var dateStr = date.toLocaleString('en-US', {
    timeZone: 'CST',
  });
  //console.log(dateStr);


let inputConfig = input.config();
let table = base.getTable("TRIAGE/Report Dashboard");
let query = await table.selectRecordsAsync({fields: ['Report Name','Client Request "Deliverable Specifics"','Total Page Count (Check for Additional Records)',
    'Plaintiff Page Count (Check for Additional Records)','Expert','Requestor Firm from Intake','Client Invoice Product','Taxonomy for Reporting Metrics',
    'Calculated Additional Page Fee','Invoice Client Override','Invoice Expert Override',
    '# X-Ray Reviewed',
    '# MRIs/CT Reviewed',
    //'X-Ray Received Rollup',
    //'MRI/CT Received Rollup',
    'Binder pg Count Rollup','Duplicate pg Count Rollup','Submitted pg Count rollup',
    'Hospital Facilities - Billing/Coding',
    'Non-Hospital Facilities - Billing/Coding',
    'Expert Time Spent',
    'Depo Expert Prep Time Spent',
    '>1 Plaintiffs',
    'Initial Due Date (Client Request)','Date Client Approved Estimate',
    'IME # of Body Parts >1',
    'Invoice Task & Status',
    'Network for Billing',
    "Hourly Rate Client"
    ],});
let airtableRecordId = inputConfig.airtableRecordId;
let invoicingDuplicateComment = inputConfig.invoicingDuplicateComment;
let duplicatePageCount = inputConfig.duplicatePageCount;
let numFacToOpine = inputConfig.numFacToOpine;
let trueServiceLine = inputConfig.trueServiceLine;
let isLLS = containsSubstring(trueServiceLine, 'LLS');
console.log(trueServiceLine);
console.log(`numFacToOpine: ${numFacToOpine}, isLLS: ${isLLS}`);

let clientInvoiceProductsFld = table.getField('Client Invoice Product');
console.log(`record ID is ${airtableRecordId}`);
let record = query.getRecord(airtableRecordId);
//console.log(record);
let invoiceClientOverride = record.getCellValue('Invoice Client Override');
let invoiceExpertOverride = record.getCellValue('Invoice Expert Override');
let reportName = record.getCellValue('Report Name');
console.log('Report Name: '+reportName);
console.log('invoiceClientOverride: '+invoiceClientOverride);
let clientRequest = record.getCellValue('Client Request "Deliverable Specifics"');
let expert = record.getCellValueAsString('Expert');
expert= removeDoubleQuotes(expert);
console.log('Expert: '+expert);
let clientLawFirm = record.getCellValueAsString('Requestor Firm from Intake');
clientLawFirm= removeDoubleQuotes(clientLawFirm);
console.log('Client Law Firm: '+clientLawFirm);
let clientInvoiceProducts = record.getCellValue('Client Invoice Product');
let expertSpecialty = record.getCellValueAsString('Taxonomy for Reporting Metrics');
let numXrayReviewed = record.getCellValue('# X-Ray Reviewed');   
let numMRICTReviewed = record.getCellValue('# MRIs/CT Reviewed');  
let totImgReviewed = numXrayReviewed + numMRICTReviewed;  
let numHospiFacBillCoding = record.getCellValue('Hospital Facilities - Billing/Coding');     
let numNonHospiFacBillCoding = record.getCellValue('Non-Hospital Facilities - Billing/Coding'); 
let numExpertHours = record.getCellValue('Expert Time Spent'); 
let numDepoExpertPrepHours = record.getCellValue('Depo Expert Prep Time Spent'); 
let numPlaintiffs = record.getCellValue('>1 Plaintiffs');
let initialDueDate = record.getCellValue('Initial Due Date (Client Request)'); 
let clientApprovedEstimateDate = record.getCellValue('Date Client Approved Estimate');
let imeNumBodyPartsGtThan1 = record.getCellValue('IME # of Body Parts >1');
let invoiceTaskStatusName = record.getCellValue('Invoice Task & Status').name;
let networkForBillings = record.getCellValue('Network for Billing');
let hourlyRateClient = record.getCellValue("Hourly Rate Client");
let isExpertHourly = false;
let isComplexCase = false;
let isComplexHourly = false;
let isRareSpecialty = false;

// determin if expert is hourly by checking for complex case
console.log("Network of blllings");
console.log(networkForBillings);
//removeByName("XXXXX"); // this will return cloned list.
if(networkForBillings != null && networkForBillings.length >0 ){
    for (let item of networkForBillings){
        if (item === "Hourly"){
            isExpertHourly = true;
        }
    }
    
    // for (let item of clientInvoiceProducts){
    //     if( item.name === "Surgeon/Rare Specialty A+" ){
    //         isComplexCase = true;
    //         break;
    //     }
    // }
    // if(isExpertHourly && isComplexCase){
    //     isComplexHourly = true;
    //     //updatedInvoiceProductList.push({name:"Hourly Rate Complex Case"});
    // }
    
}
// console.log("isExpertHourly "+ isExpertHourly);
// console.log("isComplexCase "+ isComplexCase);
// console.log("isComplexHourly "+ isComplexHourly);
console.log(clientInvoiceProducts);

// Check if the invoicing has already been done.
// need to also identify if this is image review only report.
let isInvoiced = false;

console.log(`invoce status is `+ invoiceTaskStatusName);
if(invoiceTaskStatusName ===  'Invoiced' || invoiceTaskStatusName ===  'Paid'){
    isInvoiced = true;
    console.log(`*****************This report has been Invoiced.  Will skip the automation****************`);
}

// rush due date calculation
let rushDueDateInBizDays = calcNumOfWorkingDays(clientApprovedEstimateDate, initialDueDate) ;
console.log('Client Rush Due Date - Date Estimate Approved in Business Days: '+rushDueDateInBizDays);
if(rushDueDateInBizDays<0){
    console.log('The dates for Rush date calculation are invalid. '+clientApprovedEstimateDate+' | ' + initialDueDate);
}
await table.updateRecordAsync(
    record, {'Client Rush Due Date - Date Estimate Approved in Business Days': rushDueDateInBizDays}
);

//page counts
let totPageCountAddtlRec = record.getCellValue('Total Page Count (Check for Additional Records)');
let plaintiffPageCountAddtlRec = record.getCellValue('Plaintiff Page Count (Check for Additional Records)');
if (plaintiffPageCountAddtlRec == null){
    plaintiffPageCountAddtlRec=0;
}
let submittedPgRollup =record.getCellValue('Submitted pg Count rollup');
let binderPgRollup =record.getCellValue('Binder pg Count Rollup');

// combing with rollup for additional record processing calculations
let totPageCount = totPageCountAddtlRec+ submittedPgRollup;
let plaintiffPageCount = plaintiffPageCountAddtlRec+ binderPgRollup;


// need to see if the invoice product includes ReRead
// need to also identify if this is image review only report.
let isImgReRead = false;
let isImgingOnly = true;
if(clientInvoiceProducts != null && clientInvoiceProducts.length >0 ){
    for (let invoiceProduct of clientInvoiceProducts){
        let invoiceProductName = invoiceProduct.name;
        if (invoiceProductName.includes("Radiologist Re-Read Report") ||
            invoiceProductName.includes("Radiologist - Expert Causality Review")){
            isImgReRead = true;
        }
        if (!invoiceProductName.includes("Imaging") && !invoiceProductName.includes("Additional Page")){
            isImgingOnly = false;
        }
        if(invoiceProductName.includes("Surgeon/Spine/Rare Specialty - Med/Bill CA") ||
        invoiceProductName.includes("Surgeon/Spine/Rare Specialty - Expert Causality Review")){
            isRareSpecialty = true;
        }
    }
}

console.log('expert Specialty is: '+expertSpecialty);

console.log(clientInvoiceProducts);
console.log('expert Specialty is: '+expertSpecialty);

// ***** Skip everything if the report has been invoiced already************
if(isInvoiced){
    console.log('Skipping this automation since the report has been already invoiced or paid');
}else{
    if(invoiceClientOverride ){
        console.log('Invoice Client Calculation Override is true');
    }else{
        await calculateClientInvoice();
    }

    if(invoiceExpertOverride ){
        console.log('Invoice Expert Calculation Override is true');
    }else{
        await calculateExpertInvoice();
    }
    // invoice product list is updated if the isInvoiceProductListModified is flipped
    updateClientInvoiceProducts();
}
async function calculateExpertInvoice(){
    
    let totalLogicaExpertInvoiceAmount =0;
    let additionalPageFee = 0;
    //let extra100PageFee = 0;
    //let extra100PageFeeSpine = 0;
    let payPerAddlpageCOH=0;
    let payPerAddlpage=0;
    let skipAddtlPageCalc = false;
    let basePageCount = 350;
    let basePageCountCOH =0;
    let pagesPerAddlSet = 100;
    let pagesPerAddlSetCOH = 100;
    let invoiceImgMRICT = 0;
    let invoiceImgXRay = 0;     
    let invoiceRadiologyReRead =0;
    const llsPerFacilityInvoiceProducts = [
        'MDJW Chiro-CA/Billing Only - Per Facility',
        'MDJW Radiologist-CA/Billing Only - Per Facility',
        'MDJW Physician -CA/Billing Only - Per Facility',
        'MDJW Spine -CA/Billing Only - Per Facility',
        'MDJW Certified Coding Specialist - CA/Billing Only - Per Hospital Facility',
    ]

    writeToExpertInvoiceExplain('Expert Invc:'+dateStr);
    writeToExpertInvoiceExplain('------------------------');
    // see what products are selected
    if(clientInvoiceProducts != null && clientInvoiceProducts.length >0 ){
        let logicaExpertRecord = null;
        
        // get Expert table ID
        let queryLogicaExperts = await base.getTable("Logica Experts - MDB").selectRecordsAsync({
        fields: ['Expert Name',
            'Additional Expert on the same Case Style Causality Expert Review',
            'Additional Medical Expert on the same case style Med/Bill CA',
            'Add-On CA',
            'Base Page Count',
            'Certified Coding Specialist - CA/Billing Only - Per Hospital Facility',
            'Certified Coding Specialist - CA/Billing Only - Per Provider or Facility',
            'Chiro - Expert Causality Review',
            'Chiro - Med/Bill CA',
            'Chiro/PT Deposition',
            'Certified Coder Deposition',
            'Chiro-CA/Billing Only',
            'COH Chiro/PT Travel',
            'COH Chiro/PT/Certified Coder Deposition',
            'COH Coder Travel',
            'COH Consulting Verbal',
            'COH Court Testimony - Full Day - >8 hrs',
            'COH IME Exam w/Oral Report - One Body Part',
            'COH IME Exam w/Report - One Body Part',
            'COH Physician -CA/Billing Only',
            'COH Physician CA/Med Necessity/Causality Expert Review',
            'COH Physician Deposition',
            'COH Physician Travel',
            'COH Radiologist-CA/Billing Only',
            'COH Rush - <6 days',
            'COH Spine CA/Med Necessity/Causality Rare Specialty Review',
            'COH Spine Deposition',
            'COH Spine Travel',
            'COH Base Page Count',
            'COH Pages per Additional Set',
            'COH Pay per Additional Page',
            'COH IME - Additional Body Part',
            'COH Physician - Med/Bill CA',
            'COH Chiro-CA/Billing Only',
            'COH Chiro - Med/Bill CA',
            'COH Spine -CA/Billing Only',
            'COH Spine - Med/Bill CA',
            'Base Facilities (Billing Only)',
            'Consultation/Pre-Litigation Review per hour',
            'Court Testimony - each additional hour',
            'Court Testimony - Full Day - >8 hrs',
            'Court Testimony Half Day - 4hrs',
            'Deposition Additional Claimant',
            'Deposition additional time',
            'Deposition Expert Prep Time per hour',
            'Imaging - MRI/CT',
            'Imaging - X-Ray',
            'IME - Additional Body Part',
            'IME Exam - One Body Part',
            'Life Care Plan Review per hour',
            //'Non-Spine - Additional Pages - Per 100 pages',
            'Pay per Additional Page',
            'Pages per Additional Set',
            'Physician - Expert Causality Review',
            'Physician - Med/Bill CA',
            'Physician -CA/Billing Only',
            'Physician Deposition',
            'Radiologist - Expert Causality Review',
            'Radiologist Med/Bill CA',
            'Radiologist-CA/Billing Only',
            'Radiologist Re-Read Report',
            'Rush - <2 days',
            'Rush - <4 days',
            'Rush - <7 days',
            'Rush - <10 days',
            //'Spine - Additional Pages - Per 100 pages',
            'Spine - Expert Causality Review',
            'Spine - Med/Bill CA',
            'Spine -CA/Billing Only',
            'Spine Deposition',
            'Surgeon/Spine/Rare Specialty Deposition',
            'Surgeon/Spine/Rare Specialty - CA/Billing Only',
            'Surgeon/Spine/Rare Specialty - Med/Bill CA',
            'Surgeon/Spine/Rare Specialty - Expert Causality Review',
            'Travel',
            'Verbal per hour',
            'Court Testimony Half Day - 4hrs',
            'Hourly Rate',
            'Surgeon/Rare Specialty A+',
            'MDJW Physician Deposition',
            'MDJW Radiologist Med/Bill CA',
            'MDJW Radiologist Re-Read Report',
            'MDJW Chiro - Med/Bill CA',
            'MDJW Physician - Med/Bill CA',
            'MDJW Rush - <2 days',
            'MDJW Spine - Med/Bill CA',
            'MDJW Chiro - Expert Causality Review',
            'MDJW Chiro-CA/Billing Only - Per Facility',
            'MDJW Physician - Expert Causality Review',
            'MDJW Radiologist - Expert Causality Review',
            'MDJW Radiologist-CA/Billing Only - Per Facility',
            'MDJW Spine - Expert Causality Review',
            'MDJW Physician -CA/Billing Only - Per Facility',
            'MDJW Spine -CA/Billing Only - Per Facility',
            'MDJW Testimony Half Day - 4 Hrs',
            'MDJW Court Testimony - Full Day - > 8 Hrs',
            'MDJW Certified Coding Specialist - CA/Billing Only - Per Hospital Facility',
            ],
        });

        // find the matching Law Firm record
        for (let record of queryLogicaExperts.records) {
            //console.log('record.name: '+record.name);
            //console.log('record.id: '+record.id);
            //console.log(expert);
            if( record.name === expert){
                logicaExpertRecord = record;
                console.log('matching Expert found: '+expert);
                // law firm level variables
                //extra100PageFee = logicaExpertRecord.getCellValue('Non-Spine - Additional Pages - Per 100 pages');
                //extra100PageFeeSpine = logicaExpertRecord.getCellValue('Spine - Additional Pages - Per 100 pages');
                payPerAddlpageCOH = logicaExpertRecord.getCellValue('COH Pay per Additional Page');
                payPerAddlpage = logicaExpertRecord.getCellValue('Pay per Additional Page');
                basePageCount = logicaExpertRecord.getCellValue('Base Page Count');
                console.log('basePageCount: '+basePageCount);
                basePageCountCOH = logicaExpertRecord.getCellValue('COH Base Page Count');
                pagesPerAddlSet = logicaExpertRecord.getCellValue('Pages per Additional Set');
                pagesPerAddlSetCOH = logicaExpertRecord.getCellValue('COH Pages per Additional Set');
                invoiceImgMRICT = logicaExpertRecord.getCellValue('Imaging - MRI/CT');
                invoiceImgXRay = logicaExpertRecord.getCellValue('Imaging - X-Ray');
                invoiceRadiologyReRead = logicaExpertRecord.getCellValue('Radiologist Re-Read Report');
                break;
            }
        }

        // calculate totals
        if(logicaExpertRecord != null){
            for (let invoiceProduct of clientInvoiceProducts){
                let invoiceProductName = invoiceProduct.name;
                console.log('calculating invoice products except additional pages');
                console.log(invoiceProductName);

                // if LLS, we need to override the client invoice product for LLS.
                console.log(`is LLS ${isLLS}`)
                if(isLLS){
                    invoiceProductName = appendMDJWPrefix(invoiceProductName);
                    console.log(`LLS. Invoice product overridden: ${invoiceProductName}`);
                }
                
                // determine if additinoal page calculation should be skipped
                // 'Chronology or Record Processing Fee Per page' skips both page counts and expert pay 
                if(skipAddtlPageCalc === false && (invoiceProductName.includes("Billing Only") 
                        || invoiceProductName.includes("Life Care Plan")
                        || invoiceProductName.includes("Deposition")
                        || invoiceProductName.includes("Court Testimony")
                        || invoiceProductName.includes("IME Exam - One Body Part")
                        || invoiceProductName == 'Chronology or Record Processing Fee Per page'
                    )
                ){
                    skipAddtlPageCalc = true;
                    writeToExpertInvoiceExplain('- Skip Additional Page calcuation for '+invoiceProductName);
                }
                // additional page calculation is skipped since it is calculated later in this script
                if(invoiceProductName == 'Non-Spine - Additional Pages' || 
                    invoiceProductName == 'Spine - Additional Pages' || 
                    invoiceProductName == 'Additional pages over 250 per 250'||
                    invoiceProductName == 'Chronology or Record Processing Fee Per page'|| 
                    invoiceProductName == 'Chiro - Additional Pages'){
                    continue;
                }

                
                if (invoiceProductName.includes("Imaging - MRI/CT") ){  
                    let mriCountWithDiscount = 0; // initialize to zero
                    // no image review discount, if isImgingOnly is true
                    if (isImgingOnly == false ){
                        mriCountWithDiscount = numMRICTReviewed -1; //first MRI is included with report
                    }else{
                        mriCountWithDiscount = numMRICTReviewed
                    }                  
                    if(mriCountWithDiscount < 0){
                        mriCountWithDiscount = 0
                    }
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * mriCountWithDiscount; 
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' $'+amount+' |#billed/#total(1st MRIorXray Free): '+mriCountWithDiscount+'/'+numMRICTReviewed+' | subtotal $'+subtotal);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                    continue;
                }
                if (invoiceProductName.includes("Imaging - X-Ray") ){
                    let xrayCountWithDiscount = numXrayReviewed;
                    // no image review discount, if isImgingOnly is true
                    if(numMRICTReviewed <= 0 &&  isImgingOnly ==false ){
                        // need to apply discount here
                        xrayCountWithDiscount = numXrayReviewed -1;
                        if(xrayCountWithDiscount < 0){
                            xrayCountWithDiscount = 0
                        }
                    }
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * xrayCountWithDiscount; 
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' $'+amount+' |#billed/#total(1st MRIorXray Free): '+xrayCountWithDiscount+'/'+numXrayReviewed+' | subtotal $'+subtotal);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                    continue;
                }
                if (invoiceProductName.includes("Certified Coding Specialist - CA/Billing Only - Per Hospital Facility")||
                    invoiceProductName.includes("Billing Specialist - CA/Billing Only - Per Hospital Facility")){
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numHospiFacBillCoding;     
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' $'+amount+' |Hospital facility count: '+numHospiFacBillCoding+' | subtotal $'+subtotal);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                    continue;
                }
                if (invoiceProductName.includes("Certified Coding Specialist - CA/Billing Only - Per Provider or Facility") ||
                    invoiceProductName.includes("Billing Specialist - CA/Billing Only Per Provider or Facility")){
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numNonHospiFacBillCoding; 
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' $'+amount+' |NonHospital count: '+numNonHospiFacBillCoding+' | subtotal $'+subtotal);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                    continue;
                }
                // handle comlex cases
                if (invoiceProductName.includes("Life Care Plan Review per hour") ||
                    invoiceProductName.includes("Wrongful Death Review per hour") ||
                    invoiceProductName.includes("Consultation/Pre-Litigation Review per hour") ||
                    invoiceProductName.includes("Verbal per hour") ||
                    invoiceProductName.includes("Deposition additional time") ||
                    invoiceProductName.includes("Court Testimony - each additional hour")
                ){                    
                    
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numExpertHours;
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' $'+amount+'| Expert Hours: '+numExpertHours+' | subtotal $'+subtotal);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                    continue;
                }
                if (
                    invoiceProductName.includes("Deposition Expert Prep Time per hour")
                ){                    
                    
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numDepoExpertPrepHours;
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' $'+amount+'| Expert Hours: '+numDepoExpertPrepHours+' | subtotal $'+subtotal);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                    continue;
                }
                // IME EXAM:  for these IME exam, use "IME Exam - One Body Part"
                if (invoiceProductName.includes("Physician IME Exam - One Body Part") ||
                    invoiceProductName.includes("Spine IME Exam - One Body Part") ||
                    invoiceProductName.includes("IME Exam - One Body Part") ||
                    invoiceProductName.includes("COH IME Exam w/Oral Report - One Body Part") ||
                    invoiceProductName.includes("COH IME Exam w/Report - One Body Part") ||
                    invoiceProductName.includes("Surgeon/Spine/Rare Specialty IME Exam - One Body Part") 
                ){                    
                    
                    let amount = logicaExpertRecord.getCellValue("IME Exam - One Body Part");
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' $'+amount);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+amount;
                    continue;
                }
                // Hourly Expert
                if (invoiceProductName.includes("Hourly")){
                        let amount = logicaExpertRecord.getCellValue("Hourly Rate");
                        let subtotal = amount * numExpertHours;
                        
                        writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' /w Hourly $'+amount+'| Expert Hours: '+numExpertHours+' | subtotal $'+subtotal);
                        totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                        isInvoiceProductListModified = true;
                        continue;
                }
                // complex case handler
                if (
                    invoiceProductName.includes("Surgeon/Rare Specialty A+") ||
                    invoiceProductName.includes("Industry Standards Expert Report per hour")
                ){                    
                    // if Exper is hourly then calculate as with hourly rate
                    if( isComplexHourly || 
                    invoiceProductName.includes("Industry Standards Expert Report per hour") ){
                        let amount = logicaExpertRecord.getCellValue("Hourly Rate");
                        let subtotal = amount * numExpertHours;
                        
                        writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' /w Hourly $'+amount+'| Expert Hours: '+numExpertHours+' | subtotal $'+subtotal);
                        totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                        isInvoiceProductListModified = true;
                        continue;
                    }else{
                        // do nothing
                        // the complex case amount will be calculated via default flow.
                    }
                }
                // Ignore Hourly Rate Complex Case since it is covered by above logic
                if(invoiceProductName.includes("Hourly Rate Complex Case"))
                {
                    // do nothing and continue;
                    continue;
                }
                /* this logic is not needed since additional image count is handled by Image review products ex. Imaging - MRI/CT
                if (invoiceProductName.includes("Radiologist Re-Read Report") ){            
                    let xrayReReadCost =0;
                    let mriReReadCost=0;        
                    // re-read covers upto 2.  After that, we need to charge based on additional images
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName); // base re-read charge
                    let baseReReadCount = 2; // is base re-read always 2?
                    if( (numMRICTReviewed + numXrayReviewed) > baseReReadCount ){
                        console.log('Num Images review exceeds base read allowed. '+'baseReReadCount:'+baseReReadCount+' numXrayReviewed:'+numXrayReviewed+' numMRICTReviewed:'+numMRICTReviewed);
                        //calculate additional MRI first since it is less expensive
                        let numMRIReReadDiscount = numMRICTReviewed - baseReReadCount;
                        if(numMRIReReadDiscount >= 0){
                            // discount only applies to xray
                            xrayReReadCost = invoiceImgXRay * numXrayReviewed;
                            mriReReadCost = invoiceImgMRICT * numMRIReReadDiscount;

                        }else if (numMRIReReadDiscount <0){
                            // need to apply rest of discount to MRI
                            xrayReReadCost = (numXrayReviewed + numMRIReReadDiscount) * invoiceImgXRay;
                        }
                        
                    }
                    writeToExpertInvoiceExplain('- baseReReadCost:'+amount+' xrayReReadCost:'+xrayReReadCost+' mriReReadCost:'+mriReReadCost);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+amount + xrayReReadCost + mriReReadCost;
                    continue;
                }
                */
                if (invoiceProductName.includes("Deposition Additional Claimant")){
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * (numPlaintiffs-1); 
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' $'+amount+'/claiment |Addtl Plaintiffs: '+(numPlaintiffs-1)+' | subtotal $'+subtotal);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                    continue;
                }
                if (invoiceProductName.includes("IME - Additional Body Part")){
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * imeNumBodyPartsGtThan1; 
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' $'+amount+'/claiment |IME Addtl body > 1: '+imeNumBodyPartsGtThan1+' | subtotal $'+subtotal);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+subtotal;
                    continue;
                }
                // skip Rush fee calculation for Experts.  Expert rush fee is only applicable if the due date is less than 5 biz dates from the approval date
                if (invoiceProductName.includes("Rush - <")){
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+ ' rushDueDateInBizDays: '+ rushDueDateInBizDays);
                    if(rushDueDateInBizDays >=5){
                        writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' | Only applicable for < 5 days');
                        continue;
                    }
                }
                // we map Court Testimony Chiro Half Day - 4hrs to Court Testimony Half Day - 4hrs column in expert table
                if (invoiceProductName.includes("Court Testimony Chiro Half Day - 4hrs")
                    ||invoiceProductName.includes("Court Testimony Spine/Physician Half Day - 4hrs")
                    ||invoiceProductName.includes("Court Testimony Certified Coder Half Day - 4hrs")
                    ||invoiceProductName.includes("Court Testimony Radiologist Half Day - 4hrs")
                    ||invoiceProductName.includes("Court Testimony Rare Specialty (Ophthalmology, ENT, Neurologist) Half Day - 4hrs")){
                    let amount = logicaExpertRecord.getCellValue("Court Testimony Half Day - 4hrs");
                    writeToExpertInvoiceExplain('- PayItem: Court Testimony Half Day - 4hrs | $'+amount);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+amount;
                    continue;
                }
                // we map Court Testimony Chiro Full Day - >8 hrs to Court Testimony Half Day - 4hrs column in expert table
                if (invoiceProductName.includes("Court Testimony Chiro Full Day - >8 hrs")
                    ||invoiceProductName.includes("Court Testimony Spine Full Day - >8 hrs")
                    ||invoiceProductName.includes("Court Testimony Certified Coder Full Day - >8 hrs")
                    ||invoiceProductName.includes("Court Testimony Ortho,Pain,ER Full Day - >8 hrs")
                    ||invoiceProductName.includes("Court Testimony Radiologist Full Day - >8 hrs")){
                    let amount = logicaExpertRecord.getCellValue("Court Testimony - Full Day - >8 hrs");
                    writeToExpertInvoiceExplain('- PayItem: Court Testimony - Full Day - >8 hrs | $'+amount);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+amount;
                    continue;
                }

                if (llsPerFacilityInvoiceProducts.includes(invoiceProductName)){
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName)*numFacToOpine;
                    writeToExpertInvoiceExplain('- LLS pays multiples of # Fac to Opine');
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+', # Fac Opine: '+numFacToOpine+' | $'+amount);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+amount;
                    continue;
                }
                
                
                // default remaining logic
                if(invoiceProductName !== null){
                    let amount = logicaExpertRecord.getCellValue(invoiceProductName);
                    writeToExpertInvoiceExplain('- PayItem: '+invoiceProductName+' | $'+amount);
                    totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+amount;
                }
            }
        }else{
            writeToExpertInvoiceExplain('***No matching Expert record found. '+ clientLawFirm);
            return;
        }
        

        // add page count fee is calculated based on total number of pages for Client Law firm invoice.  
        // for expert fee, we use plaintiffpagecount.
        // 20 page tolerance, so threshold is at 370
        let tolerance = 0;
        tolerance = Math.round(pagesPerAddlSet/10);
        let basePageCountWTolerance = basePageCount+tolerance;

        // need to skip page calculation for COH if base page count is greater than total page
        // since base page count for COH is different thatn regular client, we need spearate check
        if(clientLawFirm.includes("City of Houston Legal Department") && 
            plaintiffPageCount < basePageCountCOH){
                skipAddtlPageCalc= true;
        }
        
        let updatedInvoiceProductList =[];
        if(plaintiffPageCount > basePageCountWTolerance && skipAddtlPageCalc == false){
            let additionalPages = plaintiffPageCount - basePageCount;
            let multiple = 0;
            writeToExpertInvoiceExplain('- Total Pages [#Tot = #plaintiffPageCountAddtlRec + #binderPgRollup] '+plaintiffPageCount+' = '+ plaintiffPageCountAddtlRec +' + '+ binderPgRollup);
            //console.log('extra100PageFee: $'+extra100PageFee+'  extra100PageFeeSpine: $'+extra100PageFeeSpine+ 'payPerAddlpageCOH: $'+payPerAddlpageCOH);
            if (clientLawFirm.includes("City of Houston Legal Department") ){
                // no tolerance for CO and additional page size is different
                additionalPages = plaintiffPageCount -basePageCountCOH;
                multiple = Math.round((additionalPages-(pagesPerAddlSetCOH*0.1)) / pagesPerAddlSetCOH);
                additionalPageFee = payPerAddlpageCOH * (multiple);
                updatedInvoiceProductList.push({
                    name: 'Additional pages over 250 per 250', 
                    //color: item.color 
                });
                writeToExpertInvoiceExplain('- Extra page COH [#Tot|#base|#extra|#X|$extraFee|$totFee] '+plaintiffPageCount+'|'+ basePageCountCOH +'|'+ additionalPages +'|'+ multiple +'|$'+payPerAddlpageCOH+'/'+pagesPerAddlSet+'pg|$'+additionalPageFee);
            
            } else if (expertSpecialty.includes("Spine") || isRareSpecialty){
                additionalPages = plaintiffPageCount - basePageCount;
                //console.log(additionalPages-(pagesPerAddlSet*0.1)+"********************************");
                multiple = Math.ceil((additionalPages-(pagesPerAddlSet*0.1)) / pagesPerAddlSet);
                additionalPageFee = payPerAddlpage * (multiple);
                updatedInvoiceProductList.push({
                    name: 'Spine - Additional Pages', 
                    //color: item.color 
                });
                writeToExpertInvoiceExplain('- Extra pg Spine [#Tot|#base|#extra|#X|$extraFee|$totFee] '+plaintiffPageCount+'|'+ basePageCount +'|'+ additionalPages +'|'+ multiple +'|$'+payPerAddlpage+'/'+pagesPerAddlSet+'pg|$'+additionalPageFee);
            } else{
                multiple = Math.ceil((additionalPages-(pagesPerAddlSet*0.1)) / pagesPerAddlSet); // 10 percent buffer
                additionalPageFee = payPerAddlpage * (multiple);
                updatedInvoiceProductList.push({
                    name: 'Non-Spine - Additional Pages', 
                    //color: item.color 
                });
                writeToExpertInvoiceExplain('- Extra page [#Tot|#base|#extra|#X|$extraFee|$totFee] '+plaintiffPageCount+'|'+ basePageCount +'|'+ additionalPages +'|'+ multiple +'|$'+payPerAddlpage +'/'+pagesPerAddlSet+'pg|$'+additionalPageFee);
            }
            
            totalLogicaExpertInvoiceAmount = totalLogicaExpertInvoiceAmount+additionalPageFee;

            
            // update multi select field
            // we need to make sure to add the product for additional page
            // combine existing invoice product and additinal page count
            // for(let item of clientInvoiceProducts){
            //     if(item.name !== 'Non-Spine - Additional Pages - Per 100 pages' 
            //     && item.name !== 'Spine - Additional Pages - Per 100 pages'
            //     && item.name !== 'Additional pages over 250 per 250'){
            //         updatedInvoiceProductList.push({
            //             name: item.name, 
            //             //color: item.color 
            //         });
            //     }
            // }
            // console.log(updatedInvoiceProductList);
            // // update record
            // await table.updateRecordAsync(
            //     record, {'Client Invoice Product': updatedInvoiceProductList}
            // );
            // console.log('updated Invoice Product List: ');
            // console.log(updatedInvoiceProductList);
        }
    }
    // console.log('expert status: '+expertStatusM);
    // console.log('invoice task status: '+invoiceTaskStatus);
    // console.log('Client Invoice Product field ID: '+clientInvoiceProducts.id);
    writeToExpertInvoiceExplain('------------------------');
    writeToExpertInvoiceExplain('Total Expert: $'+totalLogicaExpertInvoiceAmount);
    // update record
    await table.updateRecordAsync(
        record, {'Calculated Expert Invoice Amount': totalLogicaExpertInvoiceAmount, 'Expert Invoice Explain':expertInvoiceExplain}
    );
}//end main function



async function calculateClientInvoice(){
    let totalClientLawFirmInvoiceAmount =0;
    let additionalPageFee = 0;
    let extra100PageFee = 0;
    let extra100PageFeeSpine = 0;
    let extra100PageFeeChiro = 0;
    let extra250PageFee=0;
    let skipAddtlPageCalc = false;
    let basePageCount = 350;
    let pagesPerAddlSet = 100;
    let invoiceImgMRICT = 0;
    let invoiceImgXRay = 0;     
    let invoiceRadiologyReRead =0;
    let numBaseFacilityCount =0;
    let clientScheduleType =null;
    writeToInvoiceExplain('Client Invc:'+dateStr);
    writeToInvoiceExplain('------------------------');
    // see what products are selected
    if(clientInvoiceProducts != null && clientInvoiceProducts.length >0 ){
        let clientLawFirmRecord = null;
        
        // get client law firm table ID
        let queryClientLawfirms = await base.getTable("Client Law (Requester) Firm - MDB").selectRecordsAsync({
        fields: ['Firm Name','Client Schedule Type','Chiro-CA/Billing Only',
                'Physician -CA/Billing Only',
                'Spine -CA/Billing Only',
                'Chiro - Med/Bill CA',
                'Spine - Med/Bill CA',
                'Chiro - Expert Causality Review',
                'Physician - Expert Causality Review',
                'Imaging - MRI/CT',
                'Imaging - X-Ray',
                'Spine - Expert Causality Review',
                'Rush - <10 days',
                'Rush - <7 days',
                'Rush - <4 days',
                'Rush - <2 days',
                'Non-Spine - Additional Pages',
                'Spine - Additional Pages',
                'IME Exam - One Body Part',
                'IME - Additional Body Part',
                'Physician Deposition',
                'Spine Deposition',
                'Deposition Additional Claimant',
                'Deposition additional time',
                'Court Testimony Half Day - 4hrs',
                'Court Testimony - Full Day - >8 hrs',
                'Court Testimony - each additional hour',
                'Travel',
                'Life Care Plan Review Retainer',
                'Consultation/Pre-Litigation Review per hour',
                'Chronology or Record Processing Fee Per page',
                'Life Care Plan Review per hour',
                'Radiologist-CA/Billing Only',
                'Radiologist Med/Bill CA',
                'Additional Medical Expert on the same case style Med/Bill CA',
                'Physician - Med/Bill CA',
                'Certified Coding Specialist - CA/Billing Only - Per Provider or Facility',
                'Billing Specialist - CA/Billing Only Per Provider or Facility',
                'Radiologist - Expert Causality Review',
                'Certified Coding Specialist - CA/Billing Only - Per Hospital Facility',
                'Billing Specialist - CA/Billing Only - Per Hospital Facility',
                'Additional Expert on the same Case Style Causality Expert Review',
                'Verbal per hour',
                'Add-On CA',
                'Non-Spine - Additional Pages',
                'Spine - Additional Pages',
                'Base Page Count',
                'Pages per Additional Set',
                'Radiologist Re-Read Report',
                'Deposition Expert Prep Time per hour',
                'Consultation/Pre-Litigation Review per hour',
                //'Industry Standards Expert Report per hour',
                'Wrongful Death Review per hour',
                'Additional pages over 250 per 250',
                'COH IME Exam w/Report - One Body Part',
                'COH IME Exam w/Oral Report - One Body Part',
                'COH Rush - <6 days',
                'COH Consulting Verbal',
                'COH Physician CA/Med Necessity/Causality Expert Review',
                'COH Physician -CA/Billing Only',
                'COH Spine CA/Med Necessity/Causality Rare Specialty Review',
                'COH Coder Travel',
                'COH Chiro/PT Travel',
                'COH Spine Travel',
                'COH Physician Travel',
                'COH Depo/Testimony Cancellation Fee <24 hrs',
                'COH Chiro/PT/Certified Coder Deposition',
                'COH Court Testimony - Full Day - >8 hrs',
                'COH Physician Deposition',
                'COH Spine Deposition',
                'COH IME - Additional Body Part',
                'COH Physician - Med/Bill CA',
                'COH Chiro-CA/Billing Only',
                'COH Spine -CA/Billing Only',
                'COH Spine - Med/Bill CA',
                'COH Chiro - Med/Bill CA',
                'Court Testimony Chiro Full Day - >8 hrs',
                'Court Testimony Chiro Half Day - 4hrs',
                'Court Testimony Spine/Physician Half Day - 4hrs',
                'Court Testimony Spine Full Day - >8 hrs',
                'Court Testimony Ortho,Pain,ER Full Day - >8 hrs',
                'Court Testimony Certified Coder Half Day - 4hrs',
                'Court Testimony Certified Coder Full Day - >8 hrs',
                'Court Testimony Radiologist Half Day - 4hrs',
                'Court Testimony Radiologist Full Day - >8 hrs',
                'Physician IME Exam - One Body Part',
                'Spine IME Exam - One Body Part',
                'Indexing + Summary/Narrative Fee Per page',
                'Chiro/PT - Additional Pages',
                'Chiro/PT Deposition',
                'Chiro/PT/Certified Coder Depo additional time',
                'Spine Deposition additional time',
                'Hourly Rate',
                'Surgeon/Rare Specialty A+',
                'Base Facilities (Billing-Only)',
                'Chiro BillingOnly(per Additional Facility)',
                'Radiologist BillingOnly(per additional facility)',
                'Physician BillingOnly(per Additional Facility)',
                'Spine BillingOnly(per Additional Facility)',
                'Surgeon/Rare Specialty Billing Only(per additional facility)',
                'Surgeon/Spine/Rare Specialty - CA/Billing Only',
                'Surgeon/Spine/Rare Specialty - Med/Bill CA',
                'Surgeon/Spine/Rare Specialty - Expert Causality Review',
                'Certified Coder Deposition',
                'Surgeon/Spine/Rare Specialty IME Exam - One Body Part',
                'Surgeon/Spine/Rare Specialty Deposition additional time',
                'Surgeon/Spine/Rare Specialty Deposition',
            ],
        });

        // find the matching Law Firm record
        for (let record of queryClientLawfirms.records) {
            //console.log('record.name: '+record.name);
            //console.log('record.id: '+record.id);
            //console.log(clientLawFirm);
            if( record.name === clientLawFirm){
                clientLawFirmRecord = record;
                console.log('matching law firm found: '+clientLawFirm);
                // law firm level variables
                extra100PageFee = clientLawFirmRecord.getCellValue('Non-Spine - Additional Pages');
                extra100PageFeeSpine = clientLawFirmRecord.getCellValue('Spine - Additional Pages');
                console.log(`client extra100PageFeeSpine: ${extra100PageFeeSpine}`);
                extra100PageFeeChiro = clientLawFirmRecord.getCellValue('Chiro/PT - Additional Pages');
                extra250PageFee = clientLawFirmRecord.getCellValue('Additional pages over 250 per 250');
                basePageCount = clientLawFirmRecord.getCellValue('Base Page Count');
                pagesPerAddlSet = clientLawFirmRecord.getCellValue('Pages per Additional Set');
                invoiceImgMRICT = clientLawFirmRecord.getCellValue('Imaging - MRI/CT');
                invoiceImgXRay = clientLawFirmRecord.getCellValue('Imaging - X-Ray');
                invoiceRadiologyReRead = clientLawFirmRecord.getCellValue('Radiologist Re-Read Report');
                numBaseFacilityCount = clientLawFirmRecord.getCellValue('Base Facilities (Billing-Only)');
                clientScheduleType = clientLawFirmRecord.getCellValue('Client Schedule Type').name;
                console.log(`clientScheduleType is ${clientScheduleType}`);
                break;
            }
        }

        // calculate totals
        if(clientLawFirmRecord != null){
            for (let invoiceProduct of clientInvoiceProducts){
                let invoiceProductName = invoiceProduct.name;
                console.log('calculating invoice products except additional pages');
                console.log(invoiceProductName);
                
                // determine if additinoal page calculation should be skipped
                if(skipAddtlPageCalc === false && (invoiceProductName.includes("Billing Only") 
                        || invoiceProductName.includes("Life Care Plan")
                        || invoiceProductName.includes("Deposition")
                        || invoiceProductName.includes("Court Testimony")
                        || invoiceProductName.includes("IME Exam - One Body Part")
                        || invoiceProductName.includes("Chronology or Record Processing Fee Per page")
                    )
                ){
                    skipAddtlPageCalc = true;
                    writeToInvoiceExplain('- Skip Additional Page calcuation for '+invoiceProductName);
                }
                // additional page calculation is skipped since it is calculated later in this script
                if(invoiceProductName == 'Non-Spine - Additional Pages' || 
                invoiceProductName == 'Spine - Additional Pages' || 
                invoiceProductName == 'Additional pages over 250 per 250'|| 
                invoiceProductName == 'Chiro - Additional Pages'
                ){
                    continue;
                }

                
                // LLS calculation.  For LLS client Fee is multiplied by the number of Facility to opine
                if(isLLS && 
                    (invoiceProductName.includes("Physician -CA/Billing Only")
                    || invoiceProductName.includes("Chiro-CA/Billing Only")
                    || invoiceProductName.includes("Spine -CA/Billing Only"))
                    ){
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName)*numFacToOpine;
                    writeToInvoiceExplain('- LLS pays multiples of # Fac to Opine');
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+', # Fac Opine: '+numFacToOpine+' | $'+amount);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+amount;
                    continue;

                }
                // For "(A) Standard Fee Schedule (A) - 2025" Client, Extra charge for facility count greather than 3
                if(clientScheduleType != null && 
                    clientScheduleType.includes('(A) Standard Fee Schedule (A) - 2025') &&
                    (invoiceProductName.includes("Physician -CA/Billing Only")
                    || invoiceProductName.includes("Chiro-CA/Billing Only")
                    || invoiceProductName.includes("Radiologist-CA/Billing Only")
                    || invoiceProductName.includes("Surgeon/Spine/Rare Specialty - CA/Billing Only"))
                    ){
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' | $'+amount);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+amount;
                    if(numBaseFacilityCount < numFacToOpine){
                        // need to charge additional for extra facility counts.
                        let additionalFacs = numFacToOpine -numBaseFacilityCount;
                        let additionalFacAmount =0;
                        if(invoiceProductName.includes("Physician -CA/Billing Only")){
                            additionalFacAmount = clientLawFirmRecord.getCellValue("Physician BillingOnly(per Additional Facility)") * additionalFacs;
                        }else if(invoiceProductName.includes("Chiro-CA/Billing Only")){
                            additionalFacAmount = clientLawFirmRecord.getCellValue("Chiro BillingOnly(per Additional Facility)")* additionalFacs;
                        }else if(invoiceProductName.includes("Radiologist-CA/Billing Only")){
                            additionalFacAmount = clientLawFirmRecord.getCellValue("Radiologist BillingOnly(per additional facility)")* additionalFacs;
                        }else if(invoiceProductName.includes("Surgeon/Spine/Rare Specialty - CA/Billing Only")){
                            additionalFacAmount = clientLawFirmRecord.getCellValue("Surgeon/Rare Specialty Billing Only(per additional facility)")* additionalFacs;
                        }
                        writeToInvoiceExplain('- Schedule (A) Client of; additional Fac #:'+additionalFacs);
                        writeToInvoiceExplain('- InvItem: Additional Fac'+', # Fac Opine|#Base|#Additional: '+numFacToOpine+'|'+numBaseFacilityCount+'|'
                        +additionalFacs+' | $'+additionalFacAmount);
                        totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+additionalFacAmount;
                    }
                    continue;
                }

                if (invoiceProductName.includes("Imaging - MRI/CT")){ 
                    // skip imaging product if re-read                   
                    if(isImgReRead){
                        continue;
                    }
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numMRICTReviewed; 
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' $'+amount+' |MRI CT Count: '+numMRICTReviewed+' | subtotal $'+subtotal);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                    continue;
                }
                if (invoiceProductName.includes("Imaging - X-Ray") ){      
                    // skip imaging product if re-read              
                    if(isImgReRead){
                        continue;
                    }
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numXrayReviewed; 
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' $'+amount+' |Xray Count: '+numXrayReviewed+' | subtotal $'+subtotal);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                    continue;
                }
                if (invoiceProductName.includes("Certified Coding Specialist - CA/Billing Only - Per Hospital Facility")||
                    invoiceProductName.includes("Billing Specialist - CA/Billing Only - Per Hospital Facility")){
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numHospiFacBillCoding;     
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' $'+amount+' |Hospital facility count: '+numHospiFacBillCoding+' | subtotal $'+subtotal);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                    continue;
                }
                if (invoiceProductName.includes("Certified Coding Specialist - CA/Billing Only - Per Provider or Facility") ||
                    invoiceProductName.includes("Billing Specialist - CA/Billing Only Per Provider or Facility")){
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numNonHospiFacBillCoding; 
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' $'+amount+' |NonHospital count: '+numNonHospiFacBillCoding+' | subtotal $'+subtotal);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                    continue;
                }
                if (                    invoiceProductName.includes("Consultation/Pre-Litigation Review per hour") ||
                    invoiceProductName.includes("Verbal per hour") ||
                    invoiceProductName.includes("Deposition additional time") ||
                    invoiceProductName.includes("Chiro/PT/Certified Coder Depo additional time") ||
                    invoiceProductName.includes("Spine Deposition additional time") ||
                    invoiceProductName.includes("Court Testimony - each additional hour")||
                    invoiceProductName.includes("Hourly") ||
                    invoiceProductName.includes("Surgeon/Spine/Rare Specialty Deposition additional time")
                ){                    
                    
                    let amount = clientLawFirmRecord.getCellValue("Hourly Rate");
                    let subtotal = amount * numExpertHours;
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' $'+amount+'| Expert Hours: '+numExpertHours+' | subtotal $'+subtotal);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                    continue;
                }
                if (invoiceProductName.includes("Wrongful Death Review per hour") ||
                    invoiceProductName.includes("Life Care Plan Review per hour")
                ){                    
                    
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numExpertHours;
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' $'+amount+'| Expert Hours: '+numExpertHours+' | subtotal $'+subtotal);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                    continue;
                }
                if (
                    invoiceProductName.includes("Deposition Expert Prep Time per hour") 
                ){                
                    
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * numDepoExpertPrepHours;
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' $'+amount+'| Expert Hours: '+numDepoExpertPrepHours+' | subtotal $'+subtotal);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                    continue;        
                    
                }
                if (invoiceProductName.includes("Radiologist Re-Read Report")
                        || invoiceProductName.includes("Radiologist - Expert Causality Review")){            
                    let xrayReReadCost =0;
                    let mriReReadCost=0;        
                    // re-read covers upto 2.  After that, we need to charge based on additional images
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName); // base re-read charge
                    let baseReReadCount = 2; // is base re-read always 2?
                    if( (numMRICTReviewed + numXrayReviewed) > baseReReadCount ){
                        console.log('Num Images review exceeds base read allowed. '+'baseReReadCount:'+baseReReadCount+' numXrayReviewed:'+numXrayReviewed+' numMRICTReviewed:'+numMRICTReviewed);
                        //calculate additional MRI first since it is less expensive
                        let numMRIReReadDiscount = numMRICTReviewed - baseReReadCount;
                        if(numMRIReReadDiscount >= 0){
                            // discount only applies to xray
                            xrayReReadCost = invoiceImgXRay * numXrayReviewed;
                            mriReReadCost = invoiceImgMRICT * numMRIReReadDiscount;

                        }else if (numMRIReReadDiscount <0){
                            // need to apply rest of discount to MRI
                            xrayReReadCost = (numXrayReviewed + numMRIReReadDiscount) * invoiceImgXRay;
                        }
                        
                    }
                    writeToInvoiceExplain(invoiceProductName+':$'+amount);
                    writeToInvoiceExplain('- Imaging - X-Ray Extra:$'+xrayReReadCost);
                    writeToInvoiceExplain('- Imaging - MRI Extra:$'+mriReReadCost);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+amount + xrayReReadCost + mriReReadCost;
                    
                    
                    continue;
                }
                if(invoiceProductName.includes("Chronology or Record Processing Fee Per page")||
                    invoiceProductName.includes("Indexing + Summary/Narrative Fee Per page")
                ){
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName) * totPageCount;
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' '+totPageCount+'pg | $'+amount);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+amount;
                    continue;
                }
                if (invoiceProductName.includes("Deposition Additional Claimant")){
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * (numPlaintiffs-1); 
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' $'+amount+'/claiment |Addtl Plaintiffs: '+(numPlaintiffs-1)+' | subtotal $'+subtotal);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                    continue;
                }
                if (invoiceProductName.includes("IME - Additional Body Part")){
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    let subtotal = amount * imeNumBodyPartsGtThan1; 
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' $'+amount+'/claiment |IME Addtl body > 1: '+imeNumBodyPartsGtThan1+' | subtotal $'+subtotal);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                    continue;
                }
                // complex case handler
                if (
                    invoiceProductName.includes("Surgeon/Rare Specialty A+") ||
                    invoiceProductName.includes("Industry Standards Expert Report per hour")
                ){                    
                    // if Exper is hourly then calculate as with hourly rate
                    if( isComplexHourly || invoiceProductName.includes("Industry Standards Expert Report per hour")){
                        let amount = hourlyRateClient;
                        let subtotal = amount * numExpertHours;
                        
                        writeToInvoiceExplain('- InvItem: '+invoiceProductName+' /w Hourly $'+amount+'| Expert Hours: '+numDepoExpertPrepHours+' | subtotal $'+subtotal);
                        totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+subtotal;
                        isInvoiceProductListModified = true;
                        continue;
                    }else{
                        // do nothing
                        // the complex case amount will be calculated via default flow.
                    }
                }
                // Ignore Hourly Rate Complex Case since it is covered by above logic
                if(invoiceProductName.includes("Hourly Rate Complex Case"))
                {
                    // do nothing and continue;
                    continue;
                }
                // default remaining logic
                if(invoiceProductName !== null){
                    let amount = clientLawFirmRecord.getCellValue(invoiceProductName);
                    writeToInvoiceExplain('- InvItem: '+invoiceProductName+' | $'+amount);
                    totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+amount;
                    continue;
                }
            }
        }else{
            writeToInvoiceExplain('***No matching Client law firm record found. '+ clientLawFirm);
            return;
        }
        

        // add page count fee is calculated based on total number of pages for Client Law firm invoice.  
        // for expert fee, we use plaintiffpagecount.
        // 20 page tolerance, so threshold is at 370
        let tolerance = 20;
        let basePageCountWTolerance = basePageCount+tolerance;
        
        
        console.log("skipAddtlPageCalc "+ skipAddtlPageCalc);
        console.log("totPageCount "+ totPageCount+ '  basePageCountWTolerance '+basePageCountWTolerance);
        if(totPageCount> basePageCountWTolerance && skipAddtlPageCalc == false){
            let additionalPages = 0;
//            Invoicing Duplicate comments is "Full charge", no change
//            $1/page Charge means any additional page will be $1/pg
//            No charge means, we need to subtract the duplicate page count from the submitted page count
            if(invoicingDuplicateComment === 'No charge'){
                totPageCount = totPageCount - duplicatePageCount;
                writeToInvoiceExplain(`- Duplicate pg comment ${invoicingDuplicateComment} subtract dups from total pages`)
                writeToInvoiceExplain('- Total Pages [#Tot = #totPageCountAddtlRec + #submittedPgRollup - #duplicate] '+totPageCount+' = '+ totPageCountAddtlRec +' + '+ submittedPgRollup+' - '+duplicatePageCount);
            }else if(invoicingDuplicateComment === '$1/page Charge'){
                totPageCount = totPageCount - duplicatePageCount;
                writeToInvoiceExplain(`- Duplicate pg comment ${invoicingDuplicateComment} ${duplicatePageCount}pg \$${duplicatePageCount}`);
                writeToInvoiceExplain('- Total Pages [#Tot = #totPageCountAddtlRec + #submittedPgRollup - #duplicate] '+totPageCount+' = '+ totPageCountAddtlRec +' + '+ submittedPgRollup+' - '+duplicatePageCount);
            
                totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+duplicatePageCount;
            }else if(invoicingDuplicateComment === 'Full Charge'){
                writeToInvoiceExplain(`- Duplicate pg comment ${invoicingDuplicateComment} included in total pg calculation `);
                writeToInvoiceExplain('- Total Pages [#Tot = #totPageCountAddtlRec + #submittedPgRollup] '+totPageCount+' = '+ totPageCountAddtlRec +' + '+ submittedPgRollup);
            
            }else{
                
                writeToInvoiceExplain('- Total Pages [#Tot = #totPageCountAddtlRec + #submittedPgRollup] '+totPageCount+' = '+ totPageCountAddtlRec +' + '+ submittedPgRollup);
            }
            additionalPages = totPageCount - basePageCountWTolerance;
            let multiple = 0;
            
            if (clientLawFirm.includes("City of Houston Legal Department") ){
                // no tolerance for CO and additional page size is different
                additionalPages = totPageCount -basePageCount;
                multiple = Math.ceil((additionalPages- (pagesPerAddlSet * 0.1)) / pagesPerAddlSet);// 10 percent buffer for additional pageset
                additionalPageFee = extra250PageFee * (multiple);
                updatedInvoiceProductList.push({
                    name: 'Additional pages over 250 per 250', 
                    //color: item.color 
                });
                writeToInvoiceExplain('- Extra page COH [#Tot|#base|#extra|$extraFee|$totFee] '
                    +totPageCount+'|'+ basePageCount +'|'+ additionalPages +'|$'+extra250PageFee+'/'+pagesPerAddlSet+'pg|$'+additionalPageFee);
            } else if (expertSpecialty.includes("Spine") || isRareSpecialty){ 
                // Rare specialty additional pages are processed like Spine
                multiple = Math.ceil(additionalPages / 100);
                additionalPageFee = extra100PageFeeSpine * (multiple);
                updatedInvoiceProductList.push({
                    name: 'Spine - Additional Pages', 
                    //color: item.color 
                });
                writeToInvoiceExplain('- Extra page Spine [#Tot|#base|#extra|$extraFee|$totFee] '
                    +totPageCount+'|'+ basePageCount +'|'+ additionalPages +'|$'+extra100PageFeeSpine+'/'+pagesPerAddlSet+'pg|$'+additionalPageFee);
            } else if (expertSpecialty.includes("Chiro") ){
                multiple = Math.ceil(additionalPages / 100);
                additionalPageFee = extra100PageFeeChiro * (multiple);
                updatedInvoiceProductList.push({
                    name: 'Chiro - Additional Pages', 
                    //color: item.color 
                });
                writeToInvoiceExplain('- Extra page Chiro [#Tot|#base|#extra|$extraFee|$totFee] '
                    +totPageCount+'|'+ basePageCount +'|'+ additionalPages +'|$'+extra100PageFeeSpine+'/'+pagesPerAddlSet+'pg|$'+additionalPageFee);
            } else{
                multiple = Math.ceil(additionalPages / pagesPerAddlSet);
                additionalPageFee = extra100PageFee * (multiple);
                updatedInvoiceProductList.push({
                    name: 'Non-Spine - Additional Pages', 
                    //color: item.color 
                });
                writeToInvoiceExplain('- Extra page [#Tot|#base|#extra|$extraFee|$totFee] '
                    +totPageCount+'|'+ basePageCount +'|'+ additionalPages +'|$'+extra100PageFee+'/'+pagesPerAddlSet+'pg|$'+additionalPageFee);
            }
            
            //writeToInvoiceExplain('- Extra page fee, total page count: '+totPageCount+' multiple of '+multiple+' | $'+additionalPageFee);
            totalClientLawFirmInvoiceAmount = totalClientLawFirmInvoiceAmount+additionalPageFee;

            isInvoiceProductListModified= true;
            /*
            // update multi select field
            // we need to make sure to add the product for additional page
            // combine existing invoice product and additinal page count
            for(let item of clientInvoiceProducts){
                if(item.name !== 'Non-Spine - Additional Pages' 
                && item.name !== 'Spine - Additional Pages'
                && item.name !== 'Additional pages over 250 per 250'){
                    updatedInvoiceProductList.push({
                        name: item.name, 
                        //color: item.color 
                    });
                }
            }
            console.log(updatedInvoiceProductList);
            // update record
            await table.updateRecordAsync(
                record, {'Client Invoice Product': updatedInvoiceProductList}
            );
            console.log('updated Invoice Product List: ');
            console.log(updatedInvoiceProductList);
            */
        }
    }
    // console.log('expert status: '+expertStatusM);
    // console.log('invoice task status: '+invoiceTaskStatus);
    // console.log('Client Invoice Product field ID: '+clientInvoiceProducts.id);
    writeToInvoiceExplain('------------------------');
    writeToInvoiceExplain('Total INVOICE: $'+totalClientLawFirmInvoiceAmount);
    // update record
    await table.updateRecordAsync(
        record, {'Calculated Invoice Amount': totalClientLawFirmInvoiceAmount,'Calculated Additional Page Fee':additionalPageFee, 'Client Invoice Explain':clientInvoiceExplain}
    );
}//end main function
async function updateClientInvoiceProducts(){
    console.log('isInvoiceProductListModified '+isInvoiceProductListModified);
    if(!isInvoiceProductListModified){
        return;
    }
    // update multi select field
    // we need to make sure to add the product for additional page
    // combine existing invoice product and additinal page count
    for(let item of clientInvoiceProducts){
        if(item.name !== 'Non-Spine - Additional Pages' 
        && item.name !== 'Spine - Additional Pages'
        && item.name !== 'Additional pages over 250 per 250'
        && item.name !== 'Chiro - Additional Pages'
        ){
            updatedInvoiceProductList.push({
                name: item.name, 
                //color: item.color 
            });
        }
    }
    console.log(updatedInvoiceProductList);
    // update record
    await table.updateRecordAsync(
        record, {'Client Invoice Product': updatedInvoiceProductList}
    );
    console.log('updated Invoice Product List: ');
    console.log(updatedInvoiceProductList);
}

function removeDoubleQuotes( str ){
    if (str.charAt(0) === '"' && str.charAt(str.length -1) === '"')
    {
        return str.substr(1,str.length -2);
    }else{
        return str;
    }
}
async function writeToInvoiceExplain(str ){
    console.log(str);
    clientInvoiceExplain = clientInvoiceExplain+'\n'+str;
}
async function writeToExpertInvoiceExplain(str ){
    console.log(str);
    expertInvoiceExplain = expertInvoiceExplain+'\n'+str;
}
async function writeToExpertInvoiceExplain(str ){
    console.log(str);
    expertInvoiceExplain = expertInvoiceExplain+'\n'+str;
}

function calcNumOfWorkingDays(fromDate1, endDate1) {

		let holidays = [
    	"2023-01-02", 
    	"2023-02-20", 
    	"2023-04-07", 
    	"2023-05-29", 
    	"2023-07-04", 
    	"2023-09-04", 
    	"2023-11-23", 
    	"2023-11-24", 
    	"2023-12-25",
    	"2024-01-01", 
    	"2024-02-19", 
    	"2024-04-05", 
    	"2024-05-27", 
    	"2024-06-19", 
    	"2024-07-04", 
    	"2024-09-02", 
    	"2024-11-28", 
    	"2024-11-29",
    	"2024-12-25",
    	"2025-01-01",
    	"2025-02-17",
    	"2025-04-18",
    	"2025-05-26",
    	"2025-07-04",
    	"2025-09-01",
    	"2025-11-27",
    	"2025-11-28",
    	"2025-12-25",
    	"2026-01-01",
     ];

    let fromDate = new Date(fromDate1);
    let endDate = new Date(endDate1);
    
    console.log("fromDate "+fromDate.toISOString().slice(0, 10)) ;
    //console.log("fromDate "+fromDate.getTime()) ;
    console.log("endDate "+endDate.toISOString().slice(0, 10)) ;
    // ensure that the argument is a valid and past date
    if(!fromDate||
        !endDate||
        isNaN(fromDate.getTime())||
        isNaN(endDate.getTime())||
        fromDate.getTime() == 0||
        endDate.getTime() == 0||
        endDate<fromDate){
    console.log("Invalid date range") ;
        return -1;
    }
    
    // clone date to avoid messing up original date and time
    var frD=new Date(fromDate.getTime()),
        toD=new Date(endDate.getTime()),
        numOfWorkingDays=0;
    
    // reset time portion
    frD.setHours(0,0,0,0);
    toD.setHours(0,0,0,0);
    // zero outing the time turns date 1 day back, so need to add one day
    frD.setDate(frD.getDate()+1);
    toD.setDate(toD.getDate()+1);
    console.log("frD "+frD.toISOString().slice(0, 10)) ;
    console.log("toD "+toD.toISOString().slice(0, 10)) ;
    console.log("Start counting working days ");
    while(frD<toD){
      frD.setDate(frD.getDate()+1);
      var day=frD.getDay();
      //console.log("datemarker "+frD.toISOString().slice(0, 10)) ;
      //console.log('day of week '+ day);
      let isHoliday = holidays.includes(frD.toISOString().slice(0, 10));
      if(day!=0&&day!=6&&!isHoliday){numOfWorkingDays++;}
    }
    console.log(numOfWorkingDays) ;
    return numOfWorkingDays;
}

function removeByName(itemName){
    let isContain = clientInvoiceProducts.find(x => x.name === itemName);
    let newclientInvoiceProducts =[];
    if(isContain !== undefined){
        for(let item of clientInvoiceProducts){
            if(item.id !== itemName ){
                newclientInvoiceProducts.push(item);
            }
        }
        clientInvoiceProducts = newclientInvoiceProducts;
    }
}

function cloneList(inList){
    let outList =[];
    for(let item of inList){
            outList.push(item);
    }
    return outList;
}
function containsSubstring(array, substring) {
    if (Array.isArray(array) && array.length > 0) {
    return array.some(item => item.includes(substring));
  } else {
    return false; 
  }
  
}
function appendMDJWPrefix(inputString) {
    console.log(`input string: ${inputString} `);
    if(inputString === "Physician -CA/Billing Only"){
        return "MDJW Physician -CA/Billing Only - Per Facility";
    }
    if(inputString === "Chiro-CA/Billing Only"){
        return 'MDJW Chiro-CA/Billing Only - Per Facility';
    }
    if(inputString === "Radiologist-CA/Billing Only"){
        return 'MDJW Radiologist-CA/Billing Only - Per Facility';
    }
    if(inputString === "Spine -CA/Billing Only"){
        return 'MDJW Spine -CA/Billing Only - Per Facility';
    }
    if(inputString === "Certified Coding Specialist - CA/Billing Only"){
        return 'MDJW Certified Coding Specialist - CA/Billing Only - Per Hospital Facility';
    }

  const targetStrings = [
    "Physician Deposition",
    "Radiologist Med/Bill CA",
    "Radiologist Re-Read Report",
    "Chiro - Med/Bill CA",
    "Physician - Med/Bill CA",
    "Rush - <2 days",
    "Spine - Med/Bill CA",
    "Chiro - Expert Causality Review",
    "Chiro-CA/Billing Only - Per Facility",
    "Physician - Expert Causality Review",
    "Radiologist - Expert Causality Review",
    "Radiologist-CA/Billing Only - Per Facility",
    "Spine - Expert Causality Review",
    "Spine -CA/Billing Only - Per Facility",
    "Testimony Half Day - 4 Hrs",
    "Court Testimony - Full Day - > 8 Hrs",
    "Certified Coding Specialist - CA/Billing Only - Per Hospital Facility"
  ];

  if (targetStrings.includes(inputString)) {
    return "MDJW " + inputString;
  } else {
    return inputString; // Return the original string if it's not in the list
  }
}
/* Complex Case logic****************************************
The expert payment for the new client invoice products 
 
Chiro - Expert Complex Case --- Use the Chiro - Expert Causality Review column from the Expert Tab
ER, Pain, Neurologist, Radiology - Expert Complex Case   ----  Use the Physician - Expert Causality Review column from the Expert Tab
Ortho, Spine, Rare Specialty - Expert Complex Case    ----  Use the Spine - Expert Causality Review column from the Expert Tab
Hourly Rate    ---- Use the Hourly Rate column from the Expert Tab
 
 
Also don't forget to make the automation that any time an expert is chosen who has "hourly" in the In-Network/Out-of-Network 
field to automatically put the "Hourly rate" in the client invoice product field
*/