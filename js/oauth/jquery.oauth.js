(function ($){

$.oauth = function(options) {
	var message = 
        {
			method: options.type || 'GET', 
			action: options.url, 
			parameters: options.data || {}
		}
	OAuth.completeRequest(message, 
        {
			'consumerKey': options.consumerKey, 
			'consumerSecret': options.consumerSecret, 
			'token': options.token,
            'tokenSecret': options.tokenSecret
        }
    );
    return this.ajax(options);    
};

}($));

(function ($){

$.oauthLastfm = function(options) {
    var paramString = OAuth.SignatureMethod.normalizeParameters(options.data);
    var apiSignature = hex_md5(paramString);
    options.data.api_sig = apiSignature;
    return $.ajax(options);    
};

}($));

