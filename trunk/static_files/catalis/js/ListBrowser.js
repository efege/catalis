/**
 * This is a summary of the situation:
 *
 *       +------------------------------------------------------+
 *       | Search form: controls what to display                |
 *       +------------------------------------------------------+
 *       | List header: informs what's being displayed          | <--+
 *       +------------------------------------------------------+    |----- which one on top? (use config option)
 *       | Results toolbar: controls what to do with the data   | <--+
 *       +------------------------------------------------------+
 *       |                                                      |
 *       | DataView: the list of records                        |
 *       |                                                      |
 *       |                                                      |
 *       |                                                      |
 *       |                                                      |
 *       |                                                      |
 *       |                                                      |
 *       |                                                      |
 *       +------------------------------------------------------+
 *       | Results toolbar at the bottom? Use config option     |
 *       +------------------------------------------------------+
 *
 *    ListPanel
 *         UI
 *             Search Form (toolbar or panel?) -- should be a Panel, though it could be a body-less, toolbar-only panel, living
 *                 just above the ListPanel.
 *                 SearchField + search type combo + buttons (search history?, latest records)
 *             List Header (a text-only panel? No, better a real header for the List Panel)
 *             Results Toolbar (PagingToolbar + sort menu + save results button) -- several possible locations
 *                 Save Records (wizard)
 *             DataView (the list of records)
 *                 Template(s)
 *
 *         DATA
 *             Screen Store (list of records)
 *             History Store (list of past searches)
 *             Search types (static)
 *             Sort options (static)
 *
 *         ("static" means not associated to a specific instance; a single shared instance is enough)
 */



/**
 *
 */
