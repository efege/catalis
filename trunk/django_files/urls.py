'''
URLconfs for Catalis
'''

from django.conf.urls.defaults import *
from django.contrib.auth.views import login, logout
from django.conf import settings
from catalis import views

urlpatterns = patterns('',
    # Example:
    # (r'^catalis_pack/', include('catalis_pack.foo.urls')),

    # The root URL "/" has the same effect as "/ui"   # TO-DO: use redirect_to? (see generic views) 
    (r'^catalis/$', views.ui),

    # Get the user interface (HTML + linked CSS, JS, images)
    (r'^catalis/ui/$', views.ui),
    
    # Get config data
    (r'^catalis/config\.js$', views.js_config),


    # Rethinking the URL structure... 2008-04-22
    # From the client's point of view, especially using ExtJS, it seems more convenient if all
    # parameters are passed as GET/POST parameters, and not as part of the base URL.
    # Perhaps the database name could be included in the base URL, because we can think of
    # the database as a "resource" to be accesed, but the rest of the params --including
    # function to be invoked and mandatory arguments to that function-- should be just
    # GET/POST parameters.
    # So we'd have:
    #   /db/bibima/?do=list&start=340&count=20
    #   /db/bibima/?do=edit&record_id=004981
    #   /db/bibima/?do=search&query=africa$+politics&count=10&sort=date_asc
    # Example of SRU/CQL-like syntax (v. 1.2):
    #   /db/bibima/
    #       ?do=search
    #       &query=title all africa* politics sortBy pub_date/sort.descending
    #       &maximumRecords=10
    (r'^catalis/db/(?P<db_name>[^/]+)/$', views.handle_db_access),


    # Database access: let's organize the possible URLs in 3 groups.  
    
    # When we request a list of records or terms, all parameters are optional.
    # Example: /bibima/do_list/?start=340&count=20
    # (r'^(?P<db_name>[^/]+)/(?P<function>index|do_list)/$', views.handle_db_access),

    # When we do any writing, we must indicate the record id.   # WHAT IF THE RECORD IS NEW?
    # Example: /bibima/edit/004981/
    # (r'^(?P<db_name>[^/]+)/(?P<function>write|edit|delete)/(?P<record_id>.+)/$', views.handle_db_access),
    
    # Finally, when we search the database, we must provide a query.
    # Example: /bibima/search/africa$+politics/?count=10&sort=date_asc 
    # (r'^(?P<db_name>[^/]+)/(?P<function>search)/(?P<query>.+)/$', views.handle_db_access),


    # Enable access to the Admin UI:
    (r'^catalis/admin/', include('django.contrib.admin.urls')),
    
    # User login & logout    
    (r'^catalis/accounts/login/$', login),
    (r'^catalis/accounts/logout/$', logout),
    
    # Log/email JS error report (uses POST)
    (r'^catalis/js_error/$', views.js_error),

    # Tests
    #(r'^catalis/test/(.+)/$', views.test_pages),
)


# Static files.
# See official docs: http://www.djangoproject.com/documentation/static_files/
# See also these related discussions:
#   Images and Stylesheets: http://groups.google.com/group/django-users/browse_thread/thread/906a11a1c86e13b0/
#   Serving media from Django only in development [Trick]: http://groups.google.com.au/group/django-users/browse_thread/thread/9946fd3406144d06
if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^catalis/media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT, 'show_indexes': True}),
    )
