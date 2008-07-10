/**
 * Tratamos de no usar Ext aquí ?
 */


Catalis.MarcRecord = function(config) {
    this.leader = config.leader;
    this.controlFields = config.controlFields;
    this.dataFields = config.dataFields;
};

Catalis.MarcRecord.prototype = {
    /**
     * @param {String} tag
     * @return {Boolean}
     */
    hasTag: function(tag) {
        for (var i = 0, len = this.dataFields.length; i < len; i++) {
            if (this.dataFields[i].tag == tag) {
                return true;
            }
        }
        return false;
    },
    
    /**
     * @param {String} what
     * @return {Array}
     */
    get: function(what) {
        // options: what = 'ttt' or what = 'ttt$c'
        var re = /^(\d\d\d)(\$(\w))?$/;
        var match = re.exec(what);
        if (match[1]) {
            var tag = match[1];
            var matchingFields = [];
            for (var i = 0, len = this.dataFields.length; i < len; i++) {
                if (this.dataFields[i].tag == tag) {
                    matchingFields.push(this.dataFields[i]);
                }
            }
            for (var i = 0, len = this.controlFields.length; i < len; i++) {
                if (this.controlFields[i].tag == tag) {
                    matchingFields.push(this.controlFields[i]);
                }
            }
            
            if (match[3]) {
                var code = match[3];
                var matchingSubfields = [];
                for (var i = 0, len = matchingFields.length; i < len; i++) {
                    matchingSubfields = Catalis.MarcRecord.getByCode(matchingFields[i], code);
                }
                return matchingSubfields;
            } else {
                return matchingFields;
            }
        }
    },
    
    getMaterialType: function() {
        // Cómo interpretar las posiciones 18-34 del campo 008, en base a los valores         // LDR/O6 y LDR/07.        // Llamada desde Catalis y desde el OPAC, pues la necesitamos en marc2aacr().        
        // Documentación:        // http://www.loc.gov/marc/formatintegration.html        // http://www.oclc.org/bibformats/en/introduction/default.shtm        // http://www.loc.gov/marc/marbi/2002/2002-dp02.html
            	// (v906='a' and not 'b~s':v907) or v906='t' --> BK    	// [pft]else if 'c~d~i~j':v906 then[/pft] --> MU    	// [pft]else if v906='m' then[/pft] --> CF    	// [pft]else if 'g~k~o~r' : v906 then[/pft] --> VM    	// [pft]else if v906='a' and 'b~s':v907 then[/pft] --> CR    	// [pft]else if 'e~f' : v906 then[/pft] --> MP    	
    	var materialType;
    	
    	var leader06 = this.leader.substr(6,1);
    	var leader07 = this.leader.substr(7,1);
    	
    	if ( ( leader06.search(/[at]/) != -1 && leader07.search(/[bis]/) == -1) )
    		materialType = "BK";   // BK = books (also manuscripts)    
    	else if ( "a" == leader06 && leader07.search(/[bis]/) != -1 )
    		materialType = "CR";   // CR = continuing resource / serial    
    	else if ( leader06.search(/[cdij]/) != -1 )
    		materialType = "MU";   // MU = music (scores & recordings) & nonmusical sound recording    
    	else if ( leader06.search(/[ef]/) != -1 )
    		materialType = "MP";   // MP = maps    
    	else if ( leader06.search(/[gkor]/) != -1 )
    		materialType = "VM";   // VM = visual materials    
    	else if ( leader06.search(/m/) != -1 )
    		materialType = "CF";   // CF = computer files    
    	else if ( leader06.search(/p/) != -1 )
    		materialType = "MIX";  // MIX = mixed materials    
    	else
    		materialType = "??";
    	
    	return materialType;
    },
    
    displayMARC: function() {
        return Catalis.util.MARC21.marcDisplay(this);
    },
    
    displayAACR: function() {
        return Catalis.util.AACR2.aacrDisplay(this);
    }
};


// Esto debiera ser un método de un objeto DataField "puro". Se usa en AACR2.js 
Catalis.MarcRecord.getByCode = function(field, code) {
    var split = field.subfields.substr(1).split(/\^/);
    var list = [];
    for (var i = 0; i < split.length; i++) {
        if (split[i].substr(0,1) == code) {
            list.push(split[i].substr(1));
        }
    }
    return list;
};
