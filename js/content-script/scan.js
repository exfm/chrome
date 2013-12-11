function Scan(){
    this.playerInserted = false;
    this.response = {
        "url": location.href,
        "hostname": location.hostname,
        "showPageActionIcon": false,
        "isTumblr": false,
        "isTumblrDashboard": false,
        "isSoundcloud": false,
        "isBandcamp": false,
        "isLiveMusicArchive": false,
        "hasMp3Links": false,
        "hasSoundcloudEmbeds": false,
        "hasBandcampEmbeds": false
    }
    if(this.tumblr() || 
       this.soundcloud() ||
       this.bandcamp() ||
       this.liveMusicArchive() ||
       this.mp3Links() ||
       this.soundcloudEmbeds() ||
       this.bandcampEmbeds()
    ){
        this.done();
        return;
    }
}

// send response to background script
Scan.prototype.done = function(){
    chrome.runtime.sendMessage(null, 
        {
            'type': 'scanDone',
            'response': this.response
        }
    )
}

// Are we on a tumblr page?
// 1. Look for .tumblr.com url 
// 2. Look for tumblr.com/dashboard
// 3. Look for 'follow' iframe
Scan.prototype.tumblr = function(){
    if(location.href.indexOf('tumblr.com') !== -1){
        if(location.href.indexOf('tumblr.com/dashboard') !== -1){
            this.response.isTumblrDashboard = true;
            this.response.showPageActionIcon = true;
            return true;
        }
        else{
            this.response.isTumblr = true;
            this.response.showPageActionIcon = true;
            return true;
        }
    }
    else{
        if(document.getElementById("tumblr_controls") !== null){
            this.response.isTumblr = true;
            this.response.showPageActionIcon = true;
            return true;
        }
    }
    return false;
}

// Are we on a soundcloud page?
// 1. Look for .soundcloud.com url 
Scan.prototype.soundcloud = function(){
    if(location.href.indexOf('soundcloud.com') !== -1){
        this.response.isSoundcloud = true;
        this.response.showPageActionIcon = true;
        return true;
    }
    return false;
}

// Are we on a bandcamp page?
// 1. Look for .bandcamp.com url  
// 2. Look for .hidden-access
Scan.prototype.bandcamp = function(){
    if(location.href.indexOf('bandcamp.com') !== -1){
        this.response.isBandcamp = true;
        this.response.showPageActionIcon = true;
        return true;
    }
    if(document.querySelector('.hidden-access')){
        if(document.querySelector('.hidden-access').innerText === 'Bandcamp'){
            this.response.isBandcamp = true;
            this.response.showPageActionIcon = true;
            return true;
        }
    }
    return false;
}

// Are we on a Live Music Archive page?
// 1. Look for .archive.org url  
Scan.prototype.liveMusicArchive = function(){
    if(location.href.indexOf('archive.org') !== -1){
        this.response.isLiveMusicArchive = true;
        this.response.showPageActionIcon = true;
        return true;
    }
    return false;
}

// Do we have .mp3 links on page?  
Scan.prototype.mp3Links = function(){
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
                this.response.hasMp3Links = true;
                this.response.showPageActionIcon = true;
                return true;
            }
        }
    } 
    return false;
}

// Do we have soundcloud embeds on page?  
Scan.prototype.soundcloudEmbeds = function(){
    var iframes = document.getElementsByTagName("iframe");
    var len = iframes.length, i;
    var playerRegex = new RegExp('soundcloud\.com\/player\/?(.*)');
    for(i = 0; i < len; i++){
        var iframe = iframes[i];
        var src = iframe.getAttribute("src");
        if (src && playerRegex.test(src)){
            this.response.hasSoundcloudEmbeds = true;
            this.response.showPageActionIcon = true;
            return true;
        }
    } 
    return false;
}

// Do we have bandcamp embeds on page?  
Scan.prototype.bandcampEmbeds = function(){
    var iframes = document.getElementsByTagName("iframe");
    var len = iframes.length, i;
    var playerRegex = new RegExp('bandcamp.com/EmbeddedPlayer');
    for(i = 0; i < len; i++){
        var iframe = iframes[i];
        var src = iframe.getAttribute("src");
        if (src && playerRegex.test(src)){
            this.response.hasBandcampEmbeds = true;
            this.response.showPageActionIcon = true;
            return true;
        }
    } 
    return false;
}

// Get a javascript variable 
// embedded on page
Scan.prototype.getPageVar = function(varName){
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
Scan.prototype.getOpenGraphContent = function(name){
    var el = null;
    try {
        el = document.querySelector('meta[property="og:'+name+'"]');
    } catch(e){}
    if(el !== null){
        return el.getAttribute('content');
    }
    return null;
}

// loop through anchors searching for mp3 links
Scan.prototype.getMp3Links = function(){
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

// loop through iframes searching for soundcloud embeds
Scan.prototype.getIframes = function(regex){
    var list = [];
    var iframes = document.getElementsByTagName("iframe");
    var len = iframes.length, i;
    var playerRegex = new RegExp(regex);
    for(i = 0; i < len; i++){
        var iframe = iframes[i];
        var src = iframe.getAttribute("src");
        if (src && playerRegex.test(src)){
            list.push(src);
        }
    } 
    return list;
}

// fix relative path for urls
Scan.prototype.fixRelativePath = function(str){
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

// show confirm dialog 
// if confirmed, open url
Scan.prototype.confirmAuth = function(service, url){
    if(confirm('Please connect Exfm <-> ' + service + ' to continue')){
        chrome.runtime.sendMessage(null, 
            {
                "type": 'openTab',
                "url": url
            }
        )
    }
}

// insert the player iframe into page
Scan.prototype.insertPlayer = function(url){
    if(this.playerInserted === false){
        this.playerInserted = true;
        document.body.classList.add('exfm-overlay');
        this.container = document.createElement("iframe");
        this.container.setAttribute('width', '100%');
        this.container.setAttribute('height', '100%');
        this.container.setAttribute('frameborder', 'none');
        this.container.setAttribute('src', url);
        this.container.className = "exfm-iframe";
        document.body.appendChild(this.container);
    }
}

// minimize the iframe player
Scan.prototype.minimizePlayer = function(){
    if(this.container){
        this.container.classList.add('exfm-minimize');
        document.body.classList.remove('exfm-overlay');
    }
}

// maximize the iframe player
Scan.prototype.maximizePlayer = function(){
    if(this.container){
        this.container.classList.remove('exfm-minimize');
        document.body.classList.add('exfm-overlay');
    }
}

var scan = new Scan();

// Messages received from background script
function onMessage(e, sender, responseCallback){
    //console.log('onMessage', e, e.type);
    var type = e.type;
    switch(type){
        case 'insertPlayer':
            scan.insertPlayer(e.url);
        break;
        case 'getPageVar':
            var tracks = scan.getPageVar(e.pageVar);
            responseCallback(tracks);
        break;
        case 'getOpenGraphContent':
            var content = scan.getOpenGraphContent(e.name);
            responseCallback(content);
        break;
        case 'getMp3Links':
            var mp3Links = scan.getMp3Links();;
            responseCallback(mp3Links);
        break;
        case 'getIframes': 
            var iframes = scan.getIframes();
            responseCallback(iframes);
        break;
        case 'needAuth':
            scan.confirmAuth(e.service, e.url);
        break;
        case 'minimizeEnd':
            scan.minimizePlayer();
        break;
        case 'maximizeEnd':
            scan.maximizePlayer();
        break;
        default:
        break;
    }
}
chrome.runtime.onMessage.addListener(this.onMessage);