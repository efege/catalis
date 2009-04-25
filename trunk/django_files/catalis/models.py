# coding: utf-8

"""
This file defines the (Django) models used by Catalis. These models are:

    - Institution
    - MarcDatabase
    - UserDbPermission
    - UserProfile
"""

from django.db import models
from django.contrib.auth.models import User  # for profiles
from django.conf import settings
import os.path
import shutil  # for removing directories
import pywxis


class Institution(models.Model):
    '''
    Each database and each user is associated to an institution -- usually a library.
    TO-DO: sometimes databases are associated with an event or meeting,
    such as a "Catalis Workshop".
    '''
    short_name = models.CharField(max_length=30)
    long_name  = models.CharField(max_length=100, blank=True)
    
    def __unicode__(self):
        return self.short_name

    class Meta:    
        verbose_name = 'institución'
        verbose_name_plural = 'instituciones'
        


# This model represents a MARC database, with either bibliographic or authority
# records.
# Each instance of the model has an associated IsisDb instance.
# The model partly acts as a wrapper for the pywxis.WxisDb class, i.e. it
# exposes IsisDb's methods for doing database operations (search, write, etc).
#
# TO-DO: what about *holdings* databases? Also MARC?
# Possible name change: CatalisDatabase
#
# Some parameters may be defined globally (for all instances of the MarcDatabase model), such as:
#    - lockid function (generates a "lockid" for locking records)
#    - expire (duration of locking)
#
# TO-DO: prevent changing the name after the object is created. Using editable=False does not accomplish
# what we want, see: How to make fields with editable=False visible in the Admin interface
# http://groups.google.com/group/django-users/browse_thread/thread/8774236fbcde3200/1c67616b4cc1c952
# UPDATE: the name is allowed to change, it may be useful sometimes. But we could add a confirmation
# request before saving such a modification.
#
class MarcDatabase(models.Model):

    DB_TYPE_CHOICES = (
        ('biblio', 'Bibliographic'),
        ('auto', 'Authority'),
        ('hldgs', 'Holdings'),
    )
    
    # -----------------------------------------------------------------------
    # Fields of the model 
    # -----------------------------------------------------------------------
    name        = models.CharField(max_length=30)             # e.g. "abr" 
    db_type     = models.CharField(max_length=10, choices=DB_TYPE_CHOICES, default='biblio')
    institution = models.ForeignKey(Institution)             # e.g. "Biblioteca Bernardino Rivadavia"
    description = models.CharField(max_length=200)            # e.g. "Libros, videos, CDs"
    notes       = models.TextField(blank=True)               # annotations, e.g. about the database's history
    active      = models.BooleanField(default=True)          # is the database available for use?

    # Rationale for using a field 'has_isisdb' instead of just checking if the associated Isis database files exist:
    # If we allow changing the database name, then ... hey, we can still check the *old* name!  TO-DO: CHECK THIS    
    has_isisdb  = models.BooleanField('La base Isis fue creada', default=False, editable=False)    # is the associated Isis database created?
    
    
    # TO-DO: add a 'counter' field, to replace the file cn.txt. Use models.PositiveIntegerField().
    # The value of this field should be increased by one each time a new record is saved to the database.
    # But is this safe? Is there a safer method to generate unique IDs?
    # Example of use (rec is a new MARC record, not yet saved):
    #     rec.db.counter += 1   # increase counter (does this use the *current* value of counter?)
    #     rec.db.save()         # save the MarcDatabase object
    #     rec.id = rec.db.PREFIX + rec.db.counter    # assign an id to the record
    #     rec.save()            # save the record (to the Isis db)
    

    # NOTE: All instances of the model share a single instance of the class WxisServer
    # (but that's not necessary)
    server = pywxis.WxisServer(settings.WXIS_HOST, settings.WXIS_PORT, settings.WXIS_PATH)
    

    # TO-DO: This is too MARC-specific, so it shouldn't go in pywxis.py (which tries to
    # be "just Isis").
    # But it's also too Isis-specific to be here in models.py.
    # So do we need some intermediate "MARC-Isis layer"?
    # FIXME -- use sorting indicators 
    SORT_KEY_MAP = {
        "pub_date"    : "v008*7.4",
        "title"       : "s(mpu, v245^a, x1, v245^b, mpl)",
        "main_entry"  : "s(mpu, v100^a, v110^a, v111^a, v130^a, v245^a, mpl)",  # includes title for sub-sorting
        "call_number" : "v859^h,x1,v859^i",
        "mod_date"    : "v005",
    }

        
    # -----------------------------------------------------------------------
    # "Special" methods
    # -----------------------------------------------------------------------
    
    def __unicode__(self):
        return self.name
    
    def __getattr__(self, name):
        if name == '_isisdb':
            # If we are here then self._isisdb does not exist yet, so we create it.
            # This attribute, created the first time it is referenced, stores a
            # reference to the associated IsisDb instance.
            # NOTE: this is known as "lazy attribute caching".
            self._isisdb = self._init_isisdb()
            return self._isisdb
        else:
            # Delegate method calls to the associated IsisDb.
            # TO-DO: limit the list of methods to only those which should be "public" (e.g. search, terms, etc.)?
            # TO-DO: use a prefix for these family of delegated methods? Example: isis_search, isis_write, etc.
            return getattr(self._isisdb, name)
        
    
    # -----------------------------------------------------------------------
    # "Private" methods
    # -----------------------------------------------------------------------
    
    def _init_isisdb(self):
        '''
        Creates and returns the associated pywxis.WxisDb instance.
        '''
        db_params = {
            'name': self._get_filename(),
            'server': self.server,
            'fst': os.path.join(settings.PATH_ISIS_DB, self.db_type + '.fst'),
            'actab': os.path.join(settings.PATH_ISIS_DB, 'ac-ansi.tab'),
            'uctab': os.path.join(settings.PATH_ISIS_DB, 'uc-ansi.tab')
        }
        return pywxis.WxisDb(**db_params)
        
    def _get_dirname(self):
        '''
        Returns the path to the directory containing this database's Isis files.
        '''
        return os.path.join(settings.PATH_ISIS_DB, self.name)
        
    def _get_filename(self):
        '''
        Returns the full path to this database's Isis files.
        '''
        return os.path.join(self._get_dirname(), self.db_type)        
        
    #def _exists_isis(self):
    #    '''Finds if the associated Isis database exists'''
    #    WARNING: This method does not work ok when the database name is changed.
    #    db_file = self._get_filename()
    #    try:
    #        db = pywxis.WxisDb(db_file, self.server)
    #    except pywxis.DatabaseDoesNotExist:
    #        return False
    #    else:
    #        return True
    
    def _create_isis(self):
        '''
        Creates the associated directory and Isis database (master & inverted files).
        '''
        path = self._get_dirname()
        try:
            # We have a permissions problem while attempting to create the db files.
            # The directory is created by the Python user (e.g. fernando), 
            # but the database files are created by the Apache user (www-data).
            # FIXME -- check this using both Django dev server and Apache.
            os.mkdir(path)
            os.chmod(path, 750)  # TO-DO: check permissions
            self._isisdb = pywxis.WxisDb(name=self._get_filename(), server=self.server, create=True)
            self.has_isisdb = True
        except:
            raise  # use exception middleware to return a friendly message?


    # Side-effects of this method: 'name' can't be a primary_key. Any other side-effects?
    def _rename_isis(self, old_name, new_name):
        '''
        Changes the associated directory's name.
        '''
        new_dir = self._get_dirname()
        parent_dir = os.path.dirname(new_dir)
        old_dir = os.path.join(parent_dir, old_name)
        os.rename(old_dir, new_dir)

        
    def _delete_isis(self):
        '''
        Removes the associated directory, which includes the Isis database.
        '''
        path = self._get_dirname()
        try:
            shutil.rmtree(path)   # optional argument: ignore_errors=True
        except:
            raise  # use exception middleware to return a friendly message?


    # -----------------------------------------------------------------------
    # Public methods
    # -----------------------------------------------------------------------
    
    # Override the default save() method (see Django Book, p. 326).
    # force_insert, force_update added in Django 1.0.
    # TO-DO: consider exceptions that may arise if there are problems with the isis directory/files.
    def save(self, force_insert=False, force_update=False):
        '''
        Creates the associated Isis database if it does not exist, and then saves the object.
        '''
        if not self.has_isisdb:
            self._create_isis()
        else:
            # For an existent database, check if the name has been changed, and
            # if so update the Isis directory.
            try:
                old = MarcDatabase.objects.get(id=self.id)
            except MarcDatabase.DoesNotExist:
                pass
            else:
                if self.name != old.name:
                    self._rename_isis(old.name, self.name)
            
        # Call the "real" save() method 
        super(MarcDatabase, self).save(force_insert, force_update)


    # Override the default delete() method (see Django Book, p. 326)
    def delete(self):
        '''
        Deletes the associated Isis database if it exists, and then deletes the object.
        '''
        if self.has_isisdb:
            self._delete_isis()
        super(MarcDatabase, self).delete()  # the "real" delete() method


    # Find the MFN given the record id (field 001)
    # TO-DO: move this to pywxis?
    def get_mfn(self, record_id):
        query = '-NC=' + record_id   # TO-DO: move this prefix away from here
        return self.search(query=query)['records'][0]['mfn']
        
    # TO-DO: get a list of users for this database
    def get_users(self):
        pass
        
    # TO-DO: add a method for downloading a (compressed) copy of the database 
    def download(self):
        pass    
    

    @property
    def total(self):
        '''Returns the number of records in the database.'''
        return self.get_total()  # delegates to IsisDb
        
    # How can we enable sorting by the "total" column, being total a method? (see Django Book, p. 330)
    # total.admin_order_field = 'total' => gives error: "'property' object has no attribute 'admin_order_field'"
    # and if the @property decorator is removed, we get "no such column: catalis_marcdatabase.total"
    
        
    class Meta:
        ordering = ['name', 'institution']
        verbose_name = 'base MARC'
        verbose_name_plural = 'bases MARC'
        
        

