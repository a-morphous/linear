# Linear

Single-line configuration parser.

Not very well documented yet.

## Why?

JSON, TOML, YAML -- are all very good at defining configuration when you have the space of a configuration file.

But for various markups, sometimes I want to add some data for a single line -- and there, the more readable variants (TOML and YAML) end up not really being useful there. In those cases, the best configurations are soemthing akin to command line arguments, where keys and values can all fit on a line.

Thus, `linear`. 

## Usage

```js
import { parse } from '@a-morphous/linear

parse("line-of-configuration", {
	// configuration here
	operator: ['=', ':'], // the character(s) used for assignment, e.g. key=value or key:value here
	separator: ',', // character(s) used to separate items
	strict: false, // whether errors should be thrown from objects / arrays failing to parse
})
```

## Spec

Linear takes a string that can be on a single line, and has multiple configuration items

Various pieces are configurable, including:
* `separator`: character(s) to separate different fields. By default is `,`, using ` ` will create space-separated fields. This can be set as a string or an array of strings, each ideally one character long.
* `operator`: character(s) used to denote assignment, by default `=`. `:` is also common. This can be set as a string or an array of strings, each ideally one character long.

...once those values are given, the result is an object of the following:

```
{
	_: string[],
	key: "value"
}
```

Values that aren't assigned a key are put into the `_` array in order. The keys are always strings.

### Basic Types

Strings, numbers, and booleans are converted automatically.

Any number (that doesn't pass isNaN() in JS) is converted to a number. Numbers of the form `0x####` are converted to hexadecimal, numbers with decimal points `.` are converted to floats, otherwise to ints.

`true` and `false` are converted to their boolean counterparts.

### Quotes

quoting a string with regular quotes turns it into a full string, even if the separator or assign operator is in there.

```
foo=bar, "foo=bar"
```
will produce
```
{
	foo: 'bar',
	_: ["foo=bar"]
}
```

If you want a string to be wrapped by quotes, you need to double-wrap them
```
"test" -> test
""test"" -> "test"
```

### Nested Objects

Anything nested between {} or [] are denoted as objects, and are parsed according to [json5](https://json5.org/) rules. (Json5 used to avoid needing internal quotes for all values, which can get messy quick.) Note that since this is assumed to be one line, you have to make your object on one line too. This is generally not a recommended format for making deeply nested configuration.

Nested objects only work as values. Keys are always strings, so will not be modified:
```
{test}={bar:"foo"}
```
will produce
```
{
	"{test}":{
		"bar": "foo"
	}
}
```

### Escaping

A `\` will escape the next character, and make it not behave as it normally would. So this is how you can enforce that `{}` or `[]`-wrapped text remains strings.

#### What if an object fails to parse?

You can set `configuration.strict` to true, which will throw an error. Otherwise, behavior will be to emit a *warning*, and then fallback to sending the object as a string.

Arrays have similar behavior.