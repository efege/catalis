/**
 * AACR2
 */

/*
    TO-DO (may 2008)
        - refactor as a method of class Catalis.Record, or assuming the same input as the
          MARC tagged function:
          {leader: '...', controlFields: [...], dataFields: [...]}
        - tomar Config como un parámetro de entrada (para no depender de un objeto global)
        
        - Dividir en funciones más pequeñas
        
        - Referencias a "bibima" en campo 510 (2 veces):
             - ( "bibima" == Status.biblio.db.name ) ? "Reseña: " 
*/

 
Catalis.util.AACR2 = function(){

    // Global for this module
    var config = {
        MAIN_ENTRY_TOP: true
        ,DISPLAY_CALL_NUMBER: true
        ,REGEX_SUBDIV: /\^a|\^x|\^y|\^z|\^v/g                // subdiv. en campos 6xx; ^a puede aparecer en 653
        ,REGEX_CTRL_SF: /\^4\w\w\w|\^5\w+|\^6[^\^]+|\^8/g    // subcampos de control (o más bien, numéricos), que no se visualizan. TO-DO: revisar (¿ponemos el ^0? ¿el ^4?).
        ,NEW_NOTE: "</div><div class='aacrNote'>"
        // Separador de áreas. Son equivalentes: &mdash; &#8212; &#x2014; \u2014        // ATENCION: de acuerdo con OCLC, el separador debe usarse sólo cuando el        // código Desc (Leader/18) es "a" o "i". Véase http://www.oclc.org/bibformats/en/fixedfield/desc.shtm
        ,LONG_DASH: "<span class='mdash'>&mdash;</span>"
        // El uso de espacios para la indentación, y de "\r\n", se debe a que        // queremos poder copiar el innerText de la ventana con la ficha, y pegarlo        // en un procesador de texto, preservando tanto como sea posible el formato        // visual.
        ,INDENT_SPACE: "   "    };
    config.REGEX_INDENT = new RegExp(config.INDENT_SPACE,"g");
    

    // -----------------------------------------------------------------------------
    var arabic2Roman = function(arabic) {
    // Código tomado de http://www.roman-britain.org/a2r.htm
    // -----------------------------------------------------------------------------
    /* Note: this function requires custom style-sheet values for <SPAN> */
    /* fncArabic2Roman variables */
        var RomanI = ["","I","II","III","IV","V","VI","VII","VIII","IX"];
        var RomanX = ["","X","XX","XXX","XL","L","LX","LXX","LXXX","XC"];
        var RomanC = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM"];
        var RomanM = ["","M","MM","MMM","<SPAN>IV</SPAN>","<SPAN>V</SPAN>","<SPAN>VI</SPAN>","<SPAN>VII</SPAN>","<SPAN>VIII</SPAN>","<SPAN>IX</SPAN>"];
        var arabicString = new String(arabic);
        var romanString = new String("");
        var aLen = arabicString.length;
        var n = 1;
        while (n <= aLen) {
            var i = aLen - n;
            var s = parseInt(arabicString.charAt(i));
            if (n == 1) { romanString = RomanI[s]; }
            if (n == 2) { romanString = RomanX[s]+romanString; }
            if (n == 3) { romanString = RomanC[s]+romanString; }
            if (n == 4) { romanString = RomanM[s]+romanString; }
            n++;
        }
        return romanString;
    };


    // -----------------------------------------------------------------------------
    var extractSubfield = function(field,sfCode) {
    //    Extracción de un subcampo. Por ejemplo,
    //        extractSubfield(fields_byTag["856"][0],"u")
    //    equivale a lo que en ISIS sería
    //        v856^u[1]
    //
    //    TO-DO: usar el tag y la ocurrencia del campo como parámetros.
    // -----------------------------------------------------------------------------
        var theSubfield = "";
        // ATENCION: 2004/03/08  split(/\^(?=\w)/) --> split(/\^/) por compatib. con IE 5.0
        var tmpSubfields = field.substr(3).split(/\^/);
        for (var i=0; i < tmpSubfields.length; i++) {
            if ( tmpSubfields[i].substr(0,1) == sfCode ) {
                theSubfield = tmpSubfields[i].substr(1);
                break;
            }
        }
        return theSubfield;
    };

    var getByCode = Catalis.MarcRecord.getByCode;
    
    
    // -----------------------------------------------------------------------------
    var fieldHighlight = function(tag,className) {
    // TO-DO: eliminar espacio en blanco que queda cuando className es vacío.
    // -----------------------------------------------------------------------------
        var myString = "";
        if ( config.AACR_FIELD_HL ) {
            myString += " title='Campo " + tag + "'";
            myString += " onmouseover='this.className=\"" + className + " aacrHighlight\"'";
            myString += " onmouseout='this.className=\"" + className + " aacrLowlight\"'";
        }
        return myString;
    };


    // -----------------------------------------------------------------------------
    var newNote = function(tag) {
    // Código HTML para cerrar un párrafo de nota y abrir uno nuevo.
    // -----------------------------------------------------------------------------
        return "</div>\n<div class='aacrNote aacrLowlight'" + fieldHighlight(tag,"aacrNote") + ">";
    };


    // TO-DO: ver sortEjemplares() en HoldingsEditor.js
    //--------------------------------------------------------
    var sortEjemplares = function(ej1,ej2) {
    //--------------------------------------------------------
        if ( ej1["3"] && ej2["3"] && ej1["3"] < ej2["3"] )
            return -1;
        if ( ej1["3"] && ej2["3"] && ej1["3"] > ej2["3"] )
            return 1;
        // A igual parte, ordenamos por número de ejemplar
        var n1 = ej1["t"] ? ej1["t"].replace(/\D/g,"") : "";
        var n2 = ej2["t"] ? ej2["t"].replace(/\D/g,"") : "";
        return n1 - n2;
    }


    // -----------------------------------------------------------------------------
    var printCallNumber = function(ejemplar) {
    // Devuelve la signatura topográfica correspondiente a 'ejemplar'.
    // -----------------------------------------------------------------------------
        var callNumber = "";
        if ( ejemplar["k"] ) {
            callNumber += ejemplar["k"] + "<br>";
        }
        if ( ejemplar["h"] ) {
            callNumber += ejemplar["h"] + "<br>";
        }
        if ( ejemplar["i"] ) {
            callNumber += ejemplar["i"].replace(/\s+/g,"<br>") + "<br>";
        }
        callNumber += "<br style='line-height: 0.7em;'>";
        return callNumber;
    };


    return {
        /*
         * @param {Object} fields The record's fields, with this structure:
         *                        {leader: '...', controlFields: [...], dataFields: [...]}
         * @return {String} HTML display
         */
        aacrDisplay: function(record) {
        //  Los campos de control 001 y 008 se usan, respectivamente, para mostrar
        //  el número de registro y para mostrar la frecuencia de una publicación
        //  seriada cuando no hay campo 310.
        //
            // TO-DO: ¿registrar los onmouseover & onmouseout vía JavaScript, sin usar
            // atributos HTML? Considerar *opcional* el resaltado onmouseover.
            
            var ejemplares = ejemplares || [];  // default value
            

            // Aquí almacenamos el texto (HTML) que va siendo generando.
            // TO-DO: ¿usar métodos DOM en lugar de un string HTML?
            var description = "";
            var tracing = "";

            // fields_byTag es un array donde se almacenan los campos de datos,
            // agrupando las ocurrencias de un mismo tag (y por lo tanto, alterando
            // posiblemente el orden original).
            var fields_byTag = [];
            for (var i = 0, len = record.dataFields.length; i < len; i++) {
                var tag = record.dataFields[i].tag;
                if ( !fields_byTag[tag] ) {
                    fields_byTag[tag] = [];
                }
                fields_byTag[tag].push(record.dataFields[i].subfields) // FIXME -- add indicators
            }

            // fields_inOrder es un array donde se almacenan los campos de datos,
            // preservando el orden original (i.e., independientemente de los tags)
            var fields_inOrder = record.datafields;


            // ---------------------------------------------------------
            // Campos 1xx: main entry heading
            // ---------------------------------------------------------
            var mainEntryTag = "";
            if ( record.hasTag("100") ) {
                mainEntryTag = "100";
            } else if ( record.hasTag("110") ) {
                mainEntryTag = "110";
            } else if ( record.hasTag("111") ) {
                mainEntryTag = "111";
            } else if ( record.hasTag("130") ) {
                mainEntryTag = "130";
            }

            if ( "" != mainEntryTag ) {
                var mainEntryHeading = record.get(mainEntryTag)[0].subfields.replace(config.REGEX_CTRL_SF,"").replace(/\^0.+$/,"").replace(/\^\w/g," ");
                if ( config.MAIN_ENTRY_TOP ) {
                    description += "<div class='mainEntryHeading'" + fieldHighlight(mainEntryTag) + ">";
                    description += mainEntryHeading;
                    description += "</div>\n\n";
                }
            }


            /*if ( fields_byTag["100"] || fields_byTag["110"] || fields_byTag["111"] || fields_byTag["130"] )
            {
                description += "\r\n";
            }*/


            // ---------------------------------------------------------
            // Campo 240 (título uniforme)
            // ATENCION: Dado que el título uniforme cumple una función relacionada
            // con el *acceso*, quizás debamos (en una visualización opcional que no destaca
            // el main entry) generar un punto de acceso por nombre/título (1xx/240).
            // ---------------------------------------------------------
            if ( record.hasTag("240") && "1" == record.get("240")[0].ind1 && config.MAIN_ENTRY_TOP ) {
                description += "<div class='uniformTitle'" + fieldHighlight("240") + ">";
                description += config.INDENT_SPACE + "[" + record.get("240")[0].subfields.replace(config.REGEX_CTRL_SF,"").replace(/\^\w/g," ") + "]";
                description += "</div>\n\n";
            }


            // -------------------------------------------------------------
            // Begin bibliographic description
            // -------------------------------------------------------------

            description += "<div class='Description'>\n";

            // ---------------------------------------------------------
            // Campo 245
            // ---------------------------------------------------------
            description += "<div class='aacrTitleParagraph'>";
            if ( record.hasTag("245") ) {
                description += "<span " + fieldHighlight("245") + ">";
                description += config.INDENT_SPACE + record.get("245")[0].subfields.replace(config.REGEX_CTRL_SF,"").replace(/\^\w/g," ");
                description += "</span>";
            }

            if ( record.hasTag("250") ) {
                description += " " + config.LONG_DASH + " ";
                description += "<span " + fieldHighlight("250") + ">";
                description += record.get("250")[0].subfields.replace(/\^\w/g," ");
                description += "</span>";
            }

            // ----------------------------------------------------------
            // 362 - Dates of publication and/or sequential designation
            // OCLC: If field 362 begins with a hyphen, the print program supplies three spaces preceding the hyphen.
            // If field 362 ends with a hyphen, the print program supplies three spaces after the hyphen.
            // ----------------------------------------------------------
            if ( record.hasTag("362") && "0" == record.get("362")[0].ind1 ) {
                //TO-DO: es Repetible
                description += " " + config.LONG_DASH + " ";
                description += "<span " + fieldHighlight("362") + ">";
                description += record.get("362")[0].subfields.replace(/\^\w/g," ").replace(/-$/,"-&nbsp;&nbsp;&nbsp;&nbsp;").replace(/^-/,"&nbsp;&nbsp;&nbsp;&nbsp;-");
                description += "</span>";
                description += ".";
            }

            if ( record.hasTag("254") ) {
                description += " " + config.LONG_DASH + " ";
                description += "<span " + fieldHighlight("254") + ">";
                description += fields_byTag["254"][0].substr(2).replace(/\^\w/g," ");
                description += "</span>";
            }

            if ( record.hasTag("255") ) {   // TO-DO: Repetible
                description += " " + config.LONG_DASH + " ";
                description += "<span " + fieldHighlight("255") + ">";
                description += fields_byTag["255"][0].substr(2).replace(/\^\w/g," ");
                description += "</span>";
            }

            if ( record.hasTag("256") ) {
                description += " " + config.LONG_DASH + " ";
                description += "<span " + fieldHighlight("256") + ">";
                description += fields_byTag["256"][0].substr(2).replace(/\^\w/g," ");
                description += "</span>";
            }

            if ( record.hasTag("260") ) {   // TO-DO: Repetible
                description += " " + config.LONG_DASH + " ";
                description += "<span" + fieldHighlight("260") + ">";
                description += fields_byTag["260"][0].substr(2).replace(/\^\w/g," ");
                description += "</span>";
            }
            
            
            
            if ( !record.hasTag("300") && record.hasTag("773") ) {
                description += "</div>";
            }

            // ---------------------------------------------------------------------------
            // Descripción física
            // TO-DO: campo 300 es repetible
            // ---------------------------------------------------------------------------
            if ( record.hasTag("300") ) {
                if ( record.hasTag("773") ) {   // ATENCION: ¿miramos 773 o leader/07?
                    description += " " + config.LONG_DASH + " ";
                }
                else {
                    description += "</div>"   // cierra el titleParagraph para no-analíticas
                    description += "<div class='aacrPhysDescParagraph'>"
                    description += config.INDENT_SPACE;
                }
                description += "<span " + fieldHighlight("300") + ">";
                
                // OCLC: [BKS, SER, VIS, MAP, REC, SCO, COM] The print program provides three
                // leading spaces if subfield ‡a does not contain a number.
                var subfield_a = record.get("300$a")[0];
                if ( subfield_a != "" && subfield_a.replace(/\D/g,"") == "" ) {
                    description += "&nbsp;&nbsp;&nbsp;";
                }
                description += record.get("300")[0].subfields.replace(/\^\w/g," "); // 300$3 se deja como viene
                description += "</span>";
                if ( record.hasTag("773") ) {
                    description += "</div>";   // cierra el titleParagraph para analíticas
                }
                
                //description += (fields_byTag["773"]) ? " \u2014 " : "\r\n" + config.INDENT_SPACE;
                /*
                if (fields_byTag["300"][0].search(/\^a\d|\^ai|\^av|\^ax|\^al/i) == -1)
                {
                    // TO-DO: mejorar esta expresión regular para detectar "números"
                    description += config.INDENT_SPACE;
                }
                */
            }
            

            // ---------------------------------------------------------------------------
            // Serie (campos 4xx, en orden de aparición)
            // ---------------------------------------------------------------------------
            if ( record.hasTag("440") || record.hasTag("490") ) {
                description += " " + config.LONG_DASH;
            }

            for (var i = 0, len = record.dataFields.length; i < len; i++)  {
                var tag = record.dataFields[i].tag;
                if ( tag.substr(0,1) == "4" ) {
                    description += " (";
                    description += "<span " + fieldHighlight(tag) + ">";
                    description += record.dataFields[i].subfields.replace(/\^x/," ISSN^x").replace(config.REGEX_CTRL_SF,"").replace(/\^\w/g," ");
                    description += "</span>";
                    description += ")";
                }
            }

            if ( !record.hasTag("773") ) {
                description += "</div>\n";  // cierra el physDescParagraph para no-analíticas
            }


            // ---------------------------------------------------------------------------
            // NOTAS: campos 5xx, más algunos otros.
            // Ver http://www.oclc.org/bibformats/en/5xx/ para el orden de impresión
            // sugerido por OCLC.
            // ---------------------------------------------------------------------------

            description += "<div class='aacrNotesParagraphs'>";
            description += "<div class='_aacrNote'>";  // para abrir la 1ra nota (¿aún es necesario? Parece que sí, en base a la definición de NEW_NOTE)


            // ---------------------------------------------------------------------------
            // Campo 773: "In" analytics
            // TO-DO: si hay subcampo $w, ¿tenemos que solicitar los datos del host al
            // servidor?
            // ---------------------------------------------------------------------------
            if ( record.hasTag("773") && record.get("773")[0].ind1 == "0" ) {
                // TO-DO: 773 es repetible
                description += newNote("773") + config.INDENT_SPACE + "<span class='displayConstant'>En:</span> ";
                var subfieldArray = record.get("773")[0].subfields.split(/\^/);
                
                // Averiguamos posición del subcampo $t
                var tPosition = -1;
                for (var i=0; i < subfieldArray.length; i++) {
                    var code = subfieldArray[i].substr(0,1);
                    if ( "t" == code ) {
                        tPosition = i; break;
                    }
                }
                // Presentamos los subcampos
                for (var i=0; i < subfieldArray.length; i++) {
                    var code = subfieldArray[i].substr(0,1);
                    if ( code.search(/[hmnruwyz7]/) == -1 ) {
                        if ( tPosition > -1 && i > tPosition ) {
                            description += config.LONG_DASH + " ";
                        }
                        if ( "z" == code ) {
                            description += "ISBN ";
                        } else if ( "x" == code ) {
                            description += "ISSN ";
                        }
                        description += subfieldArray[i].substr(1) + " ";
                    }
                }
            }
            

            // ----------------------------------------------------------
            // 310 - Current publication frequency 
            // 321 - Former publication frequency
            // ----------------------------------------------------------
            // OCLC añade paréntesis alrededor de las fechas en el subcampo $b del 310 y del 321: replace(/\^b(.+)/,"^b($1)")
            
            if ( record.hasTag("321") || record.hasTag("310") ) {
                description += newNote("321 y/o 310") + config.INDENT_SPACE;
                
                if ( record.hasTag("321") ) {
                    for (var i = 0, len = record.get("321").length; i < len; i++) {
                        if ( i > 0 ) {
                            description += "; ";
                        }
                        description += record.get("321")[i].subfields.replace(/-$/,"-&nbsp;&nbsp;&nbsp;").replace(/\^\w/g," ");
                    }
                }
                
                if ( record.hasTag("310") ) {
                    if ( record.hasTag("321") ) {
                        description += "; ";
                    }
                    description += record.get("310")[0].subfields.replace(/-$/,"-&nbsp;&nbsp;&nbsp;").replace(/\^\w/g," ");
                }
                
                if ( description.charAt(description.length - 1).search(/\.|!|\?/) == -1 ) {
                    description += ".";
                }
            }

            // OCLC: If a record has no 310 field, the print program supplies a frequency
            // note based on the Freq code. (006/01 ??)
            if ( "CR" == record.getMaterialType() && !record.hasTag("310") ) {
                var freqCode = record.get("008")[0].value.substr(18,1);
                var frequency = "";
                switch ( freqCode ) {
                    case "#" : frequency = "Irregular"; break;
                    case "a" : frequency = "Annual"; break;
                    case "b" : frequency = "Bimonthly"; break;
                    case "c" : frequency = "Semiweekly"; break;
                    case "d" : frequency = "Daily"; break;
                    case "e" : frequency = "Biweekly"; break;
                    case "f" : frequency = "Semiannual"; break;
                    case "g" : frequency = "Biennial"; break;
                    case "h" : frequency = "Triennial"; break;
                    case "i" : frequency = "Three times a week"; break;
                    case "j" : frequency = "Three times a month"; break;
                    case "m" : frequency = "Monthly"; break;
                    case "q" : frequency = "Quarterly"; break;
                    case "s" : frequency = "Semimonthly"; break;
                    case "t" : frequency = "Three times a year"; break;
                    case "w" : frequency = "Weekly"; break;
                    // If you use u or z, no frequency note prints.
                }
                if ( frequency != "" ) {
                    description += newNote("008/18") + config.INDENT_SPACE;
                    description += frequency + "."; 
                }
            }
            

            // ----------------------------------------------------------
            // 362 - Dates of publication and/or sequential designation
            // ----------------------------------------------------------
            // OCLC: If the 1st indicator value is 1, field 362 prints as a note.
            // Print following the frequency note (Freq or fields 310 and 321).
            // If there is no frequency note, field 362 prints as the first note.
            if ( record.hasTag("362") && "1" == record.get("362")[0].ind1 ) {
                description += newNote("362") + config.INDENT_SPACE;
                description += record.get("362")[0].subfields.replace(/\^\w/g," ").replace(/-$/,"-&nbsp;&nbsp;&nbsp;&nbsp;").replace(/^-/,"&nbsp;&nbsp;&nbsp;&nbsp;-");
                //description += "."; (se supone que el punto es parte del campo cuando va como nota)
            }
            
            
            // ---------------------------------------------------------------------------
            // Campo 246: Notas de variantes de título
            // Las traducciones al español de las display constants están tomadas de la
            // edición colombiana de las Reglas.
            // TO-DO: si hay más de un 246, agruparlos en base al valor del 2do indicador
            // (ver OCLC). Encabezan la lista ind2 = 0, seguido por ind2 = 1.
            // ---------------------------------------------------------------------------
            
            if ( record.hasTag("246") ) {
                for (var i = 0; i < record.get("246").length; i++) {
                    //if (fields_byTag["246"][i].substr(0,1).search(/[01]/) != -1 && fields_byTag["246"][i].substr(1,1).search(/[#2345678]/) != -1)
                    var indicators = record.get("246")[i].ind1 + record.get("246")[i].ind2; 
                    if ( indicators.search(/[01][#2-8]/) != -1 ) {
                        description += newNote("246") + config.INDENT_SPACE;
                        var displayConstant = "";
                        switch ( record.get("246")[i].ind2 ) {
                            case "2" :
                                displayConstant = "Distinctive title: ";  // Distinctive title
                                break;
                            case "3" :
                                displayConstant = "Otro título: ";  // Other title
                                break;
                            case "4" :
                                displayConstant = "Título de la cubierta: ";  // Cover title
                                break;
                            case "5" :
                                displayConstant = "Título de la portada adicional: ";  // Added title page title
                                break;
                            case "6" :
                                displayConstant = "Título de partida: ";  // Caption title
                                break;
                            case "7" :
                                displayConstant = "Titulillo: ";  // Running title
                                break;
                            case "8" :
                                displayConstant = "Título del lomo: ";  // Spine title
                                break;
                        }
                        description += "<span class='displayConstant'>" + displayConstant + "</span>";
                        // TO-DO: subcampo $i en italics
                        description += record.get("246")[i].subfields.replace(/\^[g5][^\^]+/g,"").replace(/\^f/,", ").replace(/\^i([^\^]+)/,"^i<span class='displayConstant'>$1</span>").substr(2).replace(/\^\w/g," ");
                        
                        if ( description.charAt(description.length - 1).search(/[-\.!\?]/) == -1 ) {
                            description += ".";
                        }
                    }
                }
            }

            // Field 247 Former title - Second indicator must be 0
            // OCLC: Subfields ‡g and ‡x do not print.
            if ( record.hasTag("247") && "0" == record.get("247")[0].ind2 ) {
                description += newNote("247") + config.INDENT_SPACE;
                description += "<span class='displayConstant'>" + "Título varía: " + "</span>";
                description += record.get("247")[0].subfields.replace(/\^f/,",^f").replace(/\^\w/g," ");
                if ( description.charAt(description.length - 1) != "-" ) {
                    description += ".";
                }
            }
            
            // Field 028 Publisher number - First indicator must be 0 or 1, Second indicator must be 1 or 2
            // Field 307 Hours, etc.
            
            // ---------------------------------------------------------------------------
            // Campos 5xx, en orden de aparición (recorremos todos los campos, y
            // tomamos sólo los 5xx).
            // ---------------------------------------------------------------------------
            for (var i = 0, len = record.dataFields.length; i < len; i++)  {
                if ( record.dataFields[i].tag.substr(0,1) == "5" ) {
                    var field = record.dataFields[i];
                    var tag = field.tag;
                    var ind1 = field.ind1;
                    var ind2 = field.ind2;
                    var subfields = field.subfields;
                    
                    description += newNote(tag) + config.INDENT_SPACE;
                    var displayConstant = "";
                    
                    // Casos especiales: pueden llevar una display constant controlada
                    // desde un indicador.
                    switch (tag) {
                        
                        case "505" :   // Formatted contents note
                            // TO-DO: uso de más de un 505
                            switch ( ind1 ) {
                                case "0" :
                                    displayConstant = "Contenido: "; // Contents
                                    break;
                                case "1" :
                                    displayConstant = "Contenido incompleto: "; // Incomplete contents (OCLC muestra 'Contents:')
                                    break;
                                case "2" :
                                    displayConstant = "Contenido parcial: "; // Partial contents
                                    break;
                            }
                            // TO-DO: concatenar campos 505 si hay más de uno (?)
                            break;
                        
                        case "508" :   // Creation/production credits note
                            displayConstant = "Créditos: "; // Credits
                            break;
                        
                        case "510" :   // Citation/references note
                            // TO-DO: ver indicaciones de OCLC para cuando hay varios 510.
                            // Duda: indizado o indexado?
                            switch ( ind1 ) {
                                case "0" :
                                    displayConstant = "Indizado por: "; // Indexed by
                                    break;
                                case "1" :
                                    displayConstant = "Indizado en su totalidad por: "; // Indexed in its entirety by
                                    break;
                                case "2" :
                                    displayConstant = "Indizado selectivamente por: "; // Indexed selectively by
                                    break;
                                case "3" :
                                case "4" :
                                    displayConstant = "Referencias: "; // References
                                    break;
                            }
                            break;
                        
                        case "511" :   // Participant or performer note
                            // ATENCION: en OCLC, también se tiene en cuenta el valor de Leader/06 (type of record),
                            // de modo que Leader/06 = j (Musical sound recording) --> No print constant
                            switch ( ind1 ) {
                                case "1" :
                                    displayConstant = "Elenco: "; // Cast
                                    break;
                            }
                            break;
                        
                        case "516" :   // Type of computer file or data note
                            // OCLC: does not print.
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Tipo de archivo: "; // Type of file
                                    break;
                            }
                            break;
                        
                        case "520" :   // Summary, etc.
                            // TO-DO: uso de más de un 505
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Resumen: "; // Summary
                                    break;
                                case "0" :
                                    displayConstant = "Subject: "; // Subject
                                    break;
                                case "1" :
                                    displayConstant = "Reseña: "; // Review
                                    break;
                                case "2" :
                                    displayConstant = "Scope and content: "; // Scope and content
                                    break;
                                case "3" :
                                    displayConstant = "Abstract: "; // Abstract
                                    break;
                            }
                            break;
                        
                        case "521" :   // Target audience note
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Audience: ";
                                    break;
                                case "0" :
                                    displayConstant = "Reading grade level: ";
                                    break;
                                case "1" :
                                    displayConstant = "Interest age level: ";
                                    break;
                                case "2" :
                                    displayConstant = "Interest grade level: ";
                                    break;
                                case "3" :
                                    displayConstant = "Special audience characteristics: ";
                                    break;
                                case "4" :
                                    displayConstant = "Motivation/interest level: ";
                                    break;
                            }
                            break;
                        
                        case "522" :   // Geographic coverage note
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Cobertura geográfica: "; // Geographic coverage
                                    break;
                            }
                            break;
                        
                        case "524" :   // Preferred citation of described materials note
                            // OCLC: does not print.
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Citar como: "; // Cite as
                                    break;
                            }
                            break;
                        
                        case "526" :   // Study program information note
                            switch ( ind1 ) {
                                case "0" :
                                    displayConstant = "Reading program: "; // Reading program
                                    break;
                            }
                            break;
                        
                        case "555" :   // Cumulative index/finding aids note
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Índices: "; // Indexes
                                    break;
                                case "0" :
                                    displayConstant = "Finding aids: "; // Finding aids
                                    break;
                            }
                            break;
                        
                        case "556" :   // Information about documentation note
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Documentación: "; // Documentation
                                    break;
                            }
                            break;
                        
                        case "565" :   // Case file characteristics note
                            // OCLC: does not print.
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "File size: "; // File size
                                    break;
                                case "0" :
                                    displayConstant = "Case file characteristics: "; // Case file characteristics
                                    break;
                            }
                            break;
                        
                        case "567" :   // Methodology note
                            // OCLC: does not print.
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Metodología: "; // Methodology
                                    break;
                            }
                            break;
                        
                        case "581" :   // Publications about described materials note
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Publicaciones: "; // Publications
                                    break;
                            }
                            break;
                        
                        case "586" :   // Awards note
                            switch ( ind1 ) {
                                case "#" :
                                    displayConstant = "Premios: "; // Awards
                                    break;
                            }
                            break;
                        
                        //default : description += fields_inOrder[i].value.substr(2).replace(/\^\w/g," ").replace(/--/g,LONG_DASH);
                    }
                    
                    description += "<span class='displayConstant'>" + displayConstant + "</span>";
                    
                    // El campo 510 es especial porque queremos usarlo para generar un link
                    if ( "510" == tag /*&& "bibima" == Status.biblio.db.name*/ && getByCode(field, "a")[0].search(/^(Math\. Rev\.|MR),$/) != -1 ) {
                        description += "MR, ";
                        var reviewNumbers = getByCode(field, "c")[0].split(/,\s/g);
                        for ( var j = 0; j < reviewNumbers.length; j++ ) {
                            if ( j > 0 ) description += ", ";
                            var mrURL = "http://www.ams.org/mathscinet-getitem?mr=" + reviewNumbers[j].replace(/\s#/,":");
                            description += "<a target='_blank' href='" + mrURL + "' title='Enlace a la reseña en MathSciNet' onclick='window.open(this.href); return false'>";
                            description += reviewNumbers[j];
                            description += "</a>";
                        }
                        if ( "" != getByCode(field, "3")[0] ) {
                            description += " " + getByCode(field, "3")[0];
                        }
                    } else {
                        // Común al resto de las notas
                        description += subfields.replace(/\^5.+$/,"").replace(/\^\w/g," ").replace(/--/g, config.LONG_DASH);
                    }
                    
                    if ( "510" == tag ) {
                        // OCLC
                        if ( description.charAt(description.length - 1).search(/[\.!\?]/) == -1 ) {
                            description += ".";
                        }
                    }
                    
                    // TO-DO: el subcampo 504$b no debe mostrarse.
                }
            }


            // ---------------------------------------------------------------------------
            // Campos 76x-78x, en el orden de aparición (recorremos todos los campos,
            // y tomamos sólo los 76x-78x, excepto el 773 que fue tratado más arriba).
            // Sólo se genera una nota si el primer indicador vale 0.
            // TO-DO: combinar más de una ocurrencia, e.g. del campo 785.
            // TO-DO: cotejar etiquetas con AACR2.
            // ---------------------------------------------------------------------------
            for (var i = 0, len = record.dataFields.length; i < len; i++) {
                if ( record.dataFields[i].tag.search(/76.|77[^3]|78./) != -1 && "0" == record.dataFields[i].ind1 ) {
                    var field = record.dataFields[i];
                    var tag = field.tag;
                    var ind1 = field.ind1;
                    var ind2 = field.ind2;
                    var subfields = field.subfields;
                    
                    var displayConstant = "";
                    description += newNote(tag) + config.INDENT_SPACE;
                    switch ( tag ) {
                        // --------------------------------------------------
                        case "760" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Serie principal: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "762" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Tiene subserie: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "765" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Traducción de: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "767" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Traducido como: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "770" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Tiene suplemento: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "772" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Suplemento de: ";
                                    break;
                                case "0" :
                                    displayConstant = "Parent: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "774" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Unidad componente: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "775" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Otra edición disponible: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "776" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Disponible en otra forma: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "777" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Publicado con: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "780" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "0" :
                                    displayConstant = "Continuación de: ";
                                    break;
                                case "1" :
                                    displayConstant = "Continuación en parte de: ";
                                    break;
                                case "2" :
                                    displayConstant = "Reemplaza: ";
                                    break;
                                case "3" :
                                    displayConstant = "Reemplaza en parte: ";
                                    break;
                                case "4" :
                                    displayConstant = "Formado por la unión de ... y ...: ";  // TO-DO: revisar
                                    break;
                                case "5" :
                                    displayConstant = "Absorbió: ";
                                    break;
                                case "6" :
                                    displayConstant = "Absorbió en parte: ";
                                    break;
                                case "7" :
                                    displayConstant = "Separado de: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "785" :
                        // --------------------------------------------------
                            switch ( ind2) {
                                case "0" :
                                    displayConstant = "Continúa como: ";
                                    break;
                                case "1" :
                                    displayConstant = "Continúa en parte como: ";
                                    break;
                                case "2" :
                                    displayConstant = "Reemplazado por: ";
                                    break;
                                case "3" :
                                    displayConstant = "Reemplazado en parte por: ";
                                    break;
                                case "4" :
                                    displayConstant = "Absorbido por: ";
                                    break;
                                case "5" :
                                    displayConstant = "Absorbido en parte por: ";
                                    break;
                                case "6" :
                                    displayConstant = "Split into... and...: ";
                                    break;
                                case "7" :
                                    displayConstant = "Merged with:... to form...: ";  // TO-DO: revisar
                                    break;
                                case "8" :
                                    displayConstant = "Changed back to: ";
                                    break;
                            }
                            break;
                        // --------------------------------------------------
                        case "787" :
                        // --------------------------------------------------
                            switch ( ind2 ) {
                                case "#" :
                                    displayConstant = "Ítem relacionado: ";
                                    break;
                            }
                            break;
                        /*
                        default :
                            description += fields_inOrder[i].value.replace(REGEX_CTRL_SF,"").substr(2).replace(/\^\w/g," ");
                        */
                    }
                    description += "<span class='displayConstant'>" + displayConstant + "</span>";
                    description += subfields.replace(/\^w[^\^]+/g,"").replace(/\^i([^\^]+)/,"^i<span class='displayConstant'>$1</span>").substr(2).replace(/\^z/g,",^zISBN ").replace(/\^\w/g," ");
                    description += ".";
                }
            }

            // Campo 555 ?
            // Campos 027, 028


            // ---------------------------------------------------------
            // ISBN
            // TO-DO: ¿Cómo presentar los $z : "ISBN (invalid)"?
            //        REVISAR hyphenation.
            //
            // OCLC: If subfield ‡a is not present, no data from field 020 prints.
            // If an ISBN in subfield ‡a has fewer or more than ten digits or has a letter
            // other than X as the tenth character, the ISBN does not print. 
            //
            // ATENCION: ver LCCN 81082555 (The Beatles' England): falla canonical_ISBN()
            //               LCCN 94077840 (The day John met Paul)
            //               LCCN 94069318 (Drugs, divorce, and a slipping image)
            // ---------------------------------------------------------
            
            if ( record.hasTag("020") && fields_byTag["020"].toString().search(/\^a/) != -1 ) {
                
                description += newNote("020") + config.INDENT_SPACE;
                
                for (var i = 0; i < record.get("020").length; i++) {
                    
                    if ( record.get("020")[i].subfields.search(/\^a/) != -1 ) {
                        
                        // Separador entre ISBNs
                        // ATENCION: se asume que, si algún 020 se imprime, entonces
                        // fields_byTag["020"][0] se imprime. ¿Lo modificamos?
                        if ( i > 0 ) {
                            description += ". " + config.LONG_DASH + " ";
                        }
                        
                        // Display constant
                        description += "ISBN ";
                        
                        // Extraemos el ISBN tal como está en el subcampo $a
                        // OBSOLETO -- Se usó cuando los ISBN contenían espacios o guiones
                        //var RE_ISBN = /^\d[ -]?\d?[ -]?\d?[ -]?\d?[ -]?\d?[ -]?\d?[ -]?\d?[ -]?\d?[ -]?\d?[ -]?[\dxX]?/;
                        //var myISBN = RE_ISBN.exec(fields_byTag["020"][i].substr(2))[0];
                        
                        var myISBN = record.get("020")[i].subfields.substr(2,10);  // FIXME -- ISBN 13
                        
                        // Lo "normalizamos"
                        var newISBN = ""; // ISBNhyphen.canonical_ISBN(myISBN);   FIXME
                        
                        // Y sustituimos el ISBN original (eliminando los subcampos $z si los hubiese)
                        description += record.get("020")[i].subfields.substr(2).replace(/\^z[^\^]+/g,"").replace(myISBN, newISBN).replace(/\^\w/g," ");
                    }
                }
            }

            // ---------------------------------------------------------
            // ISSN + Key title (OCLC's last note)
            // TO-DO: cómo presentar los $y [ISSN (incorrect)], $z [ISSN (canceled)]
            // TO-DO: Revisar en base a lo hecho con el ISBN en 020
            // ¿Puede haber 222 sin 022 ?
            // ---------------------------------------------------------
            if ( record.hasTag("022") ) {
                description += newNote("022") + config.INDENT_SPACE;
                for (var i = 0; i < record.get("022").length; i++) {
                    if ( i > 0 ) {
                        description += ". " + config.LONG_DASH + " ";
                    }
                    description += "ISSN ";
                    description += record.get("022")[i].subfields.substr(2).replace(/\^\w/g," ");
                    if ( record.hasTag("222") ) {
                        description += " = " + record.get("222")[i].subfields.substr(2).replace(/\^\w/g," ");
                    }
                }
            }

            description += "</div>\n";   // cierra la última nota
            description += "</div>\n";   // cierra notesParagraphs
            //description += "\r\n";


            // -----------------------------------------------------------------------
            // End bibliographic description
            // -----------------------------------------------------------------------
            description += "</div>\n";


            // -----------------------------------------------------------------------
            // TRAZADO: para que salga bien encolumnado, usamos una <table>
            // TO-DO: reescribir el trazado usando dos listas ordenadas <ol>, que
            // es lo semánticamente correcto. Eso además permitirá ofrecer como
            // alternativa el display lineal (inline) usual en las fichas (para los
            // nostálgicos).
            // -----------------------------------------------------------------------
            tracing += "<table class='tracings' cellspacing='0' border='0'>\n";
            //tracing += "<div class='tracingDiv'>";
            //tracing += "<ol>";

            // ---------------------------------------------------------------------
            // Puntos de acceso temáticos: Campos 6xx, en orden de aparición
            // ---------------------------------------------------------------------
            var subjCounter = 0;
            for (var i = 0, len = record.dataFields.length; i < len; i++) {
                if ( record.dataFields[i].tag.substr(0,1) == "6" ) {
                    var field = record.dataFields[i];
                    var tag = field.tag;
                    var ind1 = field.ind1;
                    var ind2 = field.ind2;
                    var subfields = field.subfields;
                    
                    subjCounter++;
                    //tracing += "\r\n" + config.INDENT_SPACE + subjCounter + ". ";
                    tracing += "<tr><td class='tracingCounter'>" + subjCounter + ".&nbsp;</td>";
                    tracing += "<td class='tracingCell aacrLowlight'" + fieldHighlight(tag,"tracingCell") + ">";
                    switch ( tag ) {
                        // ATENCION: 2004/03/08  replace(/\^2.+(?=\^|$)/,"") => replace(/\^2.+/,"") por compatib. con IE 5.0
                        // TO-DO: revisar espacio luego de $y, p.ej. en $y1983-$vPeriodicals
                        default : tracing += subfields.substr(2).replace(config.REGEX_SUBDIV, config.LONG_DASH).replace(/\^2.+/,"").replace(/\^0.+/,"").replace(/\^\w/g," ").replace(/--/g, config.LONG_DASH).replace("-" + config.LONG_DASH,"-&nbsp;&nbsp;&nbsp;" + config.LONG_DASH);
                    }
                    tracing += "</td></tr>";
                    
                    //tracing += "<li title='Campo " + tag + "' onmouseover='this.className=\"tracingCell aacrHighlight\"' onmouseout='this.className=\"tracingCell aacrLowlight\"'>";
                    //switch ( tag ) {
                    //    default : tracing += fields_inOrder[i].value.substr(2).replace(config.REGEX_SUBDIV,config.LONG_DASH).replace(/\^2.+(?=\^|$)/,"").replace(/\^\w/g," ");
                    //}
                    //tracing += "</li>\n";
                }
            }
            
            if ( subjCounter > 0 ) {
                tracing += "<tr><td colspan='2' style='line-height: 4px;'>&nbsp;</td></tr>";
            }
            
            //tracing += "</ol>";
            //tracing += "</div>";

            //tracing += "<table class='tracingTable' cellspacing='0' border='0'>";
            
            // ---------------------------------------------------------
            // A continuación, los puntos de acceso no temáticos
            // ---------------------------------------------------------
            var nonSubjCounter = 0;

            // -------------------------------------------------------------------
            // Opcionalmente, el primer punto de acceso es el main entry heading
            // (y el segundo, en caso de haber un 240, será un acceso por nombre-
            // título; pero este concepto debe ser REVISADO).
            // -------------------------------------------------------------------
            if ( "" != mainEntryTag && !config.MAIN_ENTRY_TOP ) {
                nonSubjCounter++;
                tracing += "<tr><td class='tracingCounter'>I.&nbsp;</td>";
                tracing += "<td class='tracingCell aacrLowlight' style='font-style: italic;'" + fieldHighlight(mainEntryTag, "tracingCell") + ">" + mainEntryHeading + "</td></tr>";
                
                if ( record.hasTag("240") ) {
                    nonSubjCounter++;
                    tracing += "<tr><td class='tracingCounter'>II.&nbsp;</td>";
                    tracing += "<td class='tracingCell aacrLowlight' title='Campos " + mainEntryTag + "-240' onmouseover='this.className=\"tracingCell aacrHighlight\"' onmouseout='this.className=\"tracingCell aacrLowlight\"'>";
                    tracing += mainEntryHeading + "&nbsp;&nbsp;" + record.get("240")[0].subfields.replace(config.REGEX_CTRL_SF,"").replace(/\^a([^\^]+)/,"^a<em>$1</em>").substr(2).replace(/\^\w/g," ");
                    if ( tracing.charAt(tracing.length - 1).search(/\.|!|\?/) == -1 ) {
                        tracing += ".";
                    }
                    tracing += "</td></tr>";
                }
            }

            // ---------------------------------------------------------
            // Campos 70x-75x, en el orden de aparición
            // ---------------------------------------------------------
            for (var i = 0, len = record.dataFields; i < len; i++) {
                if ( record.dataFields[i].tag.search(/7[0-5]./) != -1 ) {
                    var field = record.dataFields[i];
                    var tag = field.tag;
                    var ind1 = field.ind1;
                    var ind2 = field.ind2;
                    var subfields = field.subfields;
                    
                    nonSubjCounter++;
                    //tracing += "\r\n" + config.INDENT_SPACE + arabic2Roman(nonSubjCounter) + ". ";
                    tracing += "<tr><td class='tracingCounter'>" + arabic2Roman(nonSubjCounter) + ".&nbsp;</td>";
                    switch ( tag ) {
                        // ATENCION: REESCRIBIR
                        // --------------------------------------------------
                        case "740" :
                        // --------------------------------------------------
                            tracing += "<td class='tracingCell aacrLowlight'" + fieldHighlight("740","tracingCell") + ">";
                            tracing += "Título: " + subfields.replace(config.REGEX_CTRL_SF,"").substr(2).replace(/\^\w/g," ");
                            tracing += "</td>";
                            break;
                        default :
                            tracing += "<td class='tracingCell aacrLowlight'" + fieldHighlight(tag,"tracingCell") + ">";
                            tracing += subfields.replace(config.REGEX_CTRL_SF,"").substr(2).replace(/\^0.+$/,"").replace(/\^\w/g," ");
                            tracing += "</td>";
                    }
                    tracing += "</tr>";
                }
            }

            // -------------------------------------------------------------
            // Entrada secundaria de título (245)
            // TO-DO: reubicar esto para que aparezca *antes* que los 730/740
            // -------------------------------------------------------------
            if ( record.hasTag("245") && record.get("245")[0].ind1 == "1" ) {
                nonSubjCounter++;
                tracing += "<tr><td class='tracingCounter'>" + arabic2Roman(nonSubjCounter) + ".&nbsp;</td>";
                tracing += "<td class='tracingCell aacrLowlight'" + fieldHighlight("245","tracingCell") + ">";
                tracing += "Título.";
                tracing += "</td></tr>";
            }

            // -------------------------------------------------------------
            // Entrada secundaria de (variante de) título.
            // Basado en las indicaciones de OCLC.
            // -------------------------------------------------------------
            if ( record.hasTag("246") ) {
                for (var i = 0; i < record.get("246").length; i++) {
                    if ( record.get("246")[i].ind1.search(/[13]/) != -1 ) {
                        nonSubjCounter++;
                        tracing += "<tr><td class='tracingCounter'>" + arabic2Roman(nonSubjCounter) + ".&nbsp;</td>";
                        tracing += "<td class='tracingCell aacrLowlight' " + fieldHighlight("246","tracingCell") + ">";
                        tracing += "Título: " + record.get("246")[i].subfields.replace(/\^[fghi5][^\^]+/g,"").substr(2).replace(/\^\w/g," ");
                        
                        if ( tracing.charAt(tracing.length - 1).search(/[-\.!\?]/) == -1 ) {
                            tracing += ".";
                        }
                        tracing += "</td></tr>";
                    }
                }
            }

            // -------------------------------------------------------------
            // Entrada secundaria de título anterior (247).
            // OCLC: "The title proper (subfields ‡a, ‡n, ‡p) prints as the added entry."
            // -------------------------------------------------------------
            if ( record.hasTag("247") ) {
                for (var i = 0; i < record.get("247").length; i++) {
                    if ( "1" == record.get("247")[i].ind1 ) {
                        nonSubjCounter++;
                        tracing += "<tr><td class='tracingCounter'>" + arabic2Roman(nonSubjCounter) + ".&nbsp;</td>";
                        tracing += "<td class='tracingCell aacrLowlight' " + fieldHighlight("247","tracingCell") + ">";
                        tracing += "Título: " + record.get("247")[i].subfields.replace(/\^[^abnp][^\^]+/g,"").substr(2).replace(/\^\w/g," ");
                        
                        if ( tracing.charAt(tracing.length - 1).search(/[-\.!\?]/) == -1 ) {
                            tracing += ".";
                        }
                        tracing += "</td></tr>";
                    }
                }
            }
            
            // -------------------------------------------------------------
            // Entrada secundaria de serie (440, en orden de aparición)
            // -------------------------------------------------------------
            if ( record.hasTag("440") ) {
                for (var i = 0; i < record.get("440").length; i++) {
                    nonSubjCounter++;
                    tracing += "<tr><td class='tracingCounter'>" + arabic2Roman(nonSubjCounter) + ".&nbsp;</td>";
                    tracing += "<td class='tracingCell aacrLowlight' " + fieldHighlight("440","tracingCell") + ">";
                    if (i == 0) {
                        tracing += "Serie.";
                    } else {
                        tracing += "Serie: " + record.get("440")[i].subfields.replace(/,\^x[^\^]+/,"").replace(config.REGEX_CTRL_SF,"").substr(2).replace(/\^\w/g," ");
                        tracing += ".";  // OCLC
                    }
                    tracing += "</td></tr>";
                }
            }

            // -------------------------------------------------------------
            // Entrada secundaria de serie (80x-83x, en orden de aparición)
            // -------------------------------------------------------------
            for (var i = 0, len = record.dataFields.length; i < len; i++) {
                var tag = record.dataFields[i].tag;
                if ( tag.search(/800|810|811|830/) != -1 )  {
                    nonSubjCounter++;
                    tracing += "<tr><td class='tracingCounter'>" + arabic2Roman(nonSubjCounter) + ".&nbsp;</td>";
                    tracing += "<td class='tracingCell' " + fieldHighlight(tag,"tracingCell") + ">";
                    tracing += "Serie: " + record.dataFields[i].subfields.replace(config.REGEX_CTRL_SF,"").substr(2).replace(/\^\w/g," ");
                    tracing += "</td></tr>";
                }
            }

            // Fin del trazado
            tracing += "\n</table>\n";
            
            
            var recordNumbers = "";
            recordNumbers += "<table class='recordNumbers' border='0'>";
            recordNumbers += "<tr><td align='right'>";
            recordNumbers += "<span " + fieldHighlight("001") + ">" + record.get("001")[0].value + "</span>";
            
            if ( record.hasTag("010") ) {
                var LCCNnumber = record.get("010$a")[0].replace(/#/g,"");
                var LCCNlink = "<a target='_blank' href='http://catalog.loc.gov/cgi-bin/Pwebrecon.cgi?v4=1&DB=local&CMD=010a+" + LCCNnumber + "&CNT=10+records+per+page'>LCCN " + LCCNnumber + "</a>";
                recordNumbers += "&nbsp;&#183;&nbsp;" + "<span " + fieldHighlight("010 -- Enlace al catálogo de LC") + ">" + LCCNlink + "</span>";
            }
            
            var f005 = record.get("005")[0].value;
            recordNumbers += " &#183; <span " + fieldHighlight("005") + ">" + f005.substr(6,2) + "/" + f005.substr(4,2) + "/" + f005.substr(0,4) + "</span>";
            recordNumbers += "</td></tr></table>";

            var aacrOutput = description + tracing + recordNumbers;

            // Sustituciones finales
            aacrOutput = aacrOutput.replace(/\r\n/g,"<br>").replace(config.REGEX_INDENT,"&nbsp;&nbsp;&nbsp;&nbsp;");


            // -------------------------------------------------------------
            // ACCESO AL DOCUMENTO: signatura topográfica o URI
            // -------------------------------------------------------------
            
            var documentLocation = "";

            // Ejemplares
            
            if ( ejemplares.length > 0 ) {
                
                // Ordenamos la lista de ejemplares
                try {
                    // ATENCION: Esta línea genera errores de manera esporádica ("unexpected call to method or property access")
                    ejemplares.sort(sortEjemplares);
                }
                catch(err) {
                    var errorMsg = "Hubo un error al construir la ficha AACR2";
                    errorMsg += "\n\nSi nota que este problema se repite, use CTRL F5 para\nvolver a cargar los archivos en su navegador.";
                    if ( document.getElementById("f001").value != "" && modifiedRecord() ) {
                        errorMsg += "\n\nPreviamente, grabe el registro (si desea conservar\nlos cambios realizados).";
                    }
                    alert(errorMsg);
                }
                
                // Signatura del primer ejemplar
                documentLocation += printCallNumber(ejemplares[0]);
                
                // Signaturas adicionales. Sólo mostramos más de una signatura si difieren en: prefijo, clase, o librística.
                var prevKey = "";
                if ( ejemplares[0]["k"] ) prevKey += ejemplares[0]["k"];
                if ( ejemplares[0]["h"] ) prevKey += ejemplares[0]["h"];
                if ( ejemplares[0]["i"] ) prevKey += ejemplares[0]["i"];
                for ( var i=1; i < ejemplares.length; i++ ) {
                    var currentKey = "";
                    if ( ejemplares[i]["k"] ) currentKey += ejemplares[i]["k"];
                    if ( ejemplares[i]["h"] ) currentKey += ejemplares[i]["h"];
                    if ( ejemplares[i]["i"] ) currentKey += ejemplares[i]["i"];
                    if ( currentKey != prevKey )  {
                        documentLocation += printCallNumber(ejemplares[i]);
                        prevKey = currentKey;
                    }
                }
            }
            
            // Campo 856
            // ATENCION: ¿Cómo afectan los indicadores? Hay subcampos (muchos) que no están pensados
            // para ser visualizados.
            // TO-DO: el campo 856 es repetible; el subcampo $y también.
            if ( record.hasTag("856") /*&& fields_byTag["856"][0].substr(0,1) == "4"*/ ) {
                
                for ( var i=0; i < record.get("856").length; i++ ) {
                
                    var field = record.get("856")[i];
                    
                    
                    // Aislamos el subcampo $u (URI)
                    var theURI = getByCode(field, "u")[0];
                    
                    // Por defecto, el texto del link es la misma URI
                    var linkText = theURI;
                    
                    // Pero si hay un subcampo $y o un $3, usamos el primero de éstos como texto del link
                    var subfield_y = getByCode(field, "y")[0];
                    if ( "" != subfield_y ) {
                        linkText = subfield_y;
                    } else {
                        var subfield_3 = getByCode(field, "3")[0];
                        if ( "" != subfield_3 ) {
                            linkText = subfield_3;
                        }
                    }
                    
                    // Construimos entonces el link
                    var theLink = "<a target='_blank' href='" + theURI + "' title='" + theURI + "'>" + linkText + "</a>";
                    
                    // Y pegamos todo
                    //documentLocation += fields_byTag["856"][i].substr(2).replace(linkText,theLink).replace("^u" + theURI,"").replace(/\^\w/g," ").replace(/Table of/,"Table&nbsp;of");
                    documentLocation += theLink;
                    documentLocation += "<br style='line-height: 0.7em;'><br style='line-height: 0.7em;'>";
                }
            }
            
            // Campo 050 (LC call number), como última alternativa. Subcampos $a posteriores
            // al primero no se muestran.
            if ( 0 == ejemplares.length && !record.hasTag("856") && record.hasTag("050") ) {
                documentLocation = getByCode(record.get("050")[0], "a")[0];
                documentLocation += "<br>";
                documentLocation += getByCode(record.get("050")[0], "b")[0].replace(/ /g,"<br>");
                //fields_byTag["050"][0].substr(2).replace(/\^\w/g,"<br>").replace(/ /g,"<br>");
            }

            // Fin del DIV con font-size pequeño
            //aacrOutput += "</div>";


            if ( config.DISPLAY_CALL_NUMBER ) {
                var aacrTable = "";
                aacrTable += "<table class='aacrTable' cellpadding='0' cellspacing='0' border='0'>";
                aacrTable += "<tr>";
                aacrTable += "<td class='documentLocationCell'>" + documentLocation + "</td>";
                aacrTable += "<td class='aacrCell'>" + aacrOutput + "</td>";
                aacrTable += "</tr></table>";
                aacrOutput = aacrTable;
            }

            //alert(aacrOutput);
            return aacrOutput;
        }
    };
}();  // end of Catalis.util.MARC21 
