String.prototype.hashCode = function() {
    var hash = 0, i, chr, len;
    if (this.length === 0) { return hash; }
    for (i = 0, len = this.length; i < len; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

var service = (function () {

    var _config = {
            file: "./data/config-webkit.json",
            include: chrome.runtime.getManifest().content_scripts[0]["matches"][0]
        },
        _debug = true,
        _lastTabId = -1,
        _resultTab = -1,
        _tabList = {},
        _pageList = {},
        _snapshotList = {},
        _starting = false,
        // _worker = null,
        _handlers = {

        onInitialize:  function (data) {
            chrome.tabs.query( { currentWindow: true } , initializeTabs);
        },

        onLogBackgroundLists:  function (data, _, sendResponse) {
            console.log('tabs: ', _tabList);
            console.log('snapshots: ', _snapshotList);
            console.log('pages: ', _pageList);
        },

        onPageData:  function (data, _, sendResponse) {
            var generateHash = function(data) {
                var strValue = '', 
                excludes = ['scriptCount'],
                keys = Object.keys(data),
                result = false;
                if (keys.length > 0 ) {
                    keys.forEach(function(key) {
                        var skip = excludes.indexOf(key) !== -1;
                        strValue += skip ? '' : data[key];
                    });
                    strValue = strValue.replace(/\//g, 'x').toLowerCase();
                    result = Math.abs(strValue.hashCode()).toString(16);
                }
                return result;
            },
            tabId = _.tab.id,
            hash = generateHash(data);
            console.log('onPageData : ', tabId, hash, data);
            if (hash !== false) {
                _tabList[tabId] = hash;
                if (!_pageList.hasOwnProperty(hash)) {
                    _pageList[hash] = { 'data': data, 'id': tabId, 'url': _.tab.url };
                    sendResultMessage('addPage'); // does the result page care about this???
                }
            }
        },

        onCreateSnapshot:  function (data, _, sendResponse) {
            console.log('onCreateSnapshot event');
            createSnapshot(_lastTabId);
        },

        onProcessQueue:  function (data, _, sendResponse) {
            processQueue();
        },

        onSetAlarm:  function (data) {
            resetAlarm(data);
        },

        onEventName:  function (data, _, sendResponse) {
            // do event name stuff...
        },
    },

    activeTabListener = function(info) {
        var tabId = info.tabId,
        tabExists = _tabList.hasOwnProperty(tabId),
        hasSnapshot = _snapshotList.hasOwnProperty(_tabList[tabId]),
        isResult = _resultTab === tabId;

        if (isResult) {
            processQueue();
        }
        if (tabExists) {
            _lastTabId = tabId;
            if (!hasSnapshot) {
                chrome.tabs.reload(tabId, function() {
                    createSnapshot(tabId);
                    var then = new Date();
                    setTimeout(function(e, x, m) {
                        var now = new Date();
                        console.log('then: ', then, 'now: ', now);
                    }, 10000);
                });
            }
        }
    },

    alarmListener = function(msg) {
        console.log("alarm-listener : timer expired!", msg);
        sendResultMessage('intervalEvent');
        sendMessage('intervalEvent');
        processQueue();
    },

    backgroundListener = function (msg, _, sendResponse) {
        var e = msg.event || ' ',
        name = 'on'.concat(e[0].toUpperCase(), e.slice(1)),
        handler = _handlers[name];
        if (handler) { handler(msg.data, _, sendResponse); }
    },

    createResultTab = function () {
        console.log('createResultTab : ', _config.resultUrl);
        if (_config.resultUrl) {
            chrome.tabs.create({ url: _config.resultUrl, active: false },
                function (tab) { _resultTab = tab.id; _starting = false; });
        }
    },

    createSnapshot = function(tabId) {
        if (tabId !== _resultTab) {
            chrome.tabs.captureVisibleTab(function(screenshotUrl) {
                if (chrome.runtime.lastError) { 
                    console.log('captureVisibleTab', chrome.runtime.lastError.message); 
                } else {
                    resizeThumbnail(screenshotUrl, function(dataUrl) {
                        console.log('new snapshot created!');
                        _snapshotList[_tabList[tabId]] = { 'id' : tabId, 'url': dataUrl };
                        processQueue();
                    });
                }
            });
        }
    },

    ensureResultTab = function(callback) {
        callback = callback || createResultTab;
        if (_starting) { return; } // ???
        if (_resultTab < 0) {
            _starting = true;
            callback();
        } else {
            chrome.tabs.get(_resultTab, function(tab) {
                if (chrome.runtime.lastError) { callback(); }
            });
        }
    },

    initializeTabs = function (tabs) {
        if (tabs.length) {
            loadConfig(function() {
                tabs.forEach(function(t, index) {
                    if (t.active) { _lastTabId = t.id; }
                    if ((t.url.indexOf(_config.resultUrl) !== -1) && _resultTab < 0)
                        { _resultTab = t.id; }
                });
                ensureResultTab();
                resetAlarm();
                sendMessage('initComplete');
            });
        }
    },

    loadConfig = function(callback) {
        request(chrome.extension.getURL(_config.file), function(response) {
            updateConfig(response);
            sendMessage('configLoaded', _config);
            callback();
        });
    },

    processQueue = function() {
        Object.keys(_pageList).forEach(function(key) {
            var page = _pageList[key],
            img = _snapshotList[key];
            if (img) {
                if (page.id !== img.id) {
                    console.log('Page snapshot Mismatch error');
                }
                page.data.key = key;
                page.data.thumbnail = img.url;
                // anything else we should be doing here???
                sendResultMessage('seoMetadata', page.data);
            }
        });
    },

    resetAlarm = function(interval) {
        interval = interval || (_debug ? 0.3 : 2 );
        chrome.tabs.get(_lastTabId, function(tab) {
            chrome.alarms.create(tab.url, { delayInMinutes: interval} );
        });
    },

    resizeThumbnail = function(source, cb) {
        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');
        var img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, 360, 180);
            cb(c.toDataURL("image/png"));
        };
        img.src = source;
        console.log('resizeThumbnail', source);
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

    sendResultMessage = function(event, data) {
        if (_resultTab < 0) {
            // findResultTab();
            ensureResultTab();
        } else {
            chrome.tabs.sendMessage(_resultTab, { event: event, data: data });
        }
    },

    updateConfig = function(response) {
        var include = _config.include, 
        file = _config.file;
        _config = response;
        _config['include'] = include;
        _config['file'] = file;
    },

    /*onWorkerMessage = function (data, _, sendResponse) {
        // message from worker !
        console.log('onWorkerMessage', data);
    },*/

    init = function() { /* no-op*/ };
    chrome.tabs.onActivated.addListener(activeTabListener);
    chrome.runtime.onMessage.addListener(backgroundListener);
    chrome.alarms.onAlarm.addListener(alarmListener);
    console.log('bound to: ', _config.include);
    // _worker = new Worker('js/worker.js');
    // _worker.addEventListener('message', onWorkerMessage);

    return { init: init };
}());