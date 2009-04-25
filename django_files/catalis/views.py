# coding=utf-8

'''
View functions for Catalis.
Started on 2008-04-14

TO-DO
    - Find a better way to include 'settings' and 'request' in the context for the templates.
      (See django.core.context_processors.request) 

'''

from django.shortcuts import render_to_response
from django.views.generic.simple import direct_to_template
from django.template import RequestContext
from django.http import HttpResponse
from django.conf import settings
from django.utils import simplejson
from django.contrib.auth.decorators import login_required
from catalis.models import MarcDatabase
from catalis.record import MarcRecord


def _max_count(params, max):
    '''
    Ensures that the count parameter does not exceed a specified max value.
    Note that this function may modify the passed argument 'params' in-place.
    ''' 
    try:
        count_ok = ( int(params['count']) <= max )
    except:
        count_ok = False
    if not count_ok:
        params['count'] = max


def _get_lockid():
    '''
    Returns a lockid for locking Isis records.
    TO-DO: use User id, IP number, etc
    '''
    return 'some-lockid'


def _build_wxis_params(params, db):
    '''
    Builds a dictionary of parameters as expected by pywxis.
    
    NOTE: this function modifies the passed dictionary in-place. 
    
    TO-DO: since this is a kind of "wxis adapter", it should be moved to
    another module, away from Django. At the Django level, we should not
    know about wxis; we should see instead an abstract MARC/Isis database. 
    '''

    action = params['action']
    
    # this is relevant only for 'search' and 'do_list'
    if 'start' in params and params['start'].isdigit() and action in ('search', 'do_list'):   # 'start' is also used to browse the index
        params['start'] = int(params['start']) + 1  # FIMXE -- This is related to ExtJS. Should it be in another place?
        
    if 'limit' in params:
        params['count'] = params['limit']
        del params['limit']
        
    if action in ('get_record', 'edit_record'):
        params['action'] = 'search'
        params['query'] = '-NC=' + params['recordId']
        # NOTE: also can use 'do_list' with 'mfn' 
    
    elif action == 'do_list':
        # The client requests a list of the most recent records
        if 'newrecs' in params:
            params['reverse'] = 'On'
            del params['newrecs']
            
    elif action == 'search':
        # Convert 'sort' to 'sort_key' (a cisis format)
        # TO-DO: use a "-" prefix to reverse the list. E.g. "-pub_date" displays newer items first.
        # Ext uses a "dir" param, with values "ASC" or "DES"
        if 'sort' in params:
            try:
                params['sort_key'] = db.SORT_KEY_MAP[params['sort']]
            except KeyError:
                pass
            del params['sort']
        # Apply count limit
        _max_count(params, settings.MAX_RECORDS)
        
        # Transform the query
        if not 'from_dict' in params or params['from_dict'] != '1':
            # "linear algebra" (title) => "linear/(9204) AND algebra/(9204)"
            suffixes = {'title': '9204', 'name': '9104', 'subj': '9604', 'note': '9504'}
            bool_op = ' AND '
            #params['original_query'] = params['query']  WARNING: if we need to use this param, then *don't* send it to wxis, to avoid an extra encoding problem
            query_terms = params['query'].split()
            if params['query_type'] == 'free':
                params['query_type'] = 'any'  # FIXME
            if params['query_type'] != 'any':
                suffix = suffixes[params['query_type']]
                query_terms = [ term + '/(%s)' % suffix for term in query_terms]
            params['query'] = bool_op.join(query_terms)
            # TO-DO: clean the original query (remove punctuation, etc)
            # TO-DO: handle truncation (map '*' to '$')
            # FIXME -- remove words "and", "or"; "not" is ok
            # What about other stopwords (file .stw)?
            # TO-DO: searches with "OR" or "|"
            # TO-DO: change character encoding? Queries using accents are not working!
            #params['query'] = params['query'].decode('utf8')  # this seems to work OK on the python console
            # But this should be done closer to WXIS, i.e. in in pywxis.
            # Let's *not* use python-unac package.

        else:
            # Queries coming directly from a dictionary term need some (weird) escaping
            
            # Operators as words
            params['query'] = params['query'].replace(' AND ', ' \AN\D ').replace(' OR ', ' \O\R ').replace(' WITH ', ' \WITH ')
            
            # Operators as symbols
            import re
            p = re.compile('(\*|\+|\^)(?=[^$])')  # meaning: a '*' or a '+' or a '^' that do not end the expression
            params['query'] = p.sub(r'\\\1\\', params['query'])  # \1 is the matched string
            
            # Parentheses
            params['query'] = params['query'].replace('(', '\(').replace(')', '\)')
            # A parenthesis at the end requieres a special treatment.
            # For problems using parentheses, see http://catalis.uns.edu.ar/doku/doku.php/parentesis_en_el_diccionario
            if params['query'][-2:] == '\\)':
                # This is a pseudo fix using '$'.
                #params['query'] = params['query'] + '$'
                # This is another "fix" that works a little better:  "AAAA (BBBB)" => "AAAA \(BBB\B\)"
                # But... fails with "-ST=(H)"
                params['query'] = params['query'][:-3] + '\\' + params['query'][-3:-2] + '\)'
          
        # Log for debugging  
        #f = file('/home/fernando/catalis-log.zz', 'a'); f.write(params['query'] + '\n'); f.close()
        
    elif action == 'index':
        # Apply count limit
        _max_count(params, settings.MAX_TERMS)
        
        # If going backwards, retrieve an extra term
        if 'reverse' in params and params['reverse'] == 'On':
            params['count'] = str(int(params['count']) + 1)
            
    elif action in ('write', 'edit', 'delete'):
        # Generate lockid
        params['lockid'] = _get_lockid()
        
        # Map record_id to MFN
        if 'record_id' in params:
            mfn = db.get_mfn(params['record_id'])   # TO-DO: VALIDATE
            params['mfn'] = mfn
            
        if action in ('write', 'delete'):
            # Add parameters used for key extraction
            params.update({
                'fst': db.fst,
                'stw': db.stw,
                'actab': db.actab,
                'uctab': db.uctab
            })
            

