"""
For ideas about how to organize the settings, including splitting settings across
several files, applying version control to only some settings, global vs. local
settings, using a .ini syntax, etc, see:

    - Splitting up the settings file <http://code.djangoproject.com/wiki/SplitSettings>
    - Django tips: laying out an application <http://www.b-list.org/weblog/2006/sep/10/django-tips-laying-out-application/>
"""


import os

# The folder where Catalis's files live.
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CATALIS_DIR =  os.path.abspath(os.path.join(_BASE_DIR, '..'))


DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

MANAGERS = ADMINS

DATABASE_ENGINE = 'sqlite3'           # 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'ado_mssql'.
DATABASE_NAME = os.path.join(CATALIS_DIR, 'bases/sql/catalis.sqlite')   # Or path to database file if using sqlite3.
DATABASE_USER = ''             # Not used with sqlite3.
DATABASE_PASSWORD = ''         # Not used with sqlite3.
DATABASE_HOST = ''             # Set to empty string for localhost. Not used with sqlite3.
DATABASE_PORT = ''             # Set to empty string for default. Not used with sqlite3.

# Local time zone for this installation. Choices can be found here:
# http://www.postgresql.org/docs/8.1/static/datetime-keywords.html#DATETIME-TIMEZONE-SET-TABLE
# although not all variations may be possible on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'America/Buenos_Aires'

# Language code for this installation. All choices can be found here:
# http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
# http://blogs.law.harvard.edu/tech/stories/storyReader$15
LANGUAGE_CODE = 'en-US'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = os.path.join(CATALIS_DIR, 'static_files/')

# URL that handles the media served from MEDIA_ROOT.
# Example: "http://media.lawrence.com"
# Note that this should have a trailing slash if it has a path component. [From: http://www.djangoproject.com/documentation/settings/]
MEDIA_URL = '/catalis/media/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/catalis/media/django/admin/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = '6++t#tbrq9!=2#bt!1c&2k4dhjnk4+cz2yh_sghq#q6b72712f'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
#     'django.template.loaders.eggs.load_template_source',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.doc.XViewMiddleware',
)

ROOT_URLCONF = 'urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os.path.join(CATALIS_DIR, 'django/catalis/templates'),
)

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.admin',
    'catalis',
)


AUTH_PROFILE_MODULE = 'catalis.UserProfile'


# ---------------------------------------------------------------------
# Catalis settings (non-Django)
# TO-DO: copy more settings from catalis.conf
# TO-DO: move these settings to another file and import it
# ---------------------------------------------------------------------
CATALIS_LOGIN_URL = '/catalis/accounts/login/' 
TITLE = 'Catalis 2008'
DEFAULT_LANGUAGE = 'es'
LOADING_MESSAGE_es = 'Cargando Catalis...'
LOADING_MESSAGE_en = 'Loading Catalis...'
RECORDS_PER_PAGE = 10
TERMS_PER_PAGE = 20
LIST_LIMIT = 500
AUTOMATIC_PUNCTUATION = True USE_FIELD_BLOCKS = True
REPORT_JS_ERRORS = True
MAIN_ENTRY_TOP = False
DOC_LC_REMOTE = False
MAX_TERMS = 50
MAX_RECORDS = 500
#DATABASES = ({"name": 'bibima_test', "perm": 3},)


# ------------------------------------------------
# Settings that are more likely to vary locally
# ------------------------------------------------

PROXY_HOST = ''
PROXY_PORT = ''


# Host, port and path to access wxis via HTTP.
# Adjust according to your server.
# Example: if you access wxis at the URL
# "http://127.0.0.1:8080/cgi-bin/wxis", then you have
#      WXIS_HOST = '127.0.0.1'
#      WXIS_PORT = '8080'
#      WXIS_PATH = '/cgi-bin/wxis'
WXIS_HOST = '127.0.0.1'
WXIS_PORT = '80'
WXIS_PATH ='/catalis/cgi-bin/wxis'
# TO-DO: why not use a single setting, WXIS_URL= "http://127.0.0.1:8000/cgi-bin/wxis" ?

# Path of the directory where the *.xis files live.
# Use an absolute filesystem path, or (better) a path relative to wxis's
# location.
# For example, if the scripts are in directory 'py-wxis-modules' under the
# directory containing wxis, then you have WXIS_MODULES_DIR = 'py-wxis-modules'
#
# IMPORTANT!! IF YOU CHANGE THIS VALUE, YOU MUST ALSO UPDATE THE *.xis FILES.
# (sorry, it seems that wxis requires paths in <include> tags to be hardcoded)
WXIS_MODULES_DIR = 'py-wxis-modules'


# Path to the isis databases (used in models.py)
PATH_ISIS_DB = os.path.join(CATALIS_DIR, 'bases/isis')


# Import local settings that override some of the settings in this file
from settings_local import *
