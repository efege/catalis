#!/usr/bin/env python
# coding=utf-8


"""
pywxis
A module for accessing CDS/ISIS databases through Bireme's WXIS. 

MIT License <http://www.opensource.org/licenses/mit-license.php>

(c) 2008 Fernando J. Gómez / INMABB / Conicet

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""

from urllib import urlencode, urlopen


def rename_key(oldkey, newkey, dict):
    """
    Replaces oldkey by newkey in dictionary dict.
    NOTE -- modifies the passed dict object in-place.
    """
    try:
        dict[newkey] = dict[oldkey]
        del dict[oldkey]
    except KeyError:
        pass





class WxisServer:
    """
    This class represents the connection to a "Wxis server".
    Based on Malete's PHP class IsisServer.
    """

    # About these default values: read Catalis' settings.py module.
    # Use proxies={} to avoid looking for proxies when wxis is in localhost.
    # Read http://docs.python.org/lib/module-urllib.html
    # TO-DO: make those comments independent of that specific module.
    # TO-DO: consider using a unified setting, WXIS_URL= "http://127.0.0.1:8000/cgi-bin/wxis"
    def __init__(self, host='127.0.0.1', port=80, path='/cgi-bin/wxis', modules_dir='py-wxis-modules', proxies={}):
        self.host = host
        self.port = port
        self.path = path
        self.modules_dir = modules_dir
        self.proxies = proxies 
        self.url = 'http://%s:%s%s' % (self.host, self.port, self.path)

    def request(self, script, params):
        """
        Builds an URL, encodes the POST data, calls wxis, checks its response
        for errors, and finally returns the response or raises an exception.
        """
        
        IsisScript = '%s/%s.xis' % (self.modules_dir, script)
        params.update({
            'IsisScript': IsisScript,
        })
        
        # TO-DO: convert encoding utf-8 to latin-1 before calling urlencode?
        # Does not work; calling urlencode() gives errors like this:
        # UnicodeEncodeError: 'ascii' codec can't encode character u'\xe9' in position 2: ordinal not in range(128)
        # For sending queries, it would be OK if we could apply some accent-removal
        # method. But for sending data to be written, we need to do it right.
        # Read this thread: http://mail.python.org/pipermail/python-list/2006-April/376581.html
        if 'query' in params:
            params['query'] = params['query'].decode('utf8')
        data = urlencode(params)
        
        # Get WXIS's response
        fp = urlopen(self.url, data, proxies=self.proxies)  # NOTE: 'POST' is implied when a second positional argument ('data') is used
        wxis_response = fp.read()
        #print wxis_response
        
        # Convert the data returned by WXIS from latin-1 to utf-8 (unicode).
        # NOTE: this converts both the data retrieved from the database, and the wxis
        # metadata (including e.g. the query).
        # Removed after seeing records in Catalis (2008-04-22)  WHY??
        # Restored after upgrading to Ubuntu 8.04  WHY??
        # The situation is this:
        #   - to read the results directly, e.g. http://127.0.0.1:8000/db/bibima_test/?function=search&query=monteiro
        #     decode() is needed
        #   - to view the records in the browser, decode() must not be used.
        # TO-DO: understand this!
        #wxis_response = wxis_response.decode('latin-1')
        
        # Now try to catch errors in the response
        try:
            # Try to create a Python dictionary from the response.
            response = eval(wxis_response)
        except SyntaxError:
            # Reasons for a syntax error:
            #
            #   (a) WXIS died:  "WXIS|some error|...|...|" 
            #       Some examples:
            #           WXIS|file error|file open|Isis_Script|
            #           WXIS|fatal error|unavoidable|dbxopen: /home/fernando/tmp/bibliox.xrf (2)|
            #           WXIS|execution error|invalid value|-1|
            #       For a comprehensive list of errors, see these semi-official docs:
            #           * http://ibama2.ibama.gov.br/cnia2/cisis/mensagens%20de%20erro%20do%20wxis-mx.pdf
            #           * http://www.elysio.com.br/documentacao/manual_phl81.pdf
            #           * http://www.google.com.ar/search?q=%22de+erro+do+CISIS%22&filter=0
            #
            #   (b) WXIS sent an ill-formed response (e.g. missing comma, mismatched brackets)
            #
            #   Errors of type (a) can be detected using a regular expression.
            import re
            re_wxiserror = re.compile(r'(WXIS\|.+ error\|.+$)')
            wxiserror = re_wxiserror.search(wxis_response)
            if wxiserror:
                raise WxisHardError, match.group()
            else:
                # This covers reason (b)
                raise BadResponseError, wxis_response
        else:
            # OK, so the response is clean JSON... but still we may have a (clean) error message
            try:
                # Did the script send an error message? 
                reason = response['error']
            except KeyError:
                # There's no 'error' key in the response -- return the Python object
                return response
            else:
                # We have an error of the 'soft' kind
                raise WxisSoftError, reason  
    

class WxisDb:
    """
    Represents a CDS/ISIS database, accessible through WXIS.
    """
    
    def __init__(self, name, server=None, fst=None, stw=None, actab=None, uctab=None, **args):  # TO-DO: is server mandatory? some useful default? See Malete's PHP class
        self.name = name  # NOTE: this must be the full path
        self.server = server
        self.fst = fst
        self.stw = stw
        self.actab = actab
        self.uctab = uctab
        #self.expire ?? 
        #self.gizmo ??
        
        # An optional keyword parameter 'create' means "create this db". Examples:
        #     books = WxisDb('/path/to/books')              # check master existence, raise exception if it does not exist  
        #     users = WxisDb('/path/to/users', create=True) # create unconditionally, overwrite if already exists
        if 'create' in args and args['create'] == True:
            self._create()
        elif not self._exists():
            raise DatabaseDoesNotExist, self.name
        
    def __str__(self):
        return self.__class__.__name__ + ': ' + self.name 
    
    def _create(self):
        """
        Creates a database (master file and inverted file, both empty).
        """
        self.control(function='create', create='database')
        # NOTE: If an error ocurrs while attempting to create the database,
        # it's handled by _request().
    
    def _exists(self):
        """
        Checks if master file exists.
        """
        resp = self.get_status() 
        if resp['database']['status']['master'] == 'not found':
            return False
        else:
            return True

    def _request(self, script, params, content=None):
        """
        Parameters:
            script    Name of the IsisScript to invoke.
            params    Input parameters for the script. 
        """ 
        params.update({'database': self.name})
        return self.server.request(script, params)
        
    
    # The following seven methods correspond to the original wxis-modules scripts
    # or basic functions.
    # NOTE: index.xis, list.xis and search.xis expect an optional 'from' parameter,
    # but since 'from' is a Python keyword, we use 'start' instead, e.g.
    # db.index(start='BAR', count=10)
         
    def do_list(self, **params):
        """
        Retrieves a range of records.
        
        Parameters:
            start    (Optional)
            to       (Optional)
            count    (Optional)
        """
        rename_key('start', 'from', params)
        return self._request('list', params)
    
    def search(self, **params):
        """
        Performs a search using the inverted file.
        
        Parameters:
            query        The search expression. Queries must use the CISIS search language,
                         which is based on the standard CDS-ISIS search language.
                         See http://www.ius.bg.ac.yu/biblioteka/isis_search.html
            start        (Optional) Index of initial record.
            to           (Optional) Index of final record.
            count        (Optional) Number of records.
            sort_key     (Optional) A string specifying a Cisis format (PFT) to be used in sorting records.
            totalonly    (Optional) Use totalonly=1 to request the total number of results (no records)
        """
        rename_key('start', 'from', params)
        return self._request('search', params)
    
    def index(self, **params):
        """
        Retrieves a range of keys from the inverted file.
        
        Parameters:
            start    (Optional) Initial key. Defaults to the first key in the inverted file. 
            to       (Optional) Final key. Defaults to the last key in the inverted file.
            count    (Optional) By default there is no limit.
            reverse  (Optional) Disabled by default.
            posting  (Optional)
            posttag  (Optional)
        """
        rename_key('start', 'from', params)
        return self._request('index', params)
    
    def edit(self, **params):
        """
        Attempts to lock a record to allow editing. Returns the record or
        raises an exception.
        
        Parameters:
            mfn       MFN of record.
            lockid    Record lock id.
        """
        resp = self._request('edit', params)
        if resp['meta']['Isis_Status'] == '0':
            return resp
        else:
            raise LockedRecord, 'edit'
    
    def write(self, content=None, **params):
        """
        Attempts to write a record. Returns the record or raises an exception.
        
        The record content is sent to wxis in the HLine format, in which each
        field has the structure
        
            H<tag> <len> <value>
            
        Parameters:
            content    The record content. Must be a tuple, or list,
                       of 2-tuples (tag, value).
            mfn        The record's MFN, or 'New' to add a new record.
            lockid     Record lock id.
        
        Example:
        
            fields = (
                ('100', 'Some value'),
                ('200', 'Another value')
            )
            db.write(mfn=291, content=fields, lockid='xx')  
        """
        if content:
            # Convert to HLine
            params['content'] = ''.join([
                "H%s %s %s" % (field[0], str(len(field[1])), field[1])
                for field in content
            ])
        resp = self._request('write', params)
        if resp['meta']['Isis_Status'] == '0':
            return resp
        else:
            raise LockedRecord, 'write'
    
    def delete(self, **params):
        """
        Attempts to (logically) delete a record. Returns the record or raises
        an exception.
        
        Parameters:
            mfn       MFN of record.
            lockid    Record lock id.
        """
        resp = self._request('delete', params)
        if resp['meta']['Isis_Status'] == '0':
            return resp
        else:
            raise LockedRecord, 'delete'
    
    def control(self, **params):
        """
        Allows to create databases and to perform several tasks on
        existing databases.
        
        Parameters:
            function    The control function to execute ('unlock', 'invert', 'status', 'create').
            create      If function='create', then create={'master'|'inverted'|'database'}
                        creates the specified type of file(s).
            unlock      If function='unlock', then unlock='control' unlocks
                        only the database's control record.
        """
        return self._request('control', params)


    # These are convenient shortcuts to some of the methods defined above.
    
    def invert(self):
        """
        Generates the inverted file.
        """
        return self.control(function='invert')
    fullinv = invert
    
    def unlock(self):
        """
        Unlocks the master file and all locked records.
        
        Parameters:
            unlock    (Optional) If unlock='control', only the database's control
                      record is unlocked; otherwise, also all locked records are
                      unlocked. 
        """
        return self.control(function='unlock')
        
    def get_status(self, **kwargs):   # FIXME -- **kwargs is not needed, but is used to avoid an error
        """
        Returns information about the status of database files. 
        """
        return self.control(function='status')
        
    def get_total(self, **kwargs):   # FIXME -- **kwargs is not needed, but is used to avoid an error
        """
        Returns the number of records in the database.
        """
        return self.get_status()['database']['status']['total']
        
    def mfnrange(self, **params):
        """Alias for the do_list method."""
        return self.do_list(**params)
        
    def keyrange(self, **params):
        """Alias for the index method."""
        return self.index(**params)
        

    # This method was not available in wxis-modules, but is useful for cleaning
    # user-supplied queries.
    def extract(self, **params):
        """
        Returns the keys extracted from the passed data, using wxis's builtin
        mechanism, and optionally specifying custom stw, actab and uctab
        parameters. The method is in fact not associated with a specific
        WxisDb instance, though it could be useful to use the same stw, actab
        & uctab parameters used by the present WxisDb instance. 
        
        Parameters:
            data    The string from which to extract the keys. 
            tech    FST technique (4 to extract words).
        """
        return self._request('extract', params)



# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class IsisError(Exception):
    # Base class
    pass
    
class WxisHardError(IsisError):
    # For errors thrown by wxis (execution, fatal, file)
    def __init__(self, error):
        suggestion = ''
        if '|recread/xropn/w|' in error:
            suggestion = 'In other words, WXIS could not write to the disk. Check file and/or directory permissions for the web server user.'
        elif '|dbxopen:' in error:
            suggestion = 'In other words, WXIS could not open the database. Check that the files do exist and have read permissions for the web server user.'
        elif '|unavoidable|recisis0/xrf|' in error:
            suggestion = 'In other words, WXIS found problems trying to write something. Check database path and permissions for the web server user.'
        elif '|file error|file open|Isis_Script|' in error:
            suggestion = 'In other words, WXIS could not found the IsisScript. Check the path of the wxis-modules.'
        self.msg = "\n\n    %s\n\n%s" % (error, suggestion)
    def __str__(self):
        return self.msg

class WxisSoftError(IsisError):
    # For errors thrown by a script (missing parameter)
    def __init__(self, error):
        self.msg = error
    def __str__(self):
        return self.msg

class BadResponseError(IsisError):
    # For ill formed responses (with no wxis error) preventing the use of eval()
    def __init__(self, resp):
        self.msg = "The database server returned an ill-formed response. Check commas, quotes, braces, and brackets:\n\n%s" % resp 
    def __str__(self):
        return self.msg 

class LockedRecord(IsisError):
    # Isis_Status different from 0 when attempting to write a record
    def __init__(self, action):
        self.msg = "Can't %s record -- Record is locked" % action 
    def __str__(self):
        return self.msg
    
class DatabaseDoesNotExist(IsisError):
    def __init__(self, dbname):
        self.msg = "The database %s could not be found" % dbname 
    def __str__(self):
        return self.msg

# NOTE: check what other specific error codes may be returned by WXIS, described
# in the documents cited above (Elysio, etc).



#########################################################################
# Tests
#########################################################################
"""
This is a simple test of the code, which also shows how to use the API.

