# Exfm Chrome Extension

An extension for Chrome that inserts a music player on [Tumblr](http://tumblr.com), [Soundcloud](https://soundcloud.com), [Bandcamp](http://bandcamp.com) and any site with MP3 files on it. In addition to offering music playback, it also offers the ability to like songs on Tumblr, like songs on Soundcloud, buy songs on Bandcamp, save songs to a playlist on [Rdio](http://rdio.com), open songs in [Spotify](http://spotify.com) and open songs in [Tomahawk](http://www.tomahawk-player.org/)

## Installation

Download the source and have a look at the [Chrome extension docs](http://developer.chrome.com/extensions/api_index.html)
    
## Keys

You'll need to add a keys.js file to the js/vars dir with your own oAuth keys. This file should look like this:
```javascript
        var keys = {
            'TUMBLR':
                {
                    'KEY': "[Your Tumblr Consumer Key]",
                    'SECRET': "[Your Tumblr Consumer Secret]",
                    'OAUTH_CALLBACK': "[Your Tumblr callback Url]"
                },
            'SOUNDCLOUD':
                {
                    'KEY': "[Your Soundcloud Consumer Key]",
                    'SECRET': "[Your Soundcloud Consumer Secret]",
                    'OAUTH_CALLBACK': "[Your Soundcloud callback Url]"
                },
            "BANDCAMP_KEY": "[Your Bandcamp Key]",
            'RDIO': 
                {
                    'KEY': "[Your Rdio Consumer Key]",
                    'SECRET': "[Your Rdio Consumer Secret]",
                    'OAUTH_CALLBACK': "[Your Rdio callback Url]"
                },
            'LASTFM':
                {
                    'KEY': "[Your Last.fm Consumer Key]",
                    'SECRET': "[Your Last.fm Consumer Secret]",
                    'OAUTH_CALLBACK': "[Your Last.fm callback Url]"
                },
            'GOOGLE_ANALYTICS':
                {
                    'ACCOUNT': "[Your Google Analytics account]",
                    'DOMAIN': "[Your Google Analytics domain]",
                    'VERSION': "[Your Google Analytics version (could be anything)]",
                    'NAME': "[Your Google Analytics account name]"
                }
        }


