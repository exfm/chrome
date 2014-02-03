function onAlarm(alarm){
    if(alarm.name === 'ping'){
        var ping = new Ping();
        ping.onAlarm();
    }
}

var Ping = function(){};

// ping alarm went off
// every 24 hrs
Ping.prototype.onAlarm = function(){
    this.getLastPing().then(
        function(){
            this.track();
        }.bind(this),
        function(){
            
        }
    );
}

// when did we last ping?
// if over 24hrs ping again
Ping.prototype.getLastPing = function(){
    var promise = $.Deferred();
    chrome.storage.sync.get(
        'lastPing',
        function(obj){
            if(obj['lastPing']){
                var now = new Date().getTime();
                if((now - obj['lastPing']) > 86400000){
                    promise.resolve();
                }
                else{
                    promise.reject();
                }
            }
            else{
                promise.resolve();
            }
        }.bind(this)
    )
    return promise;
}

// havent pinged in 24 hrs
// get version then send event
Ping.prototype.track = function(){
    this.getVersion().then(
        function(json){
            var version = json.version;
            this.sendEvent(version);
        }.bind(this),
        function(){
            this.sendEvent('null');
        }.bind(this)
    )
}

// ajax load manifest json file
// to get the version number
Ping.prototype.getVersion = function(){
    return $.ajax(
	    {
	        'url': '../../manifest.json',
	        'type': 'GET',
	        'dataType': 'json'
        }
    );
}

// send event to GA
Ping.prototype.sendEvent = function(version){
    this.ga = new ExtGA(
        {
            'trackingId': keys.GOOGLE_ANALYTICS.ACCOUNT,
            'trackingDns': keys.GOOGLE_ANALYTICS.DOMAIN,
            'appVersion': keys.GOOGLE_ANALYTICS.VERSION,
            'appName': keys.GOOGLE_ANALYTICS.NAME
        },
        function(){
            this.ga.event('alarm', 'ping', version, 1, true);
            var obj = 
                {
                    'lastPing': new Date().getTime()
                };
            chrome.storage.sync.set(obj);
        }.bind(this)
    );
}

// set up alarm listener
chrome.alarms.onAlarm.addListener(onAlarm);

// create alarm
// 1 min after start
// Every 6 hours
chrome.alarms.create(
    'ping',
    {
        'delayInMinutes': 1,
        'periodInMinutes': 360
    }
);