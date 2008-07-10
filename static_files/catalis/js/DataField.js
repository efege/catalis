/**
 * DataField
 *
 * Related stores: Catalis.MarcData.biblio.DataFields, Catalis.MarcData.auto.DataFields
 *
 * Config:
 *    Config.REGEX_SYSTEM_SUBFIELD_DELIMITER
 *
 * Does a field object need to know what type of record (biblio/auto) it lives in?
 * We need something like that to get the "field template" from the appropriate XML doc!
 */
 
/**
 * @constructor
 *
 * @cfg {String} tag The field's tag.
 * @cfg {String} ind1 The field's first indicator value. 
 * @cfg {String} ind2 The field's second indicator value.
 * @cfg {String} subfields The field's subfields, e.g. "^aOne,^bTwo,^cThree."
 */
Catalis.DataField = function(config) {

    Ext.apply(this, config);
    
    var Config = {};
    Config.REGEX_SYSTEM_SUBFIELD_DELIMITER = '^';
    
    this.subfields = this.subfields || this.getTemplate().substr(2).split('');  // "abc" => ["a", "b", "c"]
    if (typeof this.subfields == "string") {
        this.subfields = this.subfields.split(Config.REGEX_SYSTEM_SUBFIELD_DELIMITER);   // "a^b^c" => ["a", "b", "c"]
    }
    this.createNode();
};

Catalis.DataField.menu = undefined;

Catalis.DataField.prototype = {

    /**
     * Creates the DOM node for this data field.
     * This approach uses just DOM and no panels, and closely follows the original Catalis version.
     */
    createNode : function() {
        
        var thisField = this;  // trick to solve scope problems
        
        this.node = document.createElement('tr');
        
        // Tag
        this.node.tagCell = document.createElement('td');
        this.node.appendChild(this.node.tagCell);
        Ext.fly(this.node.tagCell).addClass('tagCell');
        this.node.tagCell.innerHTML = '<div>' + this.tag + '</div>';
        Ext.fly(this.node.tagCell).on('click', function(){  // TO-DO: add listener to DIV
            this.showMenu();
        }, thisField);
     
        // Indicators
        this.node.indCell = document.createElement('td');
        this.node.appendChild(this.node.indCell);
        Ext.fly(this.node.indCell).addClass('indCell');
        this.node.indCell.appendChild(new Catalis.Indicators({
            values: this.ind || Catalis.Indicators.getTemplate(this.tag),  // OR: Catalis.DataField.getTemplate(this.tag).indicators
            field: this
        }).node);
     
        // Subfields
        this.node.subfieldsCell = document.createElement('td');
        this.node.appendChild(this.node.subfieldsCell);
        Ext.fly(this.node.subfieldsCell).addClass('subfieldsCell');
        this.subfieldsContainer = document.createElement('tbody');
        var table = document.createElement('table');
        table.cellSpacing = 0;
        table.appendChild(this.subfieldsContainer);
        this.node.subfieldsCell.appendChild(table);
        Ext.each(this.subfields, function(subfield) {
            subfield = Ext.apply(Catalis.Subfield.normalize(subfield), {field: this});  // subfield is put into the form {code: '..', value: '..', field: DataField}
            this.subfieldsContainer.appendChild(new Catalis.Subfield(subfield).node);
        }, this);
    },
    
    
    /**
     * Displays this field, inserting its DOM node in the document.
     *
     * @param {DataField} refField (optional) The field before which this field must be inserted.
     */
    display : function(refField) {
        // First find which field block our field belongs to.
        // Should this be a property of DataField that we set at initialization time? 
        var blockID = 'block-' + FieldManager.getFieldBlockName(this.tag);
        //var block = Ext.getCmp(blockID);
        var block = document.getElementById(blockID);
        
        if (refField) {
            // Field's position is determined based on refField.
            var refIndex = block.getDatafields().indexOf(refField);
            block.insert(refIndex, this);
        } else {
            // Field's position is determined based on its tag.
            var newPos = block.findNewFieldPosition(this.tag);
            block.insert(newPos, this);
        }
        block.doLayout();
    }
    
};

// This *has* to be a static method, so that it can be called from Indicators.js,
// unless we use the fact that an instance of Indicators has a reference to an
// instance of DataField.
Catalis.DataField.getTemplate = function(tag) {
    //return MARC21Store.getById(tag).node.getAttribute('template');
    return Catalis.MarcData[type].DataFields.getById(tag).data.template;
};
