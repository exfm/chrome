function Main(){
    this.audio = new Audio();
    this.playQueue = new PlayQueue(
        {
            'audio': this.audio,
            'use_local_storage': false
        }
    )
    chrome.runtime.sendMessage(null, 
        {
            "type": 'deepScan'
        }
    )
}

Main.prototype.gotPlaylist = function(list){
    console.log(list);
}

var main = new Main();