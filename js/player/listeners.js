// Recieve message from extension
function onMessage(e, sender, responseCallback){
    console.log('player got message:', e, e.type);
    var type = e.type;
    switch(type){
        case 'playlist':
            main.gotPlaylist(e.playlist);
        break;
        case 'soundcloudKey':
            main.playQueue.soundcloud_key = e.soundcloudKey;
        break;
        case 'toggleMinimize':
            main.toggleMinimize();
        break;
        case 'capturedTab':
            console.log('capturedTab:', e.dataUrl);
            main.capturedTab(e.dataUrl);
        break;
        default:
        break
    }
}
chrome.runtime.onMessage.addListener(this.onMessage);