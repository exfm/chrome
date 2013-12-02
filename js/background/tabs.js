// Tab object that interacts with and controls
// all tabs that scan found possible music on
function Tab(sender, response, save){
    this.id = sender.tab.id;
    this.sender = sender;
    this.response = response;
    this.showPageActionIcon();
    if(save === true){
        var obj = {};
        obj["tab" + this.id] = this;
        chrome.storage.local.set(obj);
    }
}

// Show page action icon
// We may have songs on page
Tab.prototype.showPageActionIcon = function(){
    chrome.pageAction.show(this.id);   
}

// Page action icon on this
// tab was clicked
Tab.prototype.onPageActionClicked = function(){
    this.insertCSS();
}

// Insert player css into page
Tab.prototype.insertCSS = function(){
    chrome.tabs.insertCSS(
        this.id,
        {
            file: "css/player.css"
        },
        this.insertPlayqueue.bind(this)
    );
}

// Insert playqueue script into page
Tab.prototype.insertPlayqueue = function(){
    chrome.tabs.executeScript(
        this.id,
        {
            file: "js/content-script/playqueue.js"
        },
        this.insertMain.bind(this)
    );
}

// Insert main script into page
Tab.prototype.insertMain = function(){
    chrome.tabs.executeScript(
        this.id,
        {
            file: "js/content-script/main.js"
        },
        this.deepScan.bind(this)
    );
}

Tab.prototype.onCaptureVisibleTab = function(dataUrl){
    chrome.tabs.sendMessage(this.id,
        {
            "type": "blur",
            "dataUrl": dataUrl
        }
    );
}

// Page action was clicked
// Deep scan page to get actual songs
// determined by what type of page scan gave us
Tab.prototype.deepScan = function(){
    console.log('deep scan');
    if(this.response.isTumblr === true){
        var tumblr = new Tumblr(this);
        return;
    }
    if(this.response.isSoundcloud === true){
        chrome.tabs.sendMessage(this.id,
            {
                "type": "soundcloudKey",
                "soundcloudKey": keys.SOUNDCLOUD_KEY
            }
        );
        var soundcloud = new Soundcloud(this);
        return;
    }
}

// Show playlist on tab
Tab.prototype.showPlaylist = function(){
    console.log('showPlaylist', this.playlist);
    var html = 
    chrome.tabs.sendMessage(this.id,
        {
            "type": "playlist",
            "playlist": this.playlist
        }
    );
}
