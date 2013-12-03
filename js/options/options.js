function Options(){
    $('#tumblr').on('click', this.onServiceClick.bind(this));
    $('#rdio').on('click', this.onServiceClick.bind(this));
}

Options.prototype.onServiceClick = function(e){
    var service = e.target.dataset.service;
    console.log('service', service);
    chrome.storage.sync.get(service + 'Auth', this.checkAuth.bind(this, service));
}

Options.prototype.checkAuth = function(service, oauthObj){
    console.log('checkAuth', service, oauthObj);
    if(oauthObj[service + 'Auth']){
        console.log('we got it');
    }
    else{
        var capitalService = service.toUpperCase();
        var authorize = new Authorize(
            {
                'key': keys.TUMBLR_KEY,
                'secret': keys.TUMBLR_SECRET,
                'requestTokenUrl': constants[capitalService].REQUEST_URL,
                'userAuthorizationURL': constants[capitalService].AUTHORIZE_URL,
                'accessTokenURL': constants[capitalService].ACCESS_URL,
                'callbackUrl': "http://oauth.extension.fm/tumblr",
                'callback': this.authDone,
                'service': service
            }
        );
         authorize.requestToken();
    }
}

Options.prototype.authDone = function(success, oauthObj, service){
    console.log('authDone', oauthObj, service);
    if(success === true){
        var obj = {};
        obj[service + 'Auth'] = oauthObj;
        chrome.storage.sync.set(obj);
    }
    else{
        alert("There was a problem. Please try again.");
    }
}

    /*
 var authorize = new Authorize(
        {
            'key': keys.RDIO_KEY,
            'secret': keys.RDIO_SECRET,
            'requestTokenUrl': constants.RDIO_REQUEST_URL,
            'userAuthorizationURL': constants.RDIO_AUTHORIZE_URL,
            'accessTokenURL': constants.RDIO_ACCESS_URL,
            'callbackUrl': "http://dankantor.com"
            
        }
    );
*/
   



function init(){
    var options = new Options();
}

$(document).ready(init);