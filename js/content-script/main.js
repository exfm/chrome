// Player

function Main(){
    this.playlist = [];
    this.audio = new Audio();
    this.playQueue = new PlayQueue(
        {
            'audio': this.audio,
            'use_local_storage': false
        }
    )
    this.render();
}

// render the container overlay
Main.prototype.render = function(){
    this.container = document.createElement('div');
    this.container.className = 'exfm-container';
    document.body.appendChild(this.container);
}


Main.prototype.renderPlaylist = function(){
    this.playQueue.add(this.playlist);
    this.playQueue.play(0);
}

var main = new Main();

/*
Player.prototype.addBlur = function(dataUrl){
    var div = document.createElement("div");
    div.className = "blur";
    div.style.backgroundImage = "url(" + dataUrl + ")";
    document.body.appendChild(div);
}
*/

// Messages received from background script
function onMessage(e, sender){
    console.log('onMessage', e, sender);
    if(e.type === 'blur'){
        main.addBlur(e.dataUrl);
    }
    if(e.type === 'playlist'){
        main.playlist = e.playlist;
        main.renderPlaylist();
    }
    if(e.type === 'soundcloudKey'){
        main.playQueue.soundcloud_key = e.soundcloudKey;
        console.log(this.playQueue);
    }
}
chrome.runtime.onMessage.addListener(this.onMessage);