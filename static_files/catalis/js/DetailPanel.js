/**
 * DetailPanel
 *
 * TO-DO: pressing the button for the current display style should have no effect
 * (no button toggle, no database query, no html update)
 *
 * NOTE: links within the displayed record should open a new browser window/tab (target="_blank")
 *
 * TO-DO: add config option to display buttons on a horizontal toolbar or on a side. 
 */

Catalis.DetailPanel = Ext.extend(Ext.Panel, {

    displayStyle: 'AACR',  // default    TO-DO: use 'defaultDisplayStyle' config

    text: {
        // Buttons
        aacr: 'AACR'
        ,marc: 'MARC'
        ,edit: 'Edit record'
        
        ,searchBoxEmpty: 'Control number'
    },
    
    initComponent: function() {
    
        /**
         * FIXME -- handle an empty response or error message (record not found)
         *
         * Rename to onStoreLoad?
         */
        function handleResponse(store, records, options) {
        
            // Create a MarcRecord instance
            // TO-DO: this.record = new Catalis.MarcRecord(store.reader.jsonData);  ??
            this.record = new Catalis.MarcRecord({
                leader: store.reader.jsonData.leader,
                controlFields: store.reader.jsonData.controlFields,
                dataFields: store.reader.jsonData.dataFields
            });
            this.record.recordId = this.record.get("001")[0].value;
            
            switch (this.displayStyle) {
                case 'AACR': this.displayAACR(); break;
                case 'MARC': this.displayMARC(); break;
            }
            
            // Display the recordId
            this.searchBox.setValue(this.record.recordId);
            
            this.body.scrollTo('top', 0);  // FIXME -- works ok when loading a new record, but not
                                           // when changing the display style of a record
        }
        
        // Check what's new about simulating *vertical* toolbars in Ext,
        // http://www.google.com/search?q=site%3Aextjs.com+vertical+toolbar
        var toolbarItems = [{
            text: this.text.aacr,
            enableToggle: true,
            toggleGroup: 'displayStyle',
            pressed: true,  // TO-DO: this depends on the default style (config)
            handler: this.displayAACR,
            scope: this
        }, ' ', {
            text: this.text.marc,
            enableToggle: true,
            toggleGroup: 'displayStyle',
            handler: this.displayMARC,
            scope: this
        }, '-', {
            text: this.text.edit,
            handler: function() {
                this.fireEvent('recordedit', this.record.recordId);
            },
            scope: this
        }];
        
        // Search box
        if (this.useSearchBox) {
            this.searchBox = new Ext.form.TextField({
                width: 85
                ,emptyText: this.text.searchBoxEmpty
                ,listeners: {
                    specialkey: {
                        fn: function(field, evt) {
                            if (evt.getKey() == evt.ENTER) {
                                //evt.preventDefault();
                                this.loadRecord(field.getValue());
                                // TO-DO: pad number with zeros? Client or server side?
                                // Using Ext: String.leftPad
                            }
                        },
                        scope: this
                    }
                }
            });
            toolbarItems.push('->', this.text.searchBoxEmpty + ':', ' ', ' ', this.searchBox);
        }
    
        /**
         * Data store
         *
         * Assume the JSON response has this structure
         * (the server is responsible for sending this):
         *
         * {
         *  "meta": {...metadata...},
         *  "data": [{
         *            "mfn": "...",  (optional, not needed)
         *            "leader": "...",
         *            "controlfields": [{"tag": "001", "value": "..."}, ...],
         *            "datafields": [{"tag": "245", "ind1": "0", "ind2": "1", "value": "..."}, ...]
         *          }]
         * }
         *
         * TO*DO: think why we need a data store which only stores a single record at a time.
         */ 
        this.store = new Ext.data.Store({
            proxy: this.db.proxy
            ,reader: new Ext.data.JsonReader(
                {}, Ext.data.Record.create([])
            )
            ,listeners: {
                load: {
                    fn: handleResponse
                    ,scope: this
                }
                ,loadexception: function(a, b, c, d) {  // FIXME
                    console.log(c, d);
                }
            }
        });
        
        // Optional paging toolbar to navigate through a list of records.
        // The list may be the whole database (by MFN), or the results of a search / mfnrange. 
        if (this.paging) {
            this.toolbar = new Ext.PagingToolbar({
                store: this.store
                ,pageSize: 1
                ,items: ['-', toolbarItems]
            });
            // TO-DO: bind toolbar actions (prev/next) to the associated ListPanel's store
        } else {
            this.toolbar = new Ext.Toolbar(toolbarItems);
        }

        Ext.apply(this, {
            autoScroll: true
            ,bodyStyle: 'padding: 0.5em'
            ,tbar: this.toolbar
        });
        
        Catalis.DetailPanel.superclass.initComponent.call(this);

        this.addEvents({
            'recordedit': true
        });
    },  // end of initComponent

    /**
     * Opciones para cargar un registro en el panel:
         - invocar el load() de un store (proxy + reader) asociado al Panel, y dejar que al recargar
           el store se actualice un view usando un template (el template debe invocar a la función que
           procese el JSON recibido para generar el display)
         - invocar el load() del Panel, que a su vez invoca el load() del UpdateManager del body del Panel;
           como tenemos que procesar el JSON recibido, necesitamos un callback
       
       TO-DO: Un cambio de estilo para un registro no debiera requerir una nueva petición al servidor.
     */
    // TO-DO: display a message if no record is found
    loadRecord: function(recordId) {
        this.store.load({params: {
            action: 'get_record'  // TO-DO: this param is constant; should be defined for the store
            ,recordId: recordId
        }});
    },

    // Visual effect based on Ext's Layout browser example:
    //          this.body.update(html).slideIn('r', {stopFx:true, duration:.25});
    // NOTE: slideIn looks best from the right; moving from the left creates
    // an unpleasant moving scrollbar.
    // Anyway, effects should be a config option.
    
    displayAACR: function() {
        var html = this.record.displayAACR();
        this.body.update(html); //.slideIn('r', {stopFx:true, duration:.25});
        this.displayStyle = 'AACR';
        //this.body.focus();
    },

    displayMARC: function() {
        var html = this.record.displayMARC();
        this.body.update(html); //.slideIn('r', {stopFx:true, duration:.25});
        this.displayStyle = 'MARC';
        //this.body.focus();
    }
});