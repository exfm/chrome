function Options(){
    this.ga = new ExtGA(
        {
            'trackingId': keys.GOOGLE_ANALYTICS.ACCOUNT,
            'trackingDns': keys.GOOGLE_ANALYTICS.DOMAIN,
            'appVersion': keys.GOOGLE_ANALYTICS.VERSION,
            'appName': keys.GOOGLE_ANALYTICS.NAME
        }
    );
    this.services = [
        'tumblr',
        'rdio',
        'soundcloud',
        'lastfm'
    ]
    $('.auth-button').on('click', this.onServiceClick.bind(this));
    this.getAuthStatus();
    this.ga.pageview('options', 'Options');
}

// check to see what services
// user is authed for
Options.prototype.getAuthStatus = function(){
    for(var i in this.services){
        var service = this.services[i];
        chrome.storage.sync.get(
            service + 'Auth',
            this.gotAuthStatus.bind(this, service)
        );
    }
}

// got auth status for services
// update UI accordingly
Options.prototype.gotAuthStatus = function(service, oAuthObj){
    console.log(service, oAuthObj);
    if(oAuthObj[service + 'Auth']){
        $('#' + service + '-auth-button')
            .removeClass('connect')
            .text('Disconnect');
        $('#service-logo-' + service)
            .addClass('connected');
    }
    else{
        $('#' + service + '-auth-button')
            .addClass('connect')
            .text('Connect');
        $('#service-logo-' + service)
            .removeClass('connected');
    }
}

// auth button clicked
// if service is connected, disconnect it by 
// clearing storage
// If not connected yet, start oauth flow
Options.prototype.onServiceClick = function(e){
    var service = e.target.dataset.service;
    if($(e.target).hasClass('connect')){
        var oAuthVersion = e.target.dataset.oauth_version;
        this.connect(service, oAuthVersion);
        this.ga.event('button', 'connect', service, 1);
    }
    else{
        chrome.storage.sync.remove(
            service + 'Auth',
            this.getAuthStatus.bind(this)
        );
        if(service === 'rdio'){
            chrome.storage.sync.remove('rdioPlaylistId');
        }
        this.ga.event('button', 'disconnect', service, 1);
    }
}

// start oauth flow
Options.prototype.connect = function(service, oAuthVersion){
    var capitalService = service.toUpperCase();
    var authorize = new Authorize(
        {
            'key': keys[capitalService].KEY,
            'secret': keys[capitalService].SECRET,
            'requestTokenUrl': constants[capitalService].REQUEST_URL,
            'userAuthorizationUrl': constants[capitalService].AUTHORIZE_URL,
            'accessTokenUrl': constants[capitalService].ACCESS_URL,
            'callbackUrl': keys[capitalService].OAUTH_CALLBACK,
            'callback': this.authDone.bind(this),
            'service': service,
            'authorizeParams': constants[capitalService].AUTHORIZE_PARAMS
        }
    );
    if(oAuthVersion === "1"){
        authorize.requestToken();
    }
    if(oAuthVersion === "2"){
        authorize.openAuthDialog();
    }
    if(oAuthVersion === "lastfm"){
        authorize.openLastFMAuthDialog();
    }
}

// oauth flow done
// If successfull save credentials in stoarge
Options.prototype.authDone = function(success, oAuthObj, service){
    console.log('authDone', oAuthObj, service);
    if(success === true){
        var obj = {};
        obj[service + 'Auth'] = oAuthObj;
        chrome.storage.sync.set(
            obj,
            this.getAuthStatus.bind(this)
        );
        this.authConnected(service, oAuthObj);
    }
    else{
        alert("There was a problem. Please try again.");
    }
    var capitalService = service.charAt(0).toUpperCase() + service.slice(1);
    this.ga.social('connect', capitalService, 'connect', 1);
}

// auth was successfull
// do service specific stuff
Options.prototype.authConnected = function(service, oAuthObj){
    switch(service){
        case 'rdio':
            var rdio = new Rdio();
            rdio.getPlaylists(oAuthObj);
        break
        default:
        break;
    }
}
   
function init(){
    var options = new Options();
}

$(document).ready(init);