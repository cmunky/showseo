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
            sendMessage('pageData', extractPageData());
        },

        onIntervalEvent:  function (data) {
            sendMessage('pageData', extractPageData());
            // TODO: Do interval stuff here...
        },
    },

    onWindowLoad = function(e) {
        sendMessage('pageData', extractPageData());
    },

    extractPageData = function () {
        // Should come from config, but the event timing was inconsistent...,
        // Need to look at the event model and work to make the async work properly
        config.rules = {
            'pageUrl': { sel: null, ref: 'window.location.href' },
            'scriptCount': { sel: "script", len: true },
            'linkCanonical': { sel: "link[rel='stylesheet']", attr: "href" }, // cause the test site sucks
            // 'linkCanonical': { sel: "link[rel='canonical']", attr: "href" },
            'metaDescription': { sel: "meta[name='description']", attr: "content"},
            'metaTitle': { sel: "meta[name='title']", attr: "content"},
            'headTitle': { sel: "head title", txt: true},
            'bodyH1': { sel: "h1", txt: true}
        };
        var result = {};
        if (config.rules) {
            Object.keys(config.rules).forEach(function(key) {
                var calc = null,
                obj = config.rules[key], 
                select = obj['sel'];
                if (select) {
                    var node = $(select);
                    if (obj.len) {
                        calc = node.length;
                    }
                    if (obj.attr) {
                        calc = node.attr(obj.attr);
                    }
                    if (obj.txt) {
                        calc = node.text();
                    }
                } else {
                    calc = eval(obj.ref);
                }
                result[key] = calc || 'n/a';
            });
        }
        return result;
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
    window.onload = onWindowLoad;

    return { init: init };
}($, chrome.runtime));
$(function() { showSeo.init(); });