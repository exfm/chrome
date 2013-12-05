(function(){

"use strict";

function ProgressBar(opts){

    // class added to hide elements
    this.hideClass = 'display_none';
    
    // css class to add to progress bar when in loading state
    this.loadingClass = "loading";

    $.extend(this, opts);
        
    if(this.playQueue){
        this.audio = this.playQueue.audio;
    }
    
    // boolean if user is seeking or not
    this.isSeeking = false;
    
    this.addListeners();
    this.setSizes();
    
}

// add listeners
ProgressBar.prototype.addListeners = function(){
    this.removeListeners();
    if(this.back){
        this.bindedBackClick = $.proxy(this, 'click');
        console.log($(this.back));
        $(this.back).bind(
            'click', 
            this.bindedBackClick
        );
    }
    if(this.front){
        this.bindedFrontClick = $.proxy(this, 'click');
        $(this.front).bind(
            'click', 
            this.bindedFrontClick
        );
    }
    if(this.thumb){
        this.bindedThumbDown = $.proxy(this, 'mouseDown');
        $(this.thumb).bind(
            'mousedown', 
            this.bindedThumbDown
        );
        this.bindedThumbUp = $.proxy(this, 'mouseUp');
        $(this.thumb).bind(
            'mouseup', 
            this.bindedThumbUp
        );
    }
    if(this.playQueue){
        this.bindedPlayQueueLoading = this.onLoading.bind(this);
        this.playQueue.addEventListener(
            'loading', 
            this.bindedPlayQueueLoading, 
            false
        );
        this.bindedPlayQueuePlaying = this.onPlaying.bind(this);
        this.playQueue.addEventListener(
            'playing', 
            this.bindedPlayQueuePlaying, 
            false
        );
    }
    else{
        if(this.audio){
            this.bindedAudioLoading = this.onLoading.bind(this);
            this.audio.addEventListener(
                'loadstart', 
                this.bindedAudioLoading, 
                false
            );
            this.bindedAudioPlaying = this.onPlaying.bind(this);
            this.audio.addEventListener(
                'canplay', 
                this.bindedAudioPlaying, 
                false
            );
        }
    }
    if(this.audio){
        this.bindedTimeUpdate = this.onTimeUpdate.bind(this);
        this.audio.addEventListener(
            'timeupdate', 
            this.bindedTimeUpdate, 
            false
        );
        this.bindedDurationChange = this.onDurationChange.bind(this);
        this.audio.addEventListener(
            'durationchange', 
            this.bindedDurationChange, 
            false
        );
        this.bindedSeeking = this.onSeeking.bind(this);
        this.audio.addEventListener(
            'seeking', 
            this.bindedSeeking, 
            false
        );
        this.bindedSeeked = this.onSeeked.bind(this);
        this.audio.addEventListener(
            'seeked', 
            this.bindedSeeked, 
            false
        );
        this.bindedProgress = this.onProgress.bind(this);
        if(this.loadingProgress){
            this.audio.addEventListener(
                'progress', 
                this.bindedProgress, 
                false
            );
        }
    }
    this.bindedSetSizes = $.proxy(this, 'setSizes');
    $(window).bind(
        'resize', 
        this.bindedSetSizes
    );
}


// remove all listeners
ProgressBar.prototype.removeListeners = function(){
    $(this.back).unbind(
        'click', 
        this.bindedBackClick
    );
    $(this.front).unbind(
        'click', 
        this.bindedFrontClick
    );
    $(this.thumb).unbind(
        'mousedown', 
        this.bindedThumbDown
    );
    $(this.thumb).unbind(
        'mouseup', 
        this.bindedThumbUp
    );
    this.playQueue.removeEventListener(
        'loading', 
        this.bindedPlayQueueLoading
    );
    this.playQueue.removeEventListener(
        'playing', 
        this.bindedPlayQueuePlaying
    );
    this.audio.removeEventListener(
        'loadstart', 
        this.bindedAudioLoading 
    );
    this.audio.removeEventListener(
        'canplay', 
        this.bindedAudioPlaying
    );
    this.audio.removeEventListener(
        'timeupdate', 
        this.bindedTimeUpdate
    );
    this.audio.removeEventListener(
        'durationchange', 
        this.bindedDurationChange
    );
    this.audio.removeEventListener(
        'seeking', 
        this.bindedSeeking
    );
    this.audio.removeEventListener(
        'seeked', 
        this.bindedSeeked 
    );
    this.audio.removeEventListener(
        'progress', 
        this.bindedProgress 
    );
    $(window).unbind(
        'resize', 
        this.bindedSetSizes
    );
}

// calculate widths
ProgressBar.prototype.setSizes = function(){
    if(this.back){
        this.width = $(this.back).width();
        this.left = $(this.back).offset().left;
        this.right = this.left + this.width;
    }
}

// reset everything to default 
ProgressBar.prototype.reset = function(){
    $(this.thumb).addClass(this.hideClass);
    $(this.front).addClass(this.hideClass);
    this.currentTimeText = "0:00";
    this.durationText = "0:00"; 
    this.thumbLeft = 0;
    this.frontWidth = -100;
    this.percentageWidth = -100;
    this.requestAnimationFrame(this.draw);
}

// onLoading event, reset times, reset thumb and front, add loading class to back
ProgressBar.prototype.onLoading = function(e){
    this.reset()
    $(this.back).addClass(this.loadingClass);
}

// onPlaying event. show thumb and front, remove loading class from back 
ProgressBar.prototype.onPlaying = function(e){
    $(this.thumb).removeClass(this.hideClass);
    $(this.front).removeClass(this.hideClass);
    $(this.back).removeClass(this.loadingClass);
}

// onTimeUpdate event. Update count and duration. Set width on front. Move thumb.
ProgressBar.prototype.onTimeUpdate = function(e){
    this.setPosition(e.target);
}

// onDurationChange event. Update duration. 
ProgressBar.prototype.onDurationChange = function(e){
    this.durationText = this.getMMSS(Math.floor(e.target.duration)); 
    this.requestAnimationFrame(this.draw);
}

// onSeeking event, add loading class to back
ProgressBar.prototype.onSeeking = function(e){
    $(this.back).addClass(this.loadingClass);
}

// onSeeked event, remove loading class to back
ProgressBar.prototype.onSeeked = function(e){
    $(this.back).removeClass(this.loadingClass);
}

// onProgress event, fired when media is loading
ProgressBar.prototype.onProgress = function(e){
    this.percentageWidth = (100 * (e.target.buffered.end / e.target.duration)) - 100;
    this.requestAnimationFrame(this.draw);
}

// mouseDown on thumb listener
ProgressBar.prototype.mouseDown = function(e){
    $(document).bind(
        'mousemove', 
        $.proxy(this, 'mouseMove')
    );
    $(document).bind(
        'mouseup', 
        $.proxy(this, 'mouseUp')
    );
    this.isSeeking = true;
    e.preventDefault();
}

// mouseMove on thumb listener
ProgressBar.prototype.mouseMove = function(e){
    var x = e.clientX;
    if(x < this.left){
        x = this.left;
    }
    if(x > this.right){
        x = this.right;
    }
    this.seekLeft = x - this.left;
    //$(this.thumb).css("left", this.seekLeft);
    //$(this.front).css("width", this.seekLeft);
}

// mouseUp on thumb listener
ProgressBar.prototype.mouseUp = function(e){
    $(document).unbind(
        'mousemove', 
        $.proxy(this, 'mouseMove')
    );
    $(document).unbind(
        'mouseup', 
        $.proxy(this, 'mouseUp')
    );
    this.isSeeking = false;
    var percentage = this.seekLeft / this.width;
    this.seek(percentage);
}

// click on front and back listener
ProgressBar.prototype.click = function(e){
    this.mouseMove(e);
    var percentage = this.seekLeft / this.width;
    this.seek(percentage);
}

// user seeked. Call playQueue or audio directly
ProgressBar.prototype.seek = function(percentage){
    if(this.playQueue){
        this.playQueue.seek(percentage);
    }
    else{
        if(this.audio){
            if (!isNaN(this.audio.duration)){
                this.audio.currentTime = Math.floor(percentage * this.audio.duration);
            }
        }
    }
}

// return integer as minutes:seconds
ProgressBar.prototype.getMMSS = function (secs) {
    var s = secs % 60;
    if (s < 10) {
        s = "0" + s;
    }
    return Math.floor(secs/60) + ":" + s;
}

// set positions and time
ProgressBar.prototype.setPosition = function(audio){
    this.currentTimeText = this.getMMSS(Math.floor(audio.currentTime));
    if(!isNaN(audio.duration)){
        this.durationText = this.getMMSS(Math.floor(audio.duration));
    } 
    else{
        this.durationText = '...';
    } 
    var percentage = audio.currentTime / audio.duration;
    if(this.isSeeking == false) {
        if((this.width * percentage) > 0){
            this.thumbLeft = this.width * percentage;
        }
        this.frontWidth = (100 * percentage) - 100;
    }
    this.requestAnimationFrame(this.draw);
}

// manually call this to update position 
ProgressBar.prototype.update = function(){
    this.setPosition(this.audio);
}

// draw the dom changes
ProgressBar.prototype.draw = function() {
    $(this.count).text(this.currentTimeText);
    $(this.duration).text(this.durationText);
    $(this.front).css('-webkit-transform', 'translateX('+this.frontWidth+'%)');
    $(this.loadingProgress).css('-webkit-transform', 'translateX('+this.percentageWidth+'%)');
    if(this.thumb){
        $(this.thumb).css('left', this.thumbLeft);
    };
}

// only use rAF if we've got it
ProgressBar.prototype.requestAnimationFrame = function(func){
    var rAF = window.requestAnimationFrame || 
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame;
    if(rAF){
        rAF($.proxy(func, this));
    }
    else{
        func.call(this);
    }
}


// check if we've got require
if(typeof module !== "undefined"){
    module.exports = ProgressBar;
}
else{
    window.ProgressBar = ProgressBar;
}

}()); // end wrapper