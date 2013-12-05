// New Soundcloud object
function Soundcloud(tab){
    this.tab = tab;
    chrome.tabs.sendMessage(this.tab.id,
        {
            "type": "soundcloudKey",
            "soundcloudKey": keys.SOUNDCLOUD.KEY
        }
    );
}

// resolve url to json from Soundcloud API
Soundcloud.prototype.resolve = function(url){
    var requestUrl = constants.SOUNDCLOUD.RESOLVE; 
    requestUrl += url;
    requestUrl += "&client_id=" + keys.SOUNDCLOUD.KEY;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = this.response.bind(this); 
    xhr.open("GET", requestUrl, true);
    xhr.send();
}

// response from Soundcloud API
Soundcloud.prototype.response = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            var json = JSON.parse(e.target.response);
            this.parse(json);
        }
    }
}

// parse response from Soundcloud API
// If it's a user, get user json from API
Soundcloud.prototype.parse = function(json){
    if(json.kind === "playlist"){
        this.buildPlaylist(json.tracks, json.title);
    }
    if(json.kind === "track"){
        this.buildPlaylist([json], null);
    }
    if(json.kind === "user"){
        this.user = json;
        this.requestUser();
    }
}

// Build playlist of Song objects
Soundcloud.prototype.buildPlaylist = function(list, album){
    var playlist = [];
    var len = list.length;
    for(var i = 0; i < len; i++){
        var track = list[i];
        if(track.sharing === 'public' && track.streamable === true){
            var song = new Song();
            song.type = "soundcloud";
            song.title = track.title;
            song.artist = track.user.username;
            song.album = album;
            song.artwork = track.artwork_url;
            song.url = track.stream_url;
            song.serviceId = track.id;
            song.timestamp = new Date(track.created_at).getTime();
            song.purchaseUrl = track.purchase_url;
            song.duration = track.duration;
            if(this.tab.response.isSoundcloud === true){
                song.link = track.permalink_url;
            }
            else{
                song.link = this.tab.response.url;
                song.originalSource = track.permalink_url;
            }
            playlist.push(song);
        }
    }
    this.tab.playlist = playlist;
    this.tab.showPlaylist();
}


// get user json from Soundcloud API
Soundcloud.prototype.requestUser = function(json){
    var requestUrl = constants.SOUNDCLOUD.USERS; 
    requestUrl += this.user.id + "/tracks.json";
    requestUrl += "?client_id=" + keys.SOUNDCLOUD.KEY;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = this.userResponse.bind(this); 
    xhr.open("GET", requestUrl, true);
    xhr.send();
}

// response from Soundcloud API
Soundcloud.prototype.userResponse = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            var json = JSON.parse(e.target.response);
            this.buildPlaylist(json, null);
        }
    }
}

// embeds on page
// get them from content script
Soundcloud.prototype.hasEmbeds = function(){
    chrome.tabs.sendMessage(this.tab.id,
        {
            "type": "getIframes",
            "regex": "soundcloud\.com\/player\/?(.*)"
        },
        this.gotEmbeds.bind(this)
    );
}

// got embeds
Soundcloud.prototype.gotEmbeds = function(list){
    var len = list.length;
    for(var i = 0; i < len; i++){
        var src = list[i];
        var obj = this.getQueryParams(src);
        if(obj.url){
            this.resolve(obj.url);
        }
    }
}

// parse params from src string
Soundcloud.prototype.getQueryParams = function(str){
    var obj = {};
    try {
        var splits = str.split("?");
        var paramString = splits[1];
        var params = paramString.split("&");
        for (var i = 0; i < params.length; i++){
            var param = params[i];
            var keyValue = param.split("=");
            obj[keyValue[0]] = keyValue[1];
        }
    } catch(e){}
    return obj;
}