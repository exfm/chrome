// New Bandcamp object
function Bandcamp(tab){
    this.tab = tab;
}

// On site. Get embedded JSON
Bandcamp.prototype.getPageVar = function(){
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
        if(track.file){
            song.url = track.file['mp3-128'];
        }
        else{
            song.url = track.streaming_url;
        }
        var link = track.title_link || track.url;
        song.purchaseUrl = url + link;
        if(this.tab.response.isBandcamp === true){
            song.link = song.purchaseUrl;
        }
        else{
            song.link = this.tab.response.url;
            song.originalSource = track.permalink_url;
        }
        song.serviceId = track.id || track.track_id;
        song.timestamp = new Date(timestamp).getTime();
        song.duration = track.duration;
        song.hasMeta = true;
        playlist.push(song);
    }
    this.tab.playlist = playlist;
    this.tab.showPlaylist();
}

// embeds on page
// get them from content script
Bandcamp.prototype.hasEmbeds = function(){
    chrome.tabs.sendMessage(this.tab.id,
        {
            "type": "getIframes",
            "regex": "bandcamp.com/EmbeddedPlayer"
        },
        this.gotEmbeds.bind(this)
    );
}

// got embeds
Bandcamp.prototype.gotEmbeds = function(list){
    var len = list.length;
    for(var i = 0; i < len; i++){
        var src = list[i];
        var obj = this.getQueryParams(src);
        this.getAlbum(obj.album, obj.t);
    }
}

// parse params from src string
Bandcamp.prototype.getQueryParams = function(str){
    var obj = {};
    try {
        var splits = str.split("/");
        for (var i = 0; i < splits.length; i++){
            var param = splits[i];
            if(param.indexOf("=") !== -1){
                var keyValue = param.split("=");
                obj[keyValue[0]] = keyValue[1];
            }
        }
    } catch(e){}
    return obj;
}

// bandcamp album API
Bandcamp.prototype.getAlbum = function(albumId, trackNumber){
    if(albumId){
        var requestUrl = constants.BANDCAMP_ALBUM; 
        requestUrl += "key=" + keys.BANDCAMP_KEY;
        requestUrl += "&album_id=" + albumId;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = this.gotAlbum.bind(
            {
                'this': this,
                'albumId': albumId,
                'trackNumber': trackNumber
            }
        ); 
        xhr.open("GET", requestUrl, true);
        xhr.send();
    }
}

// got album json from API
Bandcamp.prototype.gotAlbum = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            var json = JSON.parse(e.target.response);
            this["this"].getArtist(this.albumId, this.trackNumber, json);
        }
    }
}

// bandcamp artist API
Bandcamp.prototype.getArtist = function(albumId, trackNumber, albumJson){
    var requestUrl = constants.BANDCAMP_ARTIST; 
        requestUrl += "key=" + keys.BANDCAMP_KEY;
        requestUrl += "&band_id=" + albumJson.band_id;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = this.gotArtist.bind(
            {
                'this': this,
                'albumId': albumId,
                'trackNumber': trackNumber,
                'albumJson': albumJson
            }
        ); 
        xhr.open("GET", requestUrl, true);
        xhr.send();
}


// got artist json from API
Bandcamp.prototype.gotArtist = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            var artistJson = JSON.parse(e.target.response);
            var tracks = this.albumJson.tracks;
            if(this.trackNumber){
                tracks = [this.albumJson.tracks[parseInt(this.trackNumber - 1)]];
            }
            this["this"].buildPlaylist(
                tracks,
                artistJson.name,
                this.albumJson.title,
                this.albumJson.large_art_url,
                artistJson.url, 
                this.albumJson.release_date
            );
        }
    }
}