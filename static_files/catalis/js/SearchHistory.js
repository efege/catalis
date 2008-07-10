/**
 * Catalis.SearchHistory component.
 *
 * Problem: if we use an Ext.Window, we must bind it somehow to its original tab.
 * Possible solutions:
 *    - make the Window modal
 *    - use a listener that hides the Window whenever its parent tab is deactivated,
 *      and restores the Window's state (shown/hidden) when the tab is activated.
 *
 * To get the "right" look for the Window, check the Grid Window in this example:
 * http://extjs.com/deploy/dev/examples/desktop/desktop.html
 * (we still have a missing toolbar border).
 * 
 * Other possible layouts:
 *    - A "floating" grid panel, shown and hidden using a toggle button. See the
 *      "floating" boolean config option. Same problem as Window?
 *    - An "horizontal panel", close to the ListPanel or search form (probably more
 *      associated to the search form)
 *    - A "vertical panel", or side panel, at the same level of DictPanel. In this
 *      case, we should use a DataView more like a "narrow list".
 *      THIS IS A VERY GOOD OPTION! Implemented 2008-06-12 
 *
 * Selected rows: Should remember selected rows on hide/show?
 * Always select first row by default?
 * Disable toolbar buttons when rows are deselected
 * Allow multiple selection? 
 *
 * Set a limit for the store size?
 *
 * TO-DO: CSS for searches with 0 hits
 *
 * Add extra params (columns)? db, user, session (current, past), DSI, ...
 * 
 * Add a filter box for the grid?
 *
 * Apply the options of the "Save results" menu directly to an item in the history,
 * without redoing the search? Probably not.
 *
 * Render the "type" column using language dependent text.
 *
 * Should we use a single global search history store? This could be useful if the user wants
 * to repeat on a database some searches done originally on another database.
 *
 * FIXME -- redoing a search from a long dictionary term (full field) is not working (from_dict is 0)  
 */
 
Catalis.SearchHistoryPanel = Ext.extend(Ext.grid.GridPanel, {
    
    text: {
        searchHistory: 'History'
        ,date: 'Time'
        ,query: 'Query'
        ,queryType: 'Type'
        ,hits: '#'  //'Total'
        ,emptyHistory: 'There are no searches.'
        ,runSearch: 'Run'
        ,modifySearch: 'Modify'
        ,clearHistory: 'Clear history'
    },
    
    initComponent: function() {
    
        this.store = new Ext.data.SimpleStore({
            fields: [
                {name: 'time', type: 'date'},
                {name: 'query', type: 'string'},
                {name: 'type', type: 'string'},
                {name: 'hits', type: 'int'}
            ]
        });
        
        this.columns = [/*{
            header: this.text.date
            ,width: 60
            ,fixed: true
            ,sortable: true
            ,dataIndex: 'time'
            ,renderer: Ext.util.Format.dateRenderer('H:i:s')
            ,menuDisabled: true
        },*/ {
            header: this.text.hits
            ,width: 35
            ,fixed: true
            ,sortable: true
            ,dataIndex: 'hits'
            ,menuDisabled: true
            ,align: 'right'
        }, {
            header: this.text.query
            ,width: 250
            ,sortable: true
            ,dataIndex: 'query'
            ,menuDisabled: true
            ,id: 'query'
        }, {
            header: this.text.queryType
            ,width: 45
            ,fixed: true
            ,sortable: true
            ,dataIndex: 'type'
            ,menuDisabled: true
            // TO-DO: add renderer, using the list panel's searchTypeStore.
            // How do we get a reference to the searchTypeStore?
            /*,renderer: function(value) {
                return xxx.listPanel.searchTypeStore.getById(value).get('display');
            }*/
        }];
        
        this.runSearchBtn = new Ext.Toolbar.Button({
            text: this.text.runSearch
            ,disabled: true
            ,handler: this.onRunSearch
            ,scope: this
        });
        
        this.modifySearchBtn = new Ext.Toolbar.Button({
            text: this.text.modifySearch
            ,disabled: true
            ,handler: this.onModifySearch 
            ,scope: this
        });
        
        this.clearHistoryBtn = new Ext.Toolbar.Button({
            text: this.text.clearHistory
            ,handler: this.clearHistory
            ,scope: this
        });
        
        this.toolbar = new Ext.Toolbar([
            this.runSearchBtn,
            '-',
            this.modifySearchBtn,
            '-',
            this.clearHistoryBtn
        ]);
        
        Ext.apply(this, {
        //this.grid = new Ext.grid.GridPanel({
            store: this.store
            ,columns: this.columns
            ,title: this.text.searchHistory
            //,border: false
            ,autoExpandColumn: 'query'  // not sure if this is useful, since the other columns have "fixed: true"
            ,viewConfig: {
                forceFit: true
                ,emptyText: this.text.emptyHistory
                ,deferEmptyText: false
            }
            ,selModel: new Ext.grid.RowSelectionModel({singleSelect: true})
            ,tbar: this.toolbar
        });
        
        /** if using a Window
        Ext.apply(this, {
            layout: 'fit'  // important!
            ,items: this.grid
            ,width: 580
            ,height: 300
            ,closeAction: 'hide'  // hide but don't destroy the Window
            //,modal: true
            ,title: this.text.searchHistory
            //,buttons: [{text: 'Close', handler: this.hide, scope: this}]
        });
        */
        
        Catalis.SearchHistoryPanel.superclass.initComponent.call(this);
    },
    
	// override initEvents
	initEvents: function() {
		// call the superclass's initEvents implementation
		Catalis.SearchHistoryPanel.superclass.initEvents.call(this);
		
		// now add application specific events
		// notice we use the selectionmodel's rowselect event rather
		// than a click event from the grid to provide key navigation
		// as well as mouse navigation
		var gridSm = this.getSelectionModel();		
		gridSm.on('rowselect', this.onRowSelect, this);
		// TO-DO: add 'rowdeselect' listener?		
	},
	
	/**
	 * @private
	 */
	onRowSelect: function(sm, rowIdx, r) {
	    this.runSearchBtn.enable();
	    this.modifySearchBtn.enable();
	},
    
    /**
     * Inserts a new search in the first position of the data store.
     * FIXME -- check repeated queries? See also ListPanel.js (onListLoad)
     */
    addSearch: function(query, type, hits) {
        this.store.insert(0, new Ext.data.Record({
            time: Date('now'),
            query: query,
            type: type,
            hits: hits
        }));
    },
    
    /**
     * Clears the search history.
     */
    clearHistory: function() {
        this.store.removeAll();
    },
    
	/**
	 * @private
	 */
    // FIXME -- see DatabasePanel
    onModifySearch: function() {
        var selectedSearch = this.getSelectionModel().getSelected();
        //this.fireEvent(...);
        //this.listPanel.searchToolbar.loadData(selectedSearch.get('query'), selectedSearch.get('type'));
        //this.listPanel.searchToolbar.searchField.focus();
    },
    
	/**
	 * @private
	 */
    // FIXME -- see DatabasePanel
    onRunSearch: function() {
        this.onModifySearch();
        //this.listPanel.searchToolbar.doSubmit();
    }

});