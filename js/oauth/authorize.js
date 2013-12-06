function Authorize(opts){
    this.callback = opts.callback;
    this.service = opts.service;
    this.parameterType = opts.parameterType;
    this.consumer = 
        {
            'consumerKey': opts.key,
            'consumerSecret': opts.secret,
            'serviceProvider': 
                {
                    'signatureMethod': "HMAC-SHA1",
                    'requestTokenURL': opts.requestTokenUrl,
    				'userAuthorizationURL': opts.userAuthorizationURL,
    				'accessTokenURL': opts.accessTokenURL,
    				'echoURL': opts.callbackUrl,
    				'authorizeParams': opts.authorizeParams,
    			}
        }
}


// Get a request token
Authorize.prototype.requestToken = function(){
    var url = this.consumer.serviceProvider.requestTokenURL;
    var parameters = [];
    var requestBody = null;
    if(this.parameterType === 'get'){
        url += '?oauth_callback=' + this.consumer.serviceProvider.echoURL;
    };
    if(this.parameterType === 'post'){
        parameters = {
            'oauth_callback': this.consumer.serviceProvider.echoURL
        }
        requestBody = OAuth.formEncode(parameters);
    };
    var message = 
        {
            'method': "POST", 
            'action': url, 
    		'parameters': parameters
        }
    OAuth.completeRequest(message, this.consumer);
    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
	$.ajax(
	    {
	        'url': message.action,
	        'type': message.method,
	        'beforeSend': function(x){ 
	            x.setRequestHeader("Authorization", authorizationHeader);
            },
            'complete': this.gotRequestToken.bind(this),
            'cache': false,
            'data': requestBody
        }
    );
}

// Got the request token
Authorize.prototype.gotRequestToken = function(xhr){
    console.log('gotRequestToken', xhr);
    if(xhr.status === 200){
        var results = OAuth.decodeForm(xhr.responseText);
        this.oauthToken = OAuth.getParameter(results, "oauth_token");
        this.oauthTokenSecret = OAuth.getParameter(results, "oauth_token_secret");
        this.bindedTabListener = this.tabListener.bind(this);
        chrome.tabs.onUpdated.addListener(this.bindedTabListener);
        chrome.tabs.create(
            {
                'url': this.consumer.serviceProvider.userAuthorizationURL+"?oauth_token="+this.oauthToken
            }
        );
    }
    else{
        this.callback(false);
    }
}

// listen for tab changes 
// so we can figure out when 
// user authed 
Authorize.prototype.tabListener = function(tabId, obj, tab){
    var indexOf = tab.url.indexOf(this.consumer.serviceProvider.echoURL);
	if (indexOf !== -1 && obj.status === "complete"){
		chrome.tabs.onUpdated.removeListener(this.bindedTabListener);
		var results = OAuth.decodeForm(tab.url.split("?")[1]);
        this.oauthToken = OAuth.getParameter(results, "oauth_token");
        this.oauthVerifier = OAuth.getParameter(results, "oauth_verifier"),
        this.oauthVerifier = this.oauthVerifier.split('#_=_')[0];
		chrome.tabs.remove(tabId);
		this.requestAccessToken();
	}    
}

// Get an access token
Authorize.prototype.requestAccessToken = function(){
    console.log('this.oauthVerifier', this.oauthVerifier);
    var message = 
        {
		    'method': "POST", 
            'action': this.consumer.serviceProvider.accessTokenURL + '?oauth_verifier=' + this.oauthVerifier, 
            'parameters':[]
        }
    var requestBody = OAuth.formEncode(message.parameters);
    OAuth.completeRequest(
        message,
        {
            'consumerKey': this.consumer.consumerKey, 
			'consumerSecret': this.consumer.consumerSecret, 
			'token': this.oauthToken,
            'tokenSecret': this.oauthTokenSecret
        }
    );
    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
    $.ajax(
        {
            'url': message.action,
            'type': message.method,
            'beforeSend': function(x){ 
                x.setRequestHeader("Authorization", authorizationHeader); 
            }, 
            'complete': this.gotAccessToken.bind(this),
            'cache': false, 
            'data': requestBody
        }
    );
}

// Got the access token
Authorize.prototype.gotAccessToken = function(xhr){
    console.log(xhr);
    if (xhr.status == 200){
        var results = OAuth.decodeForm(xhr.responseText);
        var obj = {
            "oauth_token" : OAuth.getParameter(results, "oauth_token"),
            "oauth_token_secret" : OAuth.getParameter(results, "oauth_token_secret")
            }
        this.callback(true, obj, this.service);
    } else {
        this.callback(false);
    }
}

// Oauth 2 
// Open the auth dialog
Authorize.prototype.openAuthDialog = function(){
    var url = this.consumer.serviceProvider.userAuthorizationURL;
    url += "?client_id="+this.consumer.consumerKey;
    url += "&redirect_uri="+this.consumer.serviceProvider.echoURL;
    url += this.consumer.serviceProvider.authorizeParams;
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
    var indexOf = tab.url.indexOf(this.consumer.serviceProvider.echoURL);
    if (indexOf === 0 && obj.status === "complete"){
	    chrome.tabs.onUpdated.removeListener(this.bindedTabListener);
		var results = OAuth.decodeForm(tab.url.split("?")[1]);
        var split = results[0][1].split('#');
        var code = split[0];
        var accessToken = split[1].split('=')[1];
        console.log(code, accessToken);
        var obj = {
            "code" : code,
            "accessToken" : accessToken
            }
        this.callback(true, obj, this.service);
		chrome.tabs.remove(tabId);
	}
}