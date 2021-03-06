Tweaking Configurations
=============================

So, what if you find that the existing jobs do not suffice for you to achieve
what you want? There is usually a layerd approach of steps you can take, going
from simple (but less powerful) to advanced (but more challenging). These steps
are:

* Adapt macros.
* Extend existing jobs.
* Define new jobs.

We will look at each of these levels in turn.

Macros
~~~~~~

Macros are simple named placeholders that are used in generator
configuration files. They make it easy to define values that are used in
multiple jobs in a single place (e.g. the application name), or expose a
value in a specific job so this value can be customized (e.g. a list of
packages to ignore when building an application-specific Apiviewer). One
way to change a macro is to edit the *config.json* file of your
application. Start your favourite text editor and load the configuration
file.

Let's suppose you want to add support for additional locales to your
application. Then locate the ``"let"`` entry in the configuration map.
The let key lets you define macros. Locate the macro named *"LOCALES"*,
and add two more locales so the value looks something like this: *[
"en", "fr", "de" ]*. With the next run of generate.py translation files
*fr.po* and *de.po* will be added to your *source/translation* directory.

There is also the possibility to pass a macro definition on the command
line when you invoke the generator::

    generate.py source --macro  CACHE:/tmp/cache

This tells the generator to use the path */tmp/cache* for its caching.
Passing macros in this manner allows you to change a macro on a
per-invocation basis. The command-line value will take precedence over a
potential existing definition in config.json.

Overriding Existing Jobs
~~~~~~~~~~~~~~~~~~~~~~~~

The second approach that goes beyond just modifying a macro is to
override an existing job. The default *config.json* comes with a
commented-out sample for this. Let's suppose you want to get rid of the
extra newlines that are sprinkled throughout the build version of your
app. In the *"jobs"* section of the config you find a job entry named
*"build-script"*. It has a sub-key *compile-options/code/format* (the "/" 
indicates nesting in the Json maps) which is
set to false (the default is true). Just uncomment this job and run
generate.py build again, and you'll find all newlines gone from the
generated code. This illustrates the general principle:

#. **Identify the job you are not contempt with.** This might require
   that you look at the generator output, or consult the basic
   configuration file, *tool/data/config/base.json*, as some jobs which
   you can invoke with the generator are broken down in sub-jobs.
#. **Add an entry of the same name in your config.json.** The generator,
   once you run it the next time, will indicate this by issuing a hint
   in the console output that the respective job has been shadowed.
#. **Add those keys to the job entry that you want to change, with
   suitable values.** Use the default job's definition to find out which
   config key you need to tweak. To achieve this you can look at the
   job's definition, e.g. in ``base.json``, or run the generator with
   the ``-w`` command line flag; this will print the full job definition
   before the job is run.

As mentioned above, on the next time you run the generator it will
indicate that you have successfully overridden a predefined job. The
message will be something like this:

.. code-block:: console

      - Warning: ! Shadowing job "build-script" with local one

(This is also helpful to prevent you from accidentially overriding an
existing job with a custom job that is supposed to be new).

Custom Jobs
~~~~~~~~~~~

Custom jobs are jobs that you freely define in your config.json. You add
them to the "jobs" section just as in the previous step, but making sure
you are **not** using an existing name for them (check the generator
console output when you run the job to make sure). The challenge with a
custom job is that you have to build it up from scratch, and it might
take you through some trial-and-error until you come up with a job
definition that is fully functional. To help you with that, many basic
configuration entries that almost any job would need are available in
dedicated job definitions of their own (like ``"cache"`` or
``"libraries"``), and we recommend using them. (This gives you another
hint at the configuration system of the tool chain: Jobs need not do
anything useful; they can also just be containers for configuration
snippets that can be included in other jobs to make their definition
more modular or compliant). Here is a simple custom job that just copies
two files to the build path of the application::

    "myjob" :
    {
      "extend" : ["cache"],
      "copy-files" :
      {
        "files"  : ["foo1.txt", "foo2.txt"],
        "source" : "/home/myhome/tmp",
        "target" : "./build"
      }
    }

Don't forget to add the entry *"myjob"* in your config's ``"export"`` list,
so it is available on the command line. 

Further Resources
~~~~~~~~~~~~~~~~~

* If you want to embark on the effort of creating custom jobs you're well-advised to make yourself familiar with the :doc:`general generator configuration overview </pages/tool/generator/generator_config>`, and
* the :doc:`reference of configuration keys </pages/tool/generator/generator_config_ref>` that can be used. 
* Also, there is an example configuration file in *tool/data/config/example.json* to look at.
* The basic configuration file, *tool/data/config/base.json*, 
* and the configuration files for the Testrunner (*component/testrunner/testrunner.json*)
* and Apiviewer (*component/apiviewer/api.json*) also provide good examples to learn from.

