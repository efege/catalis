Ext.apply(Catalis.ListBrowser.prototype, {
    text: {
        // Search types
        type_any: 'cualquier campo'
        ,type_title: 'títulos'
        ,type_name: 'nombres'
        ,type_subj: 'temas'
        ,type_note: 'notas'
        ,type_sn: 'ISBN / ISSN'
        ,type_inv: 'inventario'
        ,type_free: 'búsqueda libre'
        
        ,listEmpty: '<p style="padding: 1em;">No se encontraron registros</p>'
       
        // List header
        ,manyResults: '<b>{0}</b> resultados para'
        ,oneResult: 'Sólo <b>1</b> resultado para'
        ,zeroResults: '<b>No hay resultados</b> para'
        ,searchExpression: '<b>{0}</b> (en <b>{1}</b>)'
        ,recordList: '<b>Todos los registros</b>, más recientes primero'
        ,sortedBy: 'ordenados por <b>{0}</b>'
        
        // Sort
        ,sortBy: 'Ordenar por'
        ,pub_date: 'fecha de publicación'
        //,author: 'autor'
        ,main_entry: 'encabezamiento principal'
        ,title: 'título'
        ,call_number: 'signatura topográfica'
        ,mod_date: 'fecha de modificación'
        
        ,printHeader: 'Resultados para'
    }
});

Ext.apply(Catalis.SearchForm.prototype, {
    text: {
        searchBoxEmpty: 'Buscar'
        ,in_: 'en'
        ,newRecords: 'Últimos registros'  //'Ver registros nuevos'
        ,searchHistory: 'Historial de búsquedas'
    }
});


Ext.apply(Catalis.ResultsToolbar.prototype, {
    text: {
        recordsFound: 'Registros encontrados'
        ,save: 'Guardar resultados'
        ,print: 'Imprimir'
        ,email: 'Email a...'
        ,download: 'Descargar'
    },
    
    beforePageText: 'p. '  // TO-DO: translate
});


Ext.apply(Catalis.SearchHistoryPanel.prototype, {
    text: {
        searchHistory: 'Historial'
        ,date: 'Hora'
        ,query: 'Búsqueda'
        ,queryType: 'Tipo'
        ,hits: '#'  //'Total'
        ,emptyHistory: 'No hay búsquedas en el historial.'
        ,runSearch: 'Ejecutar'
        ,modifySearch: 'Modificar'
        ,clearHistory: 'Borrar historial'
    }
});


Ext.apply(Catalis.DictionaryBrowser.prototype, {
    text: {
        panelTitle: 'Diccionario'  // 'Recorrer el diccionario'
        ,prefixes: 'Prefijos'
        ,prefixPubDate: 'Fecha pub.'
        ,prefixControlNo: 'Nro. control'
        ,prefixStandardNo: 'ISBN/ISSN'
        ,prefixAccessionNo: 'Inventario'
        ,prefixLanguage: 'Idioma'
        ,prefixCallNo: 'Sig. top.'
        ,prefixType: 'Tipo'
        ,prefixFullFields: 'Campos completos'
    }
});


Ext.apply(Catalis.DetailPanel.prototype, {
    text: {
        // Buttons
        aacr: 'AACR'
        ,marc: 'MARC'
        ,edit: 'Editar registro'
        
        ,searchBoxEmpty: 'Nro. de control'
    }
});


Ext.apply(Catalis.RecordEditor.prototype, {
    text: {
        title: 'Edición'
    }
});


Ext.apply(Catalis.DataFieldsPanel.prototype, {
    text: {
        block_description: 'Descripción'
        ,block_access: 'Puntos de acceso'
        ,block_subject: 'Temas'
        ,block_other: 'Otros datos'
        
        ,block_heading: 'Encabezamiento'
        ,block_see_from: 'Véase'
        ,block_see_also_from: 'Véase además'
    }
});