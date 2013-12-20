(function(){

"use strict";

// constructor
function PlayQueue(opts){
    
    // The list array
    this.list = [];
    
    // Boolean if we should fire 'ended' event manually.
    // Mobile safari doesn't always fire 'ended' event. This will 
    // look at the time and fire it manually when it's .1 to end
    this.notify_before_end = false;
    
    // Boolean if we already fired the fake 'ended' event
    this.before_end_notified = false;
    
    // Boolean if calling 'previous' function should start current song
    // playing again if we are more than 10 seconds in
    this.smart_previous = true;
    
    // Boolean if we should automatically go to next song when current
    // song ends. Good to set to false if client goes offline so it 
    // doesn't skip through all songs
    this.autoNext = true;
    
    // if we are on the last song, user can click next 
    // and it will skip and fire stop events
    this.userCanStop = false;
    
    // Number of milliseconds we should wait before deciding the current
    // song loading is not going to load and we should call next
    this.load_timeout = 15000;
    
    // Boolean if we should store list, queueNumber 
    // and shuffled state in localStorage
    this.use_local_storage = false;
    
    // Number of list length cap. -1 means no cap
    this.lengthCap = -1;
    
    // Boolean if we should fire 'songHalf' event at halp point of playing song
    this.notify_song_half = false;

    // Boolean if we already fired the song half event
    this.song_half_notified = false;

    // The position of current song in list
    this.queueNumber = 0;

    // Boolean if the list is shuffled or not
    this.isShuffled = false;

    // Boolean is the audio is stopped vs. playing/paused
    this.isStopped = true;

    // Timeout for song load fails
    this.loadTimeout;
    
    // namespace for localStorage
    this.localStorageNS = 'exPlayQueue_';
    
    // should we first check if client is online before
    // trying to load a song
    this.checkOnlineStatus = false;
    
    // if not null, this func must return true
    // to play a song
    this.validatePlayFunction = null;
    
    // should we first check the connection type
    // before setting the timeout time?
    // for Cordova only
    this.checkConnection = false;
    
    // Arrays for event listeners
    this.listeners = {
        'nextTrack' : [],
        'previousTrack' : [],
        'added' : [],
        'playing' : [],
        'songHalf' : [],
        'loading' : [],
        'stop' : [],
        'shuffleToggled' : [],
        'listChanged' : [],
        'play' : [],
        'pause' : [],
        'error': []
    };
    
    // Which song properties we should save to localStorage
    this.savedSongProperties = [
        'id', 'url', 'title',
        'artist', 'album', 'buy_link',
        'image', 'source', 'viewer_love',
        'user_love', '_listPosition', 'context'
    ];
    
    // soundcloud needs a consumer key to play songs
    if(opts && opts.soundcloud_key){
        if (typeof(opts.soundcloud_key) == "string"){
            this.soundcloud_key = opts.soundcloud_key;
        } 
        else {
            throw new TypeError("soundcloud_key must be a string");
        }
    }
    
    // mobile safari doesn't always fire 'ended' event. This will 
    // look at the time and fire it manually when it's .1 to end
    if(opts && opts.notify_before_end){
        if (typeof(opts.notify_before_end) == "boolean"){
            this.notify_before_end = opts.notify_before_end;
        } 
        else {
            throw new TypeError("notify_before_end must be a boolean");
        }
    }
    
    // this will fire an event when the song is halfway done. 
    // useful  for scrobbling
    if(opts && opts.notify_song_half){
        if (typeof(opts.notify_song_half) == "boolean"){
            this.notify_song_half = opts.notify_song_half;
        } 
        else {
            throw new TypeError("notify_song_half must be a boolean");
        }
    }
    
    // this will skip the current loading song after certain time has passed
    if(opts && opts.load_timeout){
        if (typeof(opts.load_timeout) == "number"){
            this.load_timeout = opts.load_timeout;
        } 
        else {
            throw new TypeError("load_timeout must be a number");
        }
    }
    
    // this will save the list, queueNumber and shuffled state to localStorage
    if(opts && opts.use_local_storage){
        if (typeof(opts.use_local_storage) == "boolean"){
            this.use_local_storage = opts.use_local_storage;
            if (this.use_local_storage == true){
                this.list = this.getLocalStorageList().concat([]);
                this.queueNumber = this.getLocalStorageQueueNumber();
                this.isShuffled = this.getLocalStorageIsShuffled();
            }
        } 
        else {
            throw new TypeError("use_local_storage must be a boolean");
        }
    }
    
    // this will cap the list length at a certain number. 
    if(opts && opts.length_cap){
        if (typeof(opts.length_cap) == "number"){
            this.length_cap = opts.length_cap;
        } 
        else {
            throw new TypeError("length_cap must be a number");
        }
    }
    
    // audio is required!
    if(opts && opts.audio) {
        this.audio = opts.audio;
        this.addAudioListeners();
    } else {
        throw new TypeError("PlayQueue requires an Audio object");
        return;
    }
    
    this.addEventListener(
        "listChanged", 
        this.saveLocally.bind(this), 
        false
    );
    try{ 
        window.addEventListener(
            "storage", 
            function(e){
                this.onStorageChange(e);
            }, 
            false
        );
    } 
    catch(e){}
}

// Add listeners to audio object
PlayQueue.prototype.addAudioListeners = function(){
    this.audio.addEventListener(
        'canplay', 
        this.canPlay.bind(this), 
        false
    );
    var bindedTimeUpdate = false;
    if(this.notify_before_end == true){
        this.audio.addEventListener(
            'timeupdate', 
            this.timeUpdate.bind(this), 
            false
        );
        bindedTimeUpdate = true;
    } 
    else{
        this.audio.addEventListener(
            'ended', 
            this.next.bind(this), 
            false
        );
    }
    if(this.notify_song_half == true && bindedTimeUpdate == false){
        this.audio.addEventListener(
            'timeupdate', 
            this.timeUpdate.bind(this), 
            false
        );
    }
    this.audio.addEventListener(
        'error', 
        this.error.bind(this), 
        false
    );
    this.audio.addEventListener(
        'play', 
        this.audioOnPlay.bind(this), 
        false
    );
    this.audio.addEventListener(
        'pause', 
        this.audioOnPause.bind(this), 
        false
    );
    this.audio.addEventListener(
        'remoteprevious', 
        this.previous.bind(this), 
        false
    );
    this.audio.addEventListener(
        'remotenext', 
        this.next.bind(this), 
        false
    );
}

// return the list of songs
PlayQueue.prototype.getList = function(){
    return this.list;
}

// return the list stored in localStorage
PlayQueue.prototype.getLocalStorageList = function(){
    var l = localStorage.getItem(this.localStorageNS+"list");
    if(l){
        return JSON.parse(l);
    }
    return [];
}

// return the current queue position
PlayQueue.prototype.getQueueNumber = function(){
    return this.queueNumber || 0;
}

// set the current queue position
PlayQueue.prototype.setQueueNumber = function(queueNumber){
    this.queueNumber = queueNumber;
    if(this.use_local_storage == true){
        localStorage.setItem(this.localStorageNS+"queueNumber", this.queueNumber);
    }
}

// return the queue position stored in localStorage
PlayQueue.prototype.getLocalStorageQueueNumber = function(){
    var n = localStorage.getItem(this.localStorageNS+"queueNumber");
    if(n){
        return JSON.parse(n);
    }
    return 0;
}

// return the shufled state position stored in localStorage
PlayQueue.prototype.getLocalStorageIsShuffled = function(){
    var n = localStorage.getItem(this.localStorageNS+"isShuffled");
    if (n){
        return JSON.parse(n);
    }
    return false;
}

// get the current song
PlayQueue.prototype.getSong = function(){
    return this.getList()[this.queueNumber] || null;
}

// returns a new song object only with properties in savedSongProperties
PlayQueue.prototype.getSavedSong = function(song){
    var newSong = {};
    for(var prop in this.savedSongProperties){
        newSong[this.savedSongProperties[prop]] 
            = song[this.savedSongProperties[prop]];
    }
    return newSong;
}

// Save the list, queueNumber and shuffled state to localStorage
PlayQueue.prototype.saveLocally = function(){
    if (this.use_local_storage == true){
        localStorage.setItem(this.localStorageNS+'list', JSON.stringify(this.getList()));
        localStorage.setItem(this.localStorageNS+'queueNumber', this.queueNumber);
        localStorage.setItem(this.localStorageNS+'isShuffled', this.isShuffled);
    }
}

// add songs to the list. Takes an array of objects,
// a single object or a single url string
PlayQueue.prototype.add = function(songs){
    var currentListLen = this.getList().length;
    var added = [];
    if(typeof(songs) == "string"){
        var song = {
            "url" : songs, 
            "_listPosition" : this.getList().length
        }
        this.getList().push(song);
        added.push(song);
    }
    if(typeof(songs) == "object"){
        if(songs.length){
            var len = songs.length;
            for (var i = 0; i < len; i++){
                var song = songs[i];
                song._listPosition = this.getList().length;
                var newSong = this.getSavedSong(song);
                this.getList().push(newSong);
                added.push(newSong);
            }
        } 
        else{
            songs._listPosition = this.getList().length;
            var newSong = this.getSavedSong(songs);
            this.getList().push(newSong);
            added.push(newSong);
        }
    }
    var newList = this.getList();
    this.dispatchListChanged(
        newList, 
        this.queueNumber, 
        added, 
        [], 
        currentListLen, 
        currentListLen, 
        newList.length
    );
}

// remove a song from the list by index
PlayQueue.prototype.remove = function(n){
    var currentListLen = this.getList().length;
    var returnValue = -1;
    var list = this.getList();
    if(list[n]){
        var removed = list.splice(n, 1);
        if(this.queueNumber == n){
            if (!this.audio.paused){
                this.queueNumber--;
                this.next(true);
            }
        }
        if(this.queueNumber > n){
            this.queueNumber--;
        }
        var len = this.getList().length;
        this.updateListPositions(removed[0]._listPosition);
        var newList = this.getList();
        this.dispatchListChanged(
            newList, 
            this.queueNumber, 
            [], 
            removed, 
            null, 
            currentListLen, 
            newList.length
        );
        returnValue = n;
    }
    return returnValue;
}

// clear the list, reset queueNumber, shuffled
PlayQueue.prototype.clear = function(){
    var removed = this.getList().concat([]);
    this.list = [];
    this.queueNumber = 0;
    this.setShuffled(false);
    this.stop();
    this.dispatchListChanged(
        [], 
        this.queueNumber, 
        [], 
        removed, 
        null, 
        0, 
        0
    );
}

// move a song from one psoition to another
PlayQueue.prototype.move = function(itemIndex, moveToIndex){
    if(itemIndex == moveToIndex){
        throw new TypeError("Cannot move item into it's own position");
    } 
    var len = this.getList().length - 1;
    if(len < itemIndex){
        throw new TypeError("itemIndex out of bounds");
    }
    if(len < moveToIndex){
        throw new TypeError("moveToIndex out of bounds");
    }
    var song = this.getList().splice(itemIndex, 1);
    this.getList().splice(moveToIndex, 0, song[0]);
    if(!this.isShuffled){
        this.updateListPositions();
    }
    if(this.queueNumber == itemIndex){
        this.queueNumber = moveToIndex;
    } 
    else{
        if(itemIndex < this.queueNumber && moveToIndex >= this.queueNumber){
            this.queueNumber--;
        }
        if(itemIndex > this.queueNumber && moveToIndex <= this.queueNumber){
            this.queueNumber++;
        }
    }
    var newList = this.getList();
    this.dispatchListChanged(
        newList, 
        this.queueNumber, 
        [], 
        [], 
        null, 
        newList.length, 
        newList.length
    );
}

// after the list was manipulated, 
// update the _listPosition property on each song
PlayQueue.prototype.updateListPositions = function(n){
    var len = this.getList().length;
    if(len > 0){
        if (!this.isShuffled){
            for(var i = 0; i < len; i++){
                var song = this.getList()[i];
                song._listPosition = i;
            }
        } 
        else{
            for(var i = 0; i < len; i++){
                var song = this.getList()[i];
                if (song._listPosition > n){
                    song._listPosition--;
                }
            }
        }
    }
}

// play a song at a given index
PlayQueue.prototype.play = function(n){
    this.canPlayCalled = false;
    var shouldPlay = true;
    if(this.validatePlayFunction !== null){
        shouldPlay = this.validatePlayFunction();
    }
    if(shouldPlay === true){
        var shouldLoad = true;
        if(this.checkOnlineStatus === true){
            if(navigator.onLine === false){
                shouldLoad = false;
                if(this.getList()[n]){
                    var checkSong = this.getList()[n];
                    if(checkSong.offline && checkSong.offline === true){
                        shouldLoad = true;
                    }
                }
            }
        }
        if(shouldLoad === true){
            if(this.getList()[n]){
                clearTimeout(this.loadTimeout);
                this.isStopped = false;
                this.song_half_notified = false;
                this.before_end_notified = false;
                this.queueNumber = n;
                var song = this.getSong();
                var url = song.url;
                if(this.soundcloud_key != null){
                    if(url.indexOf("soundcloud.com") != -1){
                        if (url.indexOf("?") == -1){
                            url = url+"?consumer_key="+this.soundcloud_key;
                        } 
                        else{
                            url = url+"&consumer_key="+this.soundcloud_key;
                        }
                    }
                }
                this.audio.src = url;
                this.audio.load();
                this.dispatchEvent("loading", 
                    {
                        'song': song, 
                        'queueNumber': this.queueNumber, 
                        'audio': this.getAudioProperties()
                    }
                );
                if(this.load_timeout != -1){
                    this.loadTimeout = setTimeout(
                        this.timeoutLoading.bind(this), 
                        this.load_timeout
                    );
                }
                if(this.use_local_storage == true){
                    localStorage.setItem(this.localStorageNS+"queueNumber", this.queueNumber);
                }
                if(this.length_cap != -1){
                    if(this.getList().length > this.length_cap){
                        var cutNumber = this.getList().length - this.length_cap;
                        if(this.queueNumber < cutNumber){
                            cutNumber = this.queueNumber - 1;
                        }
                        this.queueNumber -= cutNumber;
                        var currentListLen = this.getList().length; 
                        var removed = this.getList().splice(0, cutNumber);
                        this.updateListPositions(0);
                        this.dispatchListChanged(
                            this.getList(), 
                            this.queueNumber, 
                            [], 
                            removed, 
                            null, 
                            currentListLen, 
                            this.getList().length
                        );
                    }
                }
            } 
            else {
                throw new TypeError("Index out of bounds. Got: "
                    +n+" Length: "+this.getList().length);
            }
        }
        else{
            this.dispatchEvent('offline');    
        }
    }
    else{
        this.dispatchEvent('validatePlayFunctionFalse');
    }
}

// This will toggle paused state of audio. 
// If stopped, will start playing first song
PlayQueue.prototype.playPause = function(){
    if(this.isStopped){
        if(this.getList()[this.queueNumber]){
            this.play(this.queueNumber);
        }
    } 
    else{
        if(this.audio.paused){
            this.audio.play();
        } 
        else{
            this.audio.pause();
        }
    }
}

// This will pause the current audio
PlayQueue.prototype.pause = function(){
    this.audio.pause();
}

// Fires 'playing' event when 'canplay' audio event is fired. 
// Adds some useful data
PlayQueue.prototype.canPlay = function(){
    this.canPlayCalled = true;
    this.audio.play();
    this.dispatchEvent("playing", 
        {
            'song': this.getSong(), 
            'queueNumber': this.queueNumber,  
            'audio': this.getAudioProperties()
        }
    );
}

// Fires 'error' event song cannot load or has timed out 
// Then calls nexy
PlayQueue.prototype.error = function(){
    this.dispatchEvent("error", 
        {
            'song': this.getSong(), 
            'queueNumber': this.queueNumber,  
            'audio': this.getAudioProperties()
        }
    );
    this.next(
        {
            'type': "ended"
        }
    );
}

// Listener on audio timeupdate
// Handles notify_before_end and notify_song_half
PlayQueue.prototype.timeUpdate = function(){
    if(this.notify_before_end == true 
        && this.audio.duration > 0 
        && this.audio.duration - this.audio.currentTime < .5
        && this.before_end_notified == false
    ){
        this.before_end_notified = true;
        this.next(
            {
                'type': "ended"
            }
        );
    }
    if(this.notify_song_half == true 
        && this.song_half_notified == false 
        && this.audio.currentTime / this.audio.duration > .5
    ){
        this.song_half_notified = true;
        this.dispatchEvent('songHalf', 
            {
                'song': this.getSong(), 
                'queueNumber': this.queueNumber
            }
        );
    }
}

// This is called when loadTimeout is reached
// If song has not started, next is called
PlayQueue.prototype.timeoutLoading = function(){
    if(this.canPlayCalled === false){
        this.error();
    }
}

// This is called to skip to the next song in the list
// Called automatically when a song ends
// If there are no more songs in the list, calles stop
PlayQueue.prototype.next = function(e){
    // not user initiated
    if(e && e.type === 'ended'){
        if(this.queueNumber < this.getList().length - 1
            && this.autoNext === true){
            this._goNext();
        }
        else{
            this.stop();
        } 
    }
    // user initiated
    else{
        if(this.queueNumber < this.getList().length - 1){
            this._goNext();
        }
        else{
            if(this.userCanStop === true){
                this.stop();
            } 
        }
    }
}

// actually skip to the next song
PlayQueue.prototype._goNext = function(e){
    var q = this.queueNumber + 1;
    this.play(q);
    this.dispatchEvent(
        'nextTrack', 
        {
            'song': this.getSong(), 
            'queueNumber': q
        }
    );
}

// This is called to go to the previous song in the list
// If smart_previous is true, it will go back to current song
// when it is over 10 seconds in. Or else it will go to previous song
PlayQueue.prototype.previous = function(){
    if(this.smart_previous == true){
        if(this.audio.currentTime > 10){
            this.audio.currentTime = 0;
        } 
        else {
            if(this.queueNumber > 0){
                var q = this.queueNumber - 1;
                this.play(q);
                this.dispatchEvent('previousTrack', 
                    {
                        'song': this.getSong(), 
                        'queueNumber': q
                    }
                );
            }
        }
    } 
    else{
        if(this.queueNumber > 0){
            var q = this.queueNumber - 1;
            this.play(q);
            this.dispatchEvent('previousTrack', 
                {
                    'song': this.getSong(), 
                    'queueNumber': q
                }
            );
        }
    }
}

// This is called when we reach the end of the list
// Reset queueNumber
PlayQueue.prototype.stop = function(){
    this.isStopped = true;
    this.dispatchEvent('stop', 
        {
            'audio': this.getAudioProperties()
        }
    );
}

// Set shuffled state
PlayQueue.prototype.setShuffled = function(b, start){
    if(typeof(b) == "boolean"){
        if(b == true){
            if(this.isShuffled == false){
                this.shuffleList(start);
            }
        } 
        else{
            if(this.isShuffled == true){
                this.unShuffleList(start);
            }
        }
    } 
    else{
        throw new TypeError("setShuffled only accepts booleans");
    }
}

// Toggled shuffled state
PlayQueue.prototype.toggleShuffle = function(start){
    if (this.isShuffled == true){
        this.unShuffleList(start);
    } 
    else{
        this.shuffleList(start);
    }
    return this.isShuffled;
}

// Shuffle the list. 
PlayQueue.prototype.shuffleList = function(start){
    var len = this.getList().length;
    if (len > 0){
        var playingSongPosition = this.getSong()._listPosition;
        start = start || 0;
        var toShuffle = this.getList()
            .splice(start, this.getList().length - start);  
        this.shuffle(toShuffle);
        var first = this.getList().splice(0, start);
        var newList = first.concat(toShuffle);
        var newListLen = newList.length;
        if(playingSongPosition >= start){
            for(var i = 0; i < newListLen; i++){
                var song = newList[i];
                if(song._listPosition === playingSongPosition){
                    newList.splice(i, 1);
                    newList.splice(start, 0, song);
                    break;
                }
            }
        }
        this.list = newList.concat([]);
        this.queueNumber = start;
    }
    this.isShuffled = true;
    this.dispatchListChanged(
        this.getList(), 
        this.queueNumber, 
        [], 
        [], 
        null, 
        this.getList().length,
        this.getList().length
    );
    this.dispatchEvent('shuffleToggled', 
        {
            'queueNumber': this.queueNumber, 
            'isShuffled': this.isShuffled, 
            'list': this.getList(),
            'shuffledPart': toShuffle
        }
    );
}

// Un-shuffle the list
PlayQueue.prototype.unShuffleList = function(){
    var len = this.getList().length;
    if (len > 0){
        var newList = [];
        for (var i = 0; i < len; i++){
            var song = this.getList()[i];
            newList[song._listPosition] = song;
        }
        this.queueNumber = this.getSong()._listPosition;
        this.list = newList.concat([]);
    }
    this.isShuffled = false;
    this.dispatchListChanged(
        this.getList(), 
        this.queueNumber, 
        [], 
        [], 
        null, 
        this.getList().length, 
        this.getList().length
    );
    this.dispatchEvent('shuffleToggled', 
        {
            'queueNumber': this.queueNumber, 
            'isShuffled': this.isShuffled, 
            'list': this.getList(), 
            'shuffledPart': []
        }
    );
}

// Shuffle algo
//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
PlayQueue.prototype.shuffle = function(o){
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), 
        x = o[--i], o[i] = o[j], 
        o[j] = x
    );
    return o;
}

