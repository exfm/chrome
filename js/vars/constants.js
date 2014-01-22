var constants = {
    'TUMBLR': 
        {
            'POSTS': "http://api.tumblr.com/v2/blog/",
            'DASHBOARD': "http://api.tumblr.com/v2/user/dashboard",
            'REQUEST_URL': "http://www.tumblr.com/oauth/request_token",
            'AUTHORIZE_URL': "http://www.tumblr.com/oauth/authorize",
            'ACCESS_URL': "http://www.tumblr.com/oauth/access_token",
            'LIKE_POST': "http://api.tumblr.com/v2/user/like",
            'USER_INFO': "http://api.tumblr.com/v2/user/info"
        },
    'SOUNDCLOUD':
        {
            'RESOLVE': "https://api.soundcloud.com/resolve.json",
            'USERS': "http://api.soundcloud.com/users/",
            'AUTHORIZE_URL': "https://soundcloud.com/connect",
            'AUTHORIZE_PARAMS': "&response_type=code_and_token&scope=non-expiring",
            'FAVORITE_TRACK': "https://api.soundcloud.com/me/favorites/",
            'AUTHORIZE_CALLBACK_TYPE': "hash"
        },
    "BANDCAMP_ALBUM": "http://api.bandcamp.com/api/album/2/info?",
    "BANDCAMP_ARTIST": "http://api.bandcamp.com/api/band/3/info?",
    'RDIO':
        {
            'REQUEST_URL': "http://api.rdio.com/oauth/request_token",
            'AUTHORIZE_URL': "https://www.rdio.com/oauth/authorize",
            'ACCESS_URL': "http://api.rdio.com/oauth/access_token",
            'API_URL': "http://api.rdio.com/1/",
            'PLAYLIST_NAME': "Exfm"
        },
    'LASTFM':
        {
            'AUTHORIZE_URL': "http://www.last.fm/api/auth/",
            'ACCESS_URL': "http://ws.audioscrobbler.com/2.0/?format=json",
            'API_URL': "http://ws.audioscrobbler.com/2.0/?format=json",
        },
    'SPOTIFY':
        {
            'SEARCH': "http://ws.spotify.com/search/1/track.json"
        },
    'TOMAHAWK':
        {
            'STAT': "http://localhost:60210/api/?method=stat"
        },
    'RHAPSODY':
        {
            'AUTHORIZE_URL': "https://api.rhapsody.com/oauth/authorize",
            'ACCESS_URL': "https://api.rhapsody.com/oauth/access_token",
            'AUTHORIZE_PARAMS': "&response_type=code",
            'AUTHORIZE_CALLBACK_TYPE': "param",
            'API_URL': "http://api.rhapsody.com/v1/",
            'SECURE_API_URL': "https://api.rhapsody.com/v1/",
            'PLAYLIST_NAME': "Exfm",
            'TOKEN_EXPIRED_ERROR': "keymanagement.service.access_token_expired"
        }
}