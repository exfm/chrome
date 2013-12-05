function Main(){
    this.audio = new Audio();
    this.playQueue = new PlayQueue(
        {
            'audio': this.audio,
            'use_local_storage': false
        }
    )
    chrome.runtime.sendMessage(null, 
        {
            "type": 'deepScan'
        }
    )
    $(document.body).on('click', function(){
        chrome.runtime.sendMessage(null, 
            {
                "type": 'minimize'
            }
        )   
    })
}

Main.prototype.gotPlaylist = function(list){
    this.playQueue.add(list);
    this.playQueue.play(0);
    console.log('playQueue', this.playQueue.getList());
    var template = document.getElementById('song');
    //console.log(template.content, template.innerHTML);
    document.body.appendChild(template.content.cloneNode(true));
}
var main;
$(document).ready(
    function(){
        console.log('ready');
        main = new Main();       
    }
)
