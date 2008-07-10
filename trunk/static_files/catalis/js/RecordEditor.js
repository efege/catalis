/**
 * RecordEditor
 */
 
Catalis.RecordEditor = Ext.extend(Ext.Panel, {

    text: {
        title: 'Edition'
    },

    initComponent: function() {
    
        function handleResponse(store, records, options) {
            // Create a MarcRecord instance
            this.record = new Catalis.MarcRecord({
                leader: store.reader.jsonData.leader,
                controlFields: store.reader.jsonData.controlFields,
                dataFields: store.reader.jsonData.dataFields
            });
            
            this.dataFieldsPanel.loadData(this.record.dataFields);
            var controlFields = {};
            Ext.each(this.record.controlFields, function(f) {
                controlFields[f.tag] = f.value;
            });
            this.controlFieldsPanel.loadData({leader: this.record.leader, controlFields: controlFields});
        }
        
        this.dataFieldsPanel = new Catalis.DataFieldsPanel({
            type: this.db.type
            ,region: 'center'
        });
        this.controlFieldsPanel = new Catalis.ControlFieldsPanel({
            type: this.db.type
            ,region: 'center'
        });
        this.localDataPanel = new Catalis.LocalDataPanel({
            region: 'south'
            ,height: 300
        });
        
        // Data store -- Based on: DetailPanel
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
        
        Ext.apply(this, {
            layout: 'border'
            ,title: this.text.title
            ,items: [this.dataFieldsPanel, {
                region: 'east'
                ,width: 186
                ,layout: 'border'
                ,items: [this.controlFieldsPanel, this.localDataPanel] 
            }]
        });
        
        Catalis.RecordEditor.superclass.initComponent.call(this);
    },
    
    /**
     * Based on DetailPanel.prototype.loadRecord
     */
    loadRecord: function(recordId) {
        this.store.load({params: {
            action: 'edit_record'  // TO-DO: this param is constant; should be defined for the store
            ,recordId: recordId
        }});
    }
});