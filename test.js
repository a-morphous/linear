import { parse } from './index.js';

console.log(parse("test=foo, red, green, blue, 2, 'test=five'"))
console.log(parse("test=foo, 'red, \"green\", blue', 2, 'test=five'"))
console.log(parse("#FFFFFF, '0xffffff'"))
console.log(parse("#FFFFFF, 0xffffff"))
console.log(parse("{objects in key is nothing}=yay, key={test:'foo'}"))
console.log(parse("isReady = false"))

// different separators
console.log(parse("test test=foo 'strings should maintain whitespace' yeah", {
	separator: ' '
}))

console.log(parse("test:foo, with=different operators", {
	operator: [':','=']
}))

// fail object
console.log(parse("{this should fail}"))

// escapes
console.log(parse(`\\"test\\", should retain quotes`))