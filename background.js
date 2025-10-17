/*
chrome.scripting.registerContentScript({
    id: 1,
    matches: ["https://smartmall.techmixers.com/*"],
    js: ["contentScript.js"]
  });
*/
var previousTabId = -1;
var previousURL = "";

var StorePOSURLPattern = /^http[s]?:\/\/([a-z]|[0-9]|[-]|[_]|[.])+\.odoo\.com\/pos/;
//var StorePOSURLPattern = /^http[s]?:\/\/([a-z]|[0-9]|[:]|[.])+\/prism\.shtml\#\/register/;//\/pos/;
//var StorePOSURLPattern = /^https:\/\/smartmall\.techmixers\.com\/smartmall\/pos_integr_test.php/;
var ShopSmartURLPattern = /^https:\/\/([a-z]|[0-9])+\.techmixers\.com\/smartmall\/home.php/;
chrome.tabs.onActivated.addListener((tab) => {
      chrome.tabs.get(tab.tabId, current_tab_info => {
        console.log("Current URL: " + current_tab_info.url);
        
        if(ShopSmartURLPattern.test(previousURL)){
          console.log('Injecting Script contentScriptShopSmart.js in URL '+ previousURL)
          chrome.scripting.executeScript({
            target: {tabId: previousTabId},
            files: ['./contentScriptShopSmart.js']
          }, () => console.log('Script Injected successfully'));
          if(StorePOSURLPattern.test(current_tab_info.url)){
            previousTabId = current_tab_info.id;
            previousURL = current_tab_info.url;
          }
        }else if(StorePOSURLPattern.test(previousURL)){
          console.log('Injecting Script contentScriptRetailPOS.js in URL '+ previousURL)
          chrome.scripting.executeScript({
            target: {tabId: previousTabId},
            files: ['./contentScriptRetailPOS.js']
          }, () => console.log('Script Injected successfully'));
          if(ShopSmartURLPattern.test(current_tab_info.url)){
            /*
            chrome.scripting.executeScript({
              target: {tabId: current_tab_info.id},
              files: ['./contentScript.js']
            }, () => console.log('Script Injected contentScript.js'));
            */
            previousTabId = current_tab_info.id;
            previousURL = current_tab_info.url;
          }
        }else if(ShopSmartURLPattern.test(current_tab_info.url)
                || StorePOSURLPattern.test(current_tab_info.url)){
          previousTabId = current_tab_info.id;
          previousURL = current_tab_info.url;
        }
    });
  });
  chrome.runtime.onMessage.addListener((message,sender,sendResponse) => 
                                        {
                                            console.log(sender);
                                            if(StorePOSURLPattern.test(sender.url)){
                                              console.log("Msg from Retail POS: "+message); 
                                              
                                              setTimeout(() => {
                                                console.log("Sending Message to ShopSmart...tab:"+previousTabId);
                                                chrome.tabs.sendMessage(previousTabId,message, (response) => { console.log("Response Received as: "+response) } );
                                              }
                                              ,1000)

                                            }else if(ShopSmartURLPattern.test(sender.url)){
                                              console.log("Msg from ShopSmart: "+message); 
                                              setTimeout(() => {
                                                console.log("Sending Message to Retail POS...tab:"+previousTabId);
                                                chrome.tabs.sendMessage(previousTabId,message, (response) => { console.log("Response Received as: "+response) } );
                                              }
                                              ,1000)
                                              
                                            }
                                            sendResponse("Sent Successfully (From @Background)!");
                                        }
                                    );

