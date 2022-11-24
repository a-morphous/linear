# Linear

Single-line configuration parser

## Spec

Linear takes a string that can be on a single line, and has multiple configuration items

Various pieces are configurable, including:
* `separator`: character(s) to separate different fields. By default is `,`, using ` ` will create space-separated fields
* `assign_operator`: character(s) used to denote assignment, by default `=`. `:` is also common.

...once those values are given, the result is an object of the following, like `minimist`:

```
{
	_: string[],
	key: "value"
}
```

Values that aren't assigned a key are put into the `_` array in order. The keys are always strings.

### Basic Types

strings, numbers, and booleans are converted automatically.

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

### Nested Objects
Anything nested between {} or [] are denoted as objects, and are parsed according to JSON rules. Note that since this is assumed to be one line, you have to make your object on one line too. This is generally not a recommended format for making deeply nested configuration.