Catalis.ListBrowser = Ext.extend(Ext.Panel, {

    text: {
        // Search types
        type_any: 'any field'
        ,type_title: 'titles'
        ,type_name: 'names'
        ,type_subj: 'subjects'
        ,type_note: 'notes'
        ,type_sn: 'ISBN / ISSN'
        ,type_inv: 'accession no.'
        ,type_free: 'free search'
        
        ,listEmpty: '<p style="padding: 1em;">No records found</p>'
        
        // List header
        ,manyResults: '<b>{0}</b> results for'
        ,oneResult: 'Only <b>1</b> result for'
        ,zeroResults: '<b>No results</b> for'
        ,searchExpression: '<b>{0}</b> (in <b>{1}</b>)'
        ,recordList: '<b>All records</b>, most recent first'
        ,sortedBy: 'sorted by <b>{0}</b>'
        
        // sort
        ,sortBy: 'Sort by'
        ,pub_date: 'pub. date'
        ,main_entry: 'main entry'
        ,title: 'title'
        ,call_number: 'call number'
        ,mod_date: 'modification date'
        
        ,printHeader: 'Results for'
    },
    
    pageSize: 20,
    
    // Position for the results toolbar. Options: 'above-header', 'below-header', 'bottom'.
    // 'above-header' seems a good default, so that both toolbars appear together.
    // 'below-header' is also good, since it may be read as "these are the results for your search;
    // and these are the things you can do with these results."
    toolbarPosition: 'below-header',
    
    // Default sort for the results of a search.
    // FIXME -- depends on db.type 
    defaultSort: 'main_entry',
    
    searchTypes: {
        biblio: ['any', 'title', 'name', 'subj', 'note', 'sn', 'inv', 'free'],
        auto: ['any', 'name', 'note', 'free']
    },

    initComponent: function() {
    
        // Sort options. Used in a menu in the paging toolbar, and also (in textual form) in
        // the list header.
        // TO-DO: use a single shared store, as in search types?
        // NOTE: the store can only be sorted by properties (fields) defined for its records.
        this.sortOptions = {
            'main_entry': this.text.main_entry
            ,'title': this.text.title
            ,'pub_date': this.text.pub_date
            ,'call_number': this.text.call_number
            ,'mod_date': this.text.mod_date
            //,'author': this.text.author
        };
        
        var stData = [];
        Ext.each(this.searchTypes[this.db.type], function(t) {
            stData.push([t, this.text['type_' + t]]);
        }, this);
        this.searchTypeStore = new Ext.data.SimpleStore({
            fields: ['name', 'display'],
            //expandData: true,
            data: stData,
            id: 0
        });
        
        // fields in a data Record
        var recordStructure = {
            biblio: [
                 {name: 'recordId'}
                ,{name: 'createdBy'}
                ,{name: 'main_entry'}
                ,{name: 'title'}
                ,{name: 'resp'}
                ,{name: 'edition'}
                ,{name: 'pub_date'}
                ,{name: 'location'}
                ,{name: 'call_number'}
                ,{name: 'mod_date'}
            ],
            auto: [
                 {name: 'recordId'}
                ,{name: 'heading'}
                ,{name: 'mod_date'}
            ]
        };
        
        // Prepare data for DataViews (biblio).
        // This function does some clean up of the raw data sent by the server, and applies highlighting.
        // FIXME -- highlight more fields?
        // FIXME -- when searching by specific fields, each key is returned as "tag key", e.g. "9204 FLOW"
        // FIXME -- ignore accents :-(
        function prepareData(data) {
            var hl = '<span class="hl">$1</span>';
            var keys = this.store.reader.jsonData.hl_keys;
            // if we don't have keys then no highlighting is applied
            var kre = keys ? new RegExp('\\b(' + keys.join('|') + ')\\b', 'gi') : '___some_dummy_string___';
            
            data.main_entry = data.main_entry.replace(/\^\w/g,' ').replace(kre, hl);
            data.title = data.title.replace(/ \/$/,'');
            data.resp = (data.resp) ? '/ ' + data.resp : '';
            data.location = data.location.tag == '856' ? data.location.url : data.location.classNo + '<br>' + data.location.itemNo;
            
            return data;
        }
    
        var reader = new Ext.data.JsonReader({
                root: 'records',
                totalProperty: 'total',
                id: 'recordId'
            },
            // recordStructure depends on the type of database
            Ext.data.Record.create(recordStructure[this.db.type])
        );

        // TO-DO: find how to merge both templates (print & screen)
        // TO-DO: add tooltips to buttons
        // TO-DO: store these templates in a separate file/module, so that they are more easily maintained/modified?
        // FIXME --  Ext.Button.buttonTemplate.html is not always available.
        // Looking at the source (Button.js) we see the reason:
        // Ext.Button.buttonTemplate does not exist before the first Ext.Button instance is *rendered*.
        // So, to avoid the need to create a dummy invisible button, we could explicitly define Ext.Button.buttonTemplate
        // in our code, *before* rendering the list of records. 
        var tableWidth = Ext.isIE ? '' : ' style="width: 99.99%"';  // TO-DO: find an acceptable width to prevent h-scrollbar in IE
        var btnTemplate = Ext.Button.buttonTemplate ? Ext.Button.buttonTemplate.html.replace('{0}', '{recordId}') : '{recordId}';
        var screenTemplate = new Ext.XTemplate(
            '<table id="record-list-container" cellspacing="0"' + tableWidth + '>',
                '<tpl for=".">',
                    '<tr class="brief-record">',
                        //'<td class="brief-recordId"><div id="btn-container-{recordId}"></div>{createdBy}</td>',
                        '<td class="brief-recordId"><div id="btn-container-{recordId}" class="x-btn">' + btnTemplate + '</div>{createdBy}</td>',
                        '<td class="brief-main-cell">',
                            '<div class="brief-main-entry">{main_entry}</div>',
                            '<div class="brief-description">',
                                '<a href="#"><b>{title}</b></a>',
                                '<tpl if="resp">',
                                    ' {resp}',
                                '</tpl>',
                                '<tpl if="edition">',
                                    ' &mdash; {edition}',
                                '</tpl>',
                            '</div>',
                            /* Modificación en base a una sugerencia de R. Mansilla 
                            '<div style="margin-left: 1em; font-style: italic; color: #999; border-top: 1px solid #DDD; padding-top: 0.1em;">',
                                '{recordId} &middot; {createdBy} &middot; <a href="#">Editar</a>',
                                //'<span id="btn-container-{recordId}" class="x-btn">' + Ext.Button.buttonTemplate.html.replace('{0}', '{recordId}') + '</span>',
                            '</div>',
                            */
                        '</td>',
                        '<td class="brief-date">{pub_date}</td>',
                        '<td class="brief-location">{location}</td>',
                    '</tr>',
                '</tpl>',
            '</table>'
        );
        screenTemplate.compile();
        
        this.screenStore = new Ext.data.Store({
            proxy: this.db.proxy
            ,baseParams: {
                format: 'brief'
                ,limit: this.pageSize
            }
            ,reader: reader
            ,remoteSort: true
            ,listeners: {
                beforeload: {
                    fn: this.onBeforeListLoad,
                    scope: this
                }
                ,load: {
                    fn: this.onListLoad,
                    scope: this
                }
                ,loadexception: Ext.emptyFn // FIXME
            }
        });
        
        var printTemplate = new Ext.XTemplate(
            '<table class="brief-record" cellspacing="0">',
                '<tpl for=".">',
                    '<tr>',
                        '<td class="brief-recordId">{recordId}</td>',
                        '<td>',
                            '<div class="brief-main-entry">{main_entry}</div>',
                            '<div class="brief-description">{title} {resp}</div>',
                        '</td>',
                        '<td class="brief-date">{pub_date}</td>',
                        '<td class="brief-location">{location}</td>',
                    '</tr>',
                '</tpl>',
            '</table>'
        );
        printTemplate.compile();
        
        // TO-DO: complete this
        this.printStore = new Ext.data.Store({
            proxy: this.db.proxy
            ,reader: reader
			,remoteSort: true
            ,listeners: {
                load: {
                    fn: this.printList
                    ,scope: this
                }
			}
        });
        
        
        /*this.historyStore = new Ext.data.SimpleStore({
            data: [],
            fields: ['query', 'hits']
        });*/
        
        /*this.historyCombo = new Catalis.HistoryCombo({
            store: this.historyStore
            ,listeners: {
                specialkey: {
                    fn: function(field, evt) {
                        if (evt.getKey() == evt.ENTER) {
                            var query = field.getValue();
                            this.search(query);
                        }
                    },
                    scope: this
                }
                //,beforequery: function(queryEvent){  // BUG in Ext? this makes all the <tr> appear as one!
                //    queryEvent.forceAll = true;
                //}
            }
        });*/
        
        this.searchToolbar = new Catalis.SearchForm({
            listPanel: this  // scope trick
        });
        
        this.resultsToolbar = new Catalis.ResultsToolbar({
            store: this.screenStore
            ,pageSize: this.pageSize
            ,listPanel: this // scope trick
            ,cls: 'catalis-list-paging-toolbar'  // to fix a border issue
        });
                
        this.screenView = new Ext.DataView({
            store: this.screenStore
            ,tpl: screenTemplate
            ,overClass: 'x-view-over'
            ,itemSelector: 'tr.brief-record'  // we are interested in selecting table rows. TO-DO: select using title only?
            ,singleSelect: true  // needed to activate selection highlighting
            ,prepareData: prepareData  // prepareData depends on the type of database
            ,emptyText: this.text.listEmpty
        });
        
		if (!document.getElementById('printContainer')) {
			Ext.DomHelper.append(Ext.getBody(), {
			    id: 'printContainer'
			    ,tag: 'div'
			    ,cls: 'x-hidden'
			    ,children: [
			        {tag: 'h1', id: 'printHeader'},
			        {tag: 'div', id: 'printBody'}
			    ]
			});
		}
        this.printView = new Ext.DataView({
            store: this.printStore
            ,tpl: printTemplate
            ,renderTo: 'printBody'
            ,itemSelector: 'table'  // required in Ext 2
            ,prepareData: prepareData
        });
        
        Ext.apply(this, {
            autoScroll: true
            ,tbar: this.searchToolbar  // the results toolbar is added using onRender (see below)
            ,items: [this.screenView]
        });
        
        // For the other options, see onRender below
        if (this.toolbarPosition == 'bottom') {
            this.bbar = this.resultsToolbar
        }
        
        Catalis.ListBrowser.superclass.initComponent.call(this);

        this.addEvents(
            'recordedit'  // ???
        );
        
    },  // end of initComponent
    
    
    onRender: function() {

        Catalis.ListBrowser.superclass.onRender.apply(this, arguments); // but not .call(this)
        
        // FIXME -- why use a new Panel? We can simply use the ListPanel's header, and place it below
        // the panel's top toolbar (find out how, perhaps using .render() )
        this.listHeader = new Ext.Panel({
            title: '&nbsp;'  // dummy title used to reserve vertical space
            ,cls: 'catalis-list-header'
            // TO-DO: quitar el border-top de la .x-toolbar correspondiente a la PagingToolbar
            // (es un borde extra que aparece al usar el listHeader)
            // Does it look good when using the default background and spanning more than one line (long search expression)?
        });

        // Trick to render extra toolbars (or other elements contained in this.tbar).
        // See http://extjs.com/forum/showthread.php?p=57883
        // For a different approach, based on nested panels, see: http://extjs.com/forum/showthread.php?t=36497
        
        if (this.toolbarPosition == 'above-header') {
            this.resultsToolbar.render(this.tbar);
            this.listHeader.render(this.tbar);
        } else {
            this.listHeader.render(this.tbar);
            this.resultsToolbar.render(this.tbar);
        }
        
        //this.syncSize(); // suggested in the forum
        // NOTE -- adding listHeader hides the lower part of the panel's scrollbar.
        // this.syncSize() does not solve it.
        // this.doLayout() does not solve it.
        // It was fixed somehow... don't know how
        
    },  // end of onRender
    
    /**
     * @private
     *
     * This method must allow loading the panel with records from a search or a mfnrange.
     *
     * We may directly expose the store's load() method, or we may simplify its interface,
     * using simpler parameters. For example:
     * listPanel.loadData({action: 'search', query: 'some query'})
     * listPanel.loadData({action: 'do_list', newrecs: 1})
     *
     * FIXME -- the parameter 'newrecs' should not stay in baseParams for future requests!
     * FIXME -- handle correctly the parameter 'from_dict' 
     */
    loadData: function(moreParams) {
        //this.screenStore.baseParams.format = 'brief';       // TO-DO: make this
        Ext.apply(this.screenStore.baseParams, moreParams);   // cleaner
        
        // FIXME -- add biblio/auto options
        this.screenStore.setDefaultSort(this.defaultSort);  // need some default, otherwise the last used sort option is applied
        this.screenStore.load({
            params: { start: 0 }
        });
    },
    
    /**
     *
     */
    showNewRecords: function() {
        this.loadData({
            action: 'do_list',
            newrecs: 1
        });
    },
    
    /**
     * @param {Object} params An object with search parameters: query, query_type, from_dict.
     */
    search: function(params) {
        Ext.apply(params, {action: 'search'});
        this.loadData(params);
    },
    
    // @private
    onBeforeListLoad: function(store, options) {
        //console.log(options.params, options.params.action, store.baseParams);  // options.params.action is undefined!!
        // FIXME -- query_type
        if (store.baseParams.action == 'search' && store.baseParams.from_dict != 1) {
            store.baseParams.query_type = this.searchToolbar.searchTypeCombo.getValue();
            //store.baseParams.from_dict = this.searchToolbar.hiddenField.getValue();
        }
    },
    
    // @private
    // TO-DO: organize according to element being updated:
    //    - update search form (?)
    //    - update list header
    //    - update results toolbar
    onListLoad: function(store, records, options) {
        if (this.body) {  // because sometimes the store is loaded *before* the component is rendered
            this.body.scrollTo('top', 0);
        }
        
        var action = options.params.action;
        var totalCount = store.getTotalCount();
        
        // Disable / enable some elements
        // TO-DO: use public methods of resultsToolbar?
        // FIXME -- throws error "this.resultsToolbar.saveBtn has no properties" when toolbar has not been rendered
        // (e.g. inside a hidden Ext.Window or tab). To fix this, the list should not be loaded until the container
        // has been rendered.
        this.resultsToolbar.printBtn.setDisabled(totalCount == 0 || action != 'search');
        this.resultsToolbar.saveBtn.setDisabled(totalCount == 0 || action != 'search');
        this.resultsToolbar.sortByBtn.setDisabled(totalCount < 2 || action != 'search');
        
        // TO-DO: reset search form if action != 'search'?
        
        if (action == 'search') {
        
            var query = options.params.query;
            var headerText = '';
            //var searchType = Catalis.ListBrowser.searchTypes[this.db.type].getById(options.params.query_type).get('display');
            var searchType = this.searchTypeStore.getById(options.params.query_type).get('display');
            switch (totalCount) {
                case 0:
                    headerText = this.text.zeroResults;
                    break;
                case 1:
                    headerText = this.text.oneResult;
                    break;
                default:  // many results
                    headerText = String.format(this.text.manyResults, totalCount);
                    break;
            }
            headerText += ' ' + String.format(this.text.searchExpression, query, searchType);
            if (totalCount > 1) {
                headerText += ', ' + String.format(this.text.sortedBy, this.text[options.params.sort] || '...');
            }
            
        } else if (action == 'do_list') {
            headerText = this.text.recordList;
        }
        
        //this.listHeader.body.update(headerText);  // if using Panel's body
        this.listHeader.setTitle(headerText);  // if using a Panel's header
    },
    
    /**
     * Opens a popup window with the list of records.
     *
     * NOTE: There's an extension for making printer-friendly pages, Ext.ux.PrinterFriendly.
     * See http://extjs.com/forum/showthread.php?p=148443#post148443
     */
    printList: function(store) {
        var dbName = this.db.name;
        var listTitle = this.listHeader.title;
        Ext.get('printHeader').update('Base de datos: ' + dbName + '<br>' + listTitle);  // TO-DO: use a template and fill it with data
		var printURL = Config.HTDOCS + 'catalis/html/printRecords.html';
		var w = screen.width * 0.85;
		var h = screen.height * 0.60;
		// ATENCION: en la línea que sigue, uso ":" porque en IE6 no funciona con "=" (??)
		var properties = "width=" + w + ", height=" + h + ", toolbar=yes, scrollbars=yes, resizable=yes, menubar=yes";
		// FIXME - Esto dejó de andar en FF/Win en casa, anda bien en FF/Linux en UNS. 2007-11-14
		var printWin = window.open(printURL, 'printWin', properties);
		try {
			printWin.focus();
		} catch (err) {}
	},
    
    emailList: function() {
        Ext.Msg.alert("email");
    },
    
    downloadList: function() {
        Ext.Msg.alert("download");
    },
    
    // FIXME -- beforeload must not read the current values in search type combo!
    // FIXME -- sorting while on a page > 1 should load page 1 again
    // TO-DO: show a check mark in the corresponding item in the sort menu
    sortList: function(sortBy) {
        this.screenStore.sort(sortBy);
    }

});


