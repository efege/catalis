Catalis.util.MARC21 = function(){

    // Share a special Connection for all the XML files.
    var xmlConnection = new Ext.data.Connection();
    
    // Each XML file requires its own proxy. Or can we use a single proxy and just modify the url property of its Connection?
    var createProxy = function(file) {
        xmlConnection.url = Config.HTDOCS + 'catalis/xml/' + file;
        return new Ext.data.HttpProxy(xmlConnection);
    };
    
    var xmlMARC21RecordDef = Ext.data.Record.create([
        {name: 'tag', mapping: '@tag'},
        {name: 'label-spa', mapping: '@label-spa'},
        {name: 'label-eng', mapping: '@label-eng'},
        {name: 'repet', mapping: '@repet'},
        {name: 'oblig', mapping: '@oblig'},
        {name: 'template', mapping: '@template'},
        {name: 'indicators', mapping: 'indicator'}, // ??
        {name: 'subfields', mapping: 'subfield'}
    ]);
    
    var xmlFixedFieldRecordDef = Ext.data.Record.create([
        {name: 'pos', mapping: '@pos'},
        {name: 'name', mapping: '@name'},
        {name: 'label-eng', mapping: '@label-eng'},
        {name: 'multiple', mapping: '@multiple'},
        {name: 'options', mapping: 'option'}  // ??
    ]);
    
    var xmlLanguageCodesRecordDef = Ext.data.Record.create([
        {name: 'code'},
        {name: 'name'}
    ]);
    
    var xmlCountryCodesRecordDef = Ext.data.Record.create([
        {name: 'code'},
        {name: 'name'}
    ]);
    
    var xmlRelatorCodesRecordDef = Ext.data.Record.create([
        {name: 'code'},
        {name: 'name'}
    ]);

    return {
    
        stores: {
        
            biblioDataFields: new Ext.data.Store({
                proxy: createProxy('marc21.xml'),
                reader: new Ext.data.XmlReader({
                    record: 'datafield',
                    id: '@tag'
                }, xmlMARC21RecordDef),
                listeners: {
                    'loadexception': function(){
                        Ext.Msg.alert("Error", "MARC21Store load exception");
                    }
                    //'load': getMARC21Tags
                }
            }),
            
            fixedField: new Ext.data.Store({
                proxy: createProxy('fixedField.xml'),
                reader: new Ext.data.XmlReader({
                    record: 'dataElement',
                    id: '@pos'
                }, xmlFixedFieldRecordDef),
                listeners: {
                    'loadexception': function(){
                        Ext.Msg.alert("Error", "FixedFieldStore load exception");
                    }
                }
            }),
            
            languageCodes: new Ext.data.Store({
                proxy: createProxy('language.xml'),
                reader: new Ext.data.XmlReader({
                    record: 'language',
                    id: '@code'
                }, xmlLanguageCodesRecordDef),
                listeners: {
                    'loadexception': function(){
                        Ext.Msg.alert("Error", "LanguageCodesStore load exception");
                    }
                }
            }),
            
            countryCodes: new Ext.data.Store({
                proxy: createProxy('country.xml'),
                reader: new Ext.data.XmlReader({
                    record: 'country',
                    id: '@code'
                }, xmlCountryCodesRecordDef),
                listeners: {
                    'loadexception': function(){
                        Ext.Msg.alert("Error", "CountryCodesStore load exception");
                    }
                }
            }),
            
            relatorCodes: new Ext.data.Store({
                proxy: createProxy('relator.xml'),
                reader: new Ext.data.XmlReader({
                    record: 'relator',
                    id: '@code'
                }, xmlRelatorCodesRecordDef),
                listeners: {
                    'loadexception': function(){
                        Ext.Msg.alert("Error", "RelatorCodesStore load exception");
                    }
                }
            })

        },  // end of stores
        
        
        /**
         * Generates an HTML display of all the data in the record, using MARC tags.
         *
         * @param {Object} fields The record's fields, with this structure:
         *                        {leader: '...', controlFields: [...], dataFields: [...]}
         *
         * TO-DO: move to DetailPanel? or move to Catalis.Record class?
         *
         * See notes in the file marc2marcTagged.js
         *
         * ATENCION: el uso de '&nbsp;' en las celdas con el número de campo es para
         * obligar a que haya un espacio cuando se copia el listado al portapapeles.
         *
         * El atributo class="subfield" es utilizado para poder reconocer los subampos
         * y así presentar uno por línea.
         */
        marcDisplay: function(record) {
            html = [];
            html.push('<table class="marcTaggedTable" cellspacing="0">');
            
            // Leader
            html.push(
                '<tr>',
                    '<td class="marctag">',
                        'LDR','&nbsp;',
                    '</td>',
                    '<td colspan="3">',
                        record.leader,
                    '</td>',
                '</tr>'
            );
            
            // Control fields
            Ext.each(record.controlFields, function(f){
                html.push(
                    '<tr>',
                        '<td class="marctag">',
                            f.tag, '&nbsp;',
                        '</td>',
                        '<td colspan="3">',
                            f.value,
                        '</td>',
                    '</tr>'
                );
            });
            
            // Data fields
            Ext.each(record.dataFields, function(f){
                html.push(
                    '<tr>',
                        '<td class="marctag">',
                            f.tag, '&nbsp;',
                        '</td>',
                        '<td class="indicator">',
                            f.ind1,
                        '</td>',
                        '<td class="indicator">',
                            f.ind2,
                        '</td>',
                        '<td class="fieldContent">',
                            '<span class="subfield">',
                                f.subfields.replace(/\/(?=\S)/g,'/<wbr>').replace(/\^(\w)/g,' </span><span class="subfield"><b>$</b><b>$1</b> '),
                            '</span>',
                        '</td>',
                    '</tr>'
                );
            });
            
            html.push('</table>');
            return html.join('');
        }
    };
}();

// Load stores
// This does not work, all stores are using the same url (the last one).
// See catalis.js (2007)
// NOTE: s is a global var
//for (var s in Catalis.util.MARC21.stores) {
    //console.log(Catalis.util.MARC21.stores[s].proxy);
    //Catalis.util.MARC21.stores[s].load();
//};
