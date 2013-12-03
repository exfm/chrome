// Player

function Main(){
    this.playlist = [];
    this.audio = new Audio();
    this.playQueue = new PlayQueue(
        {
            'audio': this.audio,
            'use_local_storage': false
        }
    )
    this.render();
}

// render the container overlay
Main.prototype.render = function(){
	document.body.classList.add('exfm-overlay', 'exfm-blur-now');
	this.blur = document.createElement("div");
    this.blur.className = "exfm-blur";
    document.body.appendChild(this.blur);
    this.container = document.createElement('div');
    this.container.classList.add('exfm-container');
    document.body.appendChild(this.container);
    //
}

// render the container overlay
Main.prototype.renderBottom = function(){
    this.bottom = document.createElement('div');
    this.bottom.className = 'exfm-bottom';
    this.container.appendChild(this.bottom);
    this.bottom.innerHTML = "hello there";
}


Main.prototype.renderPlaylist = function(){
    this.playQueue.add(this.playlist);
    this.playQueue.play(0);
}

Main.prototype.renderNoSongs = function(){
    document.body.removeChild(this.container);
}


// Get a javascript variable 
// embedded on page
Main.prototype.getPageVar = function(varName){
    try{
        var obj = null;
        var d = document.getElementById('exfm-json');
        if (!d) {
            d = document.createElement("div");
            d.setAttribute("id", "exfm-json");
            d.style.display = "none";
            d.className = "exfm-hidden";
            document.body.appendChild(d);
        };
        var s = document.getElementById('exfm-json-script');
        if (!s) {
            s = document.createElement("script");
            s.type = "text/javascript";
        };
        s.innerHTML = "try{document.getElementById('exfm-json').innerHTML = JSON.stringify("+varName+");}catch(e){document.getElementById('exfm-json').innerHTML = null;}";
        document.body.appendChild(s);
        var json = d.innerHTML;
        try {
            obj = JSON.parse(json);
        } catch(e){};
        return obj;
    }
    catch(e){
        return null;
    }
}

// Get a value for an opengraph
// meta tag
Main.prototype.getOpenGraphContent = function(name){
    var el = null;
    try {
        el = document.querySelector('meta[property="og:'+name+'"]');
    } catch(e){}
    if(el !== null){
        return el.getAttribute('content');
    }
    return null;
}

// add blur image as background
Main.prototype.addBlur = function(dataUrl){
    this.blur.style.backgroundImage = "url(" + dataUrl + ")";
    document.body.classList.remove('exfm-blur-now');
    this.renderBottom();
}

// loop through anchors searching for mp3 links
Main.prototype.getMp3Links = function(){
    var list = [];
    var anchors = document.getElementsByTagName("a");
    var len = anchors.length, i;
    for(i = 0; i < len; i++){
        var anchor = anchors[i];
        var href = anchor.getAttribute("href");
        if(href !== undefined &&
           href !== 'undefined' &&
           href !== '' &&
           href !== null &&
           href !== 'null'
        ){
            var lastIndex = href.lastIndexOf('.');
            var sub = href.substr(lastIndex, 4);
            var hrefLen = href.length;
            if (sub === '.mp3' && (hrefLen - lastIndex) == 4){
                var text = anchor.innerText
                list.push(
                    {
                        'href': this.fixRelativePath(href),
                        'text': text
                    }
                )
            }
        }
    } 
    return list;
}

// fix relative path for urls
Main.prototype.fixRelativePath = function(str){
    if (str.indexOf("://") == -1){
        if (str[0] == "/"){
            return location.origin + str;
        } else {
            if (str[str.length - 1] == "/"){
                return location.href + str;
            } else {
                return location.href +"/" + str;
            }
        }
    }
    return str;
}

var main = new Main();


// Messages received from background script
function onMessage(e, sender, responseCallback){
    console.log('onMessage', e, e.type);
    if(e.type === 'blur'){
        main.addBlur(e.dataUrl);
    }
    if(e.type === 'playlist'){
        main.playlist = e.playlist;
        main.renderPlaylist();
    }
    if(e.type === 'noSongs'){
        main.renderNoSongs();
    }
    if(e.type === 'soundcloudKey'){
        main.playQueue.soundcloud_key = e.soundcloudKey;
    }
    if(e.type === 'getPageVar'){
        var tracks = main.getPageVar(e.pageVar);
        responseCallback(tracks);
    }
    if(e.type === 'getOpenGraphContent'){
        var content = main.getOpenGraphContent(e.name);
        responseCallback(content);
    }
    if(e.type === 'getMp3Links'){
        var mp3Links = main.getMp3Links();;
        responseCallback(mp3Links);
    }
}
chrome.runtime.onMessage.addListener(this.onMessage);