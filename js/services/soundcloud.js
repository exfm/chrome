// New Soundcloud object
function Soundcloud(tab){
    if(tab){
        this.tab = tab;
        chrome.tabs.sendMessage(this.tab.id,
            {
                "type": "soundcloudKey",
                "soundcloudKey": keys.SOUNDCLOUD.KEY
            }
        );
    }
}

// resolve url to json from Soundcloud API
Soundcloud.prototype.resolve = function(url){
    return $.ajax(
	    {
	        'url': constants.SOUNDCLOUD.RESOLVE,
	        'type': 'GET',
            'data': {
				'client_id': keys.SOUNDCLOUD.KEY,
				'url': url
			 }
        }
    )
}

// get page on Soundcloud
Soundcloud.prototype.getPage = function(url){
    this.resolve(url).then(
        this.parse.bind(this),
        this.tab.noSongs.bind(this.tab)
    );
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
        this.requestUser(json.id);
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
            if(track.artwork_url){
                song.artwork = track.artwork_url.replace('large', 't500x500');
            }
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
            }
            song.originalSource = track.permalink_url;
            song.hasMeta = true;
            playlist.push(song);
        }
    }
    this.tab.playlist = playlist;
    this.tab.showPlaylist();
}


// get user json from Soundcloud API
Soundcloud.prototype.requestUser = function(userId){
    $.ajax(
	    {
	        'url': constants.SOUNDCLOUD.USERS + userId + "/tracks.json",
	        'type': 'GET',
            'data': {
				'client_id': keys.SOUNDCLOUD.KEY
			 }
        }
    ).then(
        function(json){
            this.buildPlaylist(json);
        }.bind(this)
    )
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
            var url = decodeURIComponent(obj.url);
            this.resolve(url).then(
                this.parse.bind(this)
            )
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

// first resolve url 
// then favorite song
Soundcloud.prototype.resolveThenFavorite = function(url){
    this.getAuth().then(
        function(oAuthObject){
            this.resolve(url).then(
                function(json){
                    if(json.kind === 'track'){
                        this.favorite(json.id);
                    }
                }.bind(this),
                function(err){
                    this.tab.sendServiceAction(
                        false,
                        'Song not found on Soundcloud',
                        'like',
                        'Soundcloud'
                    );
                }.bind(this)
            )
        }.bind(this),
        this.tab.sendAuthDialog.bind(this.tab, 'Soundcloud')
    );
}

// favorite song
Soundcloud.prototype.favorite = function(id){
    this.getAuth().then(
        function(oAuthObject){
            $.ajax(
        	    {
        	        'url': constants.SOUNDCLOUD.FAVORITE_TRACK + id + '.json',
        	        'type': 'PUT',
                    'data': {
        				'oauth_token': oAuthObject.accessToken
        			 }
                }
            ).then(
                function(json){
                    console.log('like', json);
                    this.tab.sendServiceAction(
                        true,
                        'Song liked on Soundcloud',
                        'like',
                        'Soundcloud'
                    );
                }.bind(this),
                function(err){
                    this.tab.sendServiceAction(
                        false,
                        'Error liking song on Soundcloud',
                        'like',
                        'Soundcloud'
                    );
                }.bind(this)
            )
        }.bind(this),
        this.tab.sendAuthDialog.bind(this.tab, 'Soundcloud')
    );
}

// check if user is connected to Soundcloud
Soundcloud.prototype.getAuth = function(){
    var promise = $.Deferred();
    chrome.storage.sync.get(
        'soundcloudAuth',
        function(oAuthObj){
            if(oAuthObj['soundcloudAuth']){
                promise.resolve(oAuthObj['soundcloudAuth']);
            }
            else{
                promise.reject();
            }
        }
    )
    return promise;
}