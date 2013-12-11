function GoogleAnalytics(account){
    if(account){
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
        ga('create', account);
    }
}

GoogleAnalytics.prototype.pageView = function(page){
    ga('send',
        {
            'hitType': 'pageview',
            'page': '/' + page,
            'title': page.toUpperCase()
        }
    );
    console.log('pageView', page);
}

GoogleAnalytics.prototype.event = function(category, action, label, value, nonInteraction){
    var obj = {
        'hitType': 'event',
        'eventCategory': category,
        'eventAction': action,
        'eventLabel': label,
        'eventValue': value
    }
    if(nonInteraction === true){
        obj.nonInteraction = 1;
    }
    ga('send', obj);
    console.log('event', obj);
}
