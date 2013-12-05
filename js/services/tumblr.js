// New Tumblr object
function Tumblr(tab){
    this.tab = tab;
}

// request audio posts from Tumblr API
Tumblr.prototype.getPosts = function(){
    var requestUrl = constants.TUMBLR.POSTS; 
    requestUrl += this.tab.response.hostname;
    requestUrl += "/posts?api_key=" + keys.TUMBLR.KEY;
    requestUrl += "&type=audio";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = this.response.bind(this); 
    xhr.open("GET", requestUrl, true);
    xhr.send();
}

// request audio posts from Dashboard
Tumblr.prototype.getDashboard = function(){
    chrome.storage.sync.get(
        'tumblrAuth',
        this.checkAuth.bind(this)
    );
}

// check to see if user has auth
// if so, make signed request to dashboard
// if not, prompt for user to auth
Tumblr.prototype.checkAuth = function(oAuthObj){
    if(oAuthObj['tumblrAuth']){
        var requestUrl = constants.TUMBLR.DASHBOARD + "?type=audio"; 
        var message = 
            {
				method: "post", 
				action: requestUrl, 
				parameters: []
			}
        var requestBody = OAuth.formEncode(message.parameters);
        OAuth.completeRequest(message, 
            {
    			'consumerKey': keys.TUMBLR.KEY, 
    			'consumerSecret': keys.TUMBLR.SECRET, 
    			'token': oAuthObj['tumblrAuth'].oauth_token,
                'tokenSecret': oAuthObj['tumblrAuth'].oauth_token_secret
            }
        );
        var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = this.response.bind(this); 
        xhr.open(message.method, requestUrl, true);
        xhr.setRequestHeader("Authorization", authorizationHeader);
        xhr.send();
    }
    else{
        chrome.tabs.sendMessage(this.tab.id,
            {
                "type": "needAuth",
                "service": "Tumblr",
                "url": chrome.extension.getURL("html/options.html")
            }
        );
    }
}

// response from Tumblr API
Tumblr.prototype.response = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            var json = JSON.parse(e.target.response);
            this.parse(json);
        }
    }
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
                song.album = post.album;
                song.artwork = post.album_art;
                song.url = post.audio_url;
                song.link = post.post_url;
                song.serviceId = post.id;
                song.timestamp = post.timestamp;
                if(!post.track_name){
                    song.title = post.slug.replace(/-/g, ' ');
                }
                song.postAuthor = post.blog_name;
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