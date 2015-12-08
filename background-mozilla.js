
var service = (function () {

    var events = require("./js/events.js"),
        plates = require("./js/lib/plates.js"), // ???
        config = require("./data/config-mozilla.json"),
        options = config.contentScriptOptions,
        pageMod = require("sdk/page-mod"),
        Request = require("sdk/request").Request,
        resource = require("sdk/self").data,
        // template = resource.load(options.template),

    onInitialize = function() {
        // events.sendMessage("templateLoaded", template);
        events.sendMessage("initComplete");
    },


    alarmListener = function() {
        console.log('[background] onTimeoutExpired: ');
        events.sendMessage("intervalEvent");
    },

    backgroundListener = function(worker) {
        events.initialize(worker.port);
        events.addListener('timeoutExpired', alarmListener);
        events.addListener('initialize', onInitialize);
    },

    request = function(url, callback) {
        Request({ url: url, onComplete: callback }).get();
    },

    init = function() { /* no-op */ };

    config['onAttach'] = backgroundListener;
    pageMod.PageMod(config);
    console.log('bound to: ', config.include);

    return { init: init };
}());