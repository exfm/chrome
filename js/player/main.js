function Main(){
    this.audio = new Audio();
    this.playQueue = new PlayQueue(
        {
            'audio': this.audio,
            'use_local_storage': false,
            'notify_song_half': true
        }
    );
    this.playQueue.savedSongProperties = [
        'title', 'artist', 'album',
        'artwork', 'url', 'link',
        'timestamp', 'purchaseUrl', 'type',
        'originalType', 'originalSource', 'duration',
        'serviceId', 'postAuthor', 'hasMeta',
        'reblogKey'
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
    this.rightContainerEl = $('#right');
    this.currentSongArtworkEl = $('#artwork-current');
    this.nextSongArtworkEl = $('#artwork-next');
    this.playlistEl = $('#playlist');
}

// add listeners
Main.prototype.addListeners = function(){
    this.playQueue.addEventListener(
        "loading",
        this.songLoading.bind(this),
        false
    );
    this.playQueue.addEventListener(
        "playing",
        this.songPlaying.bind(this),
        false
    );
    this.playQueue.addEventListener(
        "songHalf",
        this.onSongHalf.bind(this),
        false
    );
    this.playQueue.addEventListener(
        "play",
        this.toggleControlState.bind(this),
        false
    );
    this.playQueue.addEventListener(
        "pause",
        this.toggleControlState.bind(this),
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

    // playlist click events
    this.playlistEl.on('click', function(e){
        var target = e.target;
        var index = $('.playlist-item').index($(target));
        this.playQueue.play(index);
    }.bind(this))

    $('.service-icon').on('click', this.onServiceIconClick.bind(this));

}

Main.prototype.toggleControlState = function(e) {
    if(e.type === "play"){
        $('#play-pause').removeClass('paused');
    }else {
        $('#play-pause').addClass('paused');
    }
};

// new song loading
Main.prototype.songLoading = function(e){
    console.log(e);
    this.newSong(e.target.song, e.target.queueNumber);
}

// new song playing
Main.prototype.songPlaying = function(e){
    console.log('songPlaying', e);
    if(e.target.song.hasMeta === true){
        chrome.runtime.sendMessage(null,
            {
                "type": 'nowPlaying',
                "song": e.target.song
            }
        )
    }
}

// song half way through
Main.prototype.onSongHalf = function(e){
    console.log('songHalf', e);
    if(e.target.song.hasMeta === true){
        chrome.runtime.sendMessage(null,
            {
                "type": 'songHalf',
                "song": e.target.song
            }
        )
    }
}

// new song loading/playing
// update UI
Main.prototype.newSong = function(song, queueNumber){
    this.updateCurrentSong(song, queueNumber);
    this.updatePlaylistUI(queueNumber);
    this.checkMeta(song, queueNumber);
    this.updateCurrentServiceButtons(song);
}

// update the current song UI with metadata
Main.prototype.updateCurrentSong = function(song, queueNumber){
    this.currentSongTitleEl.text(song.title || 'Unknown Title');
    this.currentArtistEl.text(song.artist || '');
    this.currentAlbumEl.text(song.album || '');
    var artwork = song.artwork || '';

    this.rightContainerEl.removeClass('no-transition');
    this.nextSongArtworkEl.css(
            'background-image',
            'url(' + artwork + ')'
        ).removeClass('artwork-next')
        .addClass('artwork-current');
    this.currentSongArtworkEl.addClass('artwork-previous');

    $('#prev-artwork-next').on('webkitTransitionEnd', function(){
        this.rightContainerEl.addClass('no-transition');

        // reset main artwork element
        this.currentSongArtworkEl.css(
                'background-image',
                'url(' + artwork + ')'
            )
            .removeClass('artwork-previous')
            .addClass('artwork-current');
        this.nextSongArtworkEl
            .removeClass('artwork-current')
            .addClass('artwork-next');

        // reset next artwork element
        $('#next-artwork-current').css(
                'background-image',
                'url(' + nextArtwork + ')'
            )
            .removeClass('artwork-previous')
            .addClass('artwork-current');

        $('#next-artwork-next')
            .removeClass('artwork-current')
            .addClass('artwork-next');

        // reset previous artwork element
        $('#prev-artwork-current').css(
                'background-image',
                'url(' + prevArtwork + ')'
            )
            .removeClass('artwork-previous')
            .addClass('artwork-current');

        $('#prev-artwork-next')
            .removeClass('artwork-current')
            .addClass('artwork-next');

    }.bind(this));

    // next & previous artwork
    var nextSong = this.playQueue.getList()[queueNumber + 1];
    var prevSong = this.playQueue.getList()[queueNumber - 1];

    if(nextSong !== undefined){
        var nextArtwork = nextSong.artwork || '';
        $('#next-artwork-current').addClass('artwork-previous');
        $('#next-artwork-next').css(
                'background-image',
                'url(' + nextArtwork + ')'
            )
            .removeClass('artwork-next')
            .addClass('artwork-current');
    }
    if(prevSong !== undefined){
        var prevArtwork = prevSong.artwork || '';
        $('#prev-artwork-current').addClass('artwork-previous');
        $('#prev-artwork-next').css(
                'background-image',
                'url(' + prevArtwork + ')'
            )
            .removeClass('artwork-next')
            .addClass('artwork-current');
    }
}

// update playlist ui
Main.prototype.updatePlaylistUI = function(queueNumber){
    $('.playlist-item').removeClass('selected');
    $($('.playlist-item')[queueNumber]).addClass('selected');
}

// check if song needs metadata
Main.prototype.checkMeta = function(song, queueNumber){
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

// update current song service buttons
Main.prototype.updateCurrentServiceButtons = function(song){
    $('.service-icon').removeClass('show selected');
    switch(song.type){
        case 'tumblr':
            $('#service-icon-tumblr').addClass('show');
            if(song.originalType === 'soundcloud'){
                $('#service-icon-soundcloud').addClass('show');
            }
            if(song.originalType === 'bandcamp'){
                $('#service-icon-bandcamp').addClass('show');
            }
        break;
        default:
        break;
    }
}

// got id3 data from file
// Update UI
Main.prototype.gotId3 = function(queueNumber, tags){
    if(tags !== null){
        var song = this.playQueue.getList()[queueNumber];
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
    this.newSong(list[0], 0);
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

Main.prototype.onServiceIconClick = function(e){
    $(e.target).addClass('selected');
    var service = e.target.dataset.service;
    var song = this.playQueue.getSong();
    console.log(service, song);
    switch(service){
        case 'tumblr':
            chrome.runtime.sendMessage(null,
                {
                    "type": 'tumblrLike',
                    "id": song.serviceId,
                    "reblogKey": song.reblogKey
                }
            )
        break;
        case 'soundcloud':
            if(song.type === 'soundcloud'){
                chrome.runtime.sendMessage(null,
                    {
                        "type": 'soundcloudFavorite',
                        "id": song.serviceId
                    }
                )
            }
            if(song.type === 'tumblr'){
                chrome.runtime.sendMessage(null,
                    {
                        "type": 'soundcloudResolveThenFavorite',
                        "url": song.originalSource
                    }
                )
            }
        break;
        default:
        break;
    }
}

var main;
$(document).ready(
    function(){
        main = new Main();
    }
)
