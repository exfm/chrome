// New Tomahawk object
function Tomahawk(tab){
    this.tab = tab;
}

// check if Tomahawk is open
Tomahawk.prototype.stat = function(){
    var promise = new $.Deferred();
    $.get(constants.TOMAHAWK.STAT).then(
        function(json){
            console.log(json);
            promise.resolve(true);
        },
        function(err){
            console.log(err);
            promise.resolve(false);
        }
    )
    return promise;
}

// open song in Tomahawk
Tomahawk.prototype.open = function(title, artist, songUrl, album){
    var url = 'tomahawk://open/track/?artist=' + encodeURIComponent(artist);
    url += '&title=' + encodeURIComponent(title);
    //url += '&url=' + encodeURIComponent(songUrl);
    if(album){
        url += '&album=' + encodeURIComponent(album);
    }
    chrome.tabs.create(
            {
                'url': url,
                'active': false
            }, 
            function(tab){
                chrome.tabs.update(this.tab.id, 
        	       {
        	           'highlighted': true
        	       }
        	    )
                setTimeout(
                    function(){
                        chrome.tabs.remove(tab.id);
                    },
                    2000
                )
            }.bind(this)
        );
        this.tab.sendServiceAction(
            true,
            'Song opened on Tomahawk',
            'open',
            'Tomahawk'
        );
}