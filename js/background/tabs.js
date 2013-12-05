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
    this.captureVisibleTab();
    this.insertCSS();
}

// Insert player css into page
Tab.prototype.insertCSS = function(){
    chrome.tabs.insertCSS(
        this.id,
        {
            file: "css/content-script.css"
        },
        this.insertPlayer.bind(this)
    );
}


// Insert playqueue script into page
/*
Tab.prototype.insertPlayqueue = function(){
    chrome.tabs.executeScript(
        this.id,
        {
            file: "js/content-script/playqueue.js"
        },
        this.insertMain.bind(this)
    );
}
*/

// Insert main script into page
Tab.prototype.insertPlayer = function(){
    chrome.tabs.sendMessage(this.id,
        {
            "type": "insertPlayer",
            "url": chrome.extension.getURL('html/player.html')
        }
    );
}

Tab.prototype.captureVisibleTab = function(){

    chrome.tabs.captureVisibleTab(null,
        {
            'format': 'png'
        },
        this.onCaptureVisibleTab.bind(this)
    );

}

Tab.prototype.onCaptureVisibleTab = function(dataUrl){
	console.log('captured', this);
    chrome.tabs.sendMessage(this.id,
        {
            "type": "capturedTab",
            "dataUrl": dataUrl
        }
    );
}


// Page action was clicked
// Deep scan page to get actual songs
// determined by what type of page scan gave us
Tab.prototype.deepScan = function(){
    if(this.response.isTumblr === true){
        var tumblr = new Tumblr(this);
        tumblr.getPosts();
        return;
    }
    if(this.response.isTumblrDashboard === true){
        var tumblr = new Tumblr(this);
        tumblr.getDashboard();
        return;
    }
    if(this.response.isSoundcloud === true){
        var soundcloud = new Soundcloud(this);
        soundcloud.resolve(this.response.url);
        return;
    }
    if(this.response.isBandcamp === true){
        var bandcamp = new Bandcamp(this);
        bandcamp.getPageVar();
        return;
    }
    if(this.response.isLiveMusicArchive === true){
        var liveMusicArchive = new LiveMusicArchive(this);
        return;
    }
    if(this.response.hasMp3Links === true){
        var mp3Links = new Mp3Links(this);
        return;
    }
    if(this.response.hasSoundcloudEmbeds === true){
        var soundcloud = new Soundcloud(this);
        soundcloud.hasEmbeds();
        return;
    }
    if(this.response.hasBandcampEmbeds === true){
        var bandcamp = new Bandcamp(this);
        bandcamp.hasEmbeds();
        return;
    }
}

// Show playlist on tab
Tab.prototype.showPlaylist = function(){
    console.log('showPlaylist', this.playlist);
    chrome.tabs.sendMessage(this.id,
        {
            "type": "playlist",
            "playlist": this.playlist
        }
    );
}

// No songs found on page
// after deep scan
Tab.prototype.noSongs = function(){
    chrome.tabs.sendMessage(this.id,
        {
            "type": "noSongs"
        }
    );
}