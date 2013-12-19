// New Spotify object
function Spotify(tab){
    this.tab = tab;
}

// search for a song
// open spotify if theres a match
Spotify.prototype.search = function(title, artist, album){
    var query = 'title:"' + title + '"';
    query += 'artist:"' + artist + '"';
    if(album){
        query += 'album:"' + album + '"';
    }
    $.ajax(
	    {
	        'url': constants.SPOTIFY.SEARCH,
	        'type': 'GET',
            'data': {
				'q': query
			}
        }
    ).then(
        this.determineSearch.bind(this),
        function(){
            this.tab.sendServiceAction(
                false,
                'Error searching for song on Spotify',
                'open',
                'Spotify'
            );
        }.bind(this)
    )
}

// does the search result match what we provided it?
// If so open Spotify app
Spotify.prototype.determineSearch = function(json){
    if(json.tracks.length > 0){
        chrome.tabs.create(
            {
                'url': json.tracks[0].href,
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
            'Song opened on Spotify',
            'open',
            'Spotify'
        );
    }
    else{
        this.tab.sendServiceAction(
            false,
            'Song not found on Spotify',
            'open',
            'Spotify'
        );
    }
}