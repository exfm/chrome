function Scan(){
    this.response = {
        "url": location.href,
        "isTumblr": false,
        "isTumblrDashboard": false,
        "showPageActionIcon": false
    }
    this.tumblr();
    console.log(this.response);
    chrome.runtime.sendMessage(null, 
        {
            'type': 'scanDone',
            'response': this.response
        }
    )
}

// Are we on a tumblr page?
// 1. Look for .tumblr.com url 
// 2. Look for tumblr.com/dashboard
// 3. Look for 'follow' iframer 

Scan.prototype.tumblr = function(){
    if(location.href.indexOf('tumblr.com') !== -1){
        if(location.href.indexOf('tumblr.com/dashboard') !== -1){
            this.response.isTumblrDashboard = true;
            this.response.showPageActionIcon = true;
            return;
        }
        else{
            this.response.isTumblr = true;
            this.response.showPageActionIcon = true;
            return;
        }
    }
    else{
        if(document.getElementById("tumblr_controls") !== null){
            this.response.isTumblr = true;
            this.response.showPageActionIcon = true;
            return;
        }
    }
}

var scan = new Scan();