def _transform_output(result, format):
    '''
    Transforms the raw data returned by the database into something the client expects.
    '''
    
    # The transformation depends on the action being invoked, or perhaps on some extra parameter,
    # e.g. &format=brief
    # See for example: brief-record-json.js (on the svn folder).
    # And here it would be *very* nice to have something like the isis formatting language at
    # our disposal.
    # An alternative would be to pass a "pft_file" parameter to wxis, and let wxis apply the desired
    # formatting to the data. But then we would be keeping our dependency on wxis.
    #
    # database: "demo",
    # date: "20080422 180704 2 112",
    # query: "-ANOTACION-OTRA$",
    # total: 6,
    #            
    # recordId   : "000015",
    # main_entry : "",
    # title      : "Comparing prison systems : toward a comparative and international penology /",
    # resp       : "edited by Robert P. Weiss and Nigel South.",
    # date       : "1998",
    # type       : "LIBRO",
    # createdBy  : "XX",
    # location   : {tag: "859", classNo: "", itemNo: "", accessionNo: "765"}
    
    
    
    if format == 'brief':
        new_result = {
            'total': result['meta']['Isis_Total'],
            'hl_keys': 'Isis_Keys' in result['meta'] and result['meta']['Isis_Keys'],
            'records': []
        }
        for rec in result['data']:
            rec = MarcRecord(rec['fields'])
            new_result['records'].append({
                'recordId':   rec.id,
                'main_entry': rec.main_entry,
                'title':      rec.title,
                'resp':       rec.responsibility,
                'edition':    rec.edition,
                'pub_date':   rec.pub_date,
                'isbn':       rec.isbn,
                'type':       rec.type,
                'createdBy':  rec.v991,
                'location': {         # TO-DO: see brief-record-json.js
                    'tag': "859",
                    'classNo': "",
                    'itemNo': "",
                    'accessionNo': "765"
                }
            })

    elif format == 'full':
        # Assume we are sending a single record
        
        fields = result['data'][0]['fields']
        rec = MarcRecord(fields)
        
        undef = '_'  # used for positions that contain calculated lengths
        leader = undef*5 + rec.v905 + rec.v906 + rec.v907 + rec.v908 + rec.v909 + '22' + undef*5 + rec.v917 + rec.v918 + rec.v919 + '4500'
        rec.delete_tags(['905', '906', '907', '908', '909', '917', '918', '919'])
        
        new_result = {
            #'mfn': rec['mfn'],
            'leader': leader,
            'controlFields': rec._get_controlfields(),
            'dataFields': rec._get_datafields()
            # TO-DO: what about holdings data?
        }
            
    return new_result


@login_required
def ui(request):
    '''Returns the HTML for the Catalis UI.'''
    lang = 'lang' in request.GET and request.GET['lang'] or settings.DEFAULT_LANGUAGE
    return render_to_response('catalis-ui.html', {'settings': settings, 'lang': lang})


