var amt_to_redeem = document.getElementById("amt_to_redeem").value;
var currency = document.getElementById('currency').value;
var net_sale = 0.0;
amt_to_redeem = amt_to_redeem.replace(currency,"").trim();
amt_to_redeem = amt_to_redeem.replace(",","");

var send_exch_redep_topos = "0";
if(document.getElementById("send_exch_redep_topos") != undefined)
    send_exch_redep_topos = document.getElementById("send_exch_redep_topos").value;

if(amt_to_redeem == '' || (document.getElementById("edit_mode").value == "2" && send_exch_redep_topos=='0')){
    amt_to_redeem = 0;
}else if(document.getElementById("edit_mode").value == "2" && send_exch_redep_topos != '0'){
    net_sale = document.getElementById('netsale').value;
    net_sale = net_sale.replace(currency,"").trim();
    net_sale = net_sale.replace(",","");
}

// Check if campaign discount calculation is to be done by ShopSmart (SS) or by POS 
if(document.getElementById("disc_calc_by_ss").value=='0'){
    campaign_discount = '0';
}else{
    campaign_discount = document.getElementById("campaign_discount").value;
}
cardno = "";
if(document.getElementById("smartcardsms").value!='' && document.getElementById("cell_on_recpt").value!='0')
    //cardno = "\r\nCell # " + document.getElementById("smartcardsms").value;
    cardno = " " + document.getElementById("smartcardsms").value;

lid = document.getElementById("lid").value;
pd = document.getElementById("pd").value;

// Grtting values of reward rates (regular and discount) and multiplier
reward_on_discount = document.getElementById("reward_on_discount").value
if(reward_on_discount == '')
    reward_on_discount = 0;
else
    reward_on_discount = parseFloat(reward_on_discount);

reward_on_regular = document.getElementById('reward_rate').value;
if(reward_on_regular == '')
    reward_on_regular = 0;
else
    reward_on_regular = parseFloat(reward_on_regular);
    
multiplier = document.getElementById('multiplier').value;
if(multiplier == '')
    multiplier = 1;
else
    multiplier = parseFloat(multiplier);

var reward_rate = 0.0
var reward_rate_dsc = 0.0;
if(document.getElementById("trans_type").value == 'C' || document.getElementById("trans_type").value == 'S'){
    reward_rate = reward_on_discount * multiplier;
    reward_rate_dsc = reward_on_discount * multiplier;
}else{
    reward_rate = reward_on_regular * multiplier;
    reward_rate_dsc = reward_on_discount * multiplier;
}

if(document.getElementById("reg_reward_pt").value != '')
    reg_reward_pt = parseInt(document.getElementById("reg_reward_pt").value); // logic of first trans. is at the backend while fetching data
else
    reg_reward_pt = 0;
    
if(document.getElementById("bonus_pts").value != '')
    bonus_pts = parseInt(document.getElementById("bonus_pts").value); // logic of first trans. is at the backend while fetching data
else
    bonus_pts = 0;

bonus_pts += reg_reward_pt; // Adding the two bonuses

nameCaption = '';
//console.log('Name: '+document.getElementById("cust_name").value.trim());
if(document.getElementById("cust_name").value.trim() != ""){
    if(amt_to_redeem>0 || campaign_discount>0)
        nameCaption = 'LRT - ';
    else
        nameCaption = 'LNT - ';
}

custName = document.getElementById("cust_name").value;

//net_sale = parseFloat(document.getElementById("netsale").value);

if(lid == "")
    textTocopy = "FromPOS:"+nameCaption+document.getElementById("cust_name").value + ":"+cardno+":"+amt_to_redeem+":"+campaign_discount+":::"+reward_rate+":"+bonus_pts;
else
    textTocopy = "FromPOS:"+nameCaption+document.getElementById("cust_name").value + ":"+cardno+":"+amt_to_redeem+":"+campaign_discount+":"+lid+":"+pd+":"+reward_rate+":"+bonus_pts;

var arrfieldValues = {"MSG_TYP":"FromPOS"};
arrfieldValues["CUST_NAME"] = nameCaption+custName;
arrfieldValues["CARDNO"] = cardno;
arrfieldValues["REDEMP"] = amt_to_redeem;
arrfieldValues["NET_SALE"] = net_sale;
arrfieldValues["DISCNT"] = campaign_discount;
arrfieldValues["LID"] = lid;
arrfieldValues["PD"] = pd;
arrfieldValues["RWRD_RATE"] = reward_rate;
arrfieldValues["RWRD_RATE_DSC"] = reward_rate_dsc;
arrfieldValues["BONS_PTS"] = bonus_pts;
arrfieldValues["PARN_INV"] = document.getElementById("pos_tr_id_parent").value;
textTocopy = JSON.stringify(arrfieldValues);

console.log("Msg to send to Retail POS = "+textTocopy);

if(textTocopy != ''){
    
    chrome.runtime.sendMessage(textTocopy, (response) => { console.log("@ShopSmart: "+response) } );
}