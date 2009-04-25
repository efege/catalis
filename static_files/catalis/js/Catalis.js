// Create namespaces 
Ext.ns('Catalis', 'Catalis.util');

Ext.QuickTips.init();

Ext.BLANK_IMAGE_URL = Config.HTDOCS + "ext-2.2/resources/images/default/s.gif";

// TO-DO: state manager

// Data stores should be created and loaded here?
Catalis.MarcData = {
    codes: {},
    auto: {},
    biblio: {},
    
    // Share a special Connection for all the XML files.
    conn: new Ext.data.Connection(),
    
    // Each XML file requires its own proxy.
    // Or can we use a single proxy and just modify the url property of its Connection?
    createProxy: function(file) {
        Catalis.MarcData.conn.url = Config.HTDOCS + 'catalis/xml/' + file;
        return new Ext.data.HttpProxy(Catalis.MarcData.conn);
    }
};

// A simple database class
// Note that we are not defining any methods; we get data using methods
// of the associated data stores, which share the database's proxy.
// See also the wiki.
Catalis.MarcDatabase = function(name, type) {
    this.name = name;
    this.type = type;
    this.conn = new Ext.data.Connection({
        url: "/catalis/db/" + this.name + "/",   // TO-DO: move this url pattern to Config
        extraParams: {
            xhr: 1  // forces a JSON response
        }
    });
    this.proxy = new Ext.data.HttpProxy(this.conn);
    
    // For debugging only
    this.proxy.on('beforeload', function(proxy, params) {
        var log = [];
        for (var p in params) {
            log.push(p + '=' + params[p]);
        }
        log.sort();
        console.log('REQUEST: ' + log.join(' | '));
    });
};

