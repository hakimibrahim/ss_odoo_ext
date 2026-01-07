// ***************** This Script collects data from Retail POS and send it as a message to background script *************** //
var strDataToTransfer = "";
// POS Tr ID, Date Time
var salesTax = "0";
var salesTaxAmt = "0.0";
var receipt_no = "";
var dateTime = "";
var subtotal = "0";
var netTotal = "0";
var discount = "0";
var redemption_amt = "0";
var customerName = "";
var comments = "";
var receipthidden = false;
var receiptNoCaption = "Invoice#: ";//"Transaction #:";
var dateTimeCaption = "Date:";
var netTotalCaption = "PAYABLE";
var grossTotalCaption = "PAYABLE";
var discountCaption = "Discount:";
var lineItemStartColVal = "Sale";
var lineCustomerInfo = "Bill To:";
var lineItemData = "";
var listItemsStartTag = "Items";
var listItemStartOffsetIndex = 9;
var listItemEndingTag = "|Item Sold|Items Sold|"; // For one and multiple items
var lineItemEndingTagOffsetIndex = 2;
var lineItemCodeFldOffsetIndex = 6;
var lineItemQtyFldOffsetIndex = 7;
var lineItemNameFldOffsetIndex = 2;
var lineItemAmtFldOffsetIndex = 9;
var totalItems = 0;
// If receit is open then fetch the data
var objLineItemSummry = {
    totalItems: 0,
    dscntTotal: 0.0,
    regTotal: 0.0,
    taxTotal: 0.0,
    disc_amt: 0.0
}


var tag_idx = -1;

if(document.getElementsByClassName("pos-receipt-container") != undefined && document.getElementsByClassName("pos-receipt-container").length > 0)
{
    //var tenderName = "Rewards"; // Change it to whatever name is choosen
    console.log("Invoice is displayed...");
    //saleInvoiceDiv = document.getElementById("SaleInvoice3InchOffline");
    if((saleInvoiceDiv = document.getElementsByClassName("pos-receipt")) != undefined 
        && saleInvoiceDiv.length > 0){

        console.log("pos-receipt found...");

        const hostName = location.hostname;
        if(hostName.toUpperCase().includes("GIORGIOVANTI"))
            readReceipt_GV(saleInvoiceDiv)
        else if(hostName.toUpperCase().includes("TAXDOTCOM-COSMETISH"))
            readReceipt_DarhiMooch(saleInvoiceDiv,'');
        else
            readReceipt_DarhiMooch(saleInvoiceDiv,'DEFAULT');


        netTotal -= redemption_amt;
        console.log("netTotal="+netTotal);

        strDataToTransfer += receipt_no + "|" + netTotal + "|" + subtotal + "|" + "0|0|0|";
        strDataToTransfer += lineItemData+"|"+dateTime+"|"+customerName;

        var arrfieldValues = {"MSG_TYP":"FromSS1"};
        arrfieldValues["POSID"] = receipt_no;
        arrfieldValues["NET_TOT"] = ""+netTotal;
        arrfieldValues["GROS_TOT"] = ""+subtotal;
        arrfieldValues["DISCNT"] = "0";//+redemption_amt;
        arrfieldValues["REG_PR"] = ""+objLineItemSummry.regTotal;
        arrfieldValues["SPC_PR"] = ""+objLineItemSummry.dscntTotal;
        arrfieldValues["LIN_ITM"] = lineItemData;
        arrfieldValues["DTTIME"] = dateTime;
        arrfieldValues["COMMNT"] = customerName;
        arrfieldValues["REFND_INV"] = "";
        arrfieldValues["TOT_LNITM_DSC"] = "0";
        arrfieldValues["MSG_SUBTYP"] = "SETDATA_SAV";
        strDataToTransfer = JSON.stringify(arrfieldValues);

        console.log("strDataToTransfer="+strDataToTransfer);
        chrome.runtime.sendMessage(strDataToTransfer, (response) => { console.log("@RetailPOS:"+response) } );
    }else{
        console.log("Receipt frame not found.");
    }

}else{
    console.log("Invoice is not displayed...");


}

