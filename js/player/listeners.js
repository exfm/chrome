// Recieve message from extension
function onMessage(e, sender, responseCallback){
    console.log('player got message:', e, e.type);
    var type = e.type;
    switch(type){
        case 'playlist':
            main.gotPlaylist(e.playlist);
        break;
        case 'openTab':
            
        break;
        default:
        break
    }
}
chrome.runtime.onMessage.addListener(this.onMessage);

console.log(main);