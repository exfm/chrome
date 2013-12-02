// Keep references to tabs created 
// key is tab id
var tabInstances = {};

// Tab object that interacts with and controls
// all tabs that scan found possible music on
function Tab(sender, response){
    this.id = sender.tab.id;
    this.sender = sender;
    this.response = response;
    this.showPageActionIcon();
    tabInstances[this.id] = this;
}

// Show page action icon
// We may have songs on page
Tab.prototype.showPageActionIcon = function(){
    chrome.pageAction.show(this.id);   
}

// Page action was clicked
// Deep scan page to get actual songs
// determined by what type of page scan gave us
Tab.prototype.deepScan = function(){
    if(this.response.isTumblr === true){
        var tumblr = new Tumblr(this);
    }
}

// Show playlist on tab
Tab.prototype.showPlaylist = function(){
    console.log('show', this.playlist);
}
