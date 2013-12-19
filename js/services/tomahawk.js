// New Tomahawk object
function Tomahawk(tab){
    this.tab = tab;
}

// check if Tomahawk is open
Tomahawk.prototype.stat = function(){
    var promise = new $.Deferred();
    $.get(constants.TOMAHAWK.STAT).then(
        function(json){
            promise.resolve(true);
        },
        function(err){
            promise.resolve(false);
        }
    )
    return promise;
}

// open song in Tomahawk
Tomahawk.prototype.open = function(title, artist, songUrl, album){
    var url = 'tomahawk://open/track/?artist=' + encodeURIComponent(artist);
    url += '&title=' + encodeURIComponent(title);
    url += '&url=' + encodeURIComponent(songUrl);
    if(album){
        url += '&album=' + encodeURIComponent(album);
    }
    this.tab.openThenClose(url);
    this.tab.sendServiceAction(
        true,
        'Song opened on Tomahawk',
        'open',
        'Tomahawk'
    );
}