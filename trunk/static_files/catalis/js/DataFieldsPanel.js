/**
 * DataFieldsPanel
 */
 
Catalis.DataFieldsPanel = Ext.extend(Ext.Panel, {

    text: {
        block_description: 'Description'
        ,block_access: 'Access points'
        ,block_subject: 'Subjects'
        ,block_other: 'Other data'
        
        ,block_heading: 'Heading'
        ,block_see_from: 'See from'
        ,block_see_also_from: 'See also from'
    },

    blockNames: {
        'biblio': ['description', 'access', 'subject', 'other'],
        'auto': ['heading', 'see_from', 'see_also', 'other']
    },
        
    onRender: function(ct, position) {
        Catalis.DataFieldsPanel.superclass.onRender.call(this, ct, position);
        
        var children = [{
            tag: 'col',
            cls: 'fieldTagColumn'
        }, {
            tag: 'col',
            cls: 'indicatorsColumn'
        }, {
            tag: 'col',
            width: '*'
        }];
        Ext.each(this.blockNames[this.type], function(bn) {
            children.push({
                tag: 'thead',
                html: '<tr><th>' + this.text['block_' + bn] + '</th></tr>'
            }, {
                tag: 'tbody'
            });
        }, this);
        Ext.DomHelper.append(this.body, {
            tag: 'table',
            cellspacing: 0,
            children: children 
        });
    },
    
    /**
     * Creates and displays the nodes for an array of data fields passed in JSON form.
     */
    loadData: function(fields) {
        Ext.each(fields, function(field){
            var f = new Catalis.DataField(field);
            f.render(this.body);
        });
    },
    
    getData: function() {
    }
    
});