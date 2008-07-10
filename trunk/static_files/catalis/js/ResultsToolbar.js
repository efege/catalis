/**
 * @class Catalis.ResultsToolbar
 * @extends Ext.PagingToolbar
 *
 * A toolbar that provides tools to operate on a list of records.
 *
 * TO-DO: add public methods to update the state of some toolbar elements?
 *
 */
Catalis.ResultsToolbar = Ext.extend(Ext.PagingToolbar, {

    text: {
        recordsFound: 'Records found'
        ,save: 'Save results'
        ,print: 'Print'
        ,email: 'Email to...'
        ,download: 'Download'
    },
    
    beforePageText: 'p. ',  // TO-DO: translate
    
    // Add elements to the toolbar after it's been rendered
    onRender: function(ct, position) {
    
        Catalis.ResultsToolbar.superclass.onRender.call(this, ct, position);
        
        // Button w/menu (instead of a combo) for sorting a list of records
        var sortMenuItems = [];
        for (var so in this.listPanel.sortOptions) {
            sortMenuItems.push({
                text: this.listPanel.sortOptions[so]
                ,sort: so
                ,checked: false
                ,group: 'sortBy'
            });
        }
        
        this.sortByBtn = new Ext.Toolbar.Button({
            text: this.listPanel.text.sortBy
            ,menu: new Ext.menu.Menu({
                items: sortMenuItems
                ,listeners: {
                    itemclick: {
                        fn: function(item, evt){
                            this.sortList(item.sort);
                        }
                        ,scope: this.listPanel  // the toolbar's listPanel property
                    }
                    // Sync the menu to the sort state of the store 
                    ,beforeshow: {
                        fn: function(menu) {
                            var currentSort = this.screenStore.lastOptions.params.sort;
                            menu.items.each(function(it) {
                                it.setChecked(it.sort == currentSort);
                            });
                        }
                        ,scope: this.listPanel
                    }
                }
            })
        });
        
        // Button for printing
        // shortcut to "save all results in HTML in the current order and using brief format"        
        this.printBtn = new Ext.Toolbar.Button({
            text: this.text.print
            ,handler: function() {
				this.print();
            }
            ,scope: this
        });
        
        // Button w/menu for saving (print, email, download) a list of records
        // TO-DO: add "save search permanently on the server" (e.g. for DSI) ?
        this.saveBtn = new Ext.Toolbar.Button({
            text: this.text.save
            ,handler: function() {
                //console.log(this.listPanel.saveWizard);
                /*if (!this.listPanel.saveWizard) {
                    this.listPanel.saveWizard = new Catalis.SaveRecords();  // does not re-show the window
                }*/
                // FIXME -- how do we pass context parameters (list size, current page, etc)?
                //this.listPanel.saveWizard = new Catalis.SaveRecords();  // re-creates the dialog; but do we still have to destroy the old one?
                //this.listPanel.saveWizard.show();
            }
            ,scope: this
            /*,menu: [{
                text: this.text.print
            }, {
                text: this.text.email
            }, {
                text: this.text.download
                ,menu: [{
                    text: 'RTF'
                }, {
                    text: 'PDF'
                }, {
                    text: 'MARC'
                }]
            }]*/
        });
        
        // Based on http://www.extjs.com/deploy/dev/examples/view/chooser.html
        /*this.sortByCombo = new Ext.form.ComboBox({
            listClass: 'x-combo-list-small'
            ,typeAhead: true
            ,triggerAction: 'all'
            ,width: 120
            ,editable: false
            ,mode: 'local'
            ,displayField: 'desc'
            ,valueField: 'name'
            ,lazyInit: false
            ,value: 'title'
            ,store: new Ext.data.SimpleStore({
                fields: ['name', 'desc']
                ,data: [
                    ['pub_date', this.text.pub_date]
                    ,['main_entry', this.text.main_entry]
                    ,['title', this.text.title]
                ]
            })
        });*/
        
        // See PagingToolbar.js to learn the right way to modify a toolbar
        // Also see these threads about customizing PagingToolbar:
        // http://extjs.com/forum/showthread.php?t=14426, http://extjs.com/forum/showthread.php?p=136699
        this.add(
            '-', ' ', ' ', ' ',
            //this.text.sortBy,
            //' ',
            //this.sortByCombo,
            this.sortByBtn,
            ' ', '-',
            this.printBtn,
            ' ', '-',
            this.saveBtn
        );
    },  // end of onRender
	
	
    /**
     * Requests a set of records to be printed.
     *
     * TO-DO: use the general 'list' method, passing the param 'print'.
     */
    print: function() {
        // Clone params, so we get the same records
        // Use an Ext Action? http://extjs.com/deploy/dev/docs/?class=Ext.Action
        //this.listPanel.printStore.baseParams = this.listPanel.screenStore.baseParams;
        // NOTE: lastOptions.params is a superset of baseParams. We use lastOptions.params
        // to preserve sort info (params 'sort' and 'dir'). But we don't want to preserve
        // params 'start' & 'limit'.
        this.listPanel.printStore.baseParams = this.listPanel.screenStore.lastOptions.params;
        this.listPanel.printStore.baseParams.start = 0;
        this.listPanel.printStore.baseParams.limit = 1000;  // FIXME -- Use config value for 'limit'
        this.listPanel.printStore.load();
    }
});
