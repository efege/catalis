/**
 * DatabaseAdminPanel
 */
 
Ext.ns('Catalis');

Catalis.DatabaseAdminPanel = Ext.extend(Ext.Panel, {
    initComponent: function() {
    
        Ext.apply(this, {
            title: 'Admin'
            ,html: '<p>Funciones para administrar la base</p>'
            ,bodyStyle: 'padding: 1em'
        });
        
        Catalis.DatabaseAdminPanel.superclass.initComponent.call(this);    
    }  // end of initComponent
});