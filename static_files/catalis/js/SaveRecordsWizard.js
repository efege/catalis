/**
 * "Save records" wizard
 * Based on http://www.siteartwork.de/wizardcomponent_demo/
 *
 * PROBLEMS:
 *    - How do we get context parameters each time the window is displayed (list size, current page, etc)?
 *      Probably getting a reference to the associated ListPanel (i.e. the panel whose button
 *      was used to display the dialog)
 *    - How many instances should we have? A single global instance, I think.
 *
 */

Catalis.SaveRecords = Ext.extend(Ext.ux.Wiz, {

    // English
    text: {
        title: 'Save records'
        ,headerTitle: 'Header title'
        ,selectRecords: 'Select which records to save'
        ,selectDownloadFormat: 'Select a list format'
        ,selectRecordFormat: 'Select a record format'
        ,allRecords: 'All search results ({0} records)'
        ,currentPage: 'Only the current page (page {0} of {1}, {2} records)'
        ,formatBrief: 'Brief'
        ,formatLong: 'Long'
    },

    // Spanish
    text: {
        title: 'Guardar registros'
        ,headerTitle: ''
        ,selectRecords: 'Seleccione los registros que desea guardar'
        ,selectDownloadFormat: 'Seleccione un formato para el listado'
        ,selectRecordFormat: 'Seleccione un formato para los registros'
        ,allRecords: 'Todos los resultados de la búsqueda ({0} registros)'
        ,currentPage: 'Sólo la página actual (pág. {0} de {1}, {2} registros)'
        ,formatBrief: 'Breve'
        ,formatLong: 'Extenso'
    },
    
    width: 480,
    height: 320,
    //closeAction: 'hide',  // probably not very useful
    
    initComponent: function() {
    
        // Context
        // TO-DO: this.context = {...}
        //this.totalLength = this.listPanel.screenStore.getTotalLength();
        //this.currentPage = this.listPanel.screenStore.  // ???
        //this.totalPages = this.listPanel.screenStore.  // ???
        //this.pageLength = this.listPanel.screenStore.getLength();
    
        Ext.apply(this, {
        
            title: this.text.title,
            
            headerConfig: {
                title: this.text.headerTitle    
            },
            
            cardPanelConfig: {
                defaults: {
                    baseCls: 'x-small-editor'
                    ,bodyStyle: 'padding:40px 15px 5px 120px; background-color:#F6F6F6;'
                    ,border: false    
                }
            },   
        
            cards: [
                //
                new Ext.ux.Wiz.Card({
                    title: this.text.selectRecords,
                    items: [{
                        border: false
                        ,bodyStyle: 'background:none;'
                        //,html: 'Seleccione los registros'    
                        ,items: [
                            new Ext.form.Radio({
                                name: 'r'
                                ,checked: true
                                ,inputValue: 'all'
                                ,boxLabel: String.format(this.text.allRecords, this.totalLength)
                            }),
                            new Ext.form.Radio({
                                name: 'r'
                                ,inputValue: 'page'
                                ,boxLabel: String.format(this.text.currentPage, this.currentPage)
                            })
                        ]
                    }]    
                }),
                
                //
                new Ext.ux.Wiz.Card({
                    title: this.text.selectDownloadFormat,
                    items: [{
                        border: false
                        ,bodyStyle: 'background:none;'
                        ,items: [
                            new Ext.form.Radio({
                                name: 'df'
                                ,inputValue: 'html'
                                ,boxLabel: 'HTML'
                                ,checked: true
                            }),
                            new Ext.form.Radio({
                                name: 'df'
                                ,inputValue: 'pdf'
                                ,boxLabel: 'PDF'
                            }),
                            new Ext.form.Radio({
                                name: 'df'
                                ,inputValue: 'rtf'
                                ,boxLabel: 'RTF'
                            }),
                            new Ext.form.Radio({
                                name: 'df'
                                ,inputValue: 'txt'
                                ,boxLabel: 'TXT'
                            }),
                            new Ext.form.Radio({
                                name: 'df'
                                ,inputValue: 'marc'
                                ,boxLabel: 'MARC'
                            })
                        ]
                    }]    
                }),
                
                //
                new Ext.ux.Wiz.Card({
                    title: this.text.selectRecordFormat,
                    items: [{
                        border: false,
                        bodyStyle: 'background:none;'
                        ,items: [
                            new Ext.form.Radio({
                                name: 'rf'
                                ,inputValue: 'brief'
                                ,boxLabel: this.text.formatBrief
                                ,checked: true
                            }),
                            new Ext.form.Radio({
                                name: 'rf'
                                ,inputValue: 'long'
                                ,boxLabel: this.text.formatLong
                            })
                        ]
                    }]    
                })
            ]
            
            // Next card: offers a "donwload file" or "open new window" button
        });
        
        Catalis.SaveRecords.superclass.initComponent.call(this);
    }
});  // end of extend
