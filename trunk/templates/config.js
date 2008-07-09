/**
 * Variables de configuración globales.
 * Algunos valores provienen del archivo catalis.conf (now settings.py)
 */

Ext.namespace("Config");

Ext.apply(Config, {

    SOFT_NAME: "Catalis", // para mostrarlo en el título de la ventana
    SOFT_VERSION: "2007",
    DEBUG: {{ settings.DEBUG|lower }},
    SOFT_EMAIL: "catalis@googlegroups.com",
    SERVER: "{{ request.META.SERVER_NAME }}:{{ request.META.SERVER_PORT }}",  // IP?
    
    // Idioma de la interfaz
    LANG: "{{ lang }}",

    DISPLAY_SUBFIELD_LABELS: true, // Mostrar etiquetas para los subcampos
    AUTOMATIC_PUNCTUATION:   {{ settings.AUTOMATIC_PUNCTUATION|lower }},  // Asignar automáticamente la puntuación (boolean)
    USE_FIELD_BLOCKS:        {{ settings.USE_FIELD_BLOCKS|lower }},  // Agrupar campos en bloques (boolean)
    MODIFY_NOT_AACR2:        true,  // Corregir datos en registros no-AACR2 (boolean)
    AUTHORITY_CONTROL:       true,
    HIDE_SUBFIELD_ZERO:      false, // hide subfield $0 in controlled headings
    REPORT_JS_ERRORS:        {{ settings.REPORT_JS_ERRORS|lower }},  // (boolean)
    //ADMIN_EMAIL:             "[pft]v6004^m[/pft]",
    MAIN_ENTRY_TOP:          {{ settings.MAIN_ENTRY_TOP|lower }},  // (boolean)
    AACR_FIELD_HL:           true,  // resaltar campos en la ficha AACR2 (boolean)
    DOC_LC_REMOTE:           {{ settings.DOC_LC_REMOTE|lower }},  // (boolean)
    USE_LC_PROXY:            true,  // false to use an iframe, true to use proxy. TO-DO: enviar a catalis.conf
    ANIMATE:                 true,  // true to enable animation effects
    RECORD_DISPLAY_STYLE:    "aacr",  // default style

    PAGE_SIZE: {{ settings.RECORDS_PER_PAGE }}, // number of records per page
    LIST_LIMIT: {{ settings.LIST_LIMIT }}, // max number of records in a list

    // Patterns para especificar qué campos pertenecen a cada bloque
    FIELD_BLOCK_PATTERN: {
        biblio: {
            //description: no lo definimos explícitamente
            access:  /1..|240|7[0-5].|8[013]./,
            subject: /6..|08.|043|052/,
            other:   /02[^02]|0[1367].|04[^3]|05[^2]|856/
        },
        auto: {
            heading: /1../,
            see_from: /4../,
            see_also_from: /5../,
            notes: /6../
        }
    },

    // Directorio público (para css, img, xml)
    HTDOCS: "{{ settings.MEDIA_URL }}catalis/",

    /*
    // URLs de ventanas auxiliares
    URL_AUTHORITY = Config.HTDOCS + "html/authority.htm";
    URL_CONFIRM_DIALOG = Config.HTDOCS + "html/confirm.htm";
    URL_REQUEST_RECORD = Config.HTDOCS + "html/requestRecord.htm";
    URL_SAVING_RECORD = Config.HTDOCS + "html/savingRecord.htm";
    */

    // Start page for the MARC 21 docs.
    MARC_BIBLIO_DOC_URL: "{{ settings.MEDIA_URL }}catalis/doc/loc/marc/bibliographic/ecbdhome.html",
    MARC_AUTO_DOC_URL: "{{ settings.MEDIA_URL }}catalis/doc/loc/marc/authority/ecadhome.html",

    // Delimitadores usados en los registros ISO 2709
    ISO_SUBFIELD_DELIMITER:       String.fromCharCode(0x1F),
    REGEX_ISO_SUBFIELD_DELIMITER: new RegExp(String.fromCharCode(0x1F), "g"),
    ISO_FIELD_TERMINATOR:         String.fromCharCode(0x1E),
    ISO_RECORD_TERMINATOR:        String.fromCharCode(0x1D),

    // Delimitador de subcampo usado internamente
    // TO-DO: implementar el uso de un carácter diferente, para permitir el uso de '^' como parte de los datos?
    SYSTEM_SUBFIELD_DELIMITER: String.fromCharCode(0x5E),   // '^', el delimitador de ISIS, '^'
    REGEX_SYSTEM_SUBFIELD_DELIMITER: new RegExp("\\" + String.fromCharCode(0x5E), "g"),

    // Símbolo para representar elementos "indecidibles" en aacr2marc()
    UNK: "\u2666",  // Black diamond suit
    REGEX_UNK: new RegExp("\u2666", "g"),

    // A qué llamamos "subcampos vacíos"
    REGEX_EMPTY_SUBFIELD: new RegExp("^\\s*$"),

    // Altura mínima de los subfield boxes (debe ir asociada a .subfieldBox en el archivo CSS)
    SUBFIELDBOX_MIN_HEIGHT: "1.5em", //23;

    // Algunos colores
    SUBFIELDBOX_HL_BGCOLOR:      "#E2DFD0", // Oyster Shell   //"#E9E9E9"
    SUBFIELDBOX_HL_BORDERCOLOR:  "#AAA",
    RESULTROW_HL_BGCOLOR:        "#FFF8DC",  // "#FED" "#FEFEF0"
    INDEXTERM_HL_BGCOLOR:        "#E2DFD0",
    HOLDINGS_BGCOLOR:            "#FCB",
    POSTITNOTE_BGCOLOR:          "#FFA",
    DISPLAY_STYLE_BGCOLOR:       "#FEFEF0", // #FFF8DC;
    INDEXTERM_COLOR:             "#0000CC",
    FIXEDFIELD_HL_BGCOLOR:       "#FFC",
    
    // Lista de tags que admiten ajuste automático de la puntuación.
    AUTO_PUNCT_TAGS: /020.|[167]00.|[167]10.|[167]11.|24[05].|2[56]0.|254.|300.|310.|321.|4[49]0.|50[0124]a|510.|773[^xz]|830./,
    
    // Nombres de los meses (TO-DO: esto depende del idioma, y debería poder tomarse de Ext. Corrijo: en Ext no está la forma abreviada de los meses, pero podemos agregarla al objeto Date.)
    MONTH_NAME: {
        "01": "Ene",
        "02": "Feb",
        "03": "Mar",
        "04": "Abr",
        "05": "May",
        "06": "Jun",
        "07": "Jul",
        "08": "Ago",
        "09": "Sep",
        "10": "Oct",
        "11": "Nov",
        "12": "Dic",
        "00": "---"
    },
    
    // External websites, to be included in tabs.
    EXTERNAL_SITES: [{
        title: Lang.TABS.LC_CATALOG,  // Should this title depend on the user's language?
        url: "http://catalog.loc.gov/",
        enabled: true
    },{
        title: "MARC 21",
        url: "http://loc.gov/marc/",
        enabled: false
    },{
        title: "MathSciNet",
        url: "http://www.ams.org/mathscinet",
        enabled: false
    },{
        title: "Catálogo INMABB",
        url: "http://inmabb.criba.edu.ar/catalogo/",
        enabled: true
    }]
});

