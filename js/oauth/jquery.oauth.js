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
    var list = OAuth.getParameterList(options.data);
    var sortable = [];
    for (var p = 0; p < list.length; ++p) {
        var nvp = list[p];
        sortable.push([ nvp[0]
                          + " "
                          + nvp[1]
                          , nvp]);
    }
    sortable.sort(function(a,b) {
                      if (a[0] < b[0]) return  -1;
                      if (a[0] > b[0]) return 1;
                      return 0;
                  });
    var sorted = [];
    for (var s = 0; s < sortable.length; ++s) {
        sorted.push(sortable[s][1]);
    }
    
    var paramString = "";
    for (var p = 0; p < sorted.length; ++p) {
        var value = sorted[p][1];
        if (value == null){ 
            value = "";
        }
        paramString += sorted[p][0] + value;
    }
    paramString += options.consumerSecret;
    var apiSignature = hex_md5(paramString);
    options.data.api_sig = apiSignature;
    return $.ajax(options);
   
};

}($));

