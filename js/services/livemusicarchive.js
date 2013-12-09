// New LiveMusicArchive object
function LiveMusicArchive(tab){
    this.tab = tab;
    this.requestUrl = this.tab.response.url; 
    this.requestUrl += "?output=json";
    this.request();
}

// get JSON representation of page
LiveMusicArchive.prototype.request = function(){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = this.response.bind(this); 
    xhr.open("GET", this.requestUrl, true);
    xhr.send();
}

// response from API
LiveMusicArchive.prototype.response = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            console.log(e.target);
            var json = JSON.parse(e.target.response);
            this.parse(json);
        }
    }
}

// parse response from API
// Build playlist of Song objects
LiveMusicArchive.prototype.parse = function(json){
    console.log(json);
    var files = json.files;
    var playlist = [];
    for(var i in files){
        var file = files[i]
        if(file.format === "VBR MP3"){
            var song = new Song();
            song.type = "livemusicarchive";
            song.title = file.title;
            song.artist = file.creator;
            song.album = file.album;
            song.url = "http://archive.org" + json.dir + i;
            song.link = this.tab.response.url;
            try{
                song.timestamp = new Date(json.metadata.date[0]).getTime();
            }catch(e){}
            try{
                song.artwork = json.misc.image;
            }catch(e){}
            song.hasMeta = true;
            playlist.push(song);
        }
    }
    if(playlist.length > 0){
        this.tab.playlist = playlist;
        this.tab.showPlaylist();
    }
    else{
        this.tab.noSongs();
    }
}