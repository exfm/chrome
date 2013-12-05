// New Rdio object
function Rdio(tab){
    this.tab = tab;
}

// Get logged in user playlists
Rdio.prototype.getPlaylists = function(oAuthObj){
   var requestUrl = constants.RDIO.API_URL; 
   var message = 
        {
			method: "post", 
			action: requestUrl, 
			parameters: {
				'method': 'getPlaylists'
			}
		}
    var requestBody = OAuth.formEncode(message.parameters);
    OAuth.completeRequest(message, 
        {
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET, 
			'token': oAuthObj['rdioAuth'].oauth_token,
            'tokenSecret': oAuthObj['rdioAuth'].oauth_token_secret
        }
    );
    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = this.response.bind(this); 
    xhr.open(message.method, requestUrl, true);
    xhr.setRequestHeader("Authorization", authorizationHeader);
    xhr.send(requestBody);
}

// response from Tumblr API
Rdio.prototype.response = function(e){
    if(e.target.readyState === 4){
        if(e.target.status === 200){
            var json = JSON.parse(e.target.response);
            console.log(json);
            //this.parse(json);
        }
    }
}

// Create Exfm playlist
Rdio.prototype.createPlaylist = function(oAuthObj){
   var requestUrl = constants.RDIO.API_URL; 
   var message = 
        {
			method: "post", 
			action: requestUrl, 
			parameters: {
				'method': 'createPlaylist',
				'name': 'Exfm',
				'description': 'Songs discovered with Exfm http://ex.fm',
				'tracks': 't2790957'
			}
		}
    var requestBody = OAuth.formEncode(message.parameters);
    OAuth.completeRequest(message, 
        {
			'consumerKey': keys.RDIO.KEY, 
			'consumerSecret': keys.RDIO.SECRET, 
			'token': oAuthObj['rdioAuth'].oauth_token,
            'tokenSecret': oAuthObj['rdioAuth'].oauth_token_secret
        }
    );
    var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = this.response.bind(this); 
    xhr.open(message.method, requestUrl, true);
    xhr.setRequestHeader("Authorization", authorizationHeader);
    xhr.send(requestBody);
}