# coding=utf-8

# Django tests for Catalis
# Docs: http://docs.djangoproject.com/en/dev/topics/testing/

# Began on 2008-12-18

# Let's begin doing similar tests to those for pywxis.WxisDb.index

from django.test import TestCase

class CatalisTest(TestCase):

    # This method is run before each of the following tests
    def setUp(self):
        # Setup an Institution and a MarcDatabase
        from catalis.models import MarcDatabase, Institution
        self.inst = Institution(short_name='x')
        self.inst.save()
        self.dbname = 'celtic'
        self.marcdb = MarcDatabase(name=self.dbname, has_isisdb=True, institution=self.inst)
        self.marcdb.save()
        
        # Create a user
        from django.contrib.auth.models import User
        username = 'testuser'
        password = 'test'
        user = User.objects.create_user(username, 'tester@example.com', password)
        #user.is_staff = True
        #user.save()
 
        # Log in so we can access the database
        logged = self.client.login(username=username, password=password)
        self.assertTrue(logged)
    
        # Define some common data 
        self.url = '/catalis/db/%s/' % self.dbname
        self.params = {'xhr': 1}  # extra params are added later

    # Helper for reading records
    def helper_test_read(self, record_id, output):
        self.params.update({
            'action' : 'get_record',
            'recordId' : record_id,
        })
        response = self.client.get(self.url, self.params)
        self.failUnlessEqual(response.status_code, 200)
        
        resp = eval(response.content)
        
        self.assertEquals(resp.keys(), ['controlFields', 'leader', 'dataFields'])
        
        self.assertEquals(
            resp['dataFields'][0]['subfields'],
            output
        )

    # Helper for browsing the index
    def helper_test_index(self, start, output, reverse=''):
        self.params.update({
            'action' : 'index',
            'borders' : 'On',
            'start' : start,
            'limit' : 5,
            'reverse' : 'On',
        })
        response = self.client.get(self.url, self.params)
        self.failUnlessEqual(response.status_code, 200)
        
        resp = eval(response.content)
        self.assertEquals(
            (resp['meta']['prev'], [(t['Isis_Postings'], t['Isis_Key']) for t in resp['terms']], resp['meta']['next']),
            output
        )

    # Helper for doing searches
    def helper_test_search(self, query, query_type, output, reverse='', sort=None, total=None):
        self.params.update({
            'action': 'search',
            'query': query,
            'query_type' : query_type,
            'limit' : 5,
            'format': 'brief',
            'reverse': reverse,
            'sort': sort,
        })
        response = self.client.get(self.url, self.params)
        self.failUnlessEqual(response.status_code, 200)
        
        resp = eval(response.content)
        
        self.assertEquals(total, resp['total'])
        
        self.assertEquals(
            resp['records'][0]['title'],
            output
        )


    ##########################################
    # READ TESTS
    ##########################################
    
    # Request an existing record
    def test_read_record(self):
        self.helper_test_read('000030', 'Keltoi : a pan-celtic review.')
    
    # Request a non existing record
    def test_read_non_existent_record(self):
        self.helper_test_read('100000', 'FIXME - Record does not exist')


    ##########################################
    # INDEX TESTS
    ##########################################

    def test_index_emptyString(self):
        self.helper_test_index(
            '',
            ('false', [('1', '1700'), ('1', '1850'), ('1', '1932'), ('1', '1993'), ('1', '493')], 'true')
        )

    def test_index2(self):
        self.helper_test_index(
            'GUA',
            ('true', [('1', 'GUIDE'), ('1', 'HARP'), ('1', 'HEROES'), ('1', 'HIBERNO'), ('1', 'HIS')], 'true')
        )
        
    def test_index3(self):
        self.helper_test_index(
            'Y',
            ('true', [('1', 'YEAR'), ('1', 'YOUR')], 'false')
        )
        
    # FIXME - last term is not returned
    def test_index_lastPage(self):
        self.helper_test_index(
            u'\xFE\xFE',  # Latin Small Letter Thorn
            ('true', [('1', 'WISDOM'), ('1', 'WOMEN'), ('1', 'WRITTEN'), ('1', 'YEAR'), ('1', 'YOUR')], 'false'),
            reverse = 'On'
        )

    def test_index_latin1Character(self):
        self.helper_test_index(
            u'\u00E9',  # Latin Small Letter E with acute
            ('true', [('1', 'EDGES'), ('1', 'ELEMENTAL'), ('1', 'ELEMENTS'), ('1', 'ELEVENTH'), ('1', 'ENGLAND')], 'true')
        )

    def test_index_nonLatin1Character(self):
        self.helper_test_index(
            u'\u010D',  # Latin Small Letter C with caron (č)
            ('true', [('5', 'A'), ('1', 'AGE'), ('1', 'AIRS'), ('1', 'ALOUD'), ('1', 'ALPHABETS')], 'true')
        )

    # Going one page back must always return a full page, not less
    # FIXME - but where?
    def test_index_backToFirstPage(self):
        self.helper_test_index(
            '1993',
            ('false', [('1', '1700'), ('1', '1850'), ('1', '1932'), ('1', '1993'), ('1', '493')], 'true'),
            reverse = 'On'
        )


    ##########################################
    # SEARCH TESTS
    ##########################################

    def test_search_using_single_term(self):
        self.helper_test_search(
            'celtic',
            'any',
            'Keltoi : a pan-celtic review.',
            sort='main_entry',
            total='100'
        )

    def test_search_using_more_than_one_term(self):
        self.helper_test_search(
            'linguistics celtic',
            'any',
            'Celtic linguistics = Ieithyddiaeth Geltaidd : readings in the Brythonic languages : festschrift for T. Arwyn Watkins',
            total='2'
        )
    
    def test_search_non_ascii_characters_in_results(self):
        self.helper_test_search(
            'feil',
            'any',
            r'F\u00e9il-sgr\u00edbhinn E\u00f3in Mhic N\u00e9ill : essays and studies presented to Professor Eoin MacNeill',
            total='1'
        )

    def test_search_non_ascii_characters_in_query(self):
        self.helper_test_search(
            u'f\xE9il',
            'any',
            r'F\u00e9il-sgr\u00edbhinn E\u00f3in Mhic N\u00e9ill : essays and studies presented to Professor Eoin MacNeill',
            total='1'
        )