// Covers Default and DarhiMooch Receipt formats. Default needs verification though.
function readReceipt_DarhiMooch(saleInvoiceDiv, invType){
    var defaultInv = false;
    var arrTaxListColIdx = {Tax: 1, Amount: 2, Base: 3, Total: 4};
    var m_discnt_xplier = -1; // Just like Candella Toggle
    var save_recall = "R"; // S->Save, R->Recall
    var loyaltyTenderName = "LOYALTY REWARDS";//"JAZZ CASH";//

    if(invType == "DEFAULT")
        defaultInv = true;
        
    if(defaultInv){
        rcptNoTag = getTagFromListHavingText(document.getElementsByClassName("pos-receipt-order-data"),"Order ");
    }else{
        rcptNoTag = saleInvoiceDiv[0];
        /*
        posReceiptBlock = saleInvoiceDiv.getElementsByClassName("pos-receipt-center-align");
        if(posReceiptBlock != undefined && posReceiptBlock.length > 1 )
            rcptNoTag = posReceiptBlock[0];
        */
    }
    if(rcptNoTag!=undefined && rcptNoTag!=null){
        var fldValTag = undefined;
        for(i=0; i<rcptNoTag.children.length; i++){
            /*
            if(rcptNoTag.children[i].innerHTML.toUpperCase().includes("ORDER ")){
                receipt_no = rcptNoTag.children[i].innerHTML.replace("Order","").trim();
            */
            if((arr_receipt_no = rcptNoTag.children[i].innerHTML.toUpperCase().match(/\b\d{5}-\d{3}-\d{4}\b/g))!=undefined){
                if(arr_receipt_no.length > 0){
                    receipt_no = arr_receipt_no[0];
                    console.log("receipt_no="+receipt_no);
                }
                arr_receipt_no = null;
                //receipt_no = rcptNoTag.children[i].innerHTML.replace("Order","").trim();
                if(defaultInv && rcptNoTag.children.length > i+1){
                    dateTime = rcptNoTag.children[i+1].innerHTML.replace("Date:","").trim();
                    console.log("receipt_no="+receipt_no);
                    console.log("dateTime="+dateTime);
                    break;
                }else{
                    var datetimeCapTag = getTagFromListHavingText(rcptNoTag.children[i].getElementsByTagName("div"),"DATE & TIME:");
                    if(datetimeCapTag!=undefined){
                        dateTime = datetimeCapTag.textContent.toUpperCase().replace("DATE & TIME:","").trim();
                        console.log("dateTime="+dateTime);
                        strDataToTransfer = "FromSS1|";
                    }
                }
            }
            // Below in else are executed only in non-default receipt as in default receipt case, loop is stoped after finding invoice # and date
            else if(rcptNoTag.children[i].innerHTML.toUpperCase().includes("TOTAL")
                            && rcptNoTag.children[i].innerHTML.toUpperCase().includes("PAYABLE")){
                if( (receipt_amt_linesblock = rcptNoTag.children[i].getElementsByClassName("pos-receipt-center-align")) != undefined 
                        && receipt_amt_linesblock.length > 0){
                    
                    var receipt_amt_lines = receipt_amt_linesblock[0].children;
                    for(j=0; j<receipt_amt_lines.length; j++){
                        if(receipt_amt_lines[j].innerHTML.toUpperCase().includes("TOTAL")){
                            subtotal = receipt_amt_lines[j].textContent.toUpperCase().replace("TOTAL","").trim();
                            //subtotal = subtotal.replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                            // Not subtracting tax b/c we are going with loyalty redemption with Payment Modes. Issue is if cashier give entire amount as redemption, hence, subtracting tax will give net as negative in shopsmart
                            netTotal = subtotal;

                        } else if(receipt_amt_lines[j].innerHTML.toUpperCase().includes("SALES TAX")){
                            salesTaxAmt = receipt_amt_lines[j].textContent.toUpperCase().replace(/SALES\s+TAX\s*\d+(?:\.\d+)?%/gi,"").trim();
                            salesTaxAmt = salesTaxAmt.replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                            netTotal = parseFloat(subtotal) - parseFloat(salesTaxAmt);
                            netTotal = parseFloat(subtotal);

                        }else if(receipt_amt_lines[j].innerHTML.toUpperCase().includes("PAYMENT MODE:")){
                            if(receipt_amt_lines[j].children.length > 2){
                                var receipt_paymnt_modes = receipt_amt_lines[j];
                                for(k=0; k<receipt_paymnt_modes.children.length; k++){
                                    if(receipt_paymnt_modes.children[k].innerHTML.toUpperCase().includes(loyaltyTenderName)){
                                        redemption_amt = receipt_paymnt_modes.children[k].textContent.toUpperCase().replace(loyaltyTenderName,"").trim();
                                        redemption_amt = parseFloat(redemption_amt.replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,''));
                                        console.log("redemption_amt="+redemption_amt);
                                    } 
                                }
                            }
                            } 
                    }
                }
            }
            if((objLineItemRows = rcptNoTag.children[i].getElementsByTagName("tbody")) != undefined){
                if(objLineItemRows.length > 0 && objLineItemRows[0].children.length >0 ){
                    lineItemData = getListItems(objLineItemRows[0].children, objLineItemSummry);
                    console.log("Total reg = "+objLineItemSummry.regTotal+", Total Dscnt = "+objLineItemSummry.dscntTotal);
                    discount = objLineItemSummry.disc_amt;
                }
            }
        }
    }

    if((dateTimeTag = document.getElementById("order-date")) != null){
        dateTime = dateTimeTag.innerHTML.replace("Date:","").trim();
        console.log("dateTime="+dateTime);
    }
        
    if((lineItemDataTag = document.getElementsByClassName("order-container")[0]) != null){
        if((comments_tag = getTagFromListHavingText(lineItemDataTag.getElementsByClassName("customer-note"),"LNT - ")) != null 
            && comments_tag != undefined){
            customerName = comments_tag.innerHTML.replace(/<[^>]*>/g, '').trim();
        }else if((comments_tag = getTagFromListHavingText(lineItemDataTag.getElementsByClassName("customer-note"),"LRT - ")) != null 
            && comments_tag != undefined){
            customerName = comments_tag.innerHTML.replace(/<[^>]*>/g, '').trim();
        }
    }
    console.log("customerName: "+customerName);
    if(defaultInv){

        // Getting Gross Amount as per ShopSmart
        pos_receipt_amount = saleInvoiceDiv[0].getElementsByClassName("pos-receipt-amount")[0];
        if(pos_receipt_amount!=null && pos_receipt_amount !=undefined){
            if(pos_receipt_amount.children.length > 0)
                subtotal = pos_receipt_amount.children[0].innerHTML.trim().replace(/Rs\.|\&nbsp|\;|AED|SAR|Rs|\$|\,/gi,"").trim();
            console.log("subtotal="+subtotal);
        }

        // Getting Loyalty points redeemed
        paymentlines = saleInvoiceDiv[0].getElementsByClassName("paymentlines");
        if(paymentlines != null){
            loyalty_pts = getTagFromListHavingText(paymentlines,loyaltyTenderName);
            if(loyalty_pts != null && loyalty_pts != undefined){
                if(loyalty_pts.children != null && loyalty_pts.children !=undefined 
                    && loyalty_pts.children.length > 0)
                    loyalty_pts = loyalty_pts.children[0];
                redemption_amt = parseFloat(loyalty_pts.innerHTML.trim().replace(/Rs\.|\&nbsp|\;|AED|SAR|Rs|\$|\,/gi,"").trim());
                console.log("redemption_amt="+redemption_amt);
            }
        }

        // Getting Tax Amount
        netTotal = subtotal;
        pos_receipt_taxes = saleInvoiceDiv[0].getElementsByClassName("pos-receipt-taxes")[0];
        if(pos_receipt_taxes != null && pos_receipt_taxes != undefined){
            taxcols = pos_receipt_taxes.getElementsByClassName("span");
            getTagFromListHavingText(taxcols,"Tax");
            if(tag_idx != -1){
                salesTax = taxcols[tag_idx+arrTaxListColIdx.length+1].trim().replace(/Rs\.|\&nbsp|\;|AED|SAR|Rs|\$|\,|\%/gi,"").trim();
                if(salesTax != 0){
                    //netTotal = subtotal/(1+(salesTax/100));
                    // Not subtracting tax b/c we are going with loyalty redemption with Payment Modes. Issue is if cashier give entire amount as redemption, hence, subtracting tax will give net as negative in shopsmart
                    netTotal = subtotal; 
                }
            }
        }

        lineItemData = getListItems_default(save_recall, objLineItemSummry);
        console.log("Total reg = "+objLineItemSummry.regTotal+", Total Dscnt = "+objLineItemSummry.dscntTotal);
        discount = objLineItemSummry.disc_amt;
        
        /*
        if(discount!="0" && discount!=""){ // If discount / redemption exists then subtract it from reg and discounted totals to make it equal to net total. This is same we get from the breakup win of candella
            discount = discount*m_discnt_xplier;
            if(parseFloat(subtotal) < 0 || parseFloat(netTotal) < 0){ // Means its exchange transaction
                discount = discount*-1;
            }
            console.log("Calculating reg and normal totals after discount ("+discount+")");
            if(objLineItemSummry.regTotal != 0.0 || objLineItemSummry.dscntTotal != 0.0){
                var regPartOfAdjustment = ((objLineItemSummry.regTotal/(objLineItemSummry.regTotal+objLineItemSummry.dscntTotal)) * parseFloat(discount));
                var dscntPartOfAdjustment = ((objLineItemSummry.dscntTotal/(objLineItemSummry.regTotal+objLineItemSummry.dscntTotal)) * parseFloat(discount));
                console.log("Discount For: Reg = "+regPartOfAdjustment+", For Dscnt = "+dscntPartOfAdjustment);
                objLineItemSummry.regTotal -= regPartOfAdjustment;
                objLineItemSummry.dscntTotal -= dscntPartOfAdjustment;
            }
            console.log("After Discount: Total Reg = "+objLineItemSummry.regTotal+", Total Dscnt = "+objLineItemSummry.dscntTotal);
        }
        */
    }else{
    }
}

