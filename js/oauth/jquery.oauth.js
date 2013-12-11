(function ($){

$.oauth = function(options) {
	var message = 
        {
			method: options.type || 'GET', 
			action: options.url, 
			parameters: options.data
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