@login_required
def js_config(request):
    '''Returns a JavaScript file with configuration settings.'''
    lang = 'lang' in request.GET and request.GET['lang'] or settings.DEFAULT_LANGUAGE
    return render_to_response('config.js',
        # request is needed to display META.SERVER_* info
        # settings is needed to trasnport settings to the client
        {'request': request, 'settings': settings, 'lang': lang},
        context_instance=RequestContext(request))


@login_required
def handle_db_access(request, db_name, **params):
    '''
    A single function to handle access to the underlying Isis database.
    '''

    # NOTE: raises exception MarcDatabase.DoesNotExist if database object is not found.
    db = MarcDatabase.objects.get(name=db_name)


    # Join **params (if any) and GET parameters (TO-DO: filter non-existent or non-acceptable params?)
    request_dict = request.POST or request.GET 
    for key in request_dict.keys():   # Is there a shorter way? Note that using update() we get *lists*, even for a single value. 
        params[key] = request_dict.get(key)

    # Modify some parameters before invoking pywxis's methods.
    _build_wxis_params(params, db)


    # TO-DO: if action == 'write' and request.method == 'POST': handle content
    
    # Get the method we want to invoke. The 'action' parameter has been already
    # validated by the URLconf.
    db_method = getattr(db, params['action'])
    
    # Get the database response as a dictionary
    # TO-DO: if action == 'search', use result caching. We need to generate a
    # unique key for every search.
    # if action == 'search':
    #     cache_key = <database + query|escaped + sortby> 
    #     result = cache.get(cache_key)
    #     if not result:
    #        result = db_method(**params)
    #        cache.set(cache_key, result)
    
    # FIXME -- por cambio de 0.96 a 1.0, relacionado con Unicode. (2008-12-11)
    # La línea: result = db_method(**params)
    # Error: TypeError. index() keywords must be strings  (index es un caso particular de db_method)
    # Valor actual (da error): params = {u'action': u'index', 'count': u'20', u'start': u'io', u'xhr': u'1'}
    # Valor esperado (testeado, no da error): params = {'action': u'index', 'count': u'20', 'start': u'io', 'xhr': u'1'}
    
    # Usamos este fix ad hoc, basado en
    # http://groups.google.com/group/alchemist-dev/browse_thread/thread/b4c60370dfd72494/4272b43b9439b8a0?#4272b43b9439b8a0
    def str_dict_keys(d):
        "Converts to strings all the keys in dictionary d."
        tmp={}
        for (k, v) in d.items():
            tmp[str(k)] = v
        return tmp
    params = str_dict_keys(params)
    
    result = db_method(**params)
    
    # We have the raw data from the database, and now we must decide which
    # portions of that data will be sent to the client. For example, the client
    # does not always need the full records; a brief version may be enough,
    # especially when there are many records involved. Therefore, we need some
    # criteria to decide which extra manipulations are needed before returning
    # the response.
    
    if params['action'] in ('get_record', 'edit_record', 'search', 'do_list'):
        if not 'format' in params:
            params['format'] = 'full'
        response_data = _transform_output(result, params['format'])
    elif params['action'] == 'index' and 'reverse' in params and params['reverse'] == 'On':
        result['terms'].reverse()
        result['terms'].pop()  # remove the last term (which is in fact the first term of the *next* page)
        response_data = result
    else:
        response_data = result
    
    # Allow an alternative output as text or HTML, using a template. Based on
    # http://www.b-list.org/weblog/2006/jul/31/django-tips-simple-ajax-example-part-1/
    xhr = request.REQUEST.has_key('xhr')
    if xhr:
        json = simplejson.dumps(response_data)
        
        # NOTE: The correct form has a mimetype: return HttpResponse(json, mimetype='application/json'),
        # but since this causes Firefox to display the "Open/save" dialog, we omit the mimetype
        # while debugging.
        return HttpResponse(json)
    else:
        return render_to_response('response.html', response_data)
        
    # TO-DO: add other ouput formats: marcxml, mrc, mods, rss?, zipped?
    

@login_required
def js_error(request):
    '''
    Processes a JS error report, sending an email and logging the report.
    '''
    pass
    
# Test pages
def test_pages(request, page):
    lang = 'lang' in request.GET and request.GET['lang'] or 'es'
    return direct_to_template(
        request,
        template="test/%s.html" % page,
        extra_context={'settings': settings, 'lang': lang}
    )
    