TO-DO:

  * compare the actual output with the expected output, so that errors may be
    automatically detected.

  * create a database from textual data (e.g. the usual CDS as .id or .iso)
    Should we have an extra method, load_iso(), using wxis's <import> tag? Not sure,
    since importing/exporting a database should probably not be done through HTTP...
    But for a purely local test this would be no problem.
    
  * show use of actab, uctab, stw, gizmo?
  
  * besides calling wxis, also show how to manipulate the data in Python, i.e. how
    to replace the formatting language:
      - display a list of records
      - display record details
      - display database status
      - use templates ("$"-based substitutions) to format output:
        http://docs.python.org/lib/node40.html
      - also use the usual "%"-based substitutions 
  
  * special case: MARC records (using pymarc)
"""
    
"""
Original usage examples:

1) Browse index keys

    >>> db = WxisDb('/home/fer/bases/testdb')
    >>> res = db.index(count=10, start='za')
    >>> [term['Isis_Key'] for term in res['terms']]
    ['ZAANEN', 'ZABCZYK', 'ZABRODSKY', 'ZACKS', 'ZADACH', 'ZADACHA', 'ZADACHAKH', 'ZADACHI', 'ZADATCH', 'ZADEH']

2) Search -- TO-DO: simplify using functions

    >>> res = db.search(query='marsden')
    >>> import re
    >>> titles = [ unicode(re.sub('\^\w', ' ', field['value'][4:]), 'latin1') for rec in res['records'] for field in rec['fields'] if field['tag'] == '245' ]
    >>> titles.sort()
    >>> print '\n'.join([ '(%s)  %s' % (n, t) for (n, t) in zip(range(1, len(titles)+1), titles) ])
    (1)  A mathematical introduction to fluid mechanics / A. J. Chorin and J. E. Marsden.
    (2)  Algebraic aspects of integrable systems : in memory of Irene Dorfman / A. S. Fokas and I. M. Gelfand, editors.
    (3)  Análisis clásico elemental / Jerrold E. Marsden, Michael J. Hoffman ; versión en español, Oscar Alfredo Palmas Velasco ; colaboración técnica, José Antonio Cuesta Ruiz.
    (4)  Basic complex analysis / Jerrold E. Marsden, Michael J. Hoffman.
    (5)  Calculus / Jerrold Marsden, Alan Weinstein.
    (6)  Cálculo vectorial / Jerrold E. Marsden, Anthony J. Tromba ; traducción: Patricia Cifuentes Muñiz ... [et al.] ; revisión técnica: Eugenio Hernández Rodríguez.
    (7)  Integration algorithms and classical mechanics / Jerrold E. Marsden, George W. Patrick, William F. Shadwick, editors.
    (8)  New directions in applied mathematics : papers presented April 25/26, 1980, on the occasion of the Case centennial celebration / edited by Peter J. Hilton and Gail S. Young ; with contributions by Kenneth Baclawski ... [et al.].
    (9)  Student's guide to Calculus by J. Marsden and A. Weinstein. Volume 2 / Frederick H. Soon.
    (10)  Vector calculus / Jerrold E. Marsden, Anthony J. Tromba.
