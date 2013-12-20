function ExportPage(){
    this.ga = new ExtGA(
        {
            'trackingId': keys.GOOGLE_ANALYTICS.ACCOUNT,
            'trackingDns': keys.GOOGLE_ANALYTICS.DOMAIN,
            'appVersion': keys.GOOGLE_ANALYTICS.VERSION,
            'appName': keys.GOOGLE_ANALYTICS.NAME
        },
        function(){
            this.ga.pageview('export', 'Export');
        }.bind(this)
    );
}

function init(){
    var exportPage = new ExportPage();
}

$(document).ready(init);