// Recieve message from content script
// If response.showPageActionIcon === true,
// We've got possible songs on page
// Create a new Tab object
function onMessage(e, sender, responseCallback){
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
        case 'toggleMinimize': 
            chrome.tabs.sendMessage(sender.tab.id,
                {
                    "type": "toggleMinimize"
                }
            );
        break;
        case 'minimizeEnd': 
            chrome.tabs.sendMessage(sender.tab.id,
                {
                    "type": "minimizeEnd"
                }
            );
        break;
        case 'maximizeEnd': 
            chrome.tabs.sendMessage(sender.tab.id,
                {
                    "type": "maximizeEnd"
                }
            );
        break;
        case 'getDataUrl':
            responseCallback(dataUrlObj[sender.tab.id]);
            delete dataUrlObj[sender.tab.id];
        break;
        case 'tumblrLike':
            var tumblr = new Tumblr(sender.tab);
            tumblr.like(e.id, e.reblogKey);
        break;
        case 'soundcloudResolveThenFavorite':
            var soundcloud = new Soundcloud(sender.tab);
            soundcloud.resolveThenFavorite(e.url);
        break;
        case 'getId3':
            id3(e.url, function(err, tags) {
                if(!err){
                    responseCallback(tags);
                }
                else{
                    responseCallback(null);
                }
            });
            return true;
        break;
        case 'nowPlaying':
            var lastfm = new Lastfm(sender.tab);
            lastfm.nowPlaying(e.song);
        break;
        case 'songHalf':
            var lastfm = new Lastfm(sender.tab);
            lastfm.scrobble(e.song);
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
                    "type": "toggleMinimize"
                }
            );
        })
    }
});