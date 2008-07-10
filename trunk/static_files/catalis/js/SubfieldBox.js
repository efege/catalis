/**
 * SubfieldBox is a specialized textarea object, so we extend Ext.form.TextArea.
 *
 * width?
 */
 
Catalis.SubfieldBox = Ext.extend(Ext.form.TextArea, {
    width: '99%',
    grow: true,
    growMin: 23,
    growAppend: '',  // default is '&#160;\n&#160;'
    enterIsSpecial: true,  // so that we can focus the next subfield
    cls: 'subfieldBox',
    listeners: {
        'focus': function() {
            this.subfield.setActive();
        },
        'change': function() {
            this.onChange();
        },
        'specialkey': function(TextArea, evt) {
            this.handleSpecialKey(TextArea, evt);
        }
    },
    
    // Component initialization
    initComponent : function(){
        Catalis.SubfieldBox.superclass.initComponent.call(this);
    },
    
    // Component rendering
    onRender : function(ct, position){
        Catalis.SubfieldBox.superclass.onRender.call(this, ct, position);
        this.autoSize();
    },
    
    /**
     * Handles the pressing of special keys.
     * this: TextArea?
     */
    handleSpecialKey : function(TextArea, evt) {
        //console.log(evt.keyCode);
        //var textarea = TextArea.getEl().dom;
        
        // Sólo nos interesan: Alt, Ctrl, Enter, Esc, Shift
        // ATENCION: ¿Agregamos alguna tecla de función?
        if ( !evt.shiftKey && !evt.altKey && !evt.ctrlKey && evt.keyCode != evt.ENTER && evt.keyCode != evt.ESC && evt.keyCode != 123 ) {
            return true;
        }
        
        //var subfield = parentSubfield(textarea, "subfieldBox");
        var subfield = this.subfield;
        
        switch ( evt.keyCode ) {
            case evt.ENTER :                // 13: queremos convertir un ENTER en un TAB
                if (Ext.isIE) {
                    evt.browserEvent.keyCode = 9;  // En IE es fácil
                    //return true; (no parece necesario con Ext)
                } else if (Ext.isGecko) {
                    evt.stopEvent();  // no queremos un salto de línea en el textarea
                    
                    // Queremos pasarle el foco al siguiente textarea. ¿Cómo lo detectamos?
                    // TO-DO: Esta solución es ineficiente; buscar algo mejor.
                    
                    // 1. Obtenemos todos los textareas del formulario
                    //var subfieldBoxes = Ext.getCmp('datafieldsPanel').findByType('subfieldbox');
                    var subfieldBoxes = document.getElementById('recordDiv').getElementsByTagName('textarea');
                    
                    // 2. Recorremos la lista de nodos, y cuando llegamos al que originó el evento, le pasamos el foco al próximo nodo.
                    var domNode = TextArea.getEl().dom;
                    for (var i = 0, len = subfieldBoxes.length; i < len - 1; i++) {
                        if ( subfieldBoxes[i] == domNode ) {
                            subfieldBoxes[i+1].focus();
                            break;
                        }
                    }
                }
                break;
            
            case evt.ESC :        // 27 = ESC
                return false; // para evitar borrado accidental de datos con ESC
                break;
            
            case evt.END :     // 35 = Fin = End --> foco al último campo (del último bloque de campos)
                if ( evt.altKey ) {
                    // Explicación: 
                    //  .firstChild  table
                    //  .lastChild   tbody
                    //  .lastChild   tr
                    var lastField = document.getElementById("recordDiv").firstChild.lastChild.lastChild;
                    // ATENCION: ajustar para que no dependa de los bloques presentes
                    lastSubfieldBox(lastField).focus();
                    firstSubfieldBox(lastField).focus();
                    return false;
                }
                break;
            
            case evt.HOME :     // 36 = Inicio=Home --> foco al primer campo
                if ( evt.altKey ) {
                    // TO-DO: reescribir, así no funciona
                    var firstField = document.getElementById("recordDiv").firstChild.firstChild.nextSibling.nextSibling.firstChild;
                    // ATENCION: ajustar para que no dependa de los bloques presentes
                    firstField.focusFirst();
                    alert("Problema pendiente: evitar que Alt+Inicio \nme lleve a la homepage");
                    // TO-DO: está ignorando el return false! Incluso cambiando el keyCode:
                    // En IE 6 (home) parece andar bien.
                    evt.keyCode = 35;
                    return false;
                }
                break;
            
            case evt.UP :       // 38: up arrow
                if ( evt.altKey ) {
                    var field = parentField(subfield,"subfield");
                    if ( evt.ctrlKey && FieldManager.canMoveUpF(field) ) {
                        mField = FieldManager.moveField(field, "up");  // move up field
                        for (var i=0; i < 5; i++) {     // ATENCION: sucio truco  (timeout?)
                            mField.focusFirst();
                        }
                        return false;
                    }
                        else if ( !evt.ctrlKey && SubfieldManager.canMoveUpSf(subfield) ) {
                        mSubfield = subfield.move('up');  // move up subfield
                        for (var i=0; i < 5; i++) {   // sucio truco  (timeout?)
                            mSubfield.box.focus();
                        }
                        return false;
                    }
                }
                else {
                    // we would like to emulate shift+tab...
                }
                break;
            
            case evt.DOWN :                 // 40: down arrow
                if ( evt.altKey ) {
                    var field = subfield.field;
                        if ( evt.ctrlKey && field.canMoveDown() ) {
                        mField = field.move('down');  // move down field
                        for (var i=0; i < 5; i++) {  // sucio truco  (timeout?)
                            mField.focusFirst();
                        }
                        return false;
                    }
                    else if ( !evt.ctrlKey && subfield.canMoveDown() ) {
                        mSubfield = subfield.move('down');  // move down subfield
                        for (var i=0; i < 5; i++) {  // sucio truco (usar timeout?)
                            mSubfield.box.focus();
                        }
                        return false;
                    }
                }
                else if ( !evt.shiftKey ) { // shift + down arrow lo queremos seguir usando para poder seleccionar texto
                    evt.keyCode = 9;           // down arrow --> tab
                    return true;
                    // TO-DO: en Marc Magician, cursorDown sirve para moverse dentro
                    // de un textbox, pero también para navegar de un textbox al siguiente.
                }
                break;
            
            case evt.DELETE :      // 46  Shift(+Ctrl)+Delete
                if ( evt.shiftKey ) {
                    deleteObj(subfield, evt);
                    return false;
                }
                break;
            
            case 73 :       // Ctrl+I
                if ( evt.ctrlKey ) {
                    if ( subfield.field.hasIndicators ) {
                        editIndicators(subfield.field);
                    }
                    return false;
                }
                break;
            
            case 123 :       // F12
                if ( "4" == this.code ) {
                    editCodedData('relator');
                    return false;
                }
                // TO-DO: agregar campos 041, 044
                break;
        }
    },
    
    /**
     * Handles the change of subfield value.
     *
     * TO-DO: check if there were errors introduced after changing this.value => value
     */
    onChange : function() {
    
        var value = this.getValue();
        
        this.tagCode = this.subfield.tagCode;  // no me gusta así
        
        // Save cursor position for this textarea (needed for text insertion).
        this.cursorPos = this.selectionStart;
        //console.log('cursorPos:', this.cursorPos);
        
        //alert(this.scrollHeight + " -- " + this.offsetHeight);
        
        // ATENCION: tenemos lo que parece ser un bug, detectado al jugar con
        // el campo 773. Por un lado, el onchange del $z no anda, y por otro,
        // se dispara un onchange del $d sin motivo apreciable.
        
        // TO-DO: encadenar las secuencias de "value = value.replace(...)", i.e.
        // value = value.replace().replace().replace()... (puede ser en varias líneas)
        
        // Corrección: eliminamos espacios múltiples y espacios en los extremos
        // ATENCION: ¿es siempre correcto eliminar espacios iniciales? Véase e.g. 050$b en OCLC
        value = value.replace(/\s+/g, " ");
        value = value.replace(/^\s/, "");
        value = value.replace(/\s$/, "");
        
        // Sustitución: EM DASH -> guión doble
        value = value.replace(/\u2014/g, "--");
        
        // Sustitución: typographic double quotes (¿deberíamos advertir del cambio?)
        value = value.replace(/\u201C|\u201D/g, '"');
        
        // Sustitución: typographic single quotes (¿deberíamos advertir del cambio?)
        value = value.replace(/\u2018|\u2019/g, "'");
        
        // Sustitución: caracteres especiales en URIs (según OCLC)
        if ( "URI" == this.label || "856u" == this.tagCode ) {
            value = value.replace(/_/g, "%5F").replace(/~/, "%7E");
        }
        
        // Corrección: raya sin espacios alrededor en una nota de contenido
        if ( "505" == this.fieldTag ) {
            value = value.replace(/ \((pp\.\\? )?\d+--\d+\);?/g, '--'); // para TOCs copiadas de MathSciNet en bibima
            value = value.replace(/(\S)--/g, "$1 --").replace(/--(\S)/g, "-- $1");
        }
        
        // Corrección: eliminamos espacio que precede a una coma
        value = value.replace(/\s,/g, ",");
        
        // Corrección en 300 $a: 217 p --> 217 p.
        if ( "300a" == this.tagCode ) {
            value = value.replace(/(\d+)\s*([ph])$/, "$1 $2.");
        }
        
        // Corrección en 300 $b: il.col. --> il. col.
        if ( "300b" == this.tagCode ) {
            value = value.replace(/^il(?=$| )/, "il.");
        }
        
        // TO-DO: 300 $c "25" => "25 cm."
        
        // TO-DO: luego de mostrar una advertencia como las que siguen, el foco debe
        // permanecer en el mismo textarea.
        
        // Advertencia: no podemos (por ahora) aceptar un '^' en un subcampo
        if ( value.indexOf("^") != -1 ) {
            Catalis.showMessage(Lang.MESSAGES.CARET_NOT_ALLOWED, true);
            return;
        }
        
        // Advertencia: puntuación ISBD dentro de un subcampo del 260
        if ( this.tagCode.search(/260[ab]/) != -1 && value.search(/\S ([;:]) (.+$)/) != -1 ) {
            var msg = String.format(Lang.MESSAGES.PUNCTUATION_NOT_ALLOWED, RegExp.$1, RegExp.$2, this.code);
            Catalis.showMessage(msg, true);
            return;
        }
        
        if ( Config.AUTOMATIC_PUNCTUATION && this.tagCode.search(Config.AUTO_PUNCT_TAGS) != -1 ) {
            //PunctuactionManager.updatePunctuation(parentField(this, "subfieldBox"));
            PunctuactionManager.updatePunctuation(this.subfield.field);
        }
        
        // ----------------------------------
        // Campo 245
        // ----------------------------------
        if ( "245" == this.fieldTag ) {
            refreshTitleBar();
            if ( "a" == this.code ) {  // Ajuste del 2do indicador (REVISAR)
                //var nonfilchars =
            } else if ( "c" == this.code ) {
                // Insertamos un espacio antes de un ";" en la mención de respons.
                // ATENCION: es posible que haya un ";" que no separe menciones de responsabildad!
                value = value.replace(/\S; /g, " ; ");
            }
        }
            
        // ----------------------------------
        // Campo 260
        // ----------------------------------
        else if ( "260" == this.fieldTag ) {
            if ( "c" == this.code ) {
                // Ajuste de la fecha en el campo 008
                // OLD: var re = /^\[?c?(\d{4})(?=\]? ?[\.,]?$)/;   // REVISAR, especialmente para el caso "fecha1-fecha2" (código "m")
                
                // FROM demo-devel-BC
                // Casos a considerar:
                // ---------------------------------------------------
                //    260$c            008/06    008/07-10  008/11-14
                // ---------------------------------------------------
                //*   1998                s/i      1998      ####/1998   i: inclusive dates of collection (Leader/07 "c")
                //*   c1998               s        1998      ####
                //*   p1983               s        1983      ####
                //*   [1998]              s        1998      ####
                //*   [1998?]             s        1998      ####
                //*   [ca. 1960]          s        1960      ####
                //*   [1971 o 1972]       s        1971      ####
                //*   1697 [i.e. 1967]    s        1967      ####
                
                //*   [199-]              s        199u      ####
                //*   [199-?]             s        199u      ####
                //*   [18--]              s        18uu      ####
                //*   15--?]              s        15uu      ####
                
                //*   1967, c1965         t/r      1967      1965      El código r en 008/06 está asociado a una nota 500, Edition and history note (Fritz, 3.2-88)
                //*   [1985], c1983       t/r      1985      1983
                //*   [1982?], c1949      t/r      1982      1949
                
                //*   [198-], c1967       t/r      198u      1967
                
                //*   1991-1994           d/m/i    1991      1994   i: inclusive dates of collection (Leader/07 "c")
                //*   1997-[2000]         d/m      1997      2000   d: recurso continuo (Leader/07 "s")
                //*   [1988-1991]         d/m      1988      1991   d: recurso continuo (Leader/07 "s")
                //*   1986-               c/m      1986      9999   c: recurso continuo (Leader/07 "s")
                //*   [1998]-             c/m      1998      9999   c: recurso continuo (Leader/07 "s")
                //*   -1997               d/m      uuuu      1997   d: recurso continuo (Leader/07 "s")
                
                //*   [entre 1906 y 1912] q        1906      1912   q: questionable date
                
                //   sin dígitos         s        ####      ####  --> ¿mensaje de advertencia?
                //   default             DEJAR TODO COMO ESTABA
                
                // En todos los casos, el corchete inicial puede estar en un subcampo previo.
                // En todos los casos, "c" y "p" son equivalentes: e.g. c2001, p2001
                // Hay un riesgo al modificar automáticamente el campo 008: que se altere una información que era
                // correcta (e.g. un código "r" en 008/06).
                // Al final puede haber punto (tal vez precedido de un espacio), que no nos interesa tomar en cuenta.
                
                // Array con los casos a considerar
                var casosFecha = [
                    {
                        regex : "^\\[?[cp]?(\\d{4})(?=\\??\\]? ?[\\.,]?$)",  // 2001 | c2001 | p2001 | [2001] | [2001?]
                        f008_06 : '(document.getElementById("marcEditForm").L_07.value == "c") ? "i" : "s"',
                        f008_07_10 : 'RegExp.$1',  // 2001
                        f008_11_14 : '"####"'
                    },
                    {
                        regex : "^\\[?ca\\. (\\d{4})\\]",  // [ca. 1960]
                        f008_06 : '"s"',
                        f008_07_10 : 'RegExp.$1',  // 1960
                        f008_11_14 : '"####"'
                    },
                    {
                        // TO-DO: independizar del idioma
                        regex : "^\\[?(\\d{4}) [oó]r? \\d{4}\\]",  // [1971 o 1972] 
                        f008_06 : '"s"',
                        f008_07_10 : 'RegExp.$1',  // 1971
                        f008_11_14 : '"####"'
                    },
                    {
                        regex : "^\\d{4} \\[i\\.e\\.,? (\\d{4})\\]",  // 1697 [i.e. 1967]
                        f008_06 : '"s"',
                        f008_07_10 : 'RegExp.$1',  // 1967
                        f008_11_14 : '"####"'
                    },
                    // ----------------------------
                    {
                        regex : "^\\[?(\\d{3})(?=-\\??\\] ?[\\.,]?$)",  // [200-] | [200-?]
                        f008_06 : '"s"',
                        f008_07_10 : 'RegExp.$1 + "u"',  // 200u
                        f008_11_14 : '"####"'
                    },
                    // ----------------------------
                    {
                        regex : "^\\[?(\\d{2})--\\??\\]",  // [18--] | [18--?]
                        f008_06 : '"s"',
                        f008_07_10 : 'RegExp.$1 + "uu"',  // 18uu
                        f008_11_14 : '"####"'
                    },
                    // ----------------------------
                    {
                        regex : "^\\[?(\\d{4})\\]?-\\[?(\\d{4})\\]?",  // 1991-1994 | [1991-1994] | [1991]-1994 | 1991-[1994]
                        f008_06 : '(document.getElementById("marcEditForm").L_07.value == "s") ? "d" : (document.getElementById("marcEditForm").L_07.value == "c") ? "i" : "m"',
                        f008_07_10 : 'RegExp.$1',  // 1991
                        f008_11_14 : 'RegExp.$2'   // 1994
                    },
                    // ----------------------------
                    {
                        regex : "^\\[?(\\d{4})\\]?-",  // 1991- | [1991]-
                        f008_06 : '(document.getElementById("marcEditForm").L_07.value == "s") ? "c" : "m" ',
                        f008_07_10 : 'RegExp.$1',  // 1991
                        f008_11_14 : '"9999"'
                    },
                    // ----------------------------
                    {
                        regex : "^-(\\d{4})",  // -1997
                        f008_06 : '(document.getElementById("marcEditForm").L_07.value == "s") ? "d" : "m" ',
                        f008_07_10 : '"uuuu"',
                        f008_11_14 : 'RegExp.$1'  // 1997
                    },
                    // ----------------------------
                    {
                        regex : "^\\[?(\\d{4})\\??\\]?, [cp](\\d{4})",  //  1967, c1965 | [1967], c1965 | [1967?], c1965
                        f008_06 : '(document.getElementById("marcEditForm").f008_06.value == "r") ? "r" : "t"',
                        f008_07_10 : 'RegExp.$1',  // 1967
                        f008_11_14 : 'RegExp.$2'   // 1965
                    },
                    // ----------------------------
                    {
                        regex : "^\\[?(\\d{3})-\\], [cp](\\d{4})",  //  [198-], c1967
                        f008_06 : '(document.getElementById("marcEditForm").f008_06.value == "r") ? "r" : "t"',
                        f008_07_10 : 'RegExp.$1 + "u"',  // 198u
                        f008_11_14 : 'RegExp.$2'   // 1967
                    },
                    // ----------------------------
                    {
                        // TO-DO: independizar del idioma
                        regex : "^\\[?entre (\\d{4}) y (\\d{4})\\]",  //  [entre 1906 y 1912]
                        f008_06 : '"q"',
                        f008_07_10 : 'RegExp.$1',  // 1906
                        f008_11_14 : 'RegExp.$2'   // 1912
                    }
                ];
                
                // Recorremos los casos en busca de uno que se aplique
                for (var i = 0, len = casosFecha.length; i < len; i++) {
                    var re = new RegExp(casosFecha[i].regex);
                    var matchArray = re.exec(value);
                    if ( matchArray != null ) {
                        document.getElementById("marcEditForm").f008_06.value = eval(casosFecha[i].f008_06);
                        document.getElementById("marcEditForm").f008_07_10.value = eval(casosFecha[i].f008_07_10);
                        document.getElementById("marcEditForm").f008_11_14.value = eval(casosFecha[i].f008_11_14);
                        break; // salimos del loop
                    }
                }
                
            }
            else if ( "a" == this.code ) {
                // Ajuste del país en el campo 008
                // ATENCION: restringir a la PRIMERA ocurrencia del subcampo $a
                // TO-DO: enviar todo esto a una tabla externa
                var re = /^\[?(Buenos Aires|Bahía Blanca)\]?/;
                var result = re.exec(value);
                if ( result ) {
                    document.getElementById("marcEditForm").f008_15_17.value = "ag#";
                    document.getElementById("marcEditForm").f008_15_17.title = "Argentina";
                }
                var re = /^\[?New York\]?/;
                var result = re.exec(value);
                if ( result ) {
                    document.getElementById("marcEditForm").f008_15_17.value = "nyu";
                    document.getElementById("marcEditForm").f008_15_17.title = "New York (State)";
                }
                var re = /^\[?(London|Oxford)\]?/;
                var result = re.exec(value);
                if ( result ) {
                    document.getElementById("marcEditForm").f008_15_17.value = "enk";
                    document.getElementById("marcEditForm").f008_15_17.title = "England";
                }
                var re = /^\[?Paris\]?/;
                var result = re.exec(value);
                if ( result ) {
                    document.getElementById("marcEditForm").f008_15_17.value = "fr#";
                    document.getElementById("marcEditForm").f008_15_17.title = "Francia";
                }
                var re = /^\[?(Roma|Milano|Firenze)\]?/;
                var result = re.exec(value);
                if ( result ) {
                    document.getElementById("marcEditForm").f008_15_17.value = "it#";
                    document.getElementById("marcEditForm").f008_15_17.title = "Italia";
                }
                var re = /^\[?México\]?/;
                var result = re.exec(value);
                if ( result ) {
                    document.getElementById("marcEditForm").f008_15_17.value = "mx#";
                    document.getElementById("marcEditForm").f008_15_17.title = "México";
                }
                var re = /^\[?(Madrid|Barcelona|Sevilla)\]?/;
                var result = re.exec(value);
                if ( result ) {
                    document.getElementById("marcEditForm").f008_15_17.value = "sp#";
                    document.getElementById("marcEditForm").f008_15_17.title = "España";
                }
            } // end 260a
        } // end 260
            
        // ----------------------------------
        // Campo 300
        // ----------------------------------
        else if ( "300" == this.fieldTag ) {
            if ( "b" == this.code ) {
                // Ilustraciones: actualizamos f008_BK_18_21
                var re = /^il\. ?;?$/;
                var hasIllustrations = re.test(value);
                if ( hasIllustrations ) {
                    document.getElementById("marcEditForm").f008_BK_18_21.value = "a###";
                } else if ( "" == value ) {
                    document.getElementById("marcEditForm").f008_BK_18_21.value = "####";
                }
            }
        } // end 300
            
        // Campo 111: actualizamos f008_BK_29
        else if ( "111a" == this.tagCode ) {
            document.getElementById("marcEditForm").f008_BK_29.value = ( value != "" ) ? "1" : "0";
        }
        
        // ----------------------------------
        // Campo 504
        // actualizamos f008_BK_24_27
        // ----------------------------------
        // TO-DO: hay que hacer también el ajuste cuando el campo 504 es *eliminado*
        // ATENCION: la correspondencia entre 504 y "b" no es exacta; cuando hay
        // discografías también se usa un 504, pero el código en el 008 es "k".
        else if ( "504" == this.fieldTag ) {
            var currentCodedValues = document.getElementById("marcEditForm").f008_BK_24_27.value;
            if ( "" == value ) {
                // Campo 504 vacío => quitamos el código "b"
                // ATENCION: a veces, p.ej. si la obra es en sí misma una bibliografía,
                // el código "b" debe permanecer, aun cuando no exista un 504.
                // También hay que verificar que no haya *otro* campo 504 presente
                // en el registro!
                document.getElementById("marcEditForm").f008_BK_24_27.value = currentCodedValues.replace(/b/, "") + "#";
            } else {
                // Si no hay un "b", colocamos uno en la primera posición no ocupada (24 o 25)
                // TO-DO: revisar para el caso en que haya otros códigos presentes
                if ( currentCodedValues.search(/b/) == -1 ) {
                    document.getElementById("marcEditForm").f008_BK_24_27.value = "b" + currentCodedValues.substr(0,3);
                }
            }
        } // end 504
        
        // ----------------------------------
        // Verificación de ISBN
        // ----------------------------------
        else if ( this.tagCode.search(/020a|7[6-8][0-9]z/) != -1 ) {
            if ( value !== "" ) {
                if ( value.substr(0,10).indexOf("-") != -1 ) {
                    Catalis.showMessage(Lang.MESSAGES.ISBN_NO_HYPHEN, true);
                } else {
                    ISBNcheck.checkStandardNumber(this,"ISBN");
                }
            } else if ( this.error ) {
                this.style.color = "black";
                this.style.backgroundColor = "";
                this.error = false;
            }
        }
        
        // ----------------------------------
        // Verificación de ISSN
        // ----------------------------------
        else if ( this.tagCode.search(/022a|4[49]0x|7[6-8][0-9]x/) != -1 ) {
            if ( value != "" ) {
                ISBNcheck.checkStandardNumber(this,"ISSN");
            } else if ( this.error ) {
                this.style.color = "black";
                this.style.backgroundColor = "";
                this.error = false;
            }
        }
        
        // Idioma con mayúscula (para títulos uniformes)
        else if ( this.tagCode.search(/(100|110|111|130|240|243|600|610|611|630|700|710|711|830)l/) != -1 ) {
            value = value.substr(0,1).toUpperCase() + value.substr(1);
        }
        
        this.setValue(value);
        
        // Como el contenido puede haber cambiado, ajustamos la altura del textarea
        //SubfieldManager.adjustSubfieldHeight(this);        
        this.autoSize();
        
    } // onChange
});

// Register this component type.
Ext.reg('subfieldbox', Catalis.SubfieldBox);