// Return current audio properties plus some useful data
PlayQueue.prototype.getAudioProperties = function(){
    return {
        'paused': this.audio.paused,
        'isStopped': this.isStopped,
        'currentTime': this.audio.currentTime,
        'duration': this.audio.duration,
        'src': this.audio.src,
        'volume': this.audio.volume,
        'queueNumber': this.queueNumber,
        'song': this.getSong()
    }
}

// Force a 'listChanged' event to trigger
PlayQueue.prototype.refreshList = function(){
    var newList = this.getList();
    this.dispatchListChanged(
        newList, 
        this.queueNumber, 
        [], 
        [], 
        null, 
        newList.length, 
        newList.length
    );
}

// Trigger play event when audio play is triggered adding some useful data
PlayQueue.prototype.audioOnPlay = function(e){
    this.dispatchEvent('play', 
        {
            'song': this.getSong(), 
            'audio': this.getAudioProperties(), 
            'queueNumber': this.queueNumber
        }
    );
}

// Trigger pause event when audio play is triggered adding some useful data
PlayQueue.prototype.audioOnPause = function(e){
    this.dispatchEvent('pause', 
        {
            'song': this.getSong(), 
            'audio': this.getAudioProperties(), 
            'queueNumber': this.queueNumber
        }
    );
}

