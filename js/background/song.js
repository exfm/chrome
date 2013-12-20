// Song object
function Song(){
    this.title = null;
    this.artist = null;
    this.album = null;
    this.artwork = chrome.extension.getURL('images/albumart-default-' + Math.floor(Math.random() * (5) + 1) + '.jpg');
    this.url = null;
    this.link = null;
    this.timestamp = null;
    this.purchaseUrl = null;
    this.type = null;
    this.originalType = null;
    this.originalSource = null;
    this.duration = null;
    this.serviceId = null;
    this.postAuthor = null;
    this.reblogKey = null;
    this.hasMeta = false;
}