"""


def test():
    import os
    from pprint import pprint
    
    def display_status(db):
        resp = db.get_status()
        status = resp['database']['status']
        pprint(status)
        
    def display_records(resp):
        """A simple way to display records."""
        pprint(resp['data'])
        
    def section(msg):
        """Displays a header for each section of the test."""
        line = '-'*40
        print
        print line
        print msg.upper()
        print line 
    
    TEST_DB = 'cds'
    TEST_DIR = 'test'
    
    path = os.path.join(os.getcwd(), TEST_DIR)
    testdb = os.path.join(path, TEST_DB)

    # create a WxisDb instance
    db = WxisDb(testdb, WxisServer(path='/cgi-bin/isis/wxis'))

    # check db status
    section('check db status')
    display_status(db)
            
    #####################################
    section('list some records')
    #####################################
    resp = db.do_list(start=10, count=2)
    display_records(resp)
          
    # create an FST, or use an existing one
          
    #####################################
    section('generate the inverted file')
    # TO-DO: specify actab, uctab, stw
    #####################################
    resp = db.invert()
    status = resp['database']['status']
    if status == 'inverted':   # why is this check here? should it be catched earlier, and throw an exception?
        print 'Database was inverted.'
    else:
        print 'Some error occurred, database was not inverted.'
          
    section('check db status')
    display_status(db)
      
    #####################################
    section('list some keys')
    #####################################
    resp = db.index(start='W', count=10)
    print [term['Isis_Key'] for term in resp['terms']]
      
    #####################################
    section('do a search')
    #####################################
    resp = db.search(query='water', count=2)
    display_records(resp)
      
    #####################################
    section('lock a record for editing')
    #####################################
    from time import strftime
    some_mfn = 10  # arbitrary
    mylockid = 'test %s' % strftime("%Y%m%d %H%M%S")
    try:
        resp = db.edit(mfn=some_mfn, lockid=mylockid)
        pprint(resp)
    except LockedRecord:
        print "Record %s is locked, can't be edited now." % some_mfn
      
    # TO-DO: attempt to edit, delete or write a locked record
      
    #####################################
    section('create a new record')
    #####################################
    fields = (
        ('100', 'Some value'),
        ('200', 'Another value')
    )
    try:
        resp = db.write(mfn='New', content=fields, lockid=mylockid)
    except:   # what kind of exception??
        print 'Record could not be written'
    
    # display the new record's MFN or error msg
    newmfn = resp['record']['mfn']
    print 'Record was saved. MFN: %s' % newmfn
      
    section('check db status')
    display_status(db)
          
    #####################################
    section('retrieve the new record')
    #####################################
    resp = db.do_list(start=newmfn, count=1)
    #resp = db.search(query='')
    display_records(resp)
      
    #####################################
    section('unlock records')
    #####################################
    resp = db.unlock()
    pprint(resp)
      
    section('check db status')
    display_status(db)
    
    #####################################
    section('delete the new record')
    #####################################
    try:
        resp = db.delete(mfn=newmfn, lockid=mylockid)
    except LockedRecord:
        print "Record %s is locked, can't be deleted now." % some_mfn
    pprint(resp)
      
    section('check db status')
    display_status(db)
      
    # TO-DO: also show how to clean query using Python only
    #####################################
    section('clean a dirty query')
    #####################################
    query = ' water  plants '
    resp = db.extract(data=query)
    newquery = ' AND '.join(resp['terms'])
    resp = db.search(query=newquery)
    display_records(resp)


if __name__ == '__main__':
    test()