// Return song in list at index provided
PlayQueue.prototype.getSongAt = function(position){
    return this.getList()[position];
}

// Seek audio by percentage of song
// Percentage range = 0-1
PlayQueue.prototype.seek = function(percentage){
    if (!isNaN(this.audio.duration)){
        this.audio.currentTime = Math.floor(percentage * this.audio.duration);
    }
}

// Call this to trigger 'listChanged' event
PlayQueue.prototype.dispatchListChanged = function(
        list, 
        queueNumber, 
        added, 
        removed, 
        positionAddedAt, 
        oldListLength, 
        newListLength
    ){
    this.dispatchEvent('listChanged', 
        {
            'list': list, 
            'queueNumber': queueNumber, 
            'added': added,
            'removed': removed,
            'positionAddedAt': positionAddedAt, 
            'oldListLength': oldListLength, 
            'newListLength': newListLength,
            'isShuffled': this.isShuffled
        }
    );
}

// storagechange listener
PlayQueue.prototype.onStorageChange = function(e){
    if(e.key == this.localStorageNS+'list'){
        var list = JSON.parse(e.newValue);
    }
    if(e.key == this.localStorageNS+'queueNumber'){
        
    }
}

// Event emitter add
PlayQueue.prototype.addEventListener = function(eventName, callback, b){
    for(var i in this.listeners){
        if(eventName == i){
            this.listeners[i].push(callback);
            break;
        };
    };
};

// Event emitter remove
PlayQueue.prototype.removeEventListener = function(type, fn){
    if(typeof this.listeners[type] != 'undefined') {
        for(var i = 0, l; l = this.listeners[type][i]; i++) {
            if (l == fn) break;
        }
        this.listeners[type].splice(i, 1);
    }
};

// Event emitter trigger
PlayQueue.prototype.dispatchEvent = function(type, object){
    if(typeof this.listeners[type] != 'undefined' && this.listeners[type].length) {
        var array = this.listeners[type].slice();
        for (var i = 0, l; l = array[i]; i++) {
            var timeStamp = new Date().getTime();
            l.apply(object, [
                {
                    'type': type, 
                    'timeStamp': timeStamp, 
                    'target': object
                }
            ]);
        }
        return true;           
    }
    return false;
};
    
// check if we've got require
if(typeof module !== "undefined"){
    module.exports = PlayQueue;
}
else{
    window.PlayQueue = PlayQueue;
}

}()); // end wrapper