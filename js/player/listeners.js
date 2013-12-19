// Recieve message from extension
function onMessage(e, sender, responseCallback){
    var type = e.type;
    switch(type){
        case 'playlist':
            main.gotPlaylist(e.playlist);
            main.ga.pageview(e.pageType, e.pageType);
        break;
        case 'soundcloudKey':
            main.playQueue.soundcloud_key = e.soundcloudKey;
        break;
        case 'toggleMinimize':
            main.toggleMinimize();
        break;
        case 'capturedTab':
            main.capturedTab(e.dataUrl);
        break;
        case 'serviceAction':
            main.serviceAction(
                e.success,
                e.message,
                e.action,
                e.network
            );
        break;
        case 'windowLocation':
            window.location = e.url;
        break;
        default:
        break
    }
}
chrome.runtime.onMessage.addListener(this.onMessage);