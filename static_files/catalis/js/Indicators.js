/**
 * This class represents the pair of indicators in a MARC data field.
 *
 * Each pair of indicators has an associated DOM node, and methods that allow
 * getting and setting indicator values, as well as opening the dialog to edit values.
 *
 * The constructor expects to receive two parameters:
 *
 * @param {String} values The pair of initial values for these indicators.
 * @param {String} field The Catalis.DataField object to which these indicators belong.
 */

Catalis.Indicators = function(config) {
    Ext.apply(this, config);
    
    this.node = document.createElement('div');
    Ext.fly(this.node).addClass('indicators');
    this.node.innerHTML = '<span class="ind">' + this.values.substr(0,1) + '</span>' +
                          '<span class="indSeparator">|</span>' +
                          '<span class="ind">' + this.values.substr(1,1) + '</span>';
};
    
Catalis.Indicators.prototype = {
    
    /**
     * @return {String} The value of the first indicator.
     */
    getFirst : function() {
        return this.getBoth().substr(0,1);
    },
    
    /**
     * @return {String} The value of the second indicator.
     */
    getSecond : function() {
        return this.getBoth().substr(1,1);
    },
    
    /**
     * @return {String} The two indicator values concatenated.  
     */
    getBoth : function() {
        var ind = '';
        this.getEl().select('.ind').each(function(i) {
            ind += i.dom.innerHTML;
        });
        return ind;
    },
    
    /**
     * @param {String} value
     */
    setFirst : function(value) {
        this.getEl().select('.ind').first().update(value);
    },
    
    /**
     * @param {String} value
     */
    setSecond : function(value) {
        this.getEl().select('.ind').last().update(value);
    },
    
    /**
     * @param {String} values
     */
    setBoth : function(values) {
        this.setFirst(values.substr(0,1));
        this.setSecond(values.substr(1,1));
    },
    
    /**
     *
     */
    edit : function() {
        Catalis.Indicators.showDialog(this);
    }
};

/**
 * Returns the default values for the indicators in field <tt>tag</tt>.
 * 
 * @param tag
 * @static
 */
Catalis.Indicators.getTemplate = function(tag) {
    return Catalis.DataField.getTemplate(tag).substr(0,2);
};
