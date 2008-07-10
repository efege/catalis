/**
 * DataFieldBlock
 *
 * Should we extend Ext.Panel, or simply wrap a couple of DOM nodes (thead + tbody)?
 * Answer: option 2
 */
 
Catalis.DataFieldBlock = function(config) {
    Ext.apply(this, config);
     
    this.headNode = document.createElement('thead');
    this.headNode.innerHTML = '<tr><th>' + this.name + '</th></tr>';
    this.bodyNode = document.createElement('tbody');
});

Catalis.DataFieldBlock.prototype = {
    getDataFields: function() {
    },
    
    addDataField: function(field) {
    },
    
    insertDataField: function(field) {
    },
    
    indexOf: function(field) {
    }
};