function readReceipt_GV(saleInvoiceDiv){
    var arrTaxListColIdx = {Tax: 1, Amount: 2, Base: 3, Total: 4};
    var m_discnt_xplier = -1; // Just like Candella Toggle
    var save_recall = "R"; // S->Save, R->Recall
    var loyaltyTenderName = "LOYALTY REWARDS";//"JAZZ CASH";//
    rcptNoTag = saleInvoiceDiv[0];
    if(rcptNoTag!=undefined && rcptNoTag!=null){
        var fldValTag = undefined;
        for(i=0; i<rcptNoTag.children.length; i++){
            /*
            if(rcptNoTag.children[i].innerHTML.toUpperCase().includes("ORDER ")){
                receipt_no = rcptNoTag.children[i].innerHTML.replace("Order","").trim();
            */
            if((arr_receipt_no = rcptNoTag.children[i].innerHTML.toUpperCase().match(/\b\d{5}-\d{3}-\d{4}\b/g))!=undefined){
                if(arr_receipt_no.length > 0){
                    receipt_no = arr_receipt_no[0];
                    console.log("receipt_no="+receipt_no);
                }
                arr_receipt_no = null;
            }
            // Below in else are executed only in non-default receipt as in default receipt case, loop is stoped after finding invoice # and date
            else if(rcptNoTag.children[i].innerHTML.toUpperCase().includes("SUBTOTAL")
                            && rcptNoTag.children[i].innerHTML.toUpperCase().includes("PAYABLE")){
                if( (receipt_amt_linesblock = rcptNoTag.children[i].getElementsByClassName("receipt_subtotal_table")) != undefined 
                        && receipt_amt_linesblock.length > 0){
                    
                    var receipt_amt_lines = receipt_amt_linesblock[0].children;
                    for(j=0; j<receipt_amt_lines.length; j++){
                        if(receipt_amt_lines[j].innerHTML.toUpperCase().includes("PAYABLE")){
                            //subtotal = receipt_amt_lines[j].textContent.toUpperCase().replace("PAYABLE : ","").trim();
                            subtotal = receipt_amt_lines[j].textContent.toUpperCase().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                            // Not subtracting tax b/c we are going with loyalty redemption with Payment Modes. Issue is if cashier give entire amount as redemption, hence, subtracting tax will give net as negative in shopsmart
                            netTotal = subtotal;

                        } else if(receipt_amt_lines[j].innerHTML.toUpperCase().includes("SALES TAX")){
                            //salesTaxAmt = receipt_amt_lines[j].textContent.toUpperCase().replace(/SALES\s+TAX\s*\d+(?:\.\d+)?%/gi,"").trim();
                            salesTaxAmt = receipt_amt_lines[j].textContent.toUpperCase().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                            netTotal = parseFloat(subtotal) - parseFloat(salesTaxAmt);
                            netTotal = parseFloat(subtotal);

                        }else if(receipt_amt_lines[j].innerHTML.toUpperCase().includes(loyaltyTenderName)){
                            redemption_amt =  parseFloat(receipt_amt_lines[j].textContent.toUpperCase().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,''));
                            console.log("redemption_amt="+redemption_amt);
                        }else if(receipt_amt_lines[j].innerHTML.toUpperCase().includes("PAYMENT MODE:")){
                            if(receipt_amt_lines[j].children.length > 2){
                                var receipt_paymnt_modes = receipt_amt_lines[j];
                                for(k=0; k<receipt_paymnt_modes.children.length; k++){
                                    if(receipt_paymnt_modes.children[k].innerHTML.toUpperCase().includes(loyaltyTenderName)){
                                        redemption_amt = receipt_paymnt_modes.children[k].textContent.toUpperCase().replace(loyaltyTenderName,"").trim();
                                        redemption_amt = parseFloat(redemption_amt.replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,''));
                                        console.log("redemption_amt="+redemption_amt);
                                    } 
                                }
                            }
                        } 
                    }
                }
            }else{
                //var datetimeCapTag = getTagFromListHavingText(rcptNoTag.children[i].getElementsByTagName("div"),"Date : ");
                var datetimeCapTag = rcptNoTag.children[i].getElementsByClassName("receipt_date");
                if(datetimeCapTag!=undefined && datetimeCapTag.length > 0){
                    dateTime = datetimeCapTag[0].textContent.toUpperCase().replace("DATE : ","").trim();
                    console.log("dateTime="+dateTime);
                    let d = new Date(dateTime);

                    let pad = n => String(n).padStart(2, '0');
                    dateTime = pad(d.getDate()) + "-" + pad(d.getMonth() + 1) + "-" + d.getFullYear() + " " +
                                pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());

                    console.log("Formatted Date:"+dateTime);
                    strDataToTransfer = "FromSS1|";
                }
            }
            if((objLineItemRows = rcptNoTag.children[i].getElementsByTagName("tbody")) != undefined){
                if(objLineItemRows.length > 0 && objLineItemRows[0].children.length >0 ){
                    lineItemData = getListItems_GV(objLineItemRows[0].children, objLineItemSummry);
                    console.log("Total reg = "+objLineItemSummry.regTotal+", Total Dscnt = "+objLineItemSummry.dscntTotal);
                    discount = objLineItemSummry.disc_amt;
                }
            }
        }
    }
    
}

function getFieldValue(fldRowTad){
    var fldVal = "";
    var fldColTag = fldRowTad.querySelectorAll("td");
    for(var i=(fldColTag.length-1); i>=0; i--){ // Reverse loop because value is always after the caption
        if(fldColTag[i].innerHTML != ""){
            fldVal = fldColTag[i].innerHTML.replace(/<[^>]*>/g, ''); // Replace all HTML tags and their attributes and get only value
            break;
        }
    }
    return fldVal;
}

