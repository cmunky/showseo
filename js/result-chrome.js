
var showSeoResult = (function ($, $app) {
    var _private,
        _handlers = {

        onAddPage:  function (data) {
            console.log('add page happened!~', data);
            sendMessage('createSnapshot');
        },
        onIntervalEvent:  function (data) {
            console.log('interval event happened!~', data);
            sendMessage('processQueue');
        },
        onSeoMetadata:  function (data) {
            console.log('seoMetadata happened!~', data);
            if (Object.keys(data).length > 0) {
                displayGrid.add(data);
            }
        },
    },
    // nested object
    displayGrid = (function ($) {
        var _private,
            _map,
            _row,
            _item,
            _rowCount = -1,
            _width = 3, 
            _hash = {},

        applyTemplate = function(data) { 
            return Plates.bind(_item, data, _map);
        },

        appendRow = function() {
            _last.after(_row);
            _rowCount++;
            var dataRows = $('.container .data.row');
            _last = $(dataRows[_rowCount - 1]);
        },

        elementCount = function() {
            return _last.children().length;
        },

        initTemplateMap = function() {
            _map.where('src').has('#pageUrl').insert('pageUrl');
            _map.where('src').has('#thumbnail').insert('thumbnail');
            _map.where('href').is('#').insert('pageUrl');
            _map.where('class').is('page-url').use('pageUrl');
            _map.where('id').is('headTitle').use('headTitle');
            _map.where('id').is('linkCanonical').use('linkCanonical');
            _map.where('id').is('metaName').use('metaName');
            _map.where('id').is('bodyH1').use('bodyH1');
            _map.where('id').is('metaDescription').use('metaDescription');
            _map.where('id').is('scriptCount').use('scriptCount');
        },

        add = function(data) {
            if (!_hash.hasOwnProperty(data.key)) {
                var node = applyTemplate(data);
                _hash[data.key] = node;
                if (elementCount() === _width) {
                    appendRow();
                }
                _last.append(node);
            }
        },

        render = function() {
            Object.keys(_hash).forEach(function(key) {
                var node = _hash[key];
                if (node !== undefined) {
                    if (elementCount() === _width) {
                        appendRow();
                    }
                    _last.append(node);
                }
            });
        },

        getDataRows = function() {
            var result = $('.container .data.row');
            if (result.length === 0)  {
                $('.container .header.row').after(_row);
                result = $('.container .data.row');
            }
            return result;
        },

        clearGrid = function() {
            $('.container .data.row').remove();
            initGrid();
        },

        initGrid = function() {
            var dataRows = getDataRows();
            _rowCount = dataRows.length;
            _last = $(dataRows[_rowCount - 1]);
        },

        init = function() {
            initTemplateMap();
            _row = $('#template #row', document).html();
            _item = $('#template #item', document).html();

            $('#b_one').on('click', function(e, x, m) {
                sendMessage('logBackgroundLists');
            });
            $('#b_two').on('click', function(e, x, m) {
                sendMessage('processQueue');
            });
            initGrid();
        };

        _map = Plates.Map();

         return { 
            add: add,
            render: render,
            init: init 
         };

    }($)),

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
        displayGrid.init();
        displayGrid.render();
        sendMessage('processQueue');
    };

    if ($app.onMessage) { 
        $app.onMessage.addListener(pageListener); 
    }

    return { init: init };
}($, chrome.runtime));
$(function() { showSeoResult.init(); });