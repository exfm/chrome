(function ($){

$.oauth = function(options) {
	//console.log('options', options);
    //var requestUrl = options.url; 
    var message = 
        {
			method: options.type || 'GET', 
			action: options.url, 
			parameters: options.data
		}
	/*
var requestBody = null;
	if(options.data){
    	requestBody = $.param(options.data);
    }
*/
    OAuth.completeRequest(message, 
        {
			'consumerKey': options.consumerKey, 
			'consumerSecret': options.consumerSecret, 
			'token': options.token,
            'tokenSecret': options.tokenSecret
        }
    );
    //var keepAllParams = options.keepAllParams || false;
    //var authorizationHeader = OAuth.getAuthorizationHeader("", options.data, keepAllParams);
    /*
var opts = this.extend(
    	{
    		'data': requestBody,
    		'beforeSend': function(x){ 
	            x.setRequestHeader("Authorization", authorizationHeader);
            },
            'cache': false,
            'processData': false,
            'contentType': 'application/json'
		},
		options
	);
*/
	return this.ajax(options);    
};

}($)); // end

