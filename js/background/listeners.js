// Recieve message from content script
// If response.showPageActionIcon === true,
// We've got possible songs on page
// Create a new Tab object
function onMessage(e, sender){
    console.log('onMessage', e, sender);
    var type = e.type;
    switch(type){
        case 'scanDone':
            if(e.response.showPageActionIcon === true){
                var tab = new Tab(sender, e.response, true);
            }
        break;
        case 'openTab':
            chrome.tabs.create(
                {
                    'url': e.url
                }
            );
        break;
        case 'deepScan':
            chrome.storage.local.get("tab" + sender.tab.id, function(savedTab){
                var props = savedTab["tab" + sender.tab.id];
                var tab = new Tab(props.sender, props.response, false);
                tab.deepScan();
            });
        break;
        case 'minimize': 
            chrome.tabs.sendMessage(sender.tab.id,
                {
                    "type": "minimize"
                }
            );
        break;
        default:
        break
    }
}
chrome.runtime.onMessage.addListener(this.onMessage);


// Page action was clicked
// get a ref to tab and do a deep scan for songs
function onPageActionClicked(sender){
    chrome.storage.local.get("tab" + sender.id, function(savedTab){
        var props = savedTab["tab" + sender.id];
        var tab = new Tab(props.sender, props.response, false);
        tab.onPageActionClicked();
    });
}
chrome.pageAction.onClicked.addListener(this.onPageActionClicked);


// tab was removed
// remove it from storage
function onTabRemoved(tabId){
    chrome.storage.local.remove("tab" + tabId);
}
chrome.tabs.onRemoved.addListener(this.onTabRemoved);

// listen for keyboard commands
chrome.commands.onCommand.addListener(function(command) {
    console.log('Command:', command);
    if(command === 'minimize-player'){
        chrome.tabs.getSelected(null, function(tab){
            chrome.tabs.sendMessage(tab.id,
                {
                    "type": "minimize"
                }
            );
        })
    }
});