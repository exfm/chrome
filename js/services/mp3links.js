// New Mp3Links object
function Mp3Links(tab){
    this.tab = tab;
    chrome.tabs.sendMessage(this.tab.id,
        {
            "type": "getMp3Links"
        },
        this.response.bind(this)
    );
}

// Got response from page parse
Mp3Links.prototype.response = function(mp3Links){
    if(mp3Links.length > 0){
        this.buildPlaylist(mp3Links);
    }
    else{
        this.tab.noSongs();
    }
}

// Build playlist of Song objects
Mp3Links.prototype.buildPlaylist = function(list){
    var playlist = [];
    var len = list.length;
    for(var i = 0; i < len; i++){
        var link = list[i];
        var song = new Song();
        song.type = "mp3";
        song.title = link.text;
        song.url = link.href;
        playlist.push(song);
    }
    this.tab.playlist = playlist;
    this.tab.showPlaylist();
}