// Global variables
// TO-DO: make them properties of some global object.
var originalRecord;                   // para comparar con la versión actual, y decidir si hubo cambios
var g_HighlightIndexRowId = "";       // ID de la fila resaltada dentro de la tabla de términos del diccionario
var g_HighlightRowId = "";            // ID de la fila resaltada dentro de la tabla de resultados
var g_NextTask = "";                  // la tarea a ejecutar luego de una grabación del registro
var g_MARCOrganizationCode = "";
//var g_userid = "[pft]s(mpu,v2002,mpl)[/pft]";  // the current user
var g_userid = "FG";  // the current user
var g_activeBiblioDb = {};            // datos de la base bibliográfica activa
//var g_defaultBiblioDb = "[pft]ref(['USERS']l(['USERS']v2002), v5^*[1])[/pft]";  // default db for the current user (the first in the list)
var g_defaultBiblioDb = "{{ settings.DATABASES.0.name }}";
var g_defaultAutoDb = "auto";

// Other global variables: templates, ejemplares, selectedField, selectedSubfieldBox, charTable, postItNote, receivedRecord,
// newEjemplares, systemAttr, userAttr

//[pft]
/**
 * v3007: creamos lista con las bases de datos disponibles para el catalogador actual
 * Cada ocurrencia del campo 5 de la base USERS contiene: Base^pPermiso
 */
//proc( ref(['USERS']l(['USERS']v2002), ( 'a3007%',v5,'%' ) ) ),
//[/pft]
//g_available_databases = ["[pft] v3007+|", "| [/pft]"];
/*var g_available_databases = [
    [pft](
        '{db: "', v3007^*, '", perm: ', v3007^p, '}',
        if iocc < nocc(v3007) then ',' fi,/
    )[/pft]
];*/

// FIXME. This is a dirty approach.
//var g_available_databases = {
//    [pft](
//        '"', v3007^*, '": ', v3007^p,
//        if iocc < nocc(v3007) then ',' fi,/
//    )[/pft]
//};

var g_available_databases = {
    {% for db in settings.DATABASES %}
        "{{ db.name }}" : {{ db.perm }}
        {% if not forloop.last %}
        ,
        {% endif %}
    {% endfor %}
};
