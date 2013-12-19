// New Rdio object
function Rdio(tab){
    this.tab = tab;
}

// Save a song to a playlist
// search for a match
// see if we already have a playlist id
// if we dont have a playlist id search for Exfm playlist on rdio
// if we dont have an Exfm playlist on rdio create on
Rdio.prototype.save = function(title, artist){
    this.getAuth().then(
        function(oAuthObject){
            // Search for song
            this.search(title, artist).then(
                function(json){
                    // Does the song match what Rdio gave us?
                    this.determineSearch(json, title, artist).then(
                        function(trackId){
                            // Do we have the playlistId in storage?
                            this.getPlaylistId().then(
                                function(playlistId){
                                    // Add the song to the playlist
                                    this.addToPlaylist(oAuthObject, playlistId, trackId).then(
                                        function(json){
                                            if(json.status === 'ok'){
                                                this.tab.sendServiceAction(
                                                    true,
                                                    'Song saved on Rdio',
                                                    'save',
                                                    'Rdio'
                                                );
                                            }
                                            else{
                                                // The playlistId we had was wrong
                                                if(json.code === 404 && json.message === 'Playlist does not exist.'){
                                                    // Get or create a new playlist
                                                    this.getOrCreatePlaylist(oAuthObject, trackId);
                                                }
                                            }
                                        }.bind(this),
                                        function(error){
                                            this.tab.sendServiceAction(
                                                false,
                                                'Error saving song on Rdio',
                                                'save',
                                                'Rdio'
                                            );
                                        }.bind(this)
                                    )
                                }.bind(this),
                                function(){
                                    // Get or create a new playlist
                                    this.getOrCreatePlaylist(oAuthObject, trackId);
                                }.bind(this)
                            )
                        }.bind(this),
                        function(){
                            // No match on Rdio
                            this.tab.sendServiceAction(
                                false,
                                'Song not found on Rdio',
                                'save',
                                'Rdio'
                            );
                        }.bind(this)
                    )
                }.bind(this),
                function(error){
                    // Search error
                    this.tab.sendServiceAction(
                        false,
                        'Error searching for song on Rdio',
                        'save',
                        'Rdio'
                    );
                }.bind(this)
            );
        }.bind(this),
        this.tab.sendAuthDialog.bind(this.tab, 'Rdio')
    )
}

// see if we already have a playlist id
// if we dont have a playlist id search for Exfm playlist on rdio
// if we dont have an Exfm playlist on rdio create on
Rdio.prototype.getOrCreatePlaylist = function(oAuthObject, trackId){
    // Get playlists from Rdio
    this.getPlaylists(oAuthObject).then(
        function(json){
            // Is there a playlist called 'Exfm'?
            this.determinePlaylists(json).then(
                function(playlistId){
                    // Got the playlist. Add the song
                    this.addToPlaylist(oAuthObject, playlistId, trackId);
                    // Save the playlistId to storage
                    this.savePlaylistId(playlistId);
                }.bind(this),
                function(){
                    // Create the playlist on Rdio
                    this.createPlaylist(oAuthObject, trackId).then(
                        function(json){
                            // Save the playlistId to storage
                            this.savePlaylistId(json);
                        }.bind(this),
                        function(){
                            
                        }
                    )
                }.bind(this)
            )
        }.bind(this),
        function(){
            
        }
    )
}

// does the search result match what we provided it?
Rdio.prototype.determineSearch = function(json, title, artist){
    var promise = $.Deferred(); 
    if(json.status === 'ok'){
        if(json.result.results.length > 0){
            var result = json.result.results[0];
            if(result.name.toLowerCase() === title.toLowerCase() && 
               result.artist.toLowerCase() === artist.toLowerCase())
            {
                promise.resolve(result.key);
            }
            else{
                promise.reject();
            }
        }
        else{
            promise.reject();
        }
    }
    else{
         promise.reject();
    }
    return promise;
}

// Search for a song 
Rdio.prototype.search = function(title, artist){
	return $.oauth(
	    {
	        'url': constants.RDIO.API_URL,
	        'type': 'POST',
            'data': {
				'method': 'search',
				'query': artist + ' ' + title,
				'types': 'tracks',
				'count': 1,
				'never_or': true
			},
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET
        }
    );
}

// Get logged in user playlists
Rdio.prototype.getPlaylists = function(oAuthObject){
	return $.oauth(
	    {
	        'url': constants.RDIO.API_URL,
	        'type': 'POST',
            'data': {
				'method': 'getPlaylists'
			},
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET,
			'token': oAuthObject.oauth_token,
			'tokenSecret': oAuthObject.oauth_token_secret
        }
    );
}

// Is there a playlist alreayd called Exfm?
Rdio.prototype.determinePlaylists = function(json){
    var promise = $.Deferred(); 
    if(json.status === 'ok'){
        for(var i = 0; i < json.result.owned.length; i++){
            var playlist = json.result.owned[i];
            if(playlist.name === constants.RDIO.PLAYLIST_NAME){
                promise.resolve(playlist.key);
            }
        }
    }
    promise.reject();
    return promise;
}



// check if user is connected to Rdio
Rdio.prototype.getAuth = function(){
    var promise = $.Deferred();
    chrome.storage.sync.get(
        'rdioAuth',
        function(oAuthObj){
            if(oAuthObj['rdioAuth']){
                promise.resolve(oAuthObj['rdioAuth']);
            }
            else{
                promise.reject();
            }
        }
    )
    return promise;
}

// check if Rdio playlist id is saved
Rdio.prototype.getPlaylistId = function(){
    var promise = $.Deferred();
    chrome.storage.sync.get(
        'rdioPlaylistId',
        function(obj){
            if(obj['rdioPlaylistId']){
                promise.resolve(obj['rdioPlaylistId']);
            }
            else{
                promise.reject();
            }
        }
    )
    return promise;
}

// Save playlist id to storage
Rdio.prototype.savePlaylistId = function(arg){
    var key = arg;
    if(typeof(arg) === 'object'){
        key = arg.result.key;
        if(arg.status !== 'ok'){
            return;
        }
    }
    var obj = {
        'rdioPlaylistId': key
    }
    chrome.storage.sync.set(obj);   
}

// Create Exfm playlist
Rdio.prototype.createPlaylist = function(oAuthObject, trackId){
    return $.oauth(
	    {
	        'url': constants.RDIO.API_URL,
	        'type': 'POST',
            'data': {
				'method': 'createPlaylist',
				'name': 'Exfm',
				'description': 'Songs discovered with Exfm http://ex.fm',
				'tracks': trackId
			 },
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET,
			'token': oAuthObject.oauth_token,
			'tokenSecret': oAuthObject.oauth_token_secret
        }
    ); 
}

// Add to Exfm playlist
Rdio.prototype.addToPlaylist = function(oAuthObject, playlistId, trackId){
    return $.oauth(
	    {
	        'url': constants.RDIO.API_URL,
	        'type': 'POST',
            'data': {
				'method': 'addToPlaylist',
				'playlist': playlistId,
				'tracks': trackId
			 },
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET,
			'token': oAuthObject.oauth_token,
			'tokenSecret': oAuthObject.oauth_token_secret
        }
    );
}