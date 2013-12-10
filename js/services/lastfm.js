// New Lastfm object
function Lastfm(tab){
    this.tab = tab;
}

// Update Now Playing
Lastfm.prototype.nowPlaying = function(song){
    console.log('nowPlaying', song);
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
                    xhr.onreadystatechange = this.nowPlayingResponse.bind(this); 
                    xhr.open(message.method, message.action, true);
                    xhr.send(form);
                }
            }
        }.bind(this)
    )
}

// Now playing API response
Lastfm.prototype.nowPlayingResponse = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            var json = JSON.parse(e.target.response);
            console.log('nowPlaying', json);
        }
    }
}

// construct signature
Lastfm.prototype.getSignature = function(song, method, sessionKey){
    var paramString = '';
    if(song.album){
        paramString += "album" + song.album;
    }
    paramString += "api_key" + keys.LASTFM.KEY;
    paramString += "artist" + song.artist;
    paramString += "method" + method;
    paramString += "sk" + sessionKey;
    paramString += "track" + song.title;
    paramString += keys.LASTFM.SECRET;
    return hex_md5(paramString);
}

// get post params
Lastfm.prototype.getPostMessage = function(song, method, sessionKey, apiSignature){
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
    return message;
}
