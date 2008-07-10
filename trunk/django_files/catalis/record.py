# coding: utf-8
# Created: 2008-04-24 

"""
This module defines a class MarcRecord that makes it easy to work with MARC 21 records.
"""

# TO-DO
#   - Needs to be tested outside of Catalis/Django.
#   - Add leader and control fields
#   - Define custom exceptions for selectors
#   - Have a look at pymarc

import re

class MarcRecord():

    '''
    A class that represents a MARC record.
    Not based on pymarc, but anyway let's have a look at it.
    '''
    
    # Regular expressions
    re_selector = re.compile(r'(\d{1,3})(?:[_\$\^](\w))?')
    re_vselector = re.compile(r'v(\d{1,3})(?:[_\$\^](\w))?')
    re_subfield_code = re.compile(r'\^\w')   # this must use the same subfield symbol used in the data (e.g. "^" in isis)
    re_indicators = re.compile(r'^[^\^]+(?=\^)')  # idem
    re_num_subfield = re.compile(r'\^\d[^\^]*')  # idem
    re_titleslash = re.compile(r' +/ *$')  # matches the "space-slash" preceding a statement of responsibility
    
    '''
    Tests with other regular expressions:
    >>> p = re.compile(r'(?P<tag>\d{1,3})(?:\$(?P<code>\w))?')
    >>> p.match('245$r').groups()
    >>> p.match('245$r').group('tag')
    '245'
    >>> p.match('245$r').group('code')
    'r'
    >>> p.match('245').group('tag')
    '245'
    >>> p.match('245').group('code')
    >>>
    >>> p = re.compile(r'(\d{1,3})(?:\$(\w))?')
    >>> p.match('245').groups()
    ('245', None)
    >>> p.match('245$a').groups()
    ('245', 'a')
    '''

    def __init__(self, fields):
        self.fields = fields
        # Normalize tags using 3 digits (pad with zeros)
        for f in self.fields:
            if int(f['tag']) < 100:
                f['tag'] = f['tag'].zfill(3)
        
    def __getitem__(self, key):
        '''Example: rec['245']'''
        m = self.re_selector.match(key)
        if not m:
            raise IndexError, name
        tag = m.groups()[0]
        code = m.groups()[1]
        return self._get(tag, code)
    
    def __getattr__(self, name):
        '''Example: rec.v245'''
        m = self.re_vselector.match(name)
        if not m:
            raise AttributeError, name
        tag = m.groups()[0]
        code = m.groups()[1]
        return self._get(tag, code)
    
    def v(self, selector):
        '''Example: rec.v('245')'''
        return self[selector]  # implicit call to self.__getitem__

    def _getsf(self, field, code):
        '''
        Returns the contents of all subfields with a given code.
        '''
        subfields = [
            s[1:]
            for s in field.split('^')
            if len(s) > 0 and s[0] == code
        ]
        if len(subfields) == 1:
            return subfields[0]
        elif len(subfields) > 1:
            return subfields
        else:
            return ''
    
    def _get(self, tag, code=None):
        '''
        The basic method for field/subfield selection.
        I've added some friendly aliases, such as:
        
                r.v('245')
                r['v245']
                r.v245
            
                r.v('245a')
                r['v245a']
                r.v245a
                
                NOTE: an explicit subfield symbol is needed, otherwise this is ambiguous: 'v8563'
                r.v('245$a')
                r['v245$a']
                r.v245_a (only '_' allowed here)
                
            Other possibilities: r.get('245'), r.get('245_a'), r.get('245$a')
            
        Returns:
            - only one occurrence of tag: the field's value
            - two or more occurrences: a list of the fields's values.
            - zero occurrences: an empty string.
        '''
        
        if int(tag) < 10:
            # control fields
            values = [
                field['value']
                for field in self.fields
                if field['tag'] == tag
            ]
        else:
            # data fields
            values = [
                field['value']
                for field in self.fields
                if field['tag'] == tag
            ]
            
            # extract subfields?
            if code:
                values = [
                    self._getsf(field, code)
                    for field in values
                ]
            
        if len(values) == 1:
            return values[0]     # a string
        elif len(values) > 1:
            return values        # a list
        else:
            return ''            # an empty string
    
    def _get_datafields(self):
        '''
        '''
        datafields = [
            {'tag': field['tag'], 'ind1': field['value'][0:1], 'ind2': field['value'][1:2], 'subfields': field['value'][2:]}
            for field in self.fields
            if 9 < int(field['tag'])
        ]
        return datafields
    
    def _get_controlfields(self):
        '''
        '''
        controlfields = [
            field
            for field in self.fields
            if int(field['tag']) <= 9
        ]
        return controlfields
       
    def delete_tags(self, tags):
        '''
        Removes fields with the given tags.
        TO-DO: find a better way.
        '''
        fields = []
        for field in self.fields:
            if not field['tag'] in tags:
                fields.append(field)
        self.fields = fields
        
    def cleanmarc(self, data):
        '''
        Generates a clean, printable version of a field:
            - removes indicators
            - removes numeric subfields
            - replaces each pair (subfield delimiter, code) by a space
        '''
        data = re.sub(self.re_indicators , '', data)
        data = re.sub(self.re_num_subfield, '', data)
        data = re.sub(self.re_subfield_code, ' ', data)  # FIXME: leaves an extra initial space when data begins with "^"
        return data


    # -----------------------------------------------------------------------
    # MARC 21 shortcuts
    # -----------------------------------------------------------------------

    @property
    def id(self):
        return self.v001

    @property
    def title(self):
        ti = '%s %s' % (self.v245_a, self.v245_b)
        return re.sub(self.re_titleslash, '', ti)

    @property
    def main_entry(self):
        return self.cleanmarc(self.v100 or self.v110 or self.v111 or self.v130 or '')
    
    @property
    def responsibility(self):
        return self.v245_c
        
    @property
    def edition(self):
        return self.cleanmarc(self.v250)
        
    @property
    def pub_date(self):
        return self.v008[7:11]

    @property
    def isbn(self):
        isbns = self.v020_a   # NOTE: "020" is not allowed (unless we modify the code)
        if isinstance(isbns, list):  # TO-DO: replace this test by one not requiring the specific type "list"
            return isbns[0]
        else:
            return isbns

    @property
    def type(self):
        # Adapted from: doc-type.pft
        # TO-DO: translate strings
        # TO-DO: use leader values instead of v906/v907
        #ldr_type = self.leader[7]
        if self.v907 == 'a' and self.v773_7[2:4] == 'as':  # monographic component of a serial language material
        	type = 'ARTICULO de REVISTA'  # ¿y recorte de diario?
        elif self.v907 == 'a' and self.v773_7[2:4] == 'am':  # monographic component of a monographic language material
        	type = 'CAPITULO o PARTE de LIBRO'
        elif self.v502:  # TO-DO: usar 008
        	type = 'TESIS'
        elif self.v906 == 'a' and self.v907 == 'm':
        	type = 'LIBRO'   # TO-DO: un artículo/ensayo publicado en un sitio web personal, cómo queda?
        elif self.v907 == 'i' and self.v008[21] == 'w':  # integrating resource, updating Web site
        	type = 'SITIO WEB'
        elif self.v907 == 's' and self.v008[21] == 'p':  # serial, periodical
        	type = 'PUBLICACION PERIODICA'
        elif self.v907 == 's' and self.v008[21] == 'n':  # serial, newspaper
        	type = 'DIARIO'
        elif self.v907 == 's' and self.v008[21] == 'm':  # serial, monographic series
        	type = 'SERIE MONOGRAFICA'
        else:
        	type = ''
        return type
