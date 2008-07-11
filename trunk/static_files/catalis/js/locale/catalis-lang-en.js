Ext.apply(Catalis.ListBrowser.prototype, {
    text: {
        // Search types
        type_any: 'any field'
        ,type_title: 'titles'
        ,type_name: 'names'
        ,type_subj: 'subjects'
        ,type_note: 'notes'
        ,type_sn: 'ISBN / ISSN'
        ,type_inv: 'accession no.'
        ,type_free: 'free search'
        
        ,listEmpty: '<p style="padding: 1em;">No records found</p>'
        
        // List header
        ,manyResults: '<b>{0}</b> results for'
        ,oneResult: 'Only <b>1</b> result for'
        ,zeroResults: '<b>No results</b> for'
        ,searchExpression: '<b>{0}</b> (in <b>{1}</b>)'
        ,recordList: '<b>All records</b>, most recent first'
        ,sortedBy: 'sorted by <b>{0}</b>'
        
        // Sort
        ,sortBy: 'Sort by'
        ,pub_date: 'pub. date'
        //,author: 'author'
        ,main_entry: 'main entry'
        ,title: 'title'
        ,call_number: 'call number'
        ,mod_date: 'modification date'
        
        ,printHeader: 'Results for'
    }
});

Ext.apply(Catalis.SearchForm.prototype, {
    text: {
        searchBoxEmpty: 'Search'
        ,in_: 'in'  // "in" is a reserved word
        ,newRecords: 'Latest records'  //'View new records'
        ,searchHistory: 'Search history'
    }
});


Ext.apply(Catalis.ResultsToolbar.prototype, {
    text: {
        recordsFound: 'Records found'
        ,save: 'Save results'
        ,print: 'Print'
        ,email: 'Email to...'
        ,download: 'Download'
    },
    
    beforePageText: 'p. '
});


Ext.apply(Catalis.SearchHistoryPanel.prototype, {
    text: {
        searchHistory: 'History'
        ,date: 'Time'
        ,query: 'Query'
        ,queryType: 'Type'
        ,hits: '#'  //'Total'
        ,emptyHistory: 'There are no searches.'
        ,runSearch: 'Run'
        ,modifySearch: 'Modify'
        ,clearHistory: 'Clear history'
    }
});


Ext.apply(Catalis.DictionaryBrowser.prototype, {
    text: {
        panelTitle: 'Dictionary'  // 'Browse dictionary'
        ,prefixes: 'Prefixes'
        ,prefixPubDate: 'Pub.date'
        ,prefixControlNo: 'Control No.'
        ,prefixStandardNo: 'ISBN/ISSN'
        ,prefixAccessionNo: 'Accession No.'
        ,prefixLanguage: 'Language'
        ,prefixCallNo: 'Call No.'
        ,prefixType: 'Type'
        ,prefixFullFields: 'Full fields'
    }
});


Ext.apply(Catalis.DetailPanel.prototype, {
    text: {
        // Buttons
        aacr: 'AACR'
        ,marc: 'MARC'
        ,edit: 'Edit record'
        
        ,searchBoxEmpty: 'Control number'
    }
});


Ext.apply(Catalis.RecordEditor.prototype, {
    text: {
        title: 'Edition'
    }
});


Ext.apply(Catalis.DataFieldsPanel.prototype, {
    text: {
        block_description: 'Description'
        ,block_access: 'Access points'
        ,block_subject: 'Subjects'
        ,block_other: 'Other data'
        
        ,block_heading: 'Heading'
        ,block_see_from: 'See from'
        ,block_see_also_from: 'See also from'
    }
});