// New Tumblr object
function Tumblr(tab){
    this.tab = tab;
    this.requestUrl = constants.TUMBLR_POSTS; 
    this.requestUrl += this.tab.response.hostname;
    this.requestUrl += "/posts?api_key=" + keys.TUMBLR_KEY;
    this.requestUrl += "&type=audio";
    this.request();
}

// request audio posts from Tumblr API
Tumblr.prototype.request = function(){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = this.response.bind(this); 
    xhr.open("GET", this.requestUrl, true);
    xhr.send();
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
            playlist.push(song);
        }
        this.tab.playlist = playlist;
        this.tab.showPlaylist();
    }
}