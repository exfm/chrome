// New Tumblr object
function Tumblr(tab){
    this.tab = tab;
}

// request audio posts from Tumblr API
Tumblr.prototype.getPosts = function(){
    $.ajax(
	    {
	        'url': constants.TUMBLR.POSTS + this.tab.response.hostname + '/posts',
	        'type': 'GET',
            'data': {
				'api_key': keys.TUMBLR.KEY,
				'type': 'audio'
			 }
        }
    ).then(
        this.parse.bind(this),
        this.tab.noSongs.bind(this.tab)
    )  
}

// request audio posts from Dashboard
Tumblr.prototype.getDashboard = function(){
    this.getAuth().then(
        function(oAuthObject){
            $.oauth(
        	    {
        	        'url': constants.TUMBLR.DASHBOARD,
        	        'type': 'GET',
                    'data': {
        				'type': 'audio'
        			 },
        			'consumerKey': keys.TUMBLR.KEY, 
        			'consumerSecret': keys.TUMBLR.SECRET,
        			'token': oAuthObject.oauth_token,
                    'tokenSecret': oAuthObject.oauth_token_secret
                }
            ).then(
                this.parse.bind(this),
                this.tab.noSongs.bind(this.tab)
            )
        }.bind(this),
        this.tab.sendAuthDialog.bind(this.tab, 'Tumblr')
    );
}

// parse response from Tumblr API
// Build playlist of Song objects
Tumblr.prototype.parse = function(json){
    var posts = json.response.posts;
    var len = posts.length;
    if(len > 0){
        var playlist = [];
        for(var i = 0; i < len; i++){
            var post = posts[i];
            if(post.audio_type !== 'spotify'){
                var song = new Song();
                song.type = "tumblr";
                song.originalType = post.audio_type;
                song.originalSource = post.source_url;
                song.title = post.track_name;
                song.artist = post.artist;
                if(post.audio_type === 'soundcloud' && !song.artist){
                    var titleSplit = post.track_name.split(' - ');
                    if(titleSplit.length === 2){
                        song.artist = titleSplit[0];
                        song.title = titleSplit[1];
                    }
                }
                song.album = post.album;
                if(post.album_art){
                    song.artwork = post.album_art;
                }
                song.url = post.audio_url;
                song.link = post.post_url;
                song.serviceId = post.id;
                song.reblogKey = post.reblog_key;
                song.timestamp = post.timestamp;
                song.hasMeta = true;
                if(!post.track_name){
                    song.title = post.slug.replace(/-/g, ' ');
                    song.hasMeta = false;
                }
                song.postAuthor = post.blog_name;
                if(post.audio_type === 'tumblr' && post.audio_url.indexOf('tumblr.com') !== -1){
                    song.url += '?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio';
                }
                playlist.push(song);
            }
        }
        this.tab.playlist = playlist;
        this.tab.showPlaylist();
    }
    else{
        this.tab.noSongs();
    }
}

// like post 
Tumblr.prototype.like = function(id, reblogKey){
    this.getAuth().then(
        function(oAuthObject){
            $.oauth(
        	    {
        	        'url': constants.TUMBLR.LIKE_POST,
        	        'type': 'POST',
                    'data': {
        				'id': id,
        				'reblog_key': reblogKey 
        			 },
        			'consumerKey': keys.TUMBLR.KEY, 
        			'consumerSecret': keys.TUMBLR.SECRET,
        			'token': oAuthObject.oauth_token,
                    'tokenSecret': oAuthObject.oauth_token_secret
                }
            ).then(
                function(json){
                    this.tab.sendServiceAction(
                        true,
                        'Post liked on Tumblr',
                        'like',
                        'Tumblr'
                    );
                }.bind(this),
                function(err){
                    this.tab.sendServiceAction(
                        false,
                        'There was a problem liking post on Tumblr',
                        'like',
                        'Tumblr'
                    );
                }.bind(this)
            )
        }.bind(this),
        this.tab.sendAuthDialog.bind(this.tab, 'Tumblr')
    );
}

// check if user is connected to Tumblr
Tumblr.prototype.getAuth = function(){
    var promise = $.Deferred();
    chrome.storage.sync.get(
        'tumblrAuth',
        function(oAuthObj){
            if(oAuthObj['tumblrAuth']){
                promise.resolve(oAuthObj['tumblrAuth']);
            }
            else{
                promise.reject();
            }
        }
    )
    return promise;
}