function Authorize(opts){
    this.opts = opts;
}

// Get a request token
Authorize.prototype.requestToken = function(){
    $.oauth(
	    {
	        'url': this.opts.requestTokenUrl,
	        'type': 'POST',
            'data': {
				'oauth_callback': this.opts.callbackUrl
			 },
			'consumerKey': this.opts.key, 
			'consumerSecret': this.opts.secret
        }
    ).then(
        this.gotRequestToken.bind(this),
        this.callbackError.bind(this)
    )
}

// Got the request token
Authorize.prototype.gotRequestToken = function(responseText){
    var results = OAuth.decodeForm(responseText);
    this.oauthToken = OAuth.getParameter(results, "oauth_token");
    this.oauthTokenSecret = OAuth.getParameter(results, "oauth_token_secret");
    this.bindedTabListener = this.tabListener.bind(this);
    chrome.tabs.onUpdated.addListener(this.bindedTabListener);
    chrome.tabs.create(
        {
            'url': this.opts.userAuthorizationUrl+"?oauth_token="+this.oauthToken
        }
    );
}

// listen for tab changes 
// so we can figure out when 
// user authed 
Authorize.prototype.tabListener = function(tabId, obj, tab){
    var indexOf = tab.url.indexOf(this.opts.callbackUrl);
	if (indexOf !== -1 && obj.status === "complete"){
		chrome.tabs.onUpdated.removeListener(this.bindedTabListener);
		var results = OAuth.decodeForm(tab.url.split("?")[1]);
        this.oauthToken = OAuth.getParameter(results, "oauth_token");
        this.oauthVerifier = OAuth.getParameter(results, "oauth_verifier"),
        this.oauthVerifier = this.oauthVerifier.split('#_=_')[0];
        this.highlightTab();
		chrome.tabs.remove(tabId);
		this.requestAccessToken();
	}    
}

// Get an access token
Authorize.prototype.requestAccessToken = function(){
    $.oauth(
	    {
	        'url': this.opts.accessTokenUrl,
	        'type': 'POST',
	        'data': {
				'oauth_verifier': this.oauthVerifier
			 },
			'consumerKey': this.opts.key, 
			'consumerSecret': this.opts.secret,
			'token': this.oauthToken,
            'tokenSecret': this.oauthTokenSecret
        }
    ).then(
        this.gotAccessToken.bind(this),
        this.callbackError.bind(this)
    )
}

// Got the access token
Authorize.prototype.gotAccessToken = function(responseText){
    var results = OAuth.decodeForm(responseText);
    var obj = {
        "oauth_token" : OAuth.getParameter(results, "oauth_token"),
        "oauth_token_secret" : OAuth.getParameter(results, "oauth_token_secret")
        }
    this.opts.callback(true, obj, this.opts.service);
}

// Oauth 2 
// Open the auth dialog
Authorize.prototype.openAuthDialog = function(){
    var url = this.opts.userAuthorizationUrl;
    url += "?client_id="+this.opts.key;
    url += "&redirect_uri="+this.opts.callbackUrl;
    url += this.opts.authorizeParams;
    this.bindedTabListener = this.oauth2TabListener.bind(this);
    chrome.tabs.onUpdated.addListener(this.bindedTabListener);
    chrome.tabs.create(
        {
            'url': url
        }
    );
}

// Oauth 2 
// Listen for callback tab
Authorize.prototype.oauth2TabListener = function(tabId, obj, tab){
    var indexOf = tab.url.indexOf(this.opts.callbackUrl);
    if (indexOf === 0 && obj.status === "complete"){
	    chrome.tabs.onUpdated.removeListener(this.bindedTabListener);
		var results = OAuth.decodeForm(tab.url.split("?")[1]);
		if(this.opts.authorizeCallbackType === 'hash'){
            var split = results[0][1].split('#');
            var obj = 
            {
                "code" : split[0],
                "accessToken" : split[1].split('=')[1]
            }
            this.opts.callback(true, obj, this.opts.service);
        }
        if(this.opts.authorizeCallbackType === 'param'){
            var code = OAuth.getParameter(results, "code");
            this.getOauth2AccessToken(code);
        }
        this.highlightTab();
        chrome.tabs.remove(tabId);
	}
}

// Oauth 2
// Exchange code for access token
Authorize.prototype.getOauth2AccessToken = function(code){
    $.ajax(
	    {
	        'url': this.opts.accessTokenUrl,
	        'type': 'POST',
	        'data': {
				'client_id': this.opts.key,
				'client_secret': this.opts.secret,
				'response_type': 'code',
				'grant_type': 'authorization_code',
				'redirect_uri': this.opts.callbackUrl,
				'code': code
			 }
        }
    ).then(
        this.gotOauth2AccessToken.bind(this),
        this.callbackError.bind(this)
    )
}

// Oauth2
// Got access token from code
Authorize.prototype.gotOauth2AccessToken = function(json){
    if(json.expires_in){
        var now = new Date().getTime();
        json.expireTime = now + (parseInt(json.expires_in) * 1000);
    }
    console.log(json);
    this.opts.callback(true, json, this.opts.service);
}

// Lastfm Auth
// Opne the auth dialog
Authorize.prototype.openLastFMAuthDialog = function(){
    var url = this.opts.userAuthorizationUrl;
    url += "?api_key="+this.opts.key;
    url += "&cb="+this.opts.callbackUrl;
    this.bindedTabListener = this.lastFMTabListener.bind(this);
    chrome.tabs.onUpdated.addListener(this.bindedTabListener);
    chrome.tabs.create(
        {
            'url': url
        }
    );
}

// lastfm 
// Listen for callback tab
Authorize.prototype.lastFMTabListener = function(tabId, obj, tab){
    var indexOf = tab.url.indexOf(this.opts.callbackUrl);
    if (indexOf === 0 && obj.status === "complete"){
        chrome.tabs.onUpdated.removeListener(this.bindedTabListener);
		var results = OAuth.decodeForm(tab.url);
		var token = results[0][1];
		this.highlightTab();
        chrome.tabs.remove(tabId);
        this.getLastFMSession(token);
	}
}

// lastfm getSession
Authorize.prototype.getLastFMSession = function(token){
    $.oauthLastfm(
        {
	        'url': this.opts.accessTokenUrl,
	        'type': 'POST',
            'cache': false,
            'data': {
        		'token': token,
        		'api_key': this.opts.key,
        		'method': 'auth.getSession'
    		},
    		consumerSecret: this.opts.secret
        }
    ).then(
        this.gotLastFMSession.bind(this),
        this.callbackError.bind(this)
    )
}

// got lastfm session
Authorize.prototype.gotLastFMSession = function(responseJSON){
    if(responseJSON.session){
        this.opts.callback(true, responseJSON, this.opts.service);
    }
    else{
        this.callbackError();
    }
}


// callback with failure
Authorize.prototype.callbackError = function(){
    this.opts.callback(false);
}

// highlight this tab after we close other tabs
Authorize.prototype.highlightTab = function(){
    chrome.tabs.getCurrent(function(tab){
	   chrome.tabs.update(tab.id, 
	       {
	           'highlighted': true
	       }
	   )
	});
}