function extractTextBetween(startPattern, endPattern, text) {
    // Escape any special regex characters in the start and end patterns
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create the dynamic regex pattern
    const regexPattern = `${escapeRegExp(startPattern)}(.*?)${escapeRegExp(endPattern)}`;

    // Convert the pattern string to a RegExp object
    const regex = new RegExp(regexPattern, 's'); // 's' flag allows . to match newline characters

    // Use the regex to find the match
    const match = text.match(regex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
}

function getElementByTxtOrAttrVal(any_par_tag, tag_type, attrORtxt, val_txt, subtext = false,relatinvePath = true) {
    var chrome_edge = 1;
    var xpath = "//" + tag_type + "[";
    if(relatinvePath)
        xpath = "."+xpath;
    if(subtext)
        xpath += "contains("+attrORtxt+",'" + val_txt + "')]";
    else
        xpath += attrORtxt+"='" + val_txt + "']";

    if(chrome_edge == 1)
        var result = document.evaluate(xpath, any_par_tag, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    else
        var result = document.selectNodes(xpath);
    
    
    return result.singleNodeValue;
}

function getListItems_GV(objLIRows, objLISumm){
    arrlineitemColIdx = {ItemCode: -1, ItemName: 1, Price: 2, Quantity: 4, DiscountPrcnt: -1, DiscountAmt: -1, TaxPrcnt: -1, TaxAmt: 5, NetAmtWithDscnt: 6, NetAmtWODscnt: -1};
    var lineItemData_string = "";
    var dscntTotal = 0.0;
    var regTotal = 0.0;
    var taxTotal = 0.0;
    var totalLineItems = 0;

    console.log("Getting line items ....");
    var totalFirstRowColumns = 0;
    var thisItemPrice = 0.0;
    var thisItemQty = 0.0;
    var thisItemTax = 0.0;
    var thisItemTaxPrcnt = 0.0;
    var disc_amt = 0.0;
    var lnItmDscnt = 0.0;
    // Because discounts on Odoo are being maintained through single line as a sum rasther than at individual line item wise,
    // hence, we will treat entire invoice as discounted if this line is found. The below flag tracks that
    var lnitemDiscountFound = false; 
    if(objLIRows.length > 0){
        var lnitemDiscountFound = false; 
        var dscnt = 0.0;
        var itemName = "";
        var itemCode = "";
        var strLnItmDscnt = "";
        console.log("Total line items: "+objLIRows.length);
        // Traverse each row
        for(var i=0; i<objLIRows.length; i++){
            row = objLIRows[i];
            thisItemPrice = 0.0;
            thisItemPriceFromTotal = 0.0;
            thisItemTotalPrice = 0.0;
            thisItemPriceBk = 0.0;
            thisItemQty = 0.0;
            thisItemTax = 0.0;
            thisItemTaxPrcnt = 0.0;
            strLnItmDscnt = "";
            lnItmDscnt = 0.0;
            val = "";
            if(row.children[0].innerHTML.trim() != ""){ // Is it first row of a line item
                if(arrlineitemColIdx["ItemName"] >= 0 && row.children[arrlineitemColIdx["ItemName"]] != undefined){
                    itemName = row.children[arrlineitemColIdx["ItemName"]].innerHTML.trim();
                    console.log("itemName:"+itemName);
                    if(itemName.toUpperCase() != 'DISCOUNT' && !itemName.toUpperCase().includes("% on specific products".toUpperCase()))
                        continue; // First row of each line item only contain Item Name. Hence, continue to next row;
                }
            }
            if(itemName.toUpperCase() != 'DISCOUNT' && !itemName.toUpperCase().includes("% on specific products".toUpperCase())){
                totalLineItems++;
                if(arrlineitemColIdx["ItemCode"] >= 0 && row.children[arrlineitemColIdx["ItemCode"]] != undefined){
                    itemCode = row.children[arrlineitemColIdx["ItemCode"]].innerHTML.trim();
                }
                if(arrlineitemColIdx["Quantity"] >= 0 && row.children[arrlineitemColIdx["Quantity"]] != undefined){
                    val = row.children[arrlineitemColIdx["Quantity"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemQty = parseInt(val);
                }
                if(arrlineitemColIdx["TaxAmt"] >= 0 && row.children[arrlineitemColIdx["TaxAmt"]] != undefined){
                    val = row.children[arrlineitemColIdx["TaxAmt"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemTax = parseFloat(val);
                }
                if(arrlineitemColIdx["Price"] >= 0 && row.children[arrlineitemColIdx["Price"]] != undefined){
                    val = row.children[arrlineitemColIdx["Price"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemPrice = parseFloat(val);
                    thisItemPriceBk = thisItemPrice;
                }
                if(arrlineitemColIdx["NetAmtWithDscnt"] >= 0 && row.children[arrlineitemColIdx["NetAmtWithDscnt"]] != undefined){
                    val = row.children[arrlineitemColIdx["NetAmtWithDscnt"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemTotalPrice = parseFloat(val);
                    
                    if(Math.abs(thisItemTotalPrice) > 0 && thisItemQty > 0)
                        thisItemPriceFromTotal = thisItemTotalPrice/thisItemQty;
                        if(thisItemPrice == 0)
                            thisItemPrice = thisItemPriceFromTotal;
                }

                if(thisItemPriceBk != 0 && Math.abs(thisItemPriceBk) > Math.abs(thisItemPriceFromTotal) ){ // Means its a discounted article
                    dscntTotal += thisItemTotalPrice;
                    lnItmDscnt = thisItemPriceBk - thisItemPriceFromTotal;
                }else
                    regTotal += thisItemTotalPrice;
                
                console.log("thisItemPriceBk:"+thisItemPriceBk+", thisItemPrice:"+thisItemPrice);

                lineItemData_string+=""; // For code once its added in invoice
                lineItemData_string+="^"+thisItemQty;
                lineItemData_string+="^"+thisItemPrice;
                lineItemData_string+="^"+itemName;
                lineItemData_string+="^"+thisItemTax;
                lineItemData_string+="^0"; // tax amount and tax %
                lineItemData_string+="^"+lnItmDscnt; // discount
                lineItemData_string+=";";
                console.log(lineItemData_string);
        
            }else{
                row = objLIRows[++i];
                if(arrlineitemColIdx["Quantity"] >= 0 && row.children[arrlineitemColIdx["Quantity"]] != undefined){
                    val = row.children[arrlineitemColIdx["Quantity"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemQty = parseInt(val);
                }
                if(arrlineitemColIdx["Price"] >= 0 && row.children[arrlineitemColIdx["Price"]] != undefined){
                    val = row.children[arrlineitemColIdx["Price"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemPrice = parseFloat(val);
                }
                if(arrlineitemColIdx["NetAmtWithDscnt"] >= 0 && row.children[arrlineitemColIdx["NetAmtWithDscnt"]] != undefined){
                    val = row.children[arrlineitemColIdx["NetAmtWithDscnt"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemTotalPrice = parseFloat(val);
                    if(Math.abs(thisItemTotalPrice) > 0 && thisItemPrice == 0 && thisItemQty > 0)
                        thisItemPrice = thisItemTotalPrice/thisItemQty;
                }
                disc_amt += thisItemPrice;
                console.log("disc_amt:"+disc_amt);
                if(itemName.toUpperCase().includes("% on specific products".toUpperCase()))
                    lnitemDiscountFound = true;

            }
        }

        // Code to subtract overall discount amount from discounted and regular total based on their ratio
        var totalLineItemAmt = dscntTotal + regTotal;
            // If discount exists then subtract it from reg and discounted totals to make it equal to net total. This is same we get from the breakup win of candella
        if(totalLineItemAmt != 0 && disc_amt != 0){
            console.log("Calculating reg and normal totals after discount ("+disc_amt+")");
            var dscntPrcnt = dscntTotal / totalLineItemAmt;
            var regPrcnt = regTotal / totalLineItemAmt;
            dscntTotal = dscntTotal + (dscntPrcnt * disc_amt); // because disc_amt will always be of opposite sign, hence, we used add operator
            regTotal = regTotal + (regPrcnt * disc_amt); // because disc_amt will always be of opposite sign, hence, we used add operator

            // In the end if its entire discounted invoice add regular item total in discounted
            if(lnitemDiscountFound){
                dscntTotal += regTotal;
                regTotal = 0.0;
            }
        }
        
        objLISumm.dscntTotal = dscntTotal;
        objLISumm.regTotal = regTotal;
        //objLISumm.taxTotal = taxTotal;
        objLISumm.totalItems = totalLineItems;
        objLISumm.disc_amt = disc_amt
        if (lineItemData_string.length > 0){
            lineItemData_string = lineItemData_string.substring(0, lineItemData_string.length - 1);
        }
    }else
        console.log("No line items found.");

    return lineItemData_string;
}

function getListItems(objLIRows, objLISumm){
    arrlineitemColIdx = {ItemCode: -1, ItemName: 0, Price: 2, Quantity: 1, DiscountPrcnt: -1, DiscountAmt: -1, TaxPrcnt: -1, TaxAmt: -1, NetAmtWithDscnt: 3, NetAmtWODscnt: -1};
    var lineItemData_string = "";
    var dscntTotal = 0.0;
    var regTotal = 0.0;
    var taxTotal = 0.0;
    var totalLineItems = 0;

    console.log("Getting line items ....");
    var totalFirstRowColumns = 0;
    var thisItemPrice = 0.0;
    var thisItemQty = 0.0;
    var thisItemTax = 0.0;
    var thisItemTaxPrcnt = 0.0;
    var disc_amt = 0.0;
    var lnItmDscnt = 0.0;
    // Because discounts on Odoo are being maintained through single line as a sum rasther than at individual line item wise,
    // hence, we will treat entire invoice as discounted if this line is found. The below flag tracks that
    var lnitemDiscountFound = false; 
    if(objLIRows.length > 0){
        var lnitemDiscountFound = false; 
        var dscnt = 0.0;
        var itemName = "";
        var itemCode = "";
        var strLnItmDscnt = "";
        console.log("Total line items: "+objLIRows.length);
        // Traverse each row
        for(var i=0; i<objLIRows.length; i++){
            row = objLIRows[i];
            thisItemPrice = 0.0;
            thisItemTotalPrice = 0.0;
            thisItemQty = 0.0;
            thisItemTax = 0.0;
            thisItemTaxPrcnt = 0.0;
            strLnItmDscnt = "";
            lnItmDscnt = 0.0;
            val = "";

            if(arrlineitemColIdx["ItemName"] >= 0 && row.children[arrlineitemColIdx["ItemName"]] != undefined){
                itemName = row.children[arrlineitemColIdx["ItemName"]].innerHTML.trim();
            }
            if(itemName.toUpperCase() != 'DISCOUNT' && !itemName.toUpperCase().includes("% on specific products".toUpperCase())){
                totalLineItems++;
                if(arrlineitemColIdx["ItemCode"] >= 0 && row.children[arrlineitemColIdx["ItemCode"]] != undefined){
                    itemCode = row.children[arrlineitemColIdx["ItemCode"]].innerHTML.trim();
                }
                if(arrlineitemColIdx["Quantity"] >= 0 && row.children[arrlineitemColIdx["Quantity"]] != undefined){
                    val = row.children[arrlineitemColIdx["Quantity"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemQty = parseInt(val);
                }
                if(arrlineitemColIdx["TaxAmt"] >= 0 && row.children[arrlineitemColIdx["TaxAmt"]] != undefined){
                    val = row.children[arrlineitemColIdx["TaxAmt"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemTax = parseFloat(val);
                }
                if(arrlineitemColIdx["Price"] >= 0 && row.children[arrlineitemColIdx["Price"]] != undefined){
                    val = row.children[arrlineitemColIdx["Price"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemPrice = parseFloat(val);
                }
                if(arrlineitemColIdx["NetAmtWithDscnt"] >= 0 && row.children[arrlineitemColIdx["NetAmtWithDscnt"]] != undefined){
                    val = row.children[arrlineitemColIdx["NetAmtWithDscnt"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemTotalPrice = parseFloat(val);
                    if(thisItemTotalPrice > 0 && thisItemPrice == 0 && thisItemQty > 0)
                        thisItemPrice = thisItemTotalPrice/thisItemQty;
                }
                regTotal += thisItemTotalPrice;
                lineItemData_string+=""; // For code once its added in invoice
                lineItemData_string+="^"+thisItemQty;
                lineItemData_string+="^"+thisItemPrice;
                lineItemData_string+="^"+itemName;
                lineItemData_string+="^"+thisItemTax;
                lineItemData_string+="^0"; // tax amount and tax %
                lineItemData_string+="^"+lnItmDscnt; // discount
                lineItemData_string+=";";
                console.log(lineItemData_string);
        
            }else{
                if(arrlineitemColIdx["Price"] >= 0 && row.children[arrlineitemColIdx["Price"]] != undefined){
                    val = row.children[arrlineitemColIdx["Price"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemPrice = parseFloat(val);
                }
                if(arrlineitemColIdx["NetAmtWithDscnt"] >= 0 && row.children[arrlineitemColIdx["NetAmtWithDscnt"]] != undefined){
                    val = row.children[arrlineitemColIdx["NetAmtWithDscnt"]].innerHTML.trim().replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,'');
                    if(val != '')
                        thisItemTotalPrice = parseFloat(val);
                    if(thisItemTotalPrice > 0 && thisItemPrice == 0 && thisItemQty > 0)
                        thisItemPrice = thisItemTotalPrice/thisItemQty;
                }
                disc_amt += thisItemPrice;
                if(itemName.toUpperCase().includes("% on specific products".toUpperCase()))
                    lnitemDiscountFound = true;

            }
        }

        // Code to subtract overall discount amount from discounted and regular total based on their ratio
        var totalLineItemAmt = dscntTotal + regTotal;
            // If discount exists then subtract it from reg and discounted totals to make it equal to net total. This is same we get from the breakup win of candella
        if(totalLineItemAmt != 0 && disc_amt != 0){
            console.log("Calculating reg and normal totals after discount ("+disc_amt+")");
            var dscntPrcnt = dscntTotal / totalLineItemAmt;
            var regPrcnt = regTotal / totalLineItemAmt;
            dscntTotal = dscntTotal + (dscntPrcnt * disc_amt); // because disc_amt will always be of opposite sign, hence, we used add operator
            regTotal = regTotal + (regPrcnt * disc_amt); // because disc_amt will always be of opposite sign, hence, we used add operator

            // In the end if its entire discounted invoice add regular item total in discounted
            if(lnitemDiscountFound){
                dscntTotal += regTotal;
                regTotal = 0.0;
            }
        }
        
        objLISumm.dscntTotal = dscntTotal;
        objLISumm.regTotal = regTotal;
        //objLISumm.taxTotal = taxTotal;
        objLISumm.totalItems = totalLineItems;
        objLISumm.disc_amt = disc_amt
        if (lineItemData_string.length > 0){
            lineItemData_string = lineItemData_string.substring(0, lineItemData_string.length - 1);
        }
    }else
        console.log("No line items found.");

    return lineItemData_string;
}

function getListItems_default(save_recall, objLISumm){
    // Set index of each line item column. This will be changed in case there is index change in Nimbus receipt line item columns
    var arrlineitemColIdx;
    /*
    if(save_recall == "R")
        arrlineitemColIdx = {ItemCode: 1, ItemName: 2, Price: 3, Quantity: 4, DiscountPrcnt: 7, DiscountAmt: 8, TaxPrcnt: 9, TaxAmt: 10, NetAmtWithDscnt: 11, NetAmtWODscnt: 12};
    else
        arrlineitemColIdx = {ItemCode: 1, ItemName: 1, Price: 2, Quantity: 3, DiscountPrcnt: -1, DiscountAmt: 7, TaxPrcnt: 4, TaxAmt: -1, NetAmtWithDscnt: 8, NetAmtWODscnt: -1};
    */
    var lineItemData_string = "";
    var dscntTotal = 0.0;
    var regTotal = 0.0;
    var taxTotal = 0.0;
    var totalLineItems = 0;
    console.log("Getting line items ....");
    if((lineItemDataTag = document.getElementsByClassName("order-container")) != undefined
        && lineItemDataTag.length > 0){
        // Code to get each line item and its colummn values
        var lineitems = lineItemDataTag[0].getElementsByClassName("orderline");
        var totalFirstRowColumns = 0;
        var thisItemPrice = 0.0;
        var thisItemQty = 0.0;
        var thisItemTax = 0.0;
        var thisItemTaxPrcnt = 0.0;
        var disc_amt = 0.0;
        var lnItmDscnt = 0.0;
        // Because discounts on Odoo are being maintained through single line as a sum rasther than at individual line item wise,
        // hence, we will treat entire invoice as discounted if this line is found. The below flag tracks that
        var lnitemDiscountFound = false; 
        if(lineitems.length>0){
            var dscnt = 0.0;
            var itemName = "";
            var strLnItmDscnt = "";
            console.log("Total line items: "+lineitems.length);
            for(var i=0; i<lineitems.length; i++){
                thisItemPrice = 0.0;
                thisItemQty = 0.0;
                thisItemTax = 0.0;
                thisItemTaxPrcnt = 0.0;
                totalLineItems++;
                strLnItmDscnt = "";
                lnItmDscnt = 0.0;

                itemName = lineitems[i].getElementsByClassName("product-name")[0].innerHTML.replace(/<[^>]*>/g, '').trim(); // Replace all HTML tags and their attributes and get only value
                var strItemTotalPrice = lineitems[i].getElementsByClassName("product-price")[0].innerHTML.replace(/<[^>]*>/g, '').replace(/Rs\.|\&nbsp|\;|AED|SAR|Rs|\$|\,/gi,"").trim(); // Replace all HTML tags and their attributes and get only value
                lineItemData_string+=""; // For code once its added in invoice
                
                if((qty_rate_tag = lineitems[i].getElementsByClassName("price-per-unit"))!=undefined
                        && qty_rate_tag.length>0){
                    var strThisItemQty = qty_rate_tag[0].getElementsByClassName("qty")[0].innerHTML.trim();
                    if(itemName.toUpperCase() != "DISCOUNT" && !itemName.toUpperCase().includes("% on specific products".toUpperCase())){
                        if(strThisItemQty !='')
                            thisItemQty = parseFloat(strThisItemQty);
                        lineItemData_string+="^"+thisItemQty;

                        var strThisItemPrice = qty_rate_tag[0].innerHTML.replace(/<[^>]*>/g, '').trim();
                        strThisItemPrice = extractTextBetween(" x ","\/ Units",strThisItemPrice);
                        strThisItemPrice = strThisItemPrice.trim().replace(/[^0-9.-]/g, '').trim();
                        //strThisItemPrice = strThisItemPrice.trim().replace(/Rs\.|\&nbsp|\;|AED|SAR|Rs|\$|\,/gi,"").trim();
                        thisItemPrice = parseFloat(strThisItemPrice);
                        // Calculating item price from total line item price. Looks like more better approach then getting price from above commented code
                        if(thisItemQty>0)
                            thisItemPrice = parseFloat(strItemTotalPrice)/thisItemQty;
                        
                        if(qty_rate_tag[0].parentElement.innerHTML.toUpperCase().includes("DISCOUNT")){
                            dscntTotal += parseFloat(strItemTotalPrice);
                            strLnItmDscnt = extractTextBetween(" With "," discount",qty_rate_tag[0].parentElement.innerHTML);
                            strLnItmDscnt = strLnItmDscnt.trim().replace(/[^0-9.%-]/g, '').trim();
                            if(strLnItmDscnt.includes("%")) {
                                strLnItmDscnt = strLnItmDscnt.replace(/[^0-9.-]/g, '').trim();
                                if(thisItemPrice > 0)
                                    lnItmDscnt = ((parseFloat(strItemTotalPrice)*100)/(100-parseFloat(strLnItmDscnt)))-parseFloat(strItemTotalPrice);
                            }else{
                                lnItmDscnt = parseFloat(strLnItmDscnt);
                            }
                        }else
                            regTotal += parseFloat(strItemTotalPrice);
                        
                        lineItemData_string+="^"+thisItemPrice;
                    }else{
                        // replace any strike through text/amount
                        var strThisItemPrice = qty_rate_tag[0].innerHTML.replace(/<s>.*?<\/s>/g,"");

                        // replace all html tags
                        strThisItemPrice = strThisItemPrice.replace(/<[^>]*>/g, '').trim();
                        
                        strThisItemPrice = extractTextBetween(" x ","\/ Units",strThisItemPrice);
                        strThisItemPrice = strThisItemPrice.trim().replace(/[^0-9.-]/g, '').trim();
                        //strThisItemPrice = strThisItemPrice.trim().replace(/Rs\.|\&nbsp|\;|AED|SAR|Rs|\$|\,/gi,"").trim();
                        thisItemPrice = parseFloat(strThisItemPrice);
                        disc_amt += thisItemPrice;
                        if(itemName.toUpperCase().includes("% on specific products".toUpperCase()))
                            lnitemDiscountFound = true;

                        continue;
                    }
                }else{
                    lineItemData_string+="^"+thisItemQty;
                    lineItemData_string+="^"+thisItemPrice;
                }
                lineItemData_string+="^"+itemName;

                
                // Calculating Tax amount from tax percentage
                /*
                if(arrlineitemColIdx["TaxPrcnt"] != -1 && itemColumns[arrlineitemColIdx["TaxPrcnt"]] != null){
                    thisItemTaxPrcnt = parseFloat(itemColumns[arrlineitemColIdx["TaxPrcnt"]].innerHTML.trim());
                    thisItemTax = (parseFloat(thisItemPrice) - (parseFloat(thisItemPrice) / (1+(parseFloat(thisItemTaxPrcnt)/100)))) * parseFloat(thisItemQty);
                    taxTotal += thisItemTax;
                    lineItemData_string+="^"+thisItemTax;
                }else{
                    lineItemData_string+="0";
                    thisItemTax = 0;
                }
                */

                /*
                if(arrlineitemColIdx["TaxAmt"] != -1 && itemColumns[arrlineitemColIdx["TaxAmt"]] != null){
                    lineItemData_string+="^"+itemColumns[arrlineitemColIdx["TaxAmt"]].innerHTML.trim().replace(/Rs\.|AED|SAR|Rs|\$|\,/gi,""); // Tax Amount
                    thisItemTax = parseFloat(itemColumns[arrlineitemColIdx["TaxAmt"]].innerHTML.trim().replace(/Rs\.|AED|SAR|Rs|\$|\,/gi,""));
                    taxTotal += thisItemTax;
                }else{
                    lineItemData_string+="0";
                    thisItemTax = 0;
                }
                if(arrlineitemColIdx["TaxPrcnt"] != -1 && itemColumns[arrlineitemColIdx["TaxPrcnt"]] != null)
                    lineItemData_string+="^"+itemColumns[arrlineitemColIdx["TaxPrcnt"]].innerHTML.trim(); // Tax %
                else
                    lineItemData_string+="0";
                */
                lineItemData_string+="^0^0"; // tax amount and tax %
                
                /*
                if(arrlineitemColIdx["DiscountAmt"] != -1 && itemColumns[arrlineitemColIdx["DiscountAmt"]] != null){
                    dscnt = itemColumns[arrlineitemColIdx["DiscountAmt"]].innerHTML.trim().replace(/Rs\.|AED|SAR|Rs|\$|\,/gi,""); // Discount Amount
                    lineItemData_string+="^"+dscnt; // Discount Amount
                }else{
                    dscnt = 0;
                    lineItemData_string+="0";
                }
                if(arrlineitemColIdx["NetAmtWithDscnt"] != -1 && itemColumns[arrlineitemColIdx["NetAmtWithDscnt"]] != null){
                    if(dscnt > 0){
                        dscntTotal += parseFloat(itemColumns[arrlineitemColIdx["NetAmtWithDscnt"]].innerHTML.trim().replace(/Rs\.|AED|SAR|Rs|\$|\,/gi,"")) - thisItemTax;
                    }else{
                        regTotal += parseFloat(itemColumns[arrlineitemColIdx["NetAmtWithDscnt"]].innerHTML.trim().replace(/Rs\.|AED|SAR|Rs|\$|\,/gi,"")) - thisItemTax;
                    }
                }
                */
                lineItemData_string+="^"+lnItmDscnt; // discount
                lineItemData_string+=";";
                console.log(lineItemData_string);
            }

            // Code to subtract overall discount amount from discounted and regular total based on their ratio
            var totalLineItemAmt = dscntTotal + regTotal;
             // If discount exists then subtract it from reg and discounted totals to make it equal to net total. This is same we get from the breakup win of candella
            if(totalLineItemAmt != 0 && disc_amt != 0){
                console.log("Calculating reg and normal totals after discount ("+disc_amt+")");
                var dscntPrcnt = dscntTotal / totalLineItemAmt;
                var regPrcnt = regTotal / totalLineItemAmt;
                dscntTotal = dscntTotal + (dscntPrcnt * disc_amt); // because disc_amt will always be of opposite sign, hence, we used add operator
                regTotal = regTotal + (regPrcnt * disc_amt); // because disc_amt will always be of opposite sign, hence, we used add operator

                // In the end if its entire discounted invoice add regular item total in discounted
                if(lnitemDiscountFound){
                    dscntTotal += regTotal;
                    regTotal = 0.0;
                }
            }
            
            objLISumm.dscntTotal = dscntTotal;
            objLISumm.regTotal = regTotal;
            //objLISumm.taxTotal = taxTotal;
            objLISumm.totalItems = totalLineItems;
            objLISumm.disc_amt = disc_amt
            if (lineItemData_string.length > 0){
                lineItemData_string = lineItemData_string.substring(0, lineItemData_string.length - 1);
            }
        }else
            console.log("No line items found.");
    }else
        console.log("Line item container not found.");
    
    return lineItemData_string;
}

function getTagFromListHavingText(listOfTags, textToPick){
    var targetTag = null;
    tag_idx = -1;
    for(n=0; n<listOfTags.length; n++){
        if(listOfTags[n].textContent.toUpperCase().includes(textToPick.toUpperCase())){
            targetTag = listOfTags[n];
            console.log("Found "+ textToPick + " at index:"+n);
            tag_idx = n;
            break;
        }
    }
    return targetTag;
}

function getElementByTxtOrAttrVal(any_par_tag, tag_type, attrORtxt, val_txt, subtext = false,relatinvePath = true) {
    var chrome_edge = 1;
    var xpath = "//" + tag_type + "[";
    if(relatinvePath)
        xpath = "."+xpath;
    if(subtext)
        xpath += "contains("+attrORtxt+",'" + val_txt + "')]";
    else
        xpath += attrORtxt+"='" + val_txt + "']";

    if(chrome_edge == 1)
        var result = document.evaluate(xpath, any_par_tag, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    else
        var result = document.selectNodes(xpath);
    
    
    return result.singleNodeValue;
}

/*
for(let i = 0; i<collection.length; i++){
    var coll = collection[i].getElementsByClassName("pos-sale-ticket");
    if(coll.length > 0)
        receipthidden = true;
}
*/
//console.log(collection);
/*
if(receiptHeadingIFrame!=null){
    console.log("receiptHeading found");
    var previewPageIframeDoc = receiptHeadingIFrame.contentDocument || receiptHeadingIFrame.contentWindow.document;
    if(previewPageIframeDoc !=null){
        console.log("receiptHeading document found");
        var previewPage = null;
        var previewPage = previewPageIframeDoc.getElementById("page1");
        
        var listItemStartIndex = 0;
        var listItemEndIndex = 0;
        if(previewPage!=null && previewPage.children.length>1){
            console.log("previewPage children="+previewPage.children.length);
            strDataToTransfer = "FromSS1|";
            for(i=0; i<previewPage.children.length; i++){
                if(previewPage.children[i].innerHTML.toUpperCase() == receiptNoCaption.toUpperCase()){
                    receipt_no = previewPage.children[i-1].innerHTML;
                }else if(previewPage.children[i].innerHTML.toUpperCase() == lineCustomerInfo.toUpperCase()){
                    customerName = previewPage.children[i+1].innerHTML;
                }else if(previewPage.children[i].innerHTML.toUpperCase() == dateTimeCaption.toUpperCase()){
                    dateTime = previewPage.children[i-1].innerHTML;
                }else if(previewPage.children[i].innerHTML.toUpperCase() == grossTotalCaption.toUpperCase()){
                    //if(isNaN(parseFloat(subtotal)))
                    subtotal = previewPage.children[i+1].innerHTML.replace(/Rs\.|AED|SAR|Rs|\$|\,/gi, "").trim();
                }else if(previewPage.children[i].innerHTML.toUpperCase() == discountCaption.toUpperCase()){
                    discount = previewPage.children[i-1].innerHTML.replace(/Rs\.|AED|SAR|Rs|\$|\,/gi, "").trim();
                }else if(previewPage.children[i].innerHTML.toUpperCase() == netTotalCaption.toUpperCase()){
                    netTotal = previewPage.children[i-1].innerHTML.replace(/Rs\.|AED|SAR|Rs|\$|\,/gi, "").trim();
                }else if(previewPage.children[i].innerHTML.toUpperCase() == listItemsStartTag.toUpperCase()){
                    listItemStartIndex = i+listItemStartOffsetIndex;
                }else if(listItemEndingTag.toUpperCase().includes("|"+previewPage.children[i].innerHTML.toUpperCase()+"|")){
                    totalItems = previewPage.children[i-1].innerHTML.trim();
                    listItemEndIndex = i;
                }
            }
            console.log("listItemStartIndex="+listItemStartIndex+", listItemEndIndex="+listItemEndIndex);
            if(listItemStartIndex!=0 && listItemEndIndex!=0)
                lineItemData = getListItems(previewPage,listItemStartIndex,listItemEndIndex);
            
            strDataToTransfer += receipt_no + "|" + netTotal + "|" + subtotal + "|" + "0|0|0|";
            strDataToTransfer += lineItemData+"|"+dateTime+"|"+customerName;

        }else{
            strDataToTransfer += "|0|0|0|0|0|||";
        }
        chrome.runtime.sendMessage(strDataToTransfer, (response) => { console.log(response) } );
        console.log("strDataToTransfer: "+strDataToTransfer);
    }
}else{
    console.log("receiptHeading not found");

}
function getListItems(previewPage, startIndex, endIndex){
    var lineItem = 0;
    var columnsInLineItem = 9;
    var lineItemData_string = "";
    var lineItemStart = 0;//startIndex+(lineItem*columnsInLineItem)
    console.log("startIndex="+startIndex+", endIndex="+ endIndex);
    for(var idx=startIndex; idx < endIndex; idx++){
        //lineItemStart = startIndex+(lineItem*columnsInLineItem);
        //console.log("lineItemStart="+lineItemStart);
        if(idx < previewPage.children.length 
            && previewPage.children[idx]!=null
            && previewPage.children[idx].innerHTML.trim().toUpperCase() == lineItemStartColVal.toUpperCase()){
            if((idx+lineItemAmtFldOffsetIndex-1) <= previewPage.children.length){ 
                lineItem++;
                console.log("LineItem No="+lineItem);
                lineItemData_string+=previewPage.children[idx+lineItemCodeFldOffsetIndex-1].innerHTML.trim(); // Item Code - Missing
                lineItemData_string+="^"+previewPage.children[idx+lineItemQtyFldOffsetIndex-1].innerHTML.trim(); // Quantity
                lineItemData_string+="^"+previewPage.children[idx+lineItemAmtFldOffsetIndex-1].innerHTML.replace(/Rs\.|AED|SAR|Rs|\$|\,/gi,"").trim(); // Price
                lineItemData_string+="^"+previewPage.children[idx+lineItemNameFldOffsetIndex-1].innerHTML.trim().replace(/\&nbsp;|\&lt;|\&apos;/gi,""); // Name
                lineItemData_string+=";";
                idx+=lineItemAmtFldOffsetIndex-1;
            }
        }
    }
    if (lineItemData_string.length > 0){
        lineItemData_string = lineItemData_string.substring(0, lineItemData_string.length - 1);    
    }
    return lineItemData_string;
}
*/
