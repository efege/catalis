# coding: utf-8

# Generado automáticamente con http://www.djangosnippets.org/snippets/603/
# REVISAR


from catalis.models import Institution, MarcDatabase, UserProfile
from django.contrib import admin
from django.utils.translation import ugettext_lazy as _

class UserProfile_Inline(admin.StackedInline):
    model = UserProfile

class MarcDatabaseOptions(admin.ModelAdmin):
    list_display = ('name', 'db_type', 'institution', 'description', 'total', 'active')
    list_filter = ('institution', 'db_type', 'active')

# class UserOptions(admin.ModelAdmin):
#     inlines = [UserProfile_Inline]

class InstitutionOptions(admin.ModelAdmin):
    list_display = ('short_name', 'long_name')

admin.site.register(MarcDatabase, MarcDatabaseOptions)
admin.site.register(Institution, InstitutionOptions)
