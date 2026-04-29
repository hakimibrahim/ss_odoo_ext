
function pastedataScript(data){
    document.getElementById("external_data").value = data;
    document.getElementById('external_data').dispatchEvent(new Event('change', { bubbles: true }));
    //filldatainfields(data);
    //copydatainclipboard();
}

//chrome.runtime.sendMessage("03213789216", (response) => { console.log(response) } );

console.log("Adding Listner to get messages... ver 1.0.5");

var loyaltyTenderName = "LOYALTY REWARD";
var discountOnTop = false; // Discount is on main win as well
var commentsOnTop = false; // Comments button is on main win as well

// Added on [25-Mar-2026]
const hostName = location.hostname;
var more_btn_captn = "More";
var commentsBtnName = 'Customer Note';
var callGenericDataTrFn = true;
var commentsOKBtnName = "ADD";
if(hostName.toUpperCase().includes("GIORGIOVANTI")){
    more_btn_captn = "More";
    commentsBtnName = 'Customer Note';
    commentsOKBtnName = "ADD";
}else if(hostName.toUpperCase().includes("TAXDOTCOM-COSMETISH")){
    more_btn_captn = "More";
    commentsBtnName = 'Customer Note';
    commentsOKBtnName = "ADD";
}else if(hostName.toUpperCase().includes("MASARRAT-MISBAH")){
    more_btn_captn = "Actions";
    commentsBtnName = "General Note";
    commentsOKBtnName = "APPLY";
    callGenericDataTrFn = true;
}else{ // Default
    more_btn_captn = "More";
    commentsBtnName = 'Customer Note';
    commentsOKBtnName = "ADD";
}

chrome.runtime.onMessage.addListener((message,sender,sendResponse) => 
                                        {
                                            console.log("message from background ... "+message);
                                            
                                            console.log("Checking FromSS ... result: "+message.indexOf("FromSS"));
                                            console.log("Checking FromPOS ... result: "+message.indexOf("FromPOS"));
                                            if(message.indexOf("FromPOS")>=0){
                                              
                                                console.log("Calling: fillDataInRetailPOSFields...receied message from bk:"+message); 
                                                if(callGenericDataTrFn)// currently in 1.0.5 its always kept as true
                                                    fillDataInRetailPOSFields_genrc(message);
                                                else // remove this in next buid if all is working well
                                                    fillDataInRetailPOSFields(message);
                                                sendResponse("fillDataInRetailPOSFields called successfully");
  
                                            }else if(message.indexOf("FromSS")>=0 || message.indexOf("FromSS1")>=0){
                                                console.log("Calling: pastedataScript...receied message from bk:"+message); 
                                                pastedataScript(message);
                                                sendResponse("pastedataScript called successfully");
                                            }
                                            
                                        }
                                    );

// Hide discount fields on top control buttons as well as add an event listner to hide the discount button if More... button is clicked.
// Try twice
setInterval(() => {
    if(document.getElementsByClassName("pos") != undefined && document.getElementsByClassName("pos")[0] != undefined
        && document.getElementsByClassName("control-buttons") != undefined && document.getElementsByClassName("control-buttons").length>0){
        controlBtnsTags = document.getElementsByClassName('control-buttons')[0]; // Control Button panel
        element = getTagFromListHavingText_cs(controlBtnsTags.querySelectorAll("button"),commentsBtnName); // Customer Note
        if(element != null){
            commentsOnTop = true;
        }
        hideDiscountBtnOnPOSLoad();
    }else if(document.getElementsByClassName("button paymentmethod") != undefined
                && document.getElementsByClassName("button paymentmethod").length > 0){
        arrPaymtMthd = document.getElementsByClassName("button paymentmethod");
        //arrPaymtMthd = document.getElementsByClassName("payment-method-display");
        if(arrPaymtMthd != undefined && arrPaymtMthd.length > 0){
            for(i=arrPaymtMthd.length;i>0;i--){
                arrPaymtName = arrPaymtMthd[i-1].getElementsByClassName("payment-name");
                if(arrPaymtName.length>0 && arrPaymtName[0].innerHTML.trim().toUpperCase().includes(loyaltyTenderName.toUpperCase()))
                    arrPaymtMthd[i-1].style.display = 'none';
            }
        }
    }
},500);

