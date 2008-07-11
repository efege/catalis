/**
 * DatabasePanel
 *
 * TO-DO: contextual menu for the tab (here or at the TabPanel level?)
 */

Catalis.DatabasePanel = Ext.extend(Ext.Panel, {

    initComponent: function() {
    
        this.listPanel = new Catalis.ListBrowser({
            db: this.db
            ,region: 'center'
            ,margins: {top: 2}
        });
        
        this.detailPanel = new Catalis.DetailPanel({
            db: this.db
            ,region: 'south'
            ,height: 240
            ,split: true
            ,useSearchBox: true
        });
        
        this.dictPanel = new Catalis.DictionaryBrowser({
            db: this.db
            ,initialTerm: 'a'
        });
        
        this.adminPanel = new Catalis.DatabaseAdminPanel({
            db: this.db
        });
        
        this.statusPanel = new Ext.Panel({
            region: 'north'
            ,height: 60
            ,html: '<p>Estado de la base</p>'
            ,bodyStyle: 'padding: 1em'
            ,listeners: {
                render: {
                    // See also: Updater.startAutoRefresh() y Updater.setRenderer()
                    // NOTE: we don't need to update info while the database panel is not active
                    fn: function() {
                        Ext.TaskMgr.start({
                            run: function(){
                                this.statusPanel.load({
                                    url: '/catalis/db/' + this.db.name + '/'  // TO-DO: move this url pattern to Config
                                    ,params: {action: 'get_total', xhr: 1}
                                })
                            }
                            ,scope: this
                            ,interval: 60000 * 100  // milliseconds between refreshes
                            ,nocache: true
                        });
                    }
                    ,scope: this
                }    
            }
        });
        sp = this.statusPanel;  // FIXME -- delete -- this is only for debugging!
        
        this.searchHistoryPanel = new Catalis.SearchHistoryPanel({
            listPanel: this.listPanel  // scope trick -- WARNING -- should fire events
        });
        this.listPanel.searchHistoryPanel = this.searchHistoryPanel;  // FIXME -- avoid this, use events


        //this.mainPanel = center (border: listPanel + detailPanel) 
        //this.multiPanel = accordion
        //this.sidePanel = west (border: status + multipanel)
        
        Ext.apply(this, {
            layout: 'border'
            ,items: [{
                region: 'center'
                ,border: false
                ,margins: {right: 2}
                ,layout: 'border'
                ,items: [this.listPanel, this.detailPanel]
            }, {
                region: 'west'
                ,width: 222
                ,minWidth: 222
                ,maxWidth: 400
                ,split: true
                ,useSplitTips: true
                ,collapsible: true
                ,collapseMode: 'mini'
                ,border: false
                ,margins: {top: 2, left: 2}
                ,layout: 'border'
                ,items: [
                    this.statusPanel, {
                    region: 'center'
                    //,border: false
                    //,layout: 'accordion'
                    ,xtype: 'tabpanel'
                    // TO-DO: add bold to active panel's title. Ext needs a class for the active panel!
                    ,layoutConfig: {
                        //animate: true
                        //,titleCollapse: false
                        //hideCollapseTool: true
                        //activeOnTop: true
                    }
                    //,activeItem: 2   // Ext bug? Gives error "this.layout.setActiveItem is not a function"
                    // NOTE: List the items so that the activeItem appears first, at least until the activeItem problem is solved.  
                    ,items: [
                        this.dictPanel
                        ,this.searchHistoryPanel
                        ,this.adminPanel
                    ]
                    ,activeTab: 0
                    ,tabPosition: 'top'
                    /*,listeners: {
                        render: function(){
                            // FIXME -- the panel is right, but expand() has no effect
                            //console.log(this.items.get(2));
                            //this.items.get(2).expand();
                        }
                    }*/
                    // FIXME -- do not allow to have all panels collapsed; panels should not be collapsed manually
                    // Possible solution: listen to the 'beforecollapse' event; if the handler is passed a
                    // second argument === false, then the event is allowed; otherwise (a click event), the event is cancelled.
                    // Can't use the 'default: listeners' config for the items, because these panels have already been
                    // created.
                    // Try: MyAccordionPanel.items.each(function(comp){comp.on('beforecollapse', handler)})
                    /*function(panel, evt) {
                        console.log(arguments);
                        if (evt !== false) {
                            return false;
                        }
                    }*/
                }]
            }]
        });
        
        Catalis.DatabasePanel.superclass.initComponent.call(this);
    },
    
    
    // Register event handlers for inter-component communication
    initEvents: function() {
        // Call the superclass's initEvents implementation
        Catalis.DatabasePanel.superclass.initEvents.call(this);
        
        // Events in the ListPanel
        this.listPanel.screenView.on('selectionchange', this.onRecordSelected, this);
        this.listPanel.screenStore.on('load', this.onListLoad, this);
        this.listPanel.on('recordedit', this.onRecordEdit, this);
        
        // Events in the DictPanel
        this.dictPanel.view.on('selectionchange', this.onTermSelected, this);
        this.dictPanel.on('recordedit', this.onRecordEdit, this);

        // Events in the SearchHistoryPanel
        this.searchHistoryPanel.on('rowdblclick', this.onRunSearch, this);
        
        // Events in the DetailPanel
        this.detailPanel.store.on('load', this.onDetailLoad, this);
        this.detailPanel.on('recordedit', this.onRecordEdit, this); 
    },
    
    /**
     * @private
     * When a term is selected in the dictionary panel, a search is fired. 
     */
    onTermSelected: function(dataView, selections) {
        if ( !selections[0] ) {
            return;
        }
        var term = this.dictPanel.store.getAt(selections[0].viewIndex).get('Isis_Key');
        // TO-DO: the SearchForm should (perhaps) be directly available to the DatabasePanel,
        // not necessarily through the ListPanel.
        //this.listPanel.searchToolbar.loadData(term, 'any', 1);
        //this.listPanel.searchToolbar.doSubmit();
        this.listPanel.search({
            query: term
            ,query_type: 'any'
            ,from_dict: 1
        });  
    },

    /**
     * @private
     */
    onListLoad: function(store, records, options) {
    
        // When a list of records is loaded, the first record of the list is selected
        // and displayed in the DetailPanel.
        if (store.getCount() > 0) {
            this.listPanel.screenView.select(0);
        }
        
        // If this is the first page of a search, and the query is a new one, update the search history store.
        // TO-DO: when repeating an existing query, keep only the most recent and remove the previous one?
        // TO-DO: Check carefully what happens when using paging toolbar
        // TO-DO: move part of this logic to SearchHistoryPanel.
        function searchKey(record) {
            return (record.get('query') == this.query && record.get('type') == this.type); 
        }
        if (options.params.action == 'search' && options.params.start === 0) {
            var query = options.params.query;
            var query_type = options.params.query_type;
            var shp = this.searchHistoryPanel;
            if (shp.store.findBy(searchKey, {query: query, type: query_type}) == -1) {
                var totalCount = store.getTotalCount();
                shp.addSearch(query, options.params.query_type, totalCount);
            }
        }
    },
    
    /**
     * @private
     * When an item is selected in the record list, the corresponding record is displayed
     * in the DetailPanel.  
     */
    onRecordSelected: function(dataView, selections) {
        if ( !selections[0] ) {   // why this?
            return;
        }
        var recordId = this.listPanel.screenStore.getAt(selections[0].viewIndex).get('recordId');
        this.detailPanel.loadRecord(recordId);
    },
    
    /**
     * @private
     * When a record is loaded in the DetailPanel, make sure that the
     * corresponding item (if any) in the ListPanel is highlighted.
     */
    onDetailLoad: function(store, records, options) {
        var view = this.listPanel.screenView;
        var recordId = options.params.recordId;
        var index = this.listPanel.screenStore.indexOfId(recordId);
        var node = view.getNode(index);
        view.select(node, false, true);  // select() has two boolean params: keepExisting, suppressEvent
        if (node) {  // reason: sometimes there's an error "Ext.fly(node) is null".
            Ext.fly(node).scrollIntoView(view.ownerCt.body);  // TO-DO: see scrollToMember() in Ext's docs.js
        }
    },
    
    /**
     * @private
     * When the user wants to edit an existing record, these steps must be performed:
     *    - If the record is already being edited: activate the corresponding editor panel.
     *    - If each record is edited in its own editor panel: open a new editor panel, activate it, and load the record. 
     *    - If a single editor panel is used: check if it is available (no record with unsaved changes).
     *    - If the editor panel is not available: do something.
     *    - If the editor panel is available: activate the panel and load the record.
     * Loading the record involves flagging it as "locked".
     * NOTE: since this involves working with panels external to this DatabasePanel, we should move
     * this logic to a common container. 
     */
    onRecordEdit: function(recordId) {
        var editor = new Catalis.RecordEditor({db: this.db});
        editor.loadRecord(recordId);
        var tabPanel = this.ownerCt;
        tabPanel.add(editor);
        tabPanel.setActiveTab(editor);
    },
    
    /**
     * @private
     */
    onModifySearch: function(grid) {
        var selectedSearch = grid.getSelectionModel().getSelected();
        this.listPanel.searchToolbar.loadData(selectedSearch.get('query'), selectedSearch.get('type'));
        this.listPanel.searchToolbar.searchField.focus();
    },
    
    /**
     * @private
     */
    onRunSearch: function(grid) {
        this.onModifySearch(grid);
        this.listPanel.searchToolbar.doSubmit();
    }
});