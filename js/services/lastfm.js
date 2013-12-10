// New Lastfm object
function Lastfm(tab){
    this.tab = tab;
}

// Update Now Playing
Lastfm.prototype.nowPlaying = function(song){
    chrome.storage.sync.get(
        'lastfmAuth',
        function(oAuthObj){
            if(oAuthObj['lastfmAuth']){
                if(song.title && song.artist){
                    var apiSignature = this.getSignature(
                        song, 
                        'track.updateNowPlaying',
                        oAuthObj['lastfmAuth'].session.key
                    );
                    var message = this.getPostMessage(
                        song, 
                        'track.updateNowPlaying',
                        oAuthObj['lastfmAuth'].session.key,
                        apiSignature
                    );
                    var form = new FormData();
                    for(var key in message.parameters) {
                        form.append(key, message.parameters[key]);
                    }
                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = this.response.bind(this); 
                    xhr.open(message.method, message.action, true);
                    xhr.send(form);
                }
            }
        }.bind(this)
    )
}

// Scrobble
Lastfm.prototype.scrobble = function(song){
    chrome.storage.sync.get(
        'lastfmAuth',
        function(oAuthObj){
            if(oAuthObj['lastfmAuth']){
                if(song.title && song.artist){
                    var timestamp = Math.floor(new Date().getTime() / 1000);
                    var apiSignature = this.getSignature(
                        song, 
                        'track.scrobble',
                        oAuthObj['lastfmAuth'].session.key,
                        timestamp
                    );
                    var message = this.getPostMessage(
                        song, 
                        'track.scrobble',
                        oAuthObj['lastfmAuth'].session.key,
                        apiSignature,
                        timestamp
                    );
                    var form = new FormData();
                    for(var key in message.parameters) {
                        form.append(key, message.parameters[key]);
                    }
                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = this.response.bind(this); 
                    xhr.open(message.method, message.action, true);
                    xhr.send(form);
                }
            }
        }.bind(this)
    )
}

// API response
Lastfm.prototype.response = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            var json = JSON.parse(e.target.response);
        }
    }
}

// construct signature
Lastfm.prototype.getSignature = function(song, method, sessionKey, timestamp){
    var paramString = '';
    if(song.album){
        paramString += "album" + song.album;
    }
    paramString += "api_key" + keys.LASTFM.KEY;
    paramString += "artist" + song.artist;
    paramString += "method" + method;
    paramString += "sk" + sessionKey;
    if(timestamp){
        paramString += "timestamp" + timestamp;
    }
    paramString += "track" + song.title;
    paramString += keys.LASTFM.SECRET;
    return hex_md5(paramString);
}

// get post params
Lastfm.prototype.getPostMessage = function(song, method, sessionKey, apiSignature, timestamp){
    var message = 
        {
            'method': "POST", 
            'action': constants.LASTFM.API_URL, 
    		'parameters': {
        		'sk': sessionKey,
        		'api_key': keys.LASTFM.KEY,
        		'api_sig': apiSignature,
        		'track': song.title,
        		'artist': song.artist,
        		'method': method
    		}
        }
    if(song.album){
        message.parameters.album = song.album;
    }
    if(timestamp){
        message.parameters.timestamp = timestamp;
    }
    return message;
}
