/**
 * DocPanel
 */
 
Catalis.DocPanel = Ext.extend(Ext.Panel, {

    initComponent: function() {
    
        var toolbar = new Ext.Toolbar({
            // See http://extjs.com/forum/showthread.php?t=15118 
            // Thanks Animal!  
            // TO-DO: still needs some tweaking.
            cls: 'x-panel-header',
            buttons: [
                new Ext.Toolbar.TextItem('<b>' + /*Lang.OTHER.MARC_DOCS +*/ '</b>'),
                "->",
                new Ext.Toolbar.TextItem('Search field: '),
                " ",
                new Ext.form.TextField({
                    id: "search-key",
                    width: 75,
                    listeners: {
                        specialkey: function(field, evt) {
                            if (evt.getKey() == evt.ENTER) {
                                Documentation.showDoc(field.getRawValue());
                            }
                        }
                    }
                }),
                " ", " ", " ",
                {
                    xtype: 'button',
                    iconCls: "x-tool x-tool-collapse-south",
                    style: {
                        border: '0px none'
                    },
                    listeners: {
                        render: function(b) {
                            var e = b.getEl();
                            e.removeClass("x-btn");
                            b.button = e.child("button");
                            b.button.removeClass("x-btn-text");
                            b.button.setStyle({
                                border: '0px none'
                            });
                        }
                    },
                    handler: function(b) {
                        b.button.blur();
                        var type = 'biblio'; // FIXME
                        var panel = Ext.getCmp(type + 'DocPanel');  // FIXME
                        var f = panel.getFrameHeight();
                        //console.log(panel.getInnerHeight());
                        if (panel.getInnerHeight() < 5) {  // exact value depends on borders
                            //console.log('collapsed');
                            b.button.removeClass("x-tool-expand-south");
                            b.button.addClass("x-tool-collapse-south");
                            panel.setHeight(panel.lastHeight);
                            Ext.getCmp("search-key").focus();
                        } else {
                            //console.log('expanded');
                            b.button.removeClass("x-tool-collapse-south");
                            b.button.addClass("x-tool-expand-south");
                            panel.lastHeight = panel.getInnerHeight() + f;
                            panel.setHeight(panel.getFrameHeight());
                        }
                        //viewport.doLayout();
                        Ext.getCmp(type + 'EditTab').doLayout();  // FIXME
                    }
                }
            ]  // end of buttons
        });  // end of toolbar
        
        // TO-DO: see also Doug Hendricks's extension ManagedIframe
        Ext.apply(this, {
            tbar: toolbar
            ,layout: 'fit'
            ,items: [new Ext.ux.IFrameComponent({
                //url: Config['MARC_' + this.type + '_DOC_URL']
                url: 'http://loc.gov/marc/'
            })]
        });
        
        Catalis.DocPanel.superclass.initComponent.call(this);
        
    }  // end of initComponent
});