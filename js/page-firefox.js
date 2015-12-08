
$events = self.port;

var veeNone = (function ($, $events) {
    var _private,
        // _template,

    onInitComplete = function() {
        config.apply({}, function() {
            console.log('config applied!');
            // setAlarm(<alarm-interval>) 
        });
    },

    onIntervalEvent = function() {
        // TODO: Do interval stuff here...
    },

    onTemplateLoaded = function(template) {
        // _template = template;
    },

    pageListener = function() {
        addListener("initComplete", onInitComplete);
        addListener("templateLoaded", onTemplateLoaded);
        addListener("intervalEvent", onIntervalEvent);
    },

    init = function() {

        sendMessage('initialize');
    };

    pageListener();

    return { init: init };
}($, self.port));
$(function() { veeNone.init(); });