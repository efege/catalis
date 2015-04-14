Catalis is a web application used to create catalogs based on library standards [AACR2](http://www.aacr2.org) and [MARC 21](http://www.loc.gov/marc/). It's being developed at the Instituto de Matemática de Bahía Blanca (Conicet & Universidad Nacional del Sur), in Argentina.

The original version --born somewhere between 2002-2003 and released in 2005-- is hosted at http://inmabb.criba.edu.ar/catalis/ (in Spanish), and is currently used by several libraries across Argentina and other countries.

The [friendly user interface](http://inmabb.criba.edu.ar/catalis/img/img-2.htm) for editing MARC records is usually considered one of Catalis' main features.

An important limitation of that first version was that the only supported browser was Internet Explorer. To fix this problem, and also to achieve a better organization of the code as well as multilanguage support, a new version of Catalis is under development since 2007, using two popular frameworks: [Ext](http://extjs.com/products/extjs/) (Javascript) for the client side, and [Django](http://djangoproject.com) (Python) for the server side.

The bibliographic data is stored --both in the original and the development versions-- in CDS/ISIS databases.

Although this new version still has partial funcionality (e.g. it does not allow editing records yet), it seems that the general design and file structure has stabilized enough so that we can start sharing the code and getting some feedback!

Detailed installation instructions will be posted soon; you can begin reading this if you _really_ can't wait:

  * [Instalación de la versión de desarrollo de Catalis](http://catalis.uns.edu.ar/doku/doku.php/instalacion_de_catalis_con_django) (Spanish).

And this is a screenshot of what you should expect to see:

![http://inmabb.criba.edu.ar/varios/catalis2008/catalis-dev-2008.png](http://inmabb.criba.edu.ar/varios/catalis2008/catalis-dev-2008.png)



You may be also interested in a related project: [OpacMarc](http://code.google.com/p/opacmarc/).



---


Last updated: 2008-07-17

Copyright (c) 2003-2008 Fernando J. Gómez, CONICET, and Instituto de
Matemática de Bahía Blanca (INMABB)
