var showSeoResult = (function ($, $app) {
    var _private,
        // _template,
        _handlers = {

        onSomeEvent:  function (data) {
            console.log('someEvent happened!~');
        },
        onSeoMetadata:  function (data) {
            console.log('seoMetadata happened!~', data);
            displayGrid.add(data);
            displayGrid.render();
        },
        onFirstEvent:  function (data) {
            console.log('firstEvent happened!~');
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
            _list = [],

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
            _list.push(applyTemplate(data));
        },

        render = function() {
            for (var i = 0; i < _list.length; i++) {
                var node = _list[i];
                if (node !== undefined) {
                    if (elementCount() === _width) { 
                        appendRow(); 
                    }
                    _last.append(node);
                }
            }
        },

        init = function() {
            initTemplateMap();
            _row = $('#template #row', document).html();
            _item = $('#template #item', document).html();

            // $('.container .data.row').remove()
            var dataRows = $('.container .data.row');
            if (dataRows.length === 0)  {
                $('.container .header.row').after(_row);
                dataRows = $('.container .data.row');
            } 
            _rowCount = dataRows.length;
            _last = $(dataRows[_rowCount - 1]);
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
        // sendMessage('initialize');
        var data = {
            pageUrl: 'page url goes here',
            linkCanonical: 'canonical url goes here',
            headTitle: 'title content goes here',
            bodyH1: 'H1 content goes here',
            metaDescription: 'data from head',
            scriptCount: 7,
        };

        var i = 0;
        displayGrid.init();
        // while(i < 2) { displayGrid.add(data); i++; }
        displayGrid.render();
   
    };

    if ($app.onMessage) { 
        $app.onMessage.addListener(pageListener); 
    }

    return { init: init };
}($, chrome.runtime));
$(function() { showSeoResult.init(); });