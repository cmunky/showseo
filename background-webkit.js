
var service = (function () {

    var _config = {
            file: "./data/config-webkit.json",
            include: chrome.runtime.getManifest().content_scripts[0]["matches"][0]
        },
        _lastTabId = -1,
        _resultTab = -1, 
        _self, 
        _handlers = {

        onSeoPayload:  function (data) {
            console.log('onSeoPayload', data);
            if (_resultTab !== -1) {
                chrome.tabs.sendMessage(_resultTab, { event: 'seoMetadata', data: data });
            }
            // forward data to results page
        },

        onInitialize:  function (data) {
            // var queryParams = { active: true, currentWindow: true};
            // { windowId: windows.WINDOW_ID_CURRENT }
            var queryParams = { currentWindow: true};
            chrome.tabs.query( queryParams , onTabQuery);
        },

        /*onSetAlarm:  function (data) {
            var timeout = data || 10; // minutes
            chrome.alarms.create( { delayInMinutes: timeout } );            
        },*/
    },

    onTabQuery = function (tabs) {
        if (tabs.length) {
            var resultUrl = 'data/template.html', isResultTab = false;
            for (var i = tabs.length - 1; i >= 0; i--) {
                isResultTab = tabs[i].url.indexOf(resultUrl) !== -1;
                if (tabs[i].active) {
                    _lastTabId = tabs[i].id;
                }
                if (isResultTab && (_resultTab < 0)) {
                    _resultTab = tabs[i].id;
                }
            }
            loadResources();
            sendMessage('initComplete');
        }            
    }, 
    alarmListener = function(msg) {
        console.log("tab references", _lastTabId, _resultTab);
        console.log("alarm-listener : timer expired!", msg);
        if (_resultTab !== -1) {
            chrome.tabs.sendMessage(_resultTab, { event: 'someEvent', data: { stuff: "goes", here: true } });
        }
        sendMessage('intervalEvent');
    },

    backgroundListener = function (msg, _, sendResponse) {
        var e = msg.event || ' ',
        name = 'on'.concat(e[0].toUpperCase(), e.slice(1)),
        handler = _handlers[name];
        if (handler) { handler(msg.data); }
    },

    onTabCreate = function (tab) {
        console.log('onTabCreate', tab);
        _resultTab = tab.id;
        chrome.tabs.sendMessage(_resultTab, { event: 'firstEvent', data: { stuff: "goes", here: true } });
    },

    findResultTab = function(callback) {
        if (_resultTab < 0) {            
            chrome.tabs.create({url: "data/template.html"}, onTabCreate);
        }
    },

    loadResources = function(callback) {
        request(chrome.extension.getURL(_config.file), function(response) {
            updateConfig(response);
            sendMessage('configLoaded', _config);

            findResultTab();

            chrome.tabs.get(_lastTabId, function(tab) {
                _self = tab;
                chrome.alarms.create(tab.url, { delayInMinutes: 0.3 } );                
            });
            
            /*request(chrome.extension.getURL(_config.template), function(response) {
                sendMessage('templateLoaded', response); }, 'html');*/
        });
    },

    request = function(url, callback, format) {
        format = format || 'json';
        $.get(url, callback, format);
    },

    sendMessage = function(event, data) {
        if (_lastTabId < 0) {
            _handlers.onInitialize();
        } else {
            chrome.tabs.sendMessage(_lastTabId, { event: event, data: data });
        }
    },

    updateConfig = function(response) {
        var include = _config.include, 
        file = _config.file;
        _config = response;
        _config['include'] = include;
        _config['file'] = file;
    },

    init = function() { /* no-op*/ };

    chrome.runtime.onMessage.addListener(backgroundListener);
    chrome.alarms.onAlarm.addListener(alarmListener);
    console.log('bound to: ', _config.include);

    return { init: init };
}());