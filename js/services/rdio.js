// New Rdio object
function Rdio(tab){
    this.tab = tab;
}

// response from Rdio API
Rdio.prototype.response = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            var json = JSON.parse(e.target.response);
            console.log(json);
            //this.parse(json);
        }
    }
}

// Save a song to a playlist
// search for a match
// see if we already have a playlist id
// if we dont have a playlist id search for Exfm playlist on rdio
// if we dont have an Exfm playlist on rdio create on
Rdio.prototype.save = function(title, artist){
    this.getAuth().then(
        function(oAuthObject){
            this.search(title, artist).then(
                function(json){
                    this.determineSearch(json, title, artist).then(
                        function(trackId){
                            console.log('trackId', trackId);
                            this.getPlaylistId().then(
                                function(playlistId){
                                    console.log('playlistId', playlistId);
                                    this.addToPlaylist(oAuthObject, playlistId, trackId).then(
                                        function(json){
                                            console.log(json);
                                            if(json.code === 404){
                                                this.getOrCreatePlaylist(oAuthObject, trackId);
                                            }
                                        }.bind(this),
                                        function(error){
                                            console.log('errrr', error);
                                        }
                                    )
                                }.bind(this),
                                function(){
                                    console.log('no id');
                                    this.getOrCreatePlaylist(oAuthObject, trackId);
                                }.bind(this)
                            )
                        }.bind(this),
                        function(){
                            console.log('no key found');
                        }
                    )
                }.bind(this),
                function(error){
                    console.log('rdio search error');
                }
            );
        }.bind(this),
        this.sendAuthDialog.bind(this)
    )
}

// see if we already have a playlist id
// if we dont have a playlist id search for Exfm playlist on rdio
// if we dont have an Exfm playlist on rdio create on
Rdio.prototype.getOrCreatePlaylist = function(oAuthObject, trackId){
    this.getPlaylists(oAuthObject).then(
        function(json){
            console.log('playlists', json);
            this.determinePlaylists(json).then(
                function(playlistId){
                    console.log('got playlistId', playlistId);
                    this.addToPlaylist(oAuthObject, playlistId, trackId);
                    this.savePlaylistId(playlistId);
                }.bind(this),
                function(){
                    this.createPlaylist(oAuthObject, trackId).then(
                        function(json){
                            this.savePlaylistId(json);
                        }.bind(this),
                        function(){
                            console.log('error creating playlist on rdio');
                        }
                    )
                }.bind(this)
            )
        }.bind(this),
        function(){
            console.log('error getting rdio playlists');
        }
    )
}

// does the search result match what we provided it?
Rdio.prototype.determineSearch = function(json, title, artist){
    var promise = $.Deferred(); 
    if(json.status === 'ok'){
        if(json.result.results.length > 0){
            var result = json.result.results[0];
            console.log('result', result);
            if(result.name.toLowerCase() === title.toLowerCase() && 
               result.artist.toLowerCase() === artist.toLowerCase())
            {
                console.log('we have it', result.key);
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
    
  /*
  
    var requestUrl = constants.RDIO.API_URL; 
    var message = 
        {
			method: "post", 
			action: requestUrl, 
			parameters: {
				'method': 'search',
				'query': artist + ' ' + title,
				'types': 'tracks',
				'count': 1,
				'never_or': true
			}
		}
    var requestBody = $.param(message.parameters);
    OAuth.completeRequest(message, 
        {
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET
        }
    );
    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters, true);
    return $.ajax(
	    {
	        'url': message.action,
	        'type': message.method,
	        'beforeSend': function(x){ 
	            x.setRequestHeader("Authorization", authorizationHeader);
            },
            'cache': false,
            'processData': false,
            'contentType': 'application/json',
            'data': requestBody
        }
    );
*/
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


   /*
 console.log('getPlaylists');	
    var requestUrl = constants.RDIO.API_URL; 
    var message = 
        {
			method: "post", 
			action: requestUrl, 
			parameters: {
				'method': 'getPlaylists'
			}
		}
    var requestBody = $.param(message.parameters);
    OAuth.completeRequest(message, 
        {
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET, 
			'token': oAuthObject.oauth_token,
            'tokenSecret': oAuthObject.oauth_token_secret
        }
    );
    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters, true);
    return $.ajax(
	    {
	        'url': message.action,
	        'type': message.method,
	        'beforeSend': function(x){ 
	            x.setRequestHeader("Authorization", authorizationHeader);
            },
            'cache': false,
            'processData': false,
            'contentType': 'application/json',
            'data': requestBody
        }
    );
*/
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
    console.log('savePlaylistId', arg);
    var key = arg;
    if(typeof(arg) === 'object'){
        key = arg.result.key;
        if(arg.status !== 'ok'){
            return;
        }
    }
    console.log('playlist key', key);
    var obj = {
        'rdioPlaylistId': key
    }
    chrome.storage.sync.set(obj);   
}

// Create Exfm playlist
Rdio.prototype.createPlaylist = function(oAuthObject, trackId){
    var requestUrl = constants.RDIO.API_URL; 
    var message = 
        {
			method: "post", 
			action: requestUrl, 
			parameters: {
				'method': 'createPlaylist',
				'name': 'Exfm',
				'description': 'Songs discovered with Exfm http://ex.fm',
				'tracks': trackId
			}
		}
    var requestBody = $.param(message.parameters);
    OAuth.completeRequest(message, 
        {
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET, 
			'token': oAuthObject.oauth_token,
            'tokenSecret': oAuthObject.oauth_token_secret
        }
    );
    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters, true);
    return $.ajax(
	    {
	        'url': message.action,
	        'type': message.method,
	        'beforeSend': function(x){ 
	            x.setRequestHeader("Authorization", authorizationHeader);
            },
            'cache': false,
            'processData': false,
            'contentType': 'application/json',
            'data': requestBody
        }
    );
}

// Create Exfm playlist
Rdio.prototype.addToPlaylist = function(oAuthObject, playlistId, trackId){
    var requestUrl = constants.RDIO.API_URL; 
    var message = 
        {
			method: "post", 
			action: requestUrl, 
			parameters: {
				'method': 'addToPlaylist',
				'playlist': playlistId,
				'tracks': trackId
			}
		}
    var requestBody = $.param(message.parameters);
    OAuth.completeRequest(message, 
        {
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET, 
			'token': oAuthObject.oauth_token,
            'tokenSecret': oAuthObject.oauth_token_secret
        }
    );
    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters, true);
    return $.ajax(
	    {
	        'url': message.action,
	        'type': message.method,
	        'beforeSend': function(x){ 
	            x.setRequestHeader("Authorization", authorizationHeader);
            },
            'cache': false,
            'processData': false,
            'contentType': 'application/json',
            'data': requestBody
        }
    );
}

// tell tab we need auth
Rdio.prototype.sendAuthDialog = function(){
    console.log('sending');
    chrome.tabs.sendMessage(this.tab.id,
        {
            "type": "needAuth",
            "service": "Rdio",
            "url": chrome.extension.getURL("html/options.html")
        }
    );
}

Rdio.prototype.foo = function(){
	this.getAuth().then(
		function(oAuthObject){
			console.log('auth', this);
			this.getPlaylists(oAuthObject).then(
				function(json){
					console.log('json', json);
				},
				function(e){
					console.log('error', e);
				}
			)
		}.bind(this)
	)
}