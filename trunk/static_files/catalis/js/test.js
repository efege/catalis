// Code to test individual components

// ------------------------------------------------------
// List Panel
// ------------------------------------------------------
function test_listBrowser(db) {
    Ext.getBody().setStyle('padding', '1em');
    Ext.getBody().setStyle('background', '#666');
    var lb = new Catalis.ListBrowser({
        db: db,
        width: 800,
        height: 400,
        //frame: true,  // color problem
        title: 'Catalis.ListBrowser'
    });
    lb.render(document.body);
    lb.showNewRecords();
}

// ------------------------------------------------------
// Detail Panel
// ------------------------------------------------------
function test_detailPanel(db) {
    Ext.getBody().setStyle('padding', '1em');
    var dp = new Catalis.DetailPanel({
        db: db,
        width: 600,
        height: 350,
        //frame: true,
        useSearchBox: true,
        title: 'Catalis.DetailPanel - ' + db.name
    });
    dp.render(document.body);
    dp.loadRecord("003560");
}

// ------------------------------------------------------
// Dict Panel
// ------------------------------------------------------
function test_dictPanel(db) {
    Ext.getBody().setStyle('padding', '1em');
    var panel = new Catalis.DictionaryBrowser({
        db: db
        ,width: 230
        ,height: 300
        ,title: 'Catalis.DictionaryBrowser'
        ,prefixes: [
            ['-NC=', 'Control no.'],
            ['-F=', 'Pub. date'],
            ['-ST=', 'Call number']
        ]
        ,initialTerm: 'a'
    });
    panel.render(document.body);
}

// ------------------------------------------------------
// Database Panel
// ------------------------------------------------------
function test_databasePanel(db) {
    Ext.getBody().setStyle('padding', '1em');
    var dp = new Catalis.DatabasePanel({
        db: db,
        width: 780,
        height: 500,
        title: 'Catalis.DatabasePanel'
    });
    dp.render(document.body);
    dp.listPanel.showNewRecords();
    //dp.dictPanel.load('A');
}


// ------------------------------------------------------
// MainTabPanel
// ------------------------------------------------------
function test_mainTabPanel(db) {
    var main = new Ext.TabPanel({
        width: 900
        ,height: 500
        ,deferredRender: false  // does this work? I still see the tab semi-rendered
    });
    var dp1 = new Catalis.DatabasePanel({
        db: db,
        title: 'Catalis.DatabasePanel 1'
    });
    var dp2 = new Catalis.DatabasePanel({
        db: db,
        title: 'Catalis.DatabasePanel 2'
    });
    main.render(document.body);
    main.add(dp1);
    main.add(dp2);
    main.doLayout();
    dp1.listPanel.showNewRecords();
    //dp1.dictPanel.loadData('A');
    dp2.listPanel.showNewRecords();
    //dp2.dictPanel.loadData('Z');
}

// ------------------------------------------------------
// All items (for Window or Viewport)
// ------------------------------------------------------
function getAllItems(dbList) {
    var panels = [];
    for (var i=0; i < dbList.length; i++) {
        var dp = new Catalis.DatabasePanel({
            db: dbList[i],
            title: dbList[i].name
        });
        panels.push(dp);
        dp.listPanel.showNewRecords();
        //dp.dictPanel.load();
    }
    var docPanel = new Catalis.DocPanel({
        region: 'south'
        //,title: Lang.OTHER.MARC_DOCS,  // commented if toolbar is used
        ,split: true
        ,collapsible: true
        ,collapsed: true
        ,autoHide: false
        ,floatable: false
        ,animFloat: false
        //,collapseMode: 'mini'
        ,height: 180
        ,maxSize: 400
    });
    
    var items = [{
        xtype: 'toolbar',
        region: 'north',
        items: ['<b>Catalis [Ext & Django]</b>', ' ', ' ', '-', {
            text: 'Nuevo'
            ,handler: function() {Ext.Msg.alert('', 'Nuevo registro')}
        }, '-', {
            text: 'Importar'
            ,handler: function() {Ext.Msg.alert('', 'Importar registro')}
        },
        '->', 'Usuario: <b>' + g_userid + '</b> ', ' ', '-', {
            text: 'Salir'
            ,handler: function() {
                Ext.Msg.confirm('Confirmación', '¿Desea salir de Catalis?', function(ans) {
                    if (ans == 'yes') {
                        window.location.href = '/catalis/accounts/logout/';
                    }
                });
            }
        }]
    }, {
        xtype: 'tabpanel',
        region: 'center',
        border: false,
        items: panels,
        activeTab: 0
    }]
    
    return items;
}  // end of getAll

