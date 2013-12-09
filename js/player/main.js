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
        'serviceId', 'postAuthor', 'hasMeta'
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
    this.cacheElements();
    this.addListeners();
    chrome.runtime.sendMessage(null,
        {
            "type": 'deepScan'
        }
    )
    chrome.runtime.sendMessage(null,
        {
            "type": 'getDataUrl'
        },
        this.capturedTab.bind(this)
    )
}

// cache elements
Main.prototype.cacheElements = function(){
    this.containerEl = $('#container');
    this.currentSongTitleEl = $('#song-title');
    this.currentArtistEl = $('#artist');
    this.currentAlbumEl = $('#album');
    this.currentSongArtworkEl = $('#artwork');
    this.playlistEl = $('#playlist');
}

// add listeners
Main.prototype.addListeners = function(){
    this.playQueue.addEventListener(
        "loading",
        this.songLoading.bind(this),
        false
    );
    $('#minimize').on('click', function(){
        chrome.runtime.sendMessage(null,
            {
                "type": 'toggleMinimize'
            }
        )
    });
    $('#play-pause').on('click', function(){
        this.playQueue.playPause();
    }.bind(this));
    $('#prev').on('click', function(){
        this.playQueue.previous();
    }.bind(this));
    $('#next').on('click', function(){
        this.playQueue.next();
    }.bind(this));
}

// new song loading
Main.prototype.songLoading = function(e){
    console.log(e);
    this.updateCurrentSong(e.target.song, e.target.queueNumber);
}

// update the current song UI with metadata
Main.prototype.updateCurrentSong = function(song, queueNumber){
    this.currentSongTitleEl.text(song.title || 'Unknown Title');
    this.currentArtistEl.text(song.artist || '');
    this.currentAlbumEl.text(song.album || '');
    var artwork = song.artwork || '';
    this.currentSongArtworkEl.css(
        'background-image',
        'url(' + artwork + ')'
    );
    $('.playlist-item').removeClass('selected');
    $($('.playlist-item')[queueNumber]).addClass('selected');
    if(song.hasMeta === false){
        chrome.runtime.sendMessage(null,
            {
                "type": 'getId3',
                "url": song.url
            },
            this.gotId3.bind(this, queueNumber)
        )
    }
}

// got id3 data from file
// Update UI
Main.prototype.gotId3 = function(queueNumber, tags){
    if(tags !== null){
        var song = this.playQueue.getSong(queueNumber);
        song.hasMeta = true;
        if(tags.title){
            this.currentSongTitleEl.text(tags.title);
            $($('.playlist-item-song')[queueNumber]).text(tags.title);
            song.title = tags.title;
        }
        if(tags.artist){
            this.currentArtistEl.text(tags.artist);
            $($('.playlist-item-artist')[queueNumber]).text(tags.artist);
            song.artist = tags.artist;
        }
        if(tags.album){
            this.currentAlbumEl.text(tags.album);
            song.album = tags.album;
        }
    }
}

// Got the playlist from background
Main.prototype.gotPlaylist = function(list){
    var items = [];
    var playlistItem = document.getElementById('playlist-item-template').content;
    for(var i in list){
        var song = list[i];
        var clone = playlistItem.cloneNode(true);
        clone.querySelector('.playlist-item-song').innerText = song.title || 'Unknow Title';
        clone.querySelector('.playlist-item-artist').innerText = song.artist || '';
        items.push(clone);
    }
    this.playlistEl.html(items);
    this.playQueue.add(list);
    this.updateCurrentSong(list[0], 0);
    // this.playQueue.play(0);
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


Main.prototype.capturedTab = function(dataUrl) {

    var img = new Image();
    $(img).addClass('captured-tab');

    img.onload = function(){
        $('#container').prepend(img);
        setTimeout(function(){
            $('body').addClass('show');
        }, 250);
    }
    img.src = dataUrl;

};

var main;
$(document).ready(
    function(){
        main = new Main();
    }
)
