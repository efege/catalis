/**
 * @class Catalis.SearchForm
 * @extends Ext.Toolbar
 *
 * This component may be either a Toolbar for the ListPanel, or a (Form)Panel by itself.
 *
 * It has methods to load data into it (e.g. the params of a search stored in the
 * search history), and to get data out of it (used to "submit" the form and load into
 * the ListPanel's store a new cache of MARC records).
 *
 * Problem: how do we communicate with the ListPanel to load its store? (i.e. "sumbit" the form)
 * Should this component fire an event "formsubmit" or something like that?
 * Or should a ListPanel instance be passed as a config option to this component's constructor?
 * We are now using this second approach.
 */

Catalis.SearchForm = Ext.extend(Ext.Toolbar, {

    text: {
        searchBoxEmpty: 'Search'
        ,in_: 'in'  // "in" is a reserved word
        ,newRecords: 'Latest records'  //'View new records'
        ,searchHistory: 'Search history'
    },

    initComponent: function() {
    
        this.searchField = new Catalis.SearchField({
            store: this.listPanel.screenStore  // FIXME -- the store is not really needed!
            ,listPanel: this.listPanel // scope trick
            ,emptyText: this.text.searchBoxEmpty
        });

        // Copied from Ext API Documentation, http://extjs.com/deploy/dev/docs/
        this.searchTypeCombo = new Ext.ux.SelectBox({
            listClass: 'x-combo-list-small',
            width: 150,  // TO-DO: check behavior when text is resized
            
            // TO-DO: this store must exist in only two global instances: one for "biblio" and one for "auto" 
            //store: Catalis.ListBrowser.searchTypes[this.listPanel.db.type],
            store: this.listPanel.searchTypeStore,
            displayField: 'display',
            valueField: 'name',
            value: 'any'
        });
        
        // Used to flag search expressions which come directly from a dictionary term.
        /*this.hiddenField = new Ext.form.Hidden({
            name: 'from_dict'
            ,value: 0
        });*/

        Ext.apply(this, {
            items: [
                this.searchField,
                ' ',
                this.text.in_,
                ' ', ' ',
                this.searchTypeCombo,
                //this.hiddenField,
                ' ', ' ', /*'-', {
                    text: this.text.searchHistory
                    ,handler: function() {
                        this.listPanel.searchHistoryPanel.show();
                    }
                    ,scope: this
                },*/ '->', {
                    text: this.text.newRecords
                    ,handler: function() {
                        // TO-DO: clear search box
                        this.listPanel.showNewRecords();
                    }
                    ,scope: this
            }]
        });
        
        Catalis.SearchForm.superclass.initComponent.call(this);
    },
    
    /**
     * Used to load a set of search parameters from an entry in the search history.
     *
     */
    loadData: function(query, searchType, fromDict) {
        this.searchField.setValue(query);
        this.searchTypeCombo.setValue(searchType || 'any');
        //this.hiddenField.setValue(fromDict || 0);
    },
    
    /**
     * Submits the search form.
     */
    doSubmit: function() {
        this.searchField.onTrigger2Click();
    }
});



/**
 * The history combo is not working as expected. We'll use a SearchField,
 * and a separate panel for the search history.
 * (Ext.app.SearchField, from ext-2.2/examples/form/SearchField.js)
 *
 * NOTE: the two handlers assumed originally the existence of a data store.
 */
Catalis.SearchField = Ext.extend(Ext.form.TwinTriggerField, {

    initComponent: function(){
        Catalis.SearchField.superclass.initComponent.call(this);
        this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTrigger2Click();  // search
            }
        }, this);
    },

    validationEvent:false,
    validateOnBlur:false,
    trigger1Class:'x-form-clear-trigger',
    trigger2Class:'x-form-search-trigger',
    hideTrigger1:true,
    width: 300,
    hasSearch: false,
    paramName: 'query',  // the name of the query param sent to the server
    selectOnFocus: true,

    // Clean the field
    onTrigger1Click: function(){
        if(this.hasSearch){
            this.el.dom.value = '';
            var o = {start: 0};
            //this.store.baseParams = this.store.baseParams || {};            //this.store.baseParams[this.paramName] = '';            //this.store.reload({params:o});
            this.triggers[0].hide();
            this.hasSearch = false;
            this.focus();
        }
    },

    // Do a search
    onTrigger2Click: function(){
        var v = this.getRawValue();
        if(v.length < 1){
            this.onTrigger1Click();
            return;
        }
        //var o = {start: 0};        //this.store.baseParams = this.store.baseParams || {};        //this.store.baseParams[this.paramName] = v;        //this.store.reload({params:o});
        this.listPanel.search({query: v});
        this.hasSearch = true;
        this.triggers[0].show();
    }
});




// OBSOLETE CODE BELOW THIS POINT

/**
 * A combobox to do keyword searches, with search history.
 *
 * TO-DO: add a "Clear search history" button/link, that calls store.removeAll()
 * TO-DO: Add buttons to clear the input and to submit the search.
 *
 * Al hacer click en el botón con la flecha, debe verse el listado completo,
 * independientemente del valor del input. No veo cómo lograrlo con las
 * opciones disponibles en ComboBox. Tal vez sea mejor usar un DataView
 * que permita ver el historial y seleccionar un ítem, pero sin el resto
 * de la funcionalidad de un Combo. SelectBox puede servir?
 *
 * BUG? When "older" is in the history list, and the user wants
 * to type and submit only "old" it gets complicated.
 * Parece mejor no permitir el uso del teclado para navegar por la lista
 * y seleccionar términos.
 *
 * BUG: (FF/Win) cuando hago una búsqueda desde un término del diccionario,
 * el término se agrega a la lista no como una TR, sino como una TD en la
 * última TR, y sin que se vea el nro. de hits. Luego se acomoda cuando
 * escribo algo en el combo. Lo arreglo con Ext.getCmp('searchHistoryBox').view.refresh()
 * cada vez que añado un record al Store.
 */
/*Catalis.HistoryCombo = Ext.extend(Ext.form.ComboBox, {

    // English
    text: {
        SEARCH_HISTORY: 'Search history'
        ,searchBoxEmpty: 'Search'
    },
    
    // Spanish
    text: {
        SEARCH_HISTORY: 'Historial de búsquedas'
        ,searchBoxEmpty: 'Buscar'
    },

    initComponent: function() {
    
        // Template for history combo
        var tpl = new Ext.XTemplate(
            '<table cellspacing="0">',
                '<tpl for=".">',
                    '<tr>',
                        '<td class="hits">[{hits}]</td>',
                        '<td class="x-combo-list-item query">{query}</td>',
                    '</tr>',
                '</tpl>',
            '</table>'
        );
        tpl.compile();
        
        Ext.apply(this, {
            mode: 'local',
            displayField: 'query',  // needed to display matching list items while typing
            width: 180,
            listWidth: 250,  // TO-DO: should auto adjust to the list contents
            resizable: true,
            listClass: 'search-history',
            selectOnFocus: true,
            emptyText: this.text.searchBoxEmpty,
            tpl: tpl,
            title: this.text.SEARCH_HISTORY
        });
        
        Catalis.HistoryCombo.superclass.initComponent.call(this);
    }
});*/