# Many to Many relationships with attributes:
#    http://code.djangoproject.com/ticket/6095
#    http://www.djangoproject.com/documentation/models/m2m_intermediary/
#    http://code.djangoproject.com/browser/django/trunk/tests/modeltests/m2m_intermediary/models.py
class UserDbPermission(models.Model):

    '''What a user is allowed to do with a database'''
    PERM_CHOICES = (
        ('1', 'Read only'),
        ('2', 'Create, modify and delete own records'),
        ('3', 'Create, modify and delete all records'),
    )
    #user = models.ForeignKey('UserProfile', edit_inline=models.STACKED)
    database = models.ForeignKey(MarcDatabase)
    permission = models.CharField(max_length=1, choices=PERM_CHOICES, default='1')  # 0.96: core=True


# Here we store additional data about each user, beyond the default Django admin fields.
# We don't want to an admin interface for this model, since we're using edit_inline,
# which makes the fields appear in the User form.
# See:
#   http://www.b-list.org/weblog/2006/jun/06/django-tips-extending-user-model/
#   http://www.b-list.org/weblog/2007/nov/24/profiles/
#   http://code.google.com/p/django-profiles/
class UserProfile(models.Model):
    '''Additional data for users.'''
    user         = models.ForeignKey(User, unique=True)  # 0.96: edit_inline=models.STACKED
    institution  = models.ForeignKey(Institution)  # TO-DO: should be optional, not every user will be affiliated with an institution 
    phone_number = models.CharField(max_length=30, blank=True)    # 0.96: core=True
    #databases    = models.ManyToManyField(MarcDatabase)
    databases    = models.ManyToManyField(UserDbPermission)
