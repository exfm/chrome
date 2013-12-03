// New Bandcamp object
function Bandcamp(tab){
    this.tab = tab;
    chrome.tabs.sendMessage(this.tab.id,
        {
            "type": "getPageVar",
            "pageVar": "TralbumData"
        },
        this.response.bind(this)
    );
}

// Got response from page parse
Bandcamp.prototype.response = function(json){
    console.log('json', json);
    this.json = json;
    if(json !== null){
        if(this.json.item_type === "album"){
            this.buildPlaylist(
                this.json.trackinfo,
                this.json.artist,
                this.json.current.title,
                this.json.artFullsizeUrl,
                this.json.url,
                this.json.album_release_date
            );
        }
        if(json.item_type === "track"){
            chrome.tabs.sendMessage(this.tab.id,
                {
                    "type": "getOpenGraphContent",
                    "name": "description"
                },
                this.gotDescription.bind(this)
            );  
        }
    }
    else{
        this.tab.noSongs();
    }
}

Bandcamp.prototype.gotDescription = function(description){
    var album = null;
    if (description){
        album = description.split("from the album ")[1];
    }
    this.buildPlaylist(
        this.json.trackinfo,
        this.json.artist,
        album,
        this.json.artFullsizeUrl,
        this.json.url.split('/track')[0],
        this.json.album_release_date
    );
}

// Build playlist of Song objects
Bandcamp.prototype.buildPlaylist = function(list, artist, album, artwork, url, timestamp){
    var playlist = [];
    var len = list.length;
    for(var i = 0; i < len; i++){
        var track = list[i];
        var song = new Song();
        song.type = "bandcamp";
        song.title = track.title;
        song.artist = artist;
        song.album = album;
        song.artwork = artwork;
        song.url = track.file['mp3-128'];
        song.link = url + track.title_link;
        song.serviceId = track.id;
        song.timestamp = new Date(timestamp).getTime();
        song.purchaseUrl = song.link;
        song.duration = track.duration;
        playlist.push(song);
    }
    this.tab.playlist = playlist;
    this.tab.showPlaylist();
}