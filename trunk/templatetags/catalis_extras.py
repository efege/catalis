# Template library (FG, 2008-04-18)

from django import template

register = template.Library()

@register.filter
def cleanmarc(value):
    # TO-DO: see record.py
    import re
    
    # Remove indicators and numeric subfields
    pattern = re.compile(r'\^\d[^\^]*')
    value = re.sub(pattern, '', value[2:])
    
    # Remove subfield delimiters, insert spaces
    pattern = re.compile(r'\^\w')
    return re.sub(pattern, ' ', value)