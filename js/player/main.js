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
    chrome.runtime.sendMessage(null, 
        {
            "type": 'deepScan'
        }
    )
    $('#minimize').on('click', function(){
        chrome.runtime.sendMessage(null, 
            {
                "type": 'minimize'
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
    
    var template = document.getElementById('song');
    document.body.appendChild(template.content.cloneNode(true));
}
var main;
$(document).ready(
    function(){
        console.log('ready');
        main = new Main();       
    }
)
