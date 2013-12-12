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
            "type": 'getGA'
        },
        this.gotGA.bind(this)
    );
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
    );
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

    // service elements
    this.serviceHoverPointer = $('#service-hover-pointer');
    this.serviceHoverContainer = $('#service-hover-container');
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
        this.ga.event('button', 'click', 'playPause', 1);
    }.bind(this));
    $('#prev').on('click', function(){
        this.playQueue.previous();
        this.ga.event('button', 'click', 'previous', 1);
    }.bind(this));
    $('#next').on('click', function(){
        this.playQueue.next();
        this.ga.event('button', 'click', 'next', 1);
    }.bind(this));

    // playlist click events
    this.playlistEl.on('click', function(e){
        var target = e.target;
        var index = $('.playlist-item').index($(target));
        this.playQueue.play(index);
        this.ga.event('button', 'click', 'playlist item', 1);
    }.bind(this))

    $('.service-icon').on('click', this.onServiceIconClick.bind(this));

    $(document).on('keyup', this.onKeyup.bind(this));

    // add hover events for service icons
    $('.service-icon').on('mouseover', function(e){
        var serviceIcon = $(this);
        var serviceName = serviceIcon.data('service');

        // make current icon active
        $('.service-icon').removeClass('active');
        serviceIcon.addClass('active');

        // get width of service options;
        var serviceOptionsEl = $('#service-hover-container').find('.'+serviceName);
        serviceOptionsEl.addClass('layout');
        var w = serviceOptionsEl.outerWidth();
        serviceOptionsEl.removeClass('layout');
        $('#service-hover-container').css('width', w);
        $('#service-hover').attr('class', 'service-hover show '+serviceName);

        // position of service pointer
        var left = serviceIcon.position().left + 26;

        // if service links aren't already displayed
        if($('#services').hasClass('open') === false){
            // move pointer to correct position before open
            $('#service-hover-pointer').css('-webkit-transform', 'translate('+left+'px, 5px)');
            $('#service-hover-container').one('webkitTransitionEnd', function(){
                $('#services').addClass('open');
                $('#service-hover-pointer').css('-webkit-transform', 'translateX('+left+'px)');
            });
        }else{
            $('#service-hover-pointer').css('-webkit-transform', 'translateX('+left+'px)');
        }
    });
    $('#services').on('mouseleave', function(){
        $('#service-hover').removeClass('show');
        $('#services').removeClass('open');
        $('.service-icon').removeClass('active');
    });


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
    this.ga.event('song', 'play', e.target.song.type, 1, true);
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

    this.updateArtwork(song, queueNumber);

}

// update artwork
Main.prototype.updateArtwork = function(song, queueNumber) {
    var currentArtwork = song.artwork || '',
        prevArtwork = '',
        nextArtwork = '';
    var lastTransitionEl = this.currentSongArtworkEl;
    this.rightContainerEl.removeClass('no-transition');

    // main artwork element
    this.nextSongArtworkEl.css(
            'background-image',
            'url(' + currentArtwork + ')'
        ).removeClass('artwork-next')
        .addClass('artwork-current');
    this.currentSongArtworkEl.addClass('artwork-previous');

    // next & previous artwork
    var nextSong = this.playQueue.getList()[queueNumber + 1];
    var prevSong = this.playQueue.getList()[queueNumber - 1];

    if(nextSong !== undefined){
        nextArtwork = nextSong.artwork || '';
        $('#next-artwork-current').addClass('artwork-previous');
        $('#next-artwork-next').css(
                'background-image',
                'url(' + nextArtwork + ')'
            )
            .removeClass('artwork-next')
            .addClass('artwork-current');
    }
    if(prevSong !== undefined){
        lastTransitionEl = $('#prev-artwork-next');
        prevArtwork = prevSong.artwork || '';
        $('#prev-artwork-current').addClass('artwork-previous');
        $('#prev-artwork-next').css(
                'background-image',
                'url(' + prevArtwork + ')'
            )
            .removeClass('artwork-next')
            .addClass('artwork-current');
    }

    // reset artwork classes when last transition finishes
    lastTransitionEl.one('webkitTransitionEnd', this.resetArtwork.bind(this, currentArtwork, prevArtwork, nextArtwork));

};

// reset artwork elements
Main.prototype.resetArtwork = function(currentArtwork, prevArtwork, nextArtwork){
    this.rightContainerEl.addClass('no-transition');

    // reset main artwork element
    this.currentSongArtworkEl.css(
            'background-image',
            'url(' + currentArtwork + ')'
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
        case 'soundcloud':
            $('#service-icon-soundcloud').addClass('show');
        break;
        default:
        break;
    }
    if(song.hasMeta === true){
        if(song.title && song.artist){
            $('#service-icon-rdio').addClass('show');
            $('#service-icon-spotify').addClass('show');
        }
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
        if(tags.title && tags.artist){
            $('#service-icon-rdio').addClass('show');
            $('#service-icon-spotify').addClass('show');
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
        case 'rdio':
            chrome.runtime.sendMessage(null,
                {
                    "type": 'rdioSave',
                    "title": song.title,
                    "artist": song.artist
                }
            )
        break;
        case 'spotify':
            chrome.runtime.sendMessage(null,
                {
                    "type": 'spotifyOpen',
                    "title": song.title,
                    "artist": song.artist,
                    "album": song.album
                }
            )
        break;
        default:
        break;
    }
    this.ga.event('button', 'click', service, 1);
}

// keyboard shortcuts
Main.prototype.onKeyup = function(e){
    switch(e.keyCode){
        case 32:
            this.playQueue.playPause();
            this.ga.event('keyboard', 'keyup', 'playPause', 1);
        break;
        case 37:
            this.playQueue.previous();
            this.ga.event('keyboard', 'keyup', 'previous', 1);
        break;
        case 38:
            this.playQueue.previous();
            this.ga.event('keyboard', 'keyup', 'previous', 1);
        break;
        case 39:
            this.playQueue.next();
            this.ga.event('keyboard', 'keyup', 'next', 1);
        break;
        case 40:
            this.playQueue.next();
            this.ga.event('keyboard', 'keyup', 'next', 1);
        break;
        case 77:
            this.toggleMinimize();
            this.ga.event('keyboard', 'keyup', 'toggleMinimize', 1);
        break;
        default:
        break;
    }
}

// Google Analytics
Main.prototype.gotGA = function(obj){
    if(obj !== null){
        this.ga = new ExtGA(
            {
                'trackingId': obj.ACCOUNT,
                'trackingDns': obj.DOMAIN,
                'appVersion': obj.VERSION,
                'appName': obj.NAME
            }
        );
    }
    else{
        this.ga = {
            'event': function(){},
            'pageview': function(){},
            'social': function(){},
            'exception': function(){}
        };
    }
}

// Service action feedback
// eg. after clicking a button
Main.prototype.serviceAction = function(success, message, action, network){
    console.log('serviceAction', success, message);
    if(success === true){
        var song = this.playQueue.getSong();
        console.log('social', action, network, song.type);
        this.ga.social(action, network, song.type, 1);
    }
}

var main;
$(document).ready(
    function(){
        main = new Main();
    }
)
