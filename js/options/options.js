function Options(){
    this.services = [
        'tumblr',
        'rdio'
    ]
    this.getAuthStatus();
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
    $('.auth-button').on('click', this.onServiceClick.bind(this));
}

// got auth status for services
// update UI accordingly
Options.prototype.gotAuthStatus = function(service, oAuthObj){
    console.log(service, oAuthObj);
    if(oAuthObj[service + 'Auth']){
        console.log('we got it');
        $('#' + service + '-auth-button')
            .text('Disconnect')
    }
    else{
        $('#' + service + '-auth-button')
            .addClass('connect')
            .text('Connect')
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
    }
    else{
        console.log('disconnect')
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
            'userAuthorizationURL': constants[capitalService].AUTHORIZE_URL,
            'accessTokenURL': constants[capitalService].ACCESS_URL,
            'callbackUrl': keys[capitalService].OAUTH_CALLBACK,
            'callback': this.authDone,
            'service': service
        }
    );
    if(oAuthVersion === "1"){
        authorize.requestToken();
    }
    if(oAuthVersion === "2"){
        authorize.openAuthDialog();
    }
}

// oauth flow done
// If successfull save credentials in stoarge
Options.prototype.authDone = function(success, oAuthObj, service){
    console.log('authDone', oAuthObj, service);
    if(success === true){
        var obj = {};
        obj[service + 'Auth'] = oAuthObj;
        chrome.storage.sync.set(obj);
    }
    else{
        alert("There was a problem. Please try again.");
    }
}
   
function init(){
    var options = new Options();
}

$(document).ready(init);