// ------------------------------------------------------
// Viewport
// ------------------------------------------------------
function test_viewport(dbList) {
    var viewport = new Ext.Viewport({
        layout:'border'
        ,items: getAllItems(dbList)
    });
}

// ------------------------------------------------------
// Windows
// ------------------------------------------------------
function test_windows(dbList) {
    Ext.getBody().setStyle('padding', '1em');
    Ext.getBody().setStyle('background', '#666');
    
    var window1 = new Ext.Window({
        layout:'border'
        ,width: 760
        ,height: 500
        ,title: 'Catalis'
        ,closeAction: 'hide'
        ,maximizable: true
        //,minimizable: true  // not implemented
        ,items: getAllItems(dbList)
    });
    var btn1 = new Ext.Button({
        handler: function() {window1.show();}
        ,text: 'Open Catalis 1'
        ,renderTo: Ext.getBody()
    });
    
    var window2 = new Ext.Window({
        layout:'border'
        ,width: 600
        ,height: 500
        ,title: 'Catalis'
        ,closeAction: 'hide'
        ,maximizable: true
        //,minimizable: true  // not implemented
        ,items: getAllItems(dbList)
    });
    var btn2 = new Ext.Button({
        handler: function() {window2.show();}
        ,text: 'Open Catalis 2'
        ,renderTo: Ext.getBody()
    });
}

// ------------------------------------------------------
// Data Fields
// ------------------------------------------------------
function test_dataFieldsPanel() {
    var panel = new Catalis.DataFieldsPanel({
        type: 'biblio',
        width: 700,
        height: 400,
        title: 'Catalis.DataFieldsPanel'
    });
    panel.render(document.body);
    panel.loadFields([
        {tag: '245', ind1: '0', ind2: '0', subfields: '^aThis is the title :^bthis the subtitle /^cand this the responsability statement.'}
        ,{tag: '260', ind1: ' ', ind2: ' ', subfields: '^aPlace :^bPublisher,^cDate'}
    ]);
}

// ------------------------------------------------------
// Control Fields
// ------------------------------------------------------
function test_controlFieldsPanel() {
    var panel_biblio = new Catalis.ControlFieldsPanel({
        type: 'biblio',
        columnWidth: 0.5,
        //height: 350,
        title: 'Catalis.ControlFieldsPanel (biblio)'
    });
    
    var panel_auto = new Catalis.ControlFieldsPanel({
        type: 'auto',
        columnWidth: 0.5,
        //height: 350,
        title: 'Catalis.ControlFieldsPanel (auto)'
    });
    
    var panel = new Ext.Panel({
        //height: 400,
        width: 500,
        frame: true,
        title: 'Testing Control Fields',
        defaults: {bodyStyle: 'padding: 10px', frame: true},
        layout: 'column',
        items: [panel_biblio, panel_auto],
        renderTo: Ext.getBody()
    });
    
    panel_biblio.loadData({
        leader: '_____nam##_______5a#4500',
        controlFields: {
            '001': 'biblio1',
            '005': '20080524123450.0',
            '008': '981214s1996####sa############000#0#eng##'
        }
    });
    panel_auto.loadData({
        leader: '_____nam##_______5a#4500',  // FIX (use real values)
        controlFields: {
            '001': 'auto1',
            '005': '20080524123450.0',
            '008': '070829|||ac|||aaan##########|n#|||####||'
        }
    });
}


Ext.onReady(function(){
    
    // Remove loading mask
    // From: http://extjs.com/deploy/ext-2.0-alpha1/docs/resources/docs.js
    setTimeout(function(){
        Ext.fly('loading').remove();
        Ext.fly('loading-mask').fadeOut({remove:true});
    }, 500);

    // Bibliographic database
    //var db_biblio = new Catalis.MarcDatabase('bibima', 'biblio');
    // Another bibliographic database
    var db_demo = new Catalis.MarcDatabase('demo', 'biblio');
    // And another bibliographic database
    var db_celtic = new Catalis.MarcDatabase('celtic', 'biblio');
    
    // Authority database
    //var db_auto = new Catalis.MarcDatabase('auto', 'auto');
    
    // Uncomment only one of the lines below to test the corresponding component
    //test_listBrowser(db_demo);
    //test_dictPanel(db_demo);
    //test_detailPanel(db_demo);
    //test_databasePanel(db_demo);
    //test_mainTabPanel(db_demo)
    //test_dataFieldsPanel();
    //test_controlFieldsPanel();
    test_viewport([db_demo, db_celtic]);
    //test_windows([db_demo]);  // same db on both windows
});
