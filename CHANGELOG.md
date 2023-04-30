# v1.0.2

* Use the ESM version of json5 to avoid CommonJS code leaking into the library. (Moo is a separate problem, which doesn't have an easy solution right now.)

# v1.0.1

* Remove negative lookbehind to escape separators and operators; you can do the same thing with quotes and negative lookbehind fails on Safari

# v1.0.0

Initial version