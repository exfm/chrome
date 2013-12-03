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
	document.body.classList.add('exfm-overlay');
    this.container = document.createElement('div');
    this.container.className = 'exfm-container';
    document.body.appendChild(this.container);
    this.renderBottom();
}

// render the container overlay
Main.prototype.renderBottom = function(){
    this.botom = document.createElement('div');
    this.botom.className = 'exfm-bottom';
    this.container.appendChild(this.botom);
    this.botom.innerHTML = "hello there";
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

var main = new Main();

Main.prototype.addBlur = function(dataUrl){
    var div = document.createElement("div");
    div.className = "exfm-blur";
    div.style.backgroundImage = "url(" + dataUrl + ")";
    document.body.appendChild(div);
    /*
setTimeout(function(){
    	div.className = 'exfm-blur exfm-blur-now';
    }, 100);
*/
}

// Messages received from background script
function onMessage(e, sender, responseCallback){
    console.log('onMessage', e, sender);
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
}
chrome.runtime.onMessage.addListener(this.onMessage);