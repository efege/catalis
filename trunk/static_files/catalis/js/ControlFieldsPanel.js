/**
 * ControlFieldsPanel
 *
 * Subpanels:
 *    - 001 (record id)
 *    - 005 (last modif date)
 *    - leader
 *    - 008 general
 *    - 008 type-specific
 *
 * TO-DO:
 *   - "biblio" and "auto" variants
 *   - Minimize the number of objects being created. Do we really need one store + one combo + one editor
 *     for each data element? May we instead share a single set of objects?
 *   - Hide the combobox field (input + trigger element), just show the list
 *   - Hidden inputs for leader values that are not displayed?
 *
 * This class is also responsible for:
 *     - getting the raw data (XML or JSON)
 *     - creating data store and editor for each data element (requires raw data)
 *     - defining the layout of data elements into the tables
 */
Catalis.ControlFieldsPanel = Ext.extend(Ext.Panel, {

    dataPositions: {
        "biblio": {
            "leader": ['06', '07', '08', '17', '18', '19'],
            "008": []
        },
        "auto": {
            "leader": ['06', '17'],
            "008": []
        }
    },
    
    // Define how to layout the data elements, and the short names to display.
    // TO-DO: Short names should be part of a language file
    dataLayout: {
        "biblio": {
            "leader": [
                [['TipoReg', 'LDR_06'], ['NivBib', 'LDR_07']],
                [['TipoCtrl', 'LDR_08'], ['Desc', 'LDR_18']],
                [['NivCodif', 'LDR_17'], ['RegRel', 'LDR_19']]
            ],
            "008_all": [
                [['Fechas', '008_06'], ['', '008_07-10'], ['', '008_11-14']],  // FIXME: merge cells
                [['País', '008_15-17'], ['Leng', '008_35-37']],
                [['RegMod', '008_38'], ['Fuente', '008_39']]
            ],
            "008_books": [
                [['Aud', '008_BK_22'], ['Ilust', '008_BK_18-21']],
                [['FItem', '008_BK_23'], ['Cont', '008_BK_24-27']],
                [['PubGub', '008_BK_28'], ['Biogr', '008_BK_34']],
                [['Homen', '008_BK_30'], ['Índice', '008_BK_31']],
                [['FLit', '008_BK_33'], ['PubConf', '008_BK_29']]
            ]
        },
        
        "auto": {
            "leader": [
                [['TipoReg', 'LDR_06'], ['NivCodif', 'LDR_17']]
            ],
            "008": [
                [['UseSubj', '008_06']],
                [['UseSubj', '008_07'], ['UseSerie', '008_08']],
                [['UseSubj', '008_09'], ['UseSerie', '008_10']],
                [['UseSubj', '008_11'], ['UseSerie', '008_12']],
                [['NumSerie', '008_13'], ['UseMain', '008_14']],
                [['UseSubj', '008_15'], ['UseSerie', '008_16']],
                [['TipoDiv', '008_17'], ['AgGob', '008_28']],
                [['RefEval', '008_29'], ['ProcAct', '008_31']],
                [['PersUndif', '008_32'], ['NivEstab', '008_33']],
                [['RegMod', '008_38'], ['Fuente', '008_39']]
            ]
        }
    },

    onRender: function(ct, position) {
        Catalis.ControlFieldsPanel.superclass.onRender.call(this, ct, position);
        
        var table, thead, tbody, row, cell;
        
        table = document.createElement("table");
        table.className = 'control';
        table.cellSpacing = 0; 

        // This uses the layout defined in Catalis.controlFieldsLayout.
        var layout = this.dataLayout[this.type];
        for (block in layout) {
            Ext.DomHelper.append(table, {
                tag: 'thead',
                children: [{
                    tag: 'tr',
                    children: [{
                        tag: 'th',
                        colspan: 2,
                        cls: 'controlBlockHeader',
                        html: block
                    }]
                }]
            });
            tbody = Ext.DomHelper.append(table, {
                tag: 'tbody'
            });
            Ext.each(layout[block], function(rowElements) {
                row = document.createElement('tr');
                tbody.appendChild(row);
                Ext.each(rowElements, function(element) {
                    cell = this.createCell(element);
                    row.appendChild(cell);
                }, this);
            }, this);
        }
            
        // Render the whole table at once
        this.body.dom.appendChild(table);
        
        // Attach a click listener to the table
        Ext.get(table).on(
            'click',
            this.onCellClick,
            this,             // scope
            {delegate: 'td'}  // use event delegation
        );
    },  // end of onRender
    
    /**
     * Handler for click on the cells. Displays the cell editor.
     *
     * TO-DO: cleanup interaction with dataEl.
     */
    onCellClick: function(ev, cell) {
        if (!cell.input.readOnly) { return; }
    
        var dataEl = Catalis.ControlFieldsPanel.DataElements[cell.pos];
        
        // Create editor on demand
        if (!dataEl || !dataEl.editor) {
            dataEl = Catalis.ControlFieldsPanel.DataElements[cell.pos] = {};
            this.createEditor(cell.pos); // or: dataEl.editor = this.createEditor(cell.pos)
        }
        
        var code = cell.input.value;
        var description = dataEl.store.getById(code).get('description');
        dataEl.editor.startEdit(cell, description);  // this depends on the template used for the ComboBox
        dataEl.editor.field.expand();  // FIXME -- this is related to a problem with the combo's scrollbars
        dataEl.editor.field.selectByValue(code);
    },
    
    /**
     * Builds and returns a table cell for a data element.
     */
    createCell: function (element) {
        var shortName = element[0];
        var pos = element[1];
        var cell, input; 
        cell = document.createElement("td");
        cell.pos = pos;
        cell.innerHTML = shortName + ' ';
        
        input = document.createElement("input");
        input.className = 'controlDataElement';
        //input.size = Catalis.controlDataElements[cellId].size || 1;
        input.size = 1;  // FIXME
        input.readOnly = true;  // FIXME -- not always true
        cell.appendChild(input);
        cell.input = input;
        this[pos] = input;
        
        return cell;
    },
    
    /**
     * Loads data into this component.
     *
     * Input: {leader: '...', controlFields: [{"tag": "", "value": "..."}, ...]}
     * or
     * {leader: '...', controlFields: {"001": "...", "005": "...", "006": ["...", ...], "007": ["...", ...], "008": "..."}
     *
     * TO-DO: "biblio" vs "auto"
     */
    loadData: function(data) {
    
        // First, remove all data
        Ext.each(Ext.query('input', this.body.dom), function(el) {
            el.value = '';
        });
    
        // leader
        // TO-DO: hidden positions?
        var LDR = data.leader;
        Ext.each(this.dataPositions[this.type].leader, function(pos){
            this['LDR_' + pos].value = LDR.substr(pos*1, 1);  // http://www.jibbering.com/faq/faq_notes/type_convert.html#tcNumber
        }, this);
        
        // field 008
        // TO-DO: "biblio" vs "auto"
        var f008 = data.controlFields['008'];
        this['008_06'].value = f008.substr(06, 1);
        this['008_07-10'].value = f008.substr(07, 4);
        this['008_11-14'].value = f008.substr(11, 4);
        this['008_15-17'].value = f008.substr(15, 3);
        this['008_35-37'].value = f008.substr(35, 3);
        this['008_38'].value = f008.substr(38, 1);
        this['008_39'].value = f008.substr(39, 1);
        
        // TO-DO: use material type to determine which 008 to use.
        this['008_BK_18-21'].value = f008.substr(18, 4);
        this['008_BK_22'].value = f008.substr(22, 1);
        this['008_BK_23'].value = f008.substr(23, 1);
        this['008_BK_24-27'].value = f008.substr(24, 4);
        this['008_BK_28'].value = f008.substr(28, 1);
        this['008_BK_29'].value = f008.substr(29, 1);
        this['008_BK_30'].value = f008.substr(30, 1);
        this['008_BK_31'].value = f008.substr(31, 1);
        this['008_BK_33'].value = f008.substr(33, 1);
        this['008_BK_34'].value = f008.substr(34, 1);
        
        // TO-DO: add more types
    },
    
    /**
     * Returns the data stored in this component.
     */
    getData: function() {
        // leader
        // TO-DO: "biblio" vs "auto"
        var leader = [
            '_____',
            //this.LDR_05.value,
            this.LDR_06.value,
            this.LDR_07.value,
            this.LDR_08.value,
            //this.LDR_09.value,
            '22',
            this.LDR_17.value,
            this.LDR_18.value,
            this.LDR_19.value,
            '4500'
        ].join('');
        
        // control fields
        // TO-DO: "biblio" vs "auto"
        var controlFields = '';
        var controlFields = [
            {tag: '001', value: this.f001.value} ,
            {tag: '005', value: this.f005.value},
            //{tag: '006', value: this.f006.getValue()}
            //{tag: '007', value: this.f007.getValue()}
            {tag: '008', value: [
                this['008_06'].value,
                this['008_07-10'].value,
                this['008_11-14'].value,
                this['008_15-17'].value,
    
                this['008_35-37'].value
            ].join('')}
        ];
        
        return {
            leader: leader,
            controlFields: controlFields
        };
    },
    
    /**
     * Creates store, combo box and editor for a data element (on demand).
     *
     * TO-DO: a data element is defined by its position plus the *type* (biblio/auto)!!
     *
     * Should this be a static class method?
     */
    createEditor: function(pos) {
    
        var dataEl = Catalis.ControlFieldsPanel.DataElements[pos];
        
        var codes, title;
        var data = [];        
        
        // Read data from XML documents
        // TO-DO: "biblio" vs "auto"
        switch(pos) {
        
            case "008_15-17" :
            case "044" :
                codes = Ext.DomQuery.select('country', Catalis.MarcData.codes.country.reader.xmlData);
                title = "008/15-17 · Lugar de publicación";
                break;
                
            case "008_35-37" :
            case "041" :
                codes = Ext.DomQuery.select('language', Catalis.MarcData.codes.language.reader.xmlData);
                title = "008/35-37 · Idioma";
                break;
                
            case "relator" :
                // TO-DO: pensar de qué manera se puede acotar la larga lista, en función del tipo
                // de documento (video, musica, libro, etc.)
                codes = Ext.DomQuery.select('relator', Catalis.MarcData.codes.relator.reader.xmlData);
                title = "Relator codes";
                break;
                
            default:
                codes = Ext.DomQuery.select('option', Catalis.MarcData[this.type].FixedField.getById(pos).node);
                title = Catalis.MarcData[this.type].FixedField.getById(pos).get('name');
                break;
        }  // end of switch

        // Data for the stores
        Ext.each(codes, function(c) {
            var code = c.getAttribute("code");
            var cleanValue = code.replace(/([^^#])#/g,"$1 "); // "mx#" se muestra como "mx "; la expr.reg. podría quizás cambiarse por /(\w)#/g
            //var description = cleanValue + " : " + c.getAttribute("name");
            var description = c.getAttribute("name") + ' (' + cleanValue + ')';
            data.push([code, description]);
        });
    
        dataEl.store = new Ext.data.SimpleStore({
            fields: ['code', 'description'],
            //data: dataEl.data,
            data: data,
            id: 0
        });
        
        dataEl.combo = new Catalis.CodedDataCombo({
            store: dataEl.store,
            title: title,
            listeners: {
                // Hides the editor after an item is selected 
                select: {
                    fn: function(){
                        this.editor.hide();
                    },
                    scope: dataEl
                }
            }
        });
         
        dataEl.editor = new Ext.Editor(dataEl.combo, {
            hideEl: false,
            alignment: "tl-tl", //"tl-bl",  //"l-bl",
            constrain: true,
            cancelOnEsc: true,
            ignoreNoChange: true,
            listeners: {
                // Updates the associated cell's value
                complete: function(editor, newValue, oldValue){
                    this.boundEl.dom.input.value = newValue;
                    if (newValue != oldValue) {
                        // Applies a visual effect when value has been modified
                        this.boundEl.highlight();
                    }
                }
            }
        });
        
        //return editor;
        
    }  // end of createEditor
});

// Stores references to the data store, combo box and editor for each data element
Catalis.ControlFieldsPanel.DataElements = {};

// Do we need a new class, or may just pass the options to the constructor?
Catalis.CodedDataCombo = Ext.extend(Ext.form.ComboBox, {
    mode: 'local'
    ,editable: false  // should be editable for long lists, such as country and language?
    ,forceSelection: true
    ,valueField: 'code'
    //,typeAhead: true
    //,selectOnFocus: true
    ,triggerAction: 'all'
    //,hideTrigger: true
    //,shadow: false
    ,lazyRender: true  // docs say: "should always be used when rendering into an Ext.Editor"
    ,displayField: 'description' // needed to select when typing (if editable = true)
    // BUG? when typing (filtering), the store is made shorter (and remains shorter!) Maybe again
    // related to calling .expand() istead of clicking the combo.
    //,tpl: '<tpl for="."><div class="x-combo-list-item">{description}</div></tpl>'
    //,listClass: 'x-combo-list-small'
    
    ,width: 330  // ???  auto adjust?

    // I'd like to hide the combo's input + trigger element, that is, display only the list.
    // But how?
    //onRender : function(ct, position){
    //    Catalis.CodedDataCombo.superclass.onRender.call(this, ct, position);
    //}
});


// Anonymous function that creates and loads data stores with MARC data.
// TO-DO: load the stores only when the component is first used?
(function(){

    // Fixed field codes (leader and 008)
    var xmlFixedFieldRecordDef = Ext.data.Record.create([
        {name: 'pos', mapping: '@pos'},
        {name: 'shortname', mapping: '@shortname'},
        {name: 'name', mapping: '@name'},
        {name: 'label-eng', mapping: '@label-eng'},
        {name: 'multiple', mapping: '@multiple'},
        {name: 'options', mapping: 'option'}  // ??
    ]);
    Catalis.MarcData.biblio.FixedField = new Ext.data.Store({
        proxy: Catalis.MarcData.createProxy('biblioFixedField.xml'),
        reader: new Ext.data.XmlReader({
            record: 'dataElement',
            id: '@pos'
        }, xmlFixedFieldRecordDef),
        listeners: {
            loadexception: function(){
                Ext.Msg.alert("Error", "biblio.FixedField load exception");
            } 
        }
    });
    Catalis.MarcData.biblio.FixedField.load();
    
    Catalis.MarcData.auto.FixedField = new Ext.data.Store({
        proxy: Catalis.MarcData.createProxy('autoFixedField.xml'),
        reader: new Ext.data.XmlReader({
            record: 'dataElement',
            id: '@pos'
        }, xmlFixedFieldRecordDef),
        listeners: {
            loadexception: function(){
                Ext.Msg.alert("Error", "auto.FixedField load exception");
            } 
        }
    });
    Catalis.MarcData.auto.FixedField.load();

    // Language codes
    var xmlLanguageRecordDef = Ext.data.Record.create([
        {name: 'code'},
        {name: 'name'}
    ]);
    Catalis.MarcData.codes.language = new Ext.data.Store({
        proxy: Catalis.MarcData.createProxy('language.xml'),
        reader: new Ext.data.XmlReader({
            record: 'language',
            id: '@code'
        }, xmlLanguageRecordDef),
        listeners: {
            'loadexception': function(){
                Ext.Msg.alert("Error", "codes.language load exception");
            }
        }
    });
    Catalis.MarcData.codes.language.load();

    // Country codes
    var xmlCountryRecordDef = Ext.data.Record.create([
        {name: 'code'},
        {name: 'name'}
    ]);
    Catalis.MarcData.codes.country = new Ext.data.Store({
        proxy: Catalis.MarcData.createProxy('country.xml'),
        reader: new Ext.data.XmlReader({
            record: 'country',
            id: '@code'
        }, xmlCountryRecordDef),
        listeners: {
            'loadexception': function(){
                Ext.Msg.alert("Error", "codes.country load exception");
            }
        }
    });
    Catalis.MarcData.codes.country.load();
})();  // end of anonymous function
