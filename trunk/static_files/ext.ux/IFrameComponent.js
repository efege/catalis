/**
    * User extension for better management of iframes in panels. See:
    *   http://extjs.com/forum/showthread.php?t=16965&highlight=IFrameComponent
    *   http://extjs.com/forum/showthread.php?p=54322#post54322
    * See also: http://extjs.com/learn/Extension:ManagedIframe
    */
Ext.ux.IFrameComponent = Ext.extend(Ext.BoxComponent, {
    onRender : function(ct, position){
        this.el = ct.createChild({tag: 'iframe', id: 'iframe-' + this.id, frameBorder: 0, src: this.url});
    }
});

Ext.namespace("Catalis");
