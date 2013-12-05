function Main(){
    this.audio = new Audio();
    this.playQueue = new PlayQueue(
        {
            'audio': this.audio,
            'use_local_storage': false
        }
    );
    this.playQueue.savedSongProperties = [
        'title', 'artist', 'album',
        'artwork', 'url', 'link',
        'timestamp', 'purchaseUrl', 'type',
        'originalType', 'originalSource', 'duration',
        'serviceId', 'postAuthor'
    ];
    this.progressBar = new ProgressBar(
        {
            'playQueue': this.playQueue,
            'back': '#progress-back',
            'front': '#progress',
            'count': '#time-count',
            'duration': '#time-duration'
        }
    );
    chrome.runtime.sendMessage(null, 
        {
            "type": 'deepScan'
        }
    )
    this.cacheElements();
    $('#minimize').on('click', function(){
        chrome.runtime.sendMessage(null, 
            {
                "type": 'toggleMinimize'
            }
        )   
    })
    $('#play-pause').on('click', function(){
        this.playQueue.playPause();  
    }.bind(this));
    $('#prev').on('click', function(){
        this.playQueue.previous();  
    }.bind(this));
    $('#next').on('click', function(){
        this.playQueue.next();  
    }.bind(this))
}

// cache elements 
Main.prototype.cacheElements = function(){
    this.containerEl = $('#container');
}

// Got the playlist from background
Main.prototype.gotPlaylist = function(list){
    this.playQueue.add(list);
    this.playQueue.play(0);
    this.playQueue.addEventListener(
        "playing", 
        function(e){
            console.log(e);
            $('#song-title').text(e.target.song.title);
        }.bind(this), 
        false
    );
    
    //var template = document.getElementById('song');
    //document.body.appendChild(template.content.cloneNode(true));
}

// Toggle minimize state
Main.prototype.toggleMinimize = function(){
    if(this.containerEl.hasClass('minimized')){
        this.containerEl
            .one('webkitTransitionEnd', function(e){
                chrome.runtime.sendMessage(null, 
                    {
                        "type": 'maximizeEnd'
                    }
                )
            }.bind(this))
            .removeClass('minimized');
    }
    else{
        this.containerEl
            .one('webkitTransitionEnd', function(e){
                chrome.runtime.sendMessage(null, 
                    {
                        "type": 'minimizeEnd'
                    }
                )
            }.bind(this))
            .addClass('minimized');
    }
}
var main;
$(document).ready(
    function(){
        main = new Main();       
    }
)