// Moved 2008-07-01 because texts must be assigned *after* the locale file is loaded.
/*Catalis.ListBrowser.searchTypes = {

    biblio: new Ext.data.SimpleStore({
        fields: ['name', 'display'],
        //expandData: true,
        data: [
            ['any', Catalis.ListBrowser.prototype.text.type_any],
            ['title', Catalis.ListBrowser.prototype.text.type_title],
            ['name', Catalis.ListBrowser.prototype.text.type_name],
            ['subj', Catalis.ListBrowser.prototype.text.type_subj],
            ['note', Catalis.ListBrowser.prototype.text.type_note],
            ['sn', Catalis.ListBrowser.prototype.text.type_sn],
            ['inv', Catalis.ListBrowser.prototype.text.type_inv],
            ['free', Catalis.ListBrowser.prototype.text.type_free]
        ],
        id: 0
    }),
    
    auto: new Ext.data.SimpleStore({
        fields: ['name', 'display'],
        //expandData: true,
        data: [
            ['any', Catalis.ListBrowser.prototype.text.type_any],
            ['title', Catalis.ListBrowser.prototype.text.type_title],
            ['name', Catalis.ListBrowser.prototype.text.type_name],
            ['subj', Catalis.ListBrowser.prototype.text.type_subj],
            ['note', Catalis.ListBrowser.prototype.text.type_note],
            ['free', Catalis.ListBrowser.prototype.text.type_free]
        ],
        id: 0
    })
};*/

// ???
Catalis.ListBrowser.sortTypes = {}