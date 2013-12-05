var constants = {
    'TUMBLR': 
        {
            'POSTS': "http://api.tumblr.com/v2/blog/",
            'DASHBOARD': "http://api.tumblr.com/v2/user/dashboard",
            'REQUEST_URL': "http://www.tumblr.com/oauth/request_token",
            'AUTHORIZE_URL': "http://www.tumblr.com/oauth/authorize",
            'ACCESS_URL': "http://www.tumblr.com/oauth/access_token",
            'PARAMETER_TYPE': 'post'
        },
    'SOUNDCLOUD':
        {
            'RESOLVE': "https://api.soundcloud.com/resolve.json?url=",
            'USERS': "http://api.soundcloud.com/users/",
            'AUTHORIZE_URL': "https://soundcloud.com/connect"
        },
    "BANDCAMP_ALBUM": "http://api.bandcamp.com/api/album/2/info?",
    "BANDCAMP_ARTIST": "http://api.bandcamp.com/api/band/3/info?",
    'RDIO':
        {
            'REQUEST_URL': "http://api.rdio.com/oauth/request_token",
            'AUTHORIZE_URL': "https://www.rdio.com/oauth/authorize",
            'ACCESS_URL': "http://api.rdio.com/oauth/access_token",
            'PARAMETER_TYPE': 'get'
        }
}