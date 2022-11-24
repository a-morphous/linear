import { parse } from './index.js';

console.log(parse("test=foo, red, green, blue, 2, 'test=five'"))
console.log(parse("test=foo, 'red, \"green\", blue', 2, 'test=five'"))
console.log(parse("#FFFFFF, '0xffffff'"))
console.log(parse("#FFFFFF, 0xffffff"))
console.log(parse("{objects in key is nothing}, key={test:'foo'}"))
console.log(parse("isReady = false"))