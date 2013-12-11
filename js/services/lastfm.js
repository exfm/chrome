// New Lastfm object
function Lastfm(tab){
    this.tab = tab;
}

// Update Now Playing
Lastfm.prototype.nowPlaying = function(song){
    if(song.title && song.artist){
        this.getAuth().then(
            function(oAuthObject){
                var data = {
            		'sk': oAuthObject.session.key,
            		'api_key': keys.LASTFM.KEY,
            		'track': song.title,
            		'artist': song.artist,
            		'method': 'track.updateNowPlaying'
        		}
        		if(song.album){
                    data.album = song.album;
                }
                $.oauthLastfm(
                    {
            	        'url': constants.LASTFM.API_URL,
            	        'type': 'POST',
                        'cache': false,
                        'data': data,
                        'consumerSecret': keys.LASTFM.SECRET
                    }
                )
            }.bind(this)
        );
    }
}

// Scrobble
Lastfm.prototype.scrobble = function(song){
    if(song.title && song.artist){
        this.getAuth().then(
            function(oAuthObject){
                var timestamp = Math.floor(new Date().getTime() / 1000);
                var data = {
            		'sk': oAuthObject.session.key,
            		'api_key': keys.LASTFM.KEY,
            		'track': song.title,
            		'artist': song.artist,
            		'method': 'track.scrobble',
            		'timestamp': timestamp
        		}
        		if(song.album){
                    data.album = song.album;
                }
                $.oauthLastfm(
                    {
            	        'url': constants.LASTFM.API_URL,
            	        'type': 'POST',
                        'cache': false,
                        'data': data,
                        'consumerSecret': keys.LASTFM.SECRET
                    }
                )
            }.bind(this)
        );
    }
}

// check if user is connected to Lastfm
Lastfm.prototype.getAuth = function(){
    var promise = $.Deferred();
    chrome.storage.sync.get(
        'lastfmAuth',
        function(oAuthObj){
            if(oAuthObj['lastfmAuth']){
                promise.resolve(oAuthObj['lastfmAuth']);
            }
            else{
                promise.reject();
            }
        }
    )
    return promise;
}