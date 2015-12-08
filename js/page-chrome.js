var config = {
    apply: function (data, cb) {
        console.log('no-op config.apply()', data);
        cb();
    }
};
var showSeo = (function ($, $app) {
    var _private,
        // _template,
        _handlers = {

        onConfigLoaded:  function (data) {
            config.apply(data, function() {
                console.log('config applied!');
                // sendMessage('setAlarm', <alarm-interval>);
            });
        },

        onInitComplete:  function (data) {
            var na = 'n/a', payload = {
                pageUrl: window.location.href, 
                scriptCount: $("script").length,
                linkCanonical: $("link[rel='stylesheet']").attr('href') || na, // cause the test site sucks!!!
                // linkCanonical: $("link[rel='canonical']").attr('href') || na,
                metaDescription: $("meta[name='description']").attr('content') || na,
                metaTitle: $("meta[name='title']").attr('content') || na,
                headTitle: $("head title").text().trim() || na,
                bodyH1: $($("h1")[0]).text().trim() || na
            };
            sendMessage('seoPayload', payload);
        },

        onIntervalEvent:  function (data) {
            // TODO: Do interval stuff here...
        },

        onTemplateLoaded:  function (data) {
        },
    },

    pageListener = function (msg, _, sendResponse) {
        var e = msg.event || ' ',
        name = 'on'.concat(e[0].toUpperCase(), e.slice(1)),
        handler = _handlers[name];
        if (handler) { handler(msg.data); }
    },

    sendMessage = function(event, data) {
        $app.sendMessage({ event: event, data: data });
    },

    init = function() {

        sendMessage('initialize');
    };

    $app.onMessage.addListener(pageListener);

    return { init: init };
}($, chrome.runtime));
$(function() { showSeo.init(); });