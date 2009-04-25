/**
 * DictionaryBrowser
 *
 * Doc: http://catalis.uns.edu.ar/doku/doku.php/notas/catalis-con-ext#dictionarybrowser
 *
 * TO-DO: 
 *        Control style of terms (CSS): lowercase vs uppercase vs capitalized; bold vs normal
 *        FIXME -- show '3' => shows 4
 *        FIXME -- terms with quotes, e.g. http://127.0.0.1:8000/db/bibima/?action=index&start=~ADVANCED%20RESEARCH%20WORKSHOP%20%22NEW%20TRENDS%20IN%20INTEGRABILITY%20AND!&limit=20&xhr=1
 *        FIXME -- Use of special characters, e.g. ~DAIS¯U, KIKA.
 *                                                 ~IAFAEV, D. R.~(DMITRII RAUEL´EVICH),~1948-
 *                                                 ~ICME~(8º :~1996 :~SEVILLA, ESPANA).~TG-11.
 *                 This affects retrieval as well as browsing.
 *
 *        FIXME -- paging toolbar: "prev" in first page (empty list);
 *                                 "last" does not go to the last page;
 *                                 "next" in last page (error)
 *
 * Prefixes: biblio vs auto. 
 */
 
Catalis.DictionaryBrowser = Ext.extend(Ext.Panel, {

    text: {
        panelTitle: 'Dictionary'  // 'Browse dictionary'
        ,prefixes: 'Prefixes'
        ,prefixPubDate: 'Pub.date'
        ,prefixControlNo: 'Control No.'
        ,prefixStandardNo: 'ISBN/ISSN'
        ,prefixAccessionNo: 'Accession No.'
        ,prefixLanguage: 'Language'
        ,prefixCallNo: 'Call No.'
        ,prefixType: 'Type'
        ,prefixFullFields: 'Full fields'
    },

    pageSize: 20,
    
    // The template is built using an array of strings
    templateMarkup: [
        '<table cellspacing="0" class="dictionary">',
            '<tpl for=".">',
                '<tr>',
                    '<td class="postings">{Isis_Postings}</td>',
                    '<td class="term">{Isis_Key}</td>',
                '</tr>',
            '</tpl>',
        '</table>'
    ],
    
    
    initComponent: function() {
    
        // FIXME -- the prefixes depend on this.type
        // TO-DO: how to easily add extra prefixes when the FST changes?
        this.prefixes = this.prefixes || [
            ['-F=', this.text.prefixPubDate]
            ,['-INV=', this.text.prefixAccessionNo]
            ,['-LANG=', this.text.prefixLanguage]
            ,['-NC=', this.text.prefixControlNo]
            ,['-SN=', this.text.prefixStandardNo]
            ,['-ST=', this.text.prefixCallNo]
            ,['-TYPE=', this.text.prefixType]
            ,['~', this.text.prefixFullFields]
        ];
    
        // A data store for the list of terms.
        this.store = new Ext.data.Store({
            proxy: this.db.proxy,
            baseParams: {
                action: 'index'
                ,limit: this.pageSize
                ,borders: 'On' 
            },
            reader: new Ext.data.JsonReader({
                root: 'terms',
                totalProperty: 'totalCount',
                id: ''
            }, [
                {name: 'Isis_Key' /*'term'*/},
                {name: 'Isis_Postings' /*'postings'*/}
            ]),
            listeners: {
                load: {
                    fn: function() {
                        this.body.scrollTo('top', 0);
                    },
                    scope: this
                },
                loadexception: Ext.emptyFn  // FIXME
            }
        }); 
        
        var extraToolbarItems = [];        
        
        this.textfield = new Ext.form.TextField({
            width: 50
            //,selectOnFocus: true
            ,listeners: {
                specialkey: {
                    fn: function(field, evt){
                        if (evt.getKey() == evt.ENTER){
                            //evt.preventDefault();
                            this.store.load({  // TO-DO: use instead the store's 'beforeload' event?
                                params: {
                                    start: field.getValue()
                                    //,limit: this.pageSize
                                }
                            });
                        }
                    },
                    scope: this
                }
            }
        });
        extraToolbarItems.push(this.textfield);
        
        if (this.prefixes) {
            var prefixMenuItems = [];
            Ext.each(this.prefixes, function(p){
                prefixMenuItems.push({
                    text: p[1] + ' [' + p[0] + ']'
                    ,prefix: p[0]
                });
            });
            
            var prefixBtnCfg = {
                text: this.text.prefixes
                ,menu: new Ext.menu.Menu({
                    items: prefixMenuItems
                    ,listeners: {
                        itemclick: {
                            fn: function(item, evt){
                                var prefix = item.prefix;
                                this.loadData(prefix);
                                this.textfield.setValue(prefix);  // TO-DO: move this to the store's load handler?
                                this.textfield.focus();
                            }
                            ,scope: this
                        }
                    }
                })
            };
            extraToolbarItems.push(' ', prefixBtnCfg);
        }
        
        // Paging toolbar
        // FIXME: correct state of buttons (disable/enable) at the endpoints of the dictionary.
        // (onLoad method)
        // NOTE: First page and Last page buttons are not so useful; they could be replaced by options
        // in the Prefix button's menu
        this.toolbar = new Ext.PagingToolbar({
            store: this.store,
            pageSize: this.pageSize,
            cls: 'dictionaryToolbar',  // por qué no funciona con id para CSS?
            items: extraToolbarItems,
            
            // Override some private methods of PagingToolbar: doLoad, onLoad, onClick
            
            // cursor? this.store.getAt(0).get('term')
            doLoad : function(start, reverse){   // ADDED parameter 'reverse'
                var o = {}, pn = this.paramNames;
                o[pn.start] = start;
                o[pn.limit] = this.pageSize;
                o.reverse = reverse ? 'On' : ''; // ADDED
                this.store.load({params:o});
            },
            
            onLoad : function(store, r, o){
                if(!this.rendered){
                    this.dsLoaded = [store, r, o];
                    return;
                }
               this.cursor = o.params ? o.params[this.paramNames.start] : 0;
               var d = this.getPageData(), ap = d.activePage, ps = d.pages;
               
               this.afterTextEl.el.innerHTML = String.format(this.afterPageText, d.pages);
               this.field.dom.value = ap;
               var prevTerm = store.reader.jsonData.meta.prev;
               var nextTerm = store.reader.jsonData.meta.next;
               //this.first.setDisabled(ap == 1);
               //this.prev.setDisabled(ap == 1);
               this.first.setDisabled(prevTerm == 'false');  // impedimos que quede deshabilitado (para salir del paso nomás -- FIXME)
               this.prev.setDisabled(prevTerm == 'false');   // ídem - FIXME
               //this.next.setDisabled(ap == ps);
               //this.last.setDisabled(ap == ps);
               this.next.setDisabled(nextTerm == 'false');
               this.last.setDisabled(nextTerm == 'false');
               this.loading.enable();
               this.updateInfo();
            },
            
            // Handler for clicks on buttons: first/prev/next/last/refresh
            onClick : function(which){
                var store = this.store;
                switch(which){
                    case "first":
                        this.doLoad('!');  // CHANGED: 0 -> '!'
                    break;
                    case "prev":
                        //this.doLoad(Math.max(0, this.cursor-this.pageSize));
                        this.doLoad(this.store.getAt(0).get('Isis_Key'), true);  // CHANGED
                    break;
                    case "next":
                        //this.doLoad(this.cursor+this.pageSize);
                        this.doLoad(this.store.getAt(this.pageSize-1).get('Isis_Key') + '!');  // CHANGED
                    break;
                    case "last":
                        //var total = store.getTotalCount();
                        //var extra = total % this.pageSize;
                        //var lastStart = extra ? (total - extra) : total-this.pageSize;
                        //this.doLoad(lastStart);  // CHANGE: start: ?, reverse: 1
                        this.doLoad('\xFE\xFE', true);  // '\xFE' = 'þ' = Latin Small Letter Thorn
                    break;
                    case "refresh":
                        this.doLoad(this.cursor); // we don't need this one
                    break;
                }
            }
        });  // end of toolbar
        
        var template = new Ext.XTemplate(this.templateMarkup);
        template.compile();
        
        this.view = new Ext.DataView({
            store: this.store,
            tpl: template,
            overClass: 'x-view-over',
            itemSelector: 'td.term',
            singleSelect: true,  // needed to activate selection highlighting
            emptyText: ''
        });
    
        Ext.apply(this, {
            title: this.title || this.text.panelTitle
            ,autoScroll: true
            ,tbar: this.toolbar
            ,items: [this.view]
            ,listeners: {
                // FIXME -- does not work. Use initEvents?
                expand: function() {
                    //console.log(this);
                    this.textfield.focus();
                }
            }
        });
        
        Catalis.DictionaryBrowser.superclass.initComponent.call(this);

        this.addEvents(
            'termselect'
        );
        
        if (this.initialTerm) {
            this.on('render', function(){
                this.loadData(this.initialTerm);
            });
        }
    },  // end of initComponent
    
    // Useful if rendered as child of a TabPanel
    initEvents: function() {
        this.on('activate', function(){
            this.textfield.focus();
        })
    },
    
    
    /**
     * Loads a list of terms.
     */
    loadData: function(term) {
        var term = term || '!';   // default term: the first one in the dictionary
        this.store.load({params: {
            start: term
            //,limit: this.pageSize
        }});
    }
});