function showLoader() {
  // Avoid adding multiple times
  if (document.getElementById("ext-loader-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "ext-loader-overlay";
  overlay.innerHTML = `
    <div class="ext-loader-spinner"></div>
  `;
  
  document.body.appendChild(overlay);

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    #ext-loader-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999; /* must be high to appear above React app */
    }
    .ext-loader-spinner {
      border: 6px solid #f3f3f3;
      border-top: 6px solid #3498db;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function hideLoader() {
  const overlay = document.getElementById("ext-loader-overlay");
  if (overlay) overlay.remove();
}

function cleanupOnCompletion(){
    hideLoader();
    custEntryStatus = 1;
}

// Added on [25-Mar-2026]
function onMoreButtonClick() {
    console.log('More Button was clicked!');
    setTimeout(() => {
        if(document.getElementsByClassName("js_discount") != undefined){
            discount_tag_cnt = document.getElementsByClassName("js_discount").length;
            for(i=0;i<discount_tag_cnt;i++)
                document.getElementsByClassName("js_discount")[i].style.display = "none";
        }
    },200);
    return false;
}

// Hide discount fields on top control buttons as well as add an event listner to hide the discount button if More... button is clicked.
function hideDiscountBtnOnPOSLoad(){
    /*
    if(document.getElementsByClassName("js_discount")!=undefined && document.getElementsByClassName("js_discount").length>0){
        document.getElementsByClassName("js_discount")[0].style.display = "none";
        discountOnTop = true;
        console.log("Setting discountOnTop as True.");
    }
    */
    const control_buttons = document.getElementsByClassName('control-buttons')[0];
    if(control_buttons != undefined && control_buttons != null){
        element = getTagFromListHavingText_cs(control_buttons.children,"DISCOUNT"); // Customer Note
        if(element != null){
            element.style.display = "none";
            discountOnTop = true;
        }
        moreButton = getTagFromListHavingText_cs(control_buttons.querySelectorAll("button"),more_btn_captn);
        //moreButton.dispatchEvent(new Event('click'));
        
        if(moreButton != null && moreButton != undefined){
            // Add the click event listener
            moreButton.addEventListener('click', onMoreButtonClick);
        }
    }
    //}
}
/*
// Hide discount fields on top control buttons as well as add an event listner to hide the discount button if More... button is clicked.
function hideDiscountBtnOnPOSLoad(){
    if(document.getElementsByClassName("js_discount")!=undefined && document.getElementsByClassName("js_discount").length>0){
        document.getElementsByClassName("js_discount")[0].style.display = "none";
        const control_buttons = document.getElementsByClassName('control-buttons')[0];
        if(control_buttons != undefined && control_buttons != null){
            moreButton = getTagFromListHavingText_cs(control_buttons.querySelectorAll("button"),more_btn_captn);
            //moreButton.dispatchEvent(new Event('click'));
            
            // Add the click event listener
            if(moreButton != null && moreButton != undefined){
                moreButton.addEventListener('click', function() {
                    console.log('More Button was clicked!');
                    setTimeout(() => {
                        discount_tag_cnt = document.getElementsByClassName("js_discount").length;
                        for(i=0;i<discount_tag_cnt;i++)
                            document.getElementsByClassName("js_discount")[i].style.display = "none";
                    },200);
                    return false;
                });
            }
            
        }
    }
}
*/
// This one is old function and not in use starting v1.0.5. Should be removed in the next build if no issue is reported in the 3 brands
function fillDataInRetailPOSFields(data){
    var receiptNo = "";
    var discountAmt = 0.0;
    var commentDlgTitle = 'Add Customer Note';

    if(document.getElementsByClassName("js_discount") != undefined &&
        document.getElementsByClassName("js_discount") > 0)
        document.getElementsByClassName("js_discount")[0].style.display = "none";
    // Getting Receipt # to check if new receit so that data can be transferred
    if(data!='' && data !='0' && document.getElementsByClassName("pos")[0] != null 
        && document.getElementsByClassName("pos")[0] != undefined
        && document.getElementsByClassName("order-container")[0] != null 
        && document.getElementsByClassName("order-container")[0] != undefined){
        //************ Place check of new invoice, then only insert the values
        //var fieldValues = data.split(':');
        //console.log("Fields found in data: " + fieldValues.length);
        console.log("[fillDataInRetailPOSFields]: Deserializing Data From Browser ...");
        fieldValues = JSON.parse(data);
        console.log("[fillDataInRetailPOSFields]:Data from browser: " + data);
        if (fieldValues != null && fieldValues["MSG_TYP"]!=undefined
            && fieldValues["MSG_TYP"]=="FromPOS"
            && fieldValues["CUST_NAME"].length <= 100 && fieldValues["CUST_NAME"].length > 1
            && parseFloat(fieldValues["REDEMP"]) !== NaN
            && parseFloat(fieldValues["DISCNT"]) !== NaN
            //&& long.TryParse(arrstrText[2], out lcardNo)
            )
        {
            lAmount_to_redeem = parseFloat(fieldValues["REDEMP"]);
            lDiscount = parseFloat(fieldValues["DISCNT"]);
            strComments = "";

            if (fieldValues["CARDNO"].length > 0)
                strComments = fieldValues["CUST_NAME"] + fieldValues["CARDNO"];
            else
                strComments = fieldValues["CUST_NAME"];

            var customerCell = "";
            // Searching customer
            var strCustName = fieldValues["CUST_NAME"].replace(/LNT \-|LRT \-/gi,"").trim();
            //customerCell = document.getElementById('CustomerCode').value;
            strSmartCard = fieldValues["CARDNO"].trim();
            console.log('Selected Customer at POS: '+customerCell);
            console.log('Selected Customer at ShopSmart: '+strSmartCard);
            
            netTotal=0.0;
            if(fieldValues["NET_SALE"]!=undefined && fieldValues["NET_SALE"].length > 0)
                netTotal = parseFloat(fieldValues["NET_SALE"]);

            //******* For opening comments window and Entring comments *******//
            //console.log("2");
            controlBtnsTags = document.getElementsByClassName('control-buttons')[0]; // Control Button panel
            element = getTagFromListHavingText_cs(controlBtnsTags.querySelectorAll("button"),'Customer Note'); // Customer Note
            showLoader();
            if(element != null){
                element.dispatchEvent(new Event('click'));
                //console.log("3");
                setTimeout(() => {
                    //element = getElementByText(document,'h4', 'Add Customer Note');
                    var commentsTagDlg = document.getElementsByClassName("modal-dialog");
                    if(commentsTagDlg.length>0){
                       commentsTag = commentsTagDlg[0].getElementsByClassName("modal-title");
                        if(commentsTag != null && commentsTag.length > 0
                            && commentsTag[0].innerHTML.trim().toUpperCase().includes(commentDlgTitle.toUpperCase())
                        ){

                            console.log('Window is opened. Entring text ... ');
                            arrTxtAreaTag = commentsTagDlg[0].getElementsByTagName('textarea');//querySelectorAll("textarea")[0];
                            if(arrTxtAreaTag!=null && arrTxtAreaTag.length > 0){
                                console.log('Entring value in test area ... ');
                                txtAreaTag = arrTxtAreaTag[0];

                                txtAreaTag.value = strComments;
                                txtAreaTag.dispatchEvent(new Event('input', { bubbles: true }));
                                txtAreaTag.dispatchEvent(new Event('change', { bubbles: true }));
                                txtAreaTag.dispatchEvent(new Event('blur'));
                                //typeInTextarea("LNT Ibrahim Hakim", txtAreaTag);
                            }
                            //txtAreaTag.value = strComments;
                            //txtAreaTag.dispatchEvent(new Event('input'));
                            
                            var commentButtons = commentsTagDlg[0].getElementsByClassName("button confirm");
                            if(commentButtons != undefined && commentButtons.length > 0)
                                commentButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//new Event('click'));
                        }
                        
                    }
                    //******* End comments entry *******//
                    EnterDiscount(lAmount_to_redeem, lDiscount, netTotal);
                }, 1000); // 3 seconds
            }else{
                EnterDiscount(lAmount_to_redeem, lDiscount, netTotal);

            }
            cleanupOnCompletion();
        }
    }else{
        console.log("Ignoring as no item is selected.");
    }
}

function fillDataInRetailPOSFields_genrc(data){
    var receiptNo = "";
    var discountAmt = 0.0;

    if(document.getElementsByClassName("js_discount") != undefined &&
        document.getElementsByClassName("js_discount") > 0)
        document.getElementsByClassName("js_discount")[0].style.display = "none";
    // Getting Receipt # to check if new receit so that data can be transferred
    if(data!='' && data !='0' && document.getElementsByClassName("pos")[0] != null 
        && document.getElementsByClassName("pos")[0] != undefined
        && document.getElementsByClassName("order-container")[0] != null 
        && document.getElementsByClassName("order-container")[0] != undefined){
        //************ Place check of new invoice, then only insert the values
        //var fieldValues = data.split(':');
        //console.log("Fields found in data: " + fieldValues.length);
        console.log("[fillDataInRetailPOSFields_genrc]: Deserializing Data From Browser ...");
        fieldValues = JSON.parse(data);
        console.log("[fillDataInRetailPOSFields_genrc]:Data from browser: " + data);
        if (fieldValues != null && fieldValues["MSG_TYP"]!=undefined
            && fieldValues["MSG_TYP"]=="FromPOS"
            && fieldValues["CUST_NAME"].length <= 100 && fieldValues["CUST_NAME"].length > 1
            && parseFloat(fieldValues["REDEMP"]) !== NaN
            && parseFloat(fieldValues["DISCNT"]) !== NaN
            //&& long.TryParse(arrstrText[2], out lcardNo)
            )
        {
            l_lAmount_to_redeem = parseFloat(fieldValues["REDEMP"]);
            l_lDiscount = parseFloat(fieldValues["DISCNT"]);
            l_strComments = "";

            if (fieldValues["CARDNO"].length > 0)
                l_strComments = fieldValues["CUST_NAME"] + fieldValues["CARDNO"];
            else
                l_strComments = fieldValues["CUST_NAME"];

            var customerCell = "";
            // Searching customer
            var strCustName = fieldValues["CUST_NAME"].replace(/LNT \-|LRT \-/gi,"").trim();
            //customerCell = document.getElementById('CustomerCode').value;
            strSmartCard = fieldValues["CARDNO"].trim();
            console.log('Selected Customer at POS: '+customerCell);
            console.log('Selected Customer at ShopSmart: '+strSmartCard);
            
            l_netTotal=0.0;
            if(fieldValues["NET_SALE"]!=undefined && fieldValues["NET_SALE"].length > 0)
                l_netTotal = parseFloat(fieldValues["NET_SALE"]);

            //******* For opening comments window and Entring comments *******//
            //console.log("2");
            console.log("discountOnTop:"+discountOnTop);
            console.log("commentsOnTop:"+commentsOnTop);
            clickComments(l_strComments,l_lAmount_to_redeem, l_lDiscount, l_netTotal);
        }
    }else{
        console.log("Ignoring as no item is selected.");
    }
}

function enterComments(cntrl_btn_idx,posComments,lAmount_to_redeem, lDiscount, netTotal){ // Enter Comments in top or within dialog depending on the index passed
    controlBtnsTags = document.getElementsByClassName('control-buttons')[cntrl_btn_idx]; // Control Button panel
    element = getTagFromListHavingText_cs(controlBtnsTags.querySelectorAll("button"),commentsBtnName); // Customer Note
    if(element != null){
        console.log("Opening comments window...");
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//new Event('click'));
        //element.dispatchEvent(new Event('click'));
        //console.log("3");
        setTimeout(() => {
            console.log("Writing comments..."+posComments);
            writeCommnetsField(posComments);
            //******* End comments entry *******//
            EnterDiscount(lAmount_to_redeem, lDiscount, netTotal);
        }, 1000); // 3 seconds
    }else{
        EnterDiscount(lAmount_to_redeem, lDiscount, netTotal);

    }
}

function clickComments(posComments,lAmount_to_redeem, lDiscount, netTotal){
    showLoader();
    if(!commentsOnTop){ // If comments are not at the top get into Action window first
        console.log("Clicking "+more_btn_captn+" button to open sub control window.");
        const control_buttons = document.getElementsByClassName('control-buttons')[0];
        if(control_buttons != undefined && control_buttons != null){
            moreButton = getTagFromListHavingText_cs(control_buttons.querySelectorAll("button"),more_btn_captn);
            //moreButton.dispatchEvent(new Event('click'));
            
            if(moreButton != null && moreButton != undefined){
                // Click the button
                moreButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//new Event('click'));
                //moreButton.dispatchEvent(new Event('click'));
                    setTimeout(() => {
                        console.log("Wind. Opened. Calling enterComments");
                        enterComments(1,posComments,lAmount_to_redeem, lDiscount, netTotal);
                    }, 1500); 
            }
        }
    }else{
        console.log("Calling enterComments");
        enterComments(0,posComments,lAmount_to_redeem, lDiscount, netTotal);
    }
}

function writeCommnetsField(posComments){
    var commentDlgTitle = 'Add '+commentsBtnName;
    //element = getElementByText(document,'h4', 'Add Customer Note');
    var commentsTagDlg = document.getElementsByClassName("modal-dialog");
    if(commentsTagDlg.length>0){
        commentsTag = commentsTagDlg[0].getElementsByClassName("modal-title");
        commentsTag = document.getElementsByClassName("modal-title");
        console.log(commentsTag.length);
        if(commentsTag != null && commentsTag.length > 0
            && commentsTag[0].innerHTML.trim().toUpperCase().includes(commentDlgTitle.toUpperCase())
        ){

            console.log('Window is opened. Entring text ... ');
            arrTxtAreaTag = commentsTagDlg[0].getElementsByTagName('textarea');//querySelectorAll("textarea")[0];
            if(arrTxtAreaTag!=null && arrTxtAreaTag.length > 0){
                console.log('Entring value in test area ... ');
                txtAreaTag = arrTxtAreaTag[0];

                txtAreaTag.value = posComments;
                txtAreaTag.dispatchEvent(new Event('input', { bubbles: true }));
                txtAreaTag.dispatchEvent(new Event('change', { bubbles: true }));
                txtAreaTag.dispatchEvent(new Event('blur'));
                //typeInTextarea("LNT Ibrahim Hakim", txtAreaTag);
            }
            //txtAreaTag.value = posComments;
            //txtAreaTag.dispatchEvent(new Event('input'));
            
            var commentButtons = undefined;
            if(commentsOnTop)
                commentButtons = commentsTagDlg[0].getElementsByClassName("button confirm")[0];
            else
                commentButtons = getTagFromListHavingText_cs(commentsTagDlg[0].querySelectorAll("button"),commentsOKBtnName)

            if(commentButtons != undefined)
                //commentButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//new Event('click'));
                commentButtons.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//new Event('click'));
        }
        
    }
}

function EnterDiscount(lAmount_to_redeem, lDiscount, netTotal, popupAlreadyOpen){
    // Getting discount to check if its different then we want to transfer. So as to change the value 
    if((ordr_container = document.getElementsByClassName("order-container")) != null){
        //console.log("1");
        var element = getElementByText(document/*ordr_container[0]*/,'div/div/span', 'Discount');
        if(element!=null){
            var strDiscountAmt = element.parentElement.parentElement.children[1].innerHTML.replace(/<[^>]*>/g, ''); // Replace all HTML tags and their attributes and get only value;
            console.log("Curr. Dsc Amt = "+strDiscountAmt);
            discountAmt = parseFloat(strDiscountAmt.replace(/Rs\.|\&nbsp|\;|AED|SAR|Rs|\$|\,/gi,"").trim());
            console.log("Curr. Dsc Amt formatted = "+discountAmt);
        }
    }
    // Getting Net Total Value
    var netTotalRP = 0.0;
    if((ordr_summary = document.getElementsByClassName("order-summary")) != null){
        for(n=0;n<ordr_summary[0].children.length; n++){
            if(ordr_summary[0].children[n].innerHTML.toUpperCase().includes("TOTAL")){
                var strnetTotalRP = ordr_summary[0].children[n].textContent.toUpperCase().replace(loyaltyTenderName,"").trim();
                netTotalRP = parseFloat(strnetTotalRP.replace(/(?!-?(?:\d+(?:\.\d+)?|\.\d+))./g,''));
                console.log("netTotalRP formatted = "+netTotalRP);
                break;
            }
        }
        /*
        var strnetTotalRP = ordr_summary[0].children[0].innerHTML
        console.log("netTotalRP = "+strnetTotalRP);
        netTotalRP = parseFloat(strnetTotalRP.replace(/Rs\.|\&nbsp|\;|AED|SAR|Rs|\$|\,/gi,"").trim());
        console.log("netTotalRP formatted = "+netTotalRP);
        */
    }

    // Remove Cell number if already entered and not equal to the one from ShopSmart Portal
    //document.getElementById('CustomerCode').value = strSmartCard;

    dNetGrossValue = 0.0;
    if(netTotal == "")
        dNetGrossValue = 0.0;
    else
        dNetGrossValue = parseFloat(netTotalRP);
    
    var discountVal = 0.0;
    var discountButton = "";

    // If percentage is non zero, means its promotion discount. Otherwise, its redemption
    if(lDiscount>0.0){
        discountVal = lDiscount * 100;
        console.log("Giving "+discountVal+"% discount");
        //debugger;
        if(!discountOnTop){ // if discount is on popup level control btns, then open it and add discount 
            const control_buttons = document.getElementsByClassName('control-buttons')[0];
            if(control_buttons != undefined && control_buttons != null){
                moreButton = getTagFromListHavingText_cs(control_buttons.querySelectorAll("button"),more_btn_captn);
                //moreButton.dispatchEvent(new Event('click'));
                
                if(moreButton != null && moreButton != undefined){
                    // Click the button
                    moreButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//.dispatchEvent(new Event('click'));
                    setTimeout(() => {
                        //******* For opening discount window and Entring disc % *******//
                        if(document.getElementsByClassName("js_discount") != undefined 
                        && document.getElementsByClassName("js_discount").length > 0){
                            document.getElementsByClassName("js_discount")[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//new Event('click'));
                            setTimeout(() => {
                                typeText(discountVal+"", document, 50, cbAfterDscntEntry);
                            }, 1300); // 3 seconds
                        }else
                            cleanupOnCompletion();
                    }, 1500); 
                }else
                    cleanupOnCompletion();
            }else
                cleanupOnCompletion();
        }else{
            //******* For opening discount window and Entring disc % *******//
            if(document.getElementsByClassName("js_discount") != undefined 
            && document.getElementsByClassName("js_discount").length > 0){
                document.getElementsByClassName("js_discount")[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//new Event('click'));
                setTimeout(() => {
                    typeText(discountVal+"", document, 50, cbAfterDscntEntry);
                }, 1300); // 3 seconds
            }else
                cleanupOnCompletion();
        }
    }
    else{

        if (dNetGrossValue < 0.0 && lAmount_to_redeem>0.0) { // Return redemption amount only if total is negative
            var net_sale = netTotal;
            // In case if redemption is to be returned at the last
            adjustment = dNetGrossValue + net_sale; // Gross amount will be negative for Refund 
            if (adjustment < 0.0)
            {
                if (Math.abs(adjustment) > Math.abs(lAmount_to_redeem))
                {
                    console.log("[setRedemption]: Alert!!! 'adjustment' is greated than 'lAmount_to_redeem'. lAmount_to_redeem:" + lAmount_to_redeem + ", adjustment:" + adjustment + ", net_sale: " + net_sale + ", dNetGrossValue:" + dNetGrossValue);
                    if (Math.abs(Math.abs(adjustment) - Math.abs(lAmount_to_redeem)) < 1) // If difference is less then 1 its OK
                        adjustment = lAmount_to_redeem*(-1);
                    else
                        adjustment = 0.0;
                }
                //lAmount_to_redeem = ((-1 * dNetGrossValue) / ((net_sale * (1 + sales_tax)) + lAmount_to_redeem)) * lAmount_to_redeem;
                adjustment = Math.round(adjustment);
            }
            else
            {
                adjustment = 0.0;
            }

            checkpoint = 15;
            console.log("[setRedemption]: Parent Inv has value hence its an Exchange transaction, net_sale: " + net_sale + ", lAmount_to_redeem:" + lAmount_to_redeem + ", dNetGrossValue:" + dNetGrossValue + ", adjustment:" + adjustment);

            //adjustment = Math.Round(((dNetGrossValue * lDiscount) + lAmount_to_redeem), 0);
        }else{
            adjustment = lAmount_to_redeem;    
        }
        discountVal = Math.round(adjustment* 10)/10;
        // Convert discount value into percentage 
        //discountVal = (discountVal/netTotal)*100;
        //document.getElementById("AdjustmentAmount").value = discountVal*-1;
        if(discountVal != 0.0){
            console.log("discountVal Value: "+discountVal);
            // Check if Loyalty is already selected. If so first remove it
            document.getElementsByClassName("pay-order-button")[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//.dispatchEvent(new Event('click'));
            setTimeout(() => {
                var tenderName=loyaltyTenderName; 
                delAllLoyaltyPymtTenders(tenderName);
                var payMethodSection = document.getElementsByClassName("paymentmethods")[0];
                element = getTagFromListHavingText_cs(payMethodSection.getElementsByClassName('button'), tenderName)
                if(element != null){
                    element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//.dispatchEvent(new Event('click'));
                    setTimeout(() => {
                        typeText(discountVal+"", document, 400, cbAfterPymtMethod);
                    }, 500); // 3 seconds
                }else{
                    console.log(tenderName + " payment method NOT found.");
                    cleanupOnCompletion();
                }
            }, 1000); // 1 seconds
        }else
            cleanupOnCompletion();
    }
}

function cbAfterPymtMethod(targetElement){
    console.log("In callback function cbAfterPymtMethod");
    document.getElementsByClassName("button back")[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//new Event('click'));
    cleanupOnCompletion();
}

function cbAfterDscntEntry(targetElement){
    console.log("In callback function cbAfterDscntEntry");
    //targetElement.dispatchEvent(new Event('change'));
    element = getElementByText(document,'div/header/h4', 'Discount Percentage');
    if(element!=undefined){
        console.log("Clicking OK...");
        elementOkBtn = getTagFromListHavingText_cs(element.parentElement.parentElement.querySelectorAll("button"),'Ok');
        elementOkBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//new Event('click')); 
    }else{
        console.log("Pressing Enter...");
        typeSpecialKey(targetElement,'Enter',13);
    }
    cleanupOnCompletion();
}

function sendNumKey(key, targetElement){
    var code = '';
    var keyCode = 0;
    var charCode = 0;

    //console.log("key:"+ key);
    
    if(key!=""){
        //code = 'Digit' + key;
        keyCode = key.charCodeAt(0);//48 + parseInt(key);
        charCode = keyCode;
        // Create the KeyboardEvent
        //console.log("code:"+ code + ", keyCode:"+keyCode);
        var numberKeyEvent = new KeyboardEvent('keyup', {
            key: key,
            //code: code,
            keyCode: keyCode,
            charCode: charCode,
            which: keyCode,
            bubbles: true
            //cancelable: true
        });	
        targetElement.dispatchEvent(numberKeyEvent);
    }
    
    //document.dispatchEvent(new KeyboardEvent('keyup', {key: '1',keyCode: 48, charCode: 48,which: 48,bubbles: true}));
    //document.dispatchEvent(new KeyboardEvent('keyup', {key: '0',keyCode: 47, charCode: 47,which: 47,bubbles: true}));
    //document.dispatchEvent(new KeyboardEvent('keyup', {key: '0',keyCode: 47, charCode: 47,which: 47,bubbles: true}));
}

function typeText(textStr,targetElement, delayInSec, callbackFn){
    //document.dispatchEvent(new KeyboardEvent('keyup', {key: '4',code: 'Digit4',keyCode: 52, charCode: 52,which: 52,bubbles: true}));
    //return;
    for(var cntr=0;cntr<textStr.length;cntr++){
        //console.log(textStr.substring(cntr,cntr+1));
        setTimeout(sendNumKey, delayInSec*cntr, textStr.substring(cntr,cntr+1), targetElement);
	}
    setTimeout(() => {
        if(callbackFn !== undefined && callbackFn !== null){
            console.log("Calling callback function...");
            callbackFn(targetElement);
        }else{
            console.log("No callback function to call.");

        }
    }, delayInSec*cntr); 
}

function typeSpecialKey(targetElement,keyname,codeno){
	var key = keyname;
	var code = keyname;
	var keyCode = codeno;
    var charCode = codeno;
    var enterKeydownEvent = new KeyboardEvent('keydown', {
        key: key,
        code: code,
        keyCode: keyCode,
        charCode: charCode,
        which: keyCode,
        bubbles: true
        //cancelable: true
    });	
    var enterKeypressEvent = new KeyboardEvent('keypress', {
        key: key,
        code: code,
        keyCode: keyCode,
        charCode: charCode,
        which: keyCode,
        bubbles: true
        //cancelable: true
    });	
    var enterKeyupEvent = new KeyboardEvent('keyup', {
        key: key,
        code: code,
        keyCode: keyCode,
        charCode: charCode,
        which: keyCode,
        bubbles: true
        //cancelable: true
    });	
    targetElement.dispatchEvent(enterKeydownEvent);
    targetElement.dispatchEvent(enterKeypressEvent);
    targetElement.dispatchEvent(enterKeyupEvent);
}

function getElementByText(par_tag, tag, text) {
    var chrome_edge = 1;
    var xpath = "//" + tag + "[text()='" + text + "']";
    if(chrome_edge == 1)
        var result = par_tag.evaluate(xpath, par_tag, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    else
        var result = par_tag.selectNodes(xpath);
    
    
    return result.singleNodeValue;
}


function getFieldTagValue(selectionCriteria, valueSubChildIdx){
    var fldValue = "";
    var fldTag = document.querySelector(selectionCriteria);
    if(fldTag!=null){
        console.log("Field tag found");
        if(fldTag.children[1].innerHTML.trim() != ""){
            fldValue = fldTag.children[valueSubChildIdx].innerHTML.trim();
            console.log("Field value: "+fldValue);
        }else{
            console.log("Field value is EMPTY");

        }
    }else{
        console.log("Field tag NOT found");
    }
    return fldValue;

}

function getParentTag(strParentTagName,childTag){
    while(childTag != null && childTag.tagName.toUpperCase() != strParentTagName.toUpperCase()){
        childTag = childTag.parentElement;
    }
    return childTag;
}

function getTagFromListHavingText_cs(listOfTags, textToPick){
    var targetTag = null;
    for(i=0; i<listOfTags.length; i++){
        if(listOfTags[i].innerHTML.toUpperCase().includes(textToPick.toUpperCase())){
            targetTag = listOfTags[i];
            //console.log("Found "+textToPick);
            break;
        }
    }
    return targetTag;
}

function delAllLoyaltyPymtTenders(tenderName){
    var listOfTags = document.getElementsByClassName("paymentline");
    var textToPick = tenderName;
    console.log("Total paymentline found "+listOfTags.length);
    for(i=0; i<listOfTags.length; i++){
        if(listOfTags[i].innerHTML.toUpperCase().includes(textToPick.toUpperCase())){
            console.log("Found "+tenderName+" and deleting...");
            targetTag = listOfTags[i];
            targetTag.getElementsByClassName("delete-button")[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));//.dispatchEvent(new Event('click'));
        }
    }
}

function typeInTextarea(text, textarea) {
    for (let i = 0; i < text.length; i++) {
        let char = text[i];

        // Create the keyboard events
        let keydownEvent = new KeyboardEvent('keydown', {
            key: char,
            code: `Key${char.toUpperCase()}`,
            keyCode: char.charCodeAt(0),
            charCode: char.charCodeAt(0),
            which: char.charCodeAt(0),
            bubbles: true
        });

        let keypressEvent = new KeyboardEvent('keypress', {
            key: char,
            code: `Key${char.toUpperCase()}`,
            keyCode: char.charCodeAt(0),
            charCode: char.charCodeAt(0),
            which: char.charCodeAt(0),
            bubbles: true
        });

        let keyupEvent = new KeyboardEvent('keyup', {
            key: char,
            code: `Key${char.toUpperCase()}`,
            keyCode: char.charCodeAt(0),
            charCode: char.charCodeAt(0),
            which: char.charCodeAt(0),
            bubbles: true
        });

        // Dispatch the events
        textarea.dispatchEvent(keydownEvent);
        textarea.dispatchEvent(keypressEvent);

        // Update the textarea value (this is necessary to actually modify the content)
        //textarea.value += char;

        textarea.dispatchEvent(keyupEvent);
    }
}
