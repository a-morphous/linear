import moo from 'moo'
import json5 from 'json5'

export const parse = (line, configuration = {}) => {
	let mergedConfig = {
		operator: '=',
		separator: ',',
		...configuration
	}

	function isNumeric(str) {
		if (typeof str != 'string') return false // we only process strings!
		return (
			!isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
			!isNaN(parseFloat(str))
		) // ...and ensure strings of whitespace fail
	}

	const lexer = moo.states({
		key: {
			operator: { match: new RegExp(`${mergedConfig.operator}`), next: 'firstValue' },
			startQuote: { match: /"/, push: 'inQuote' },
			startSingleQuote: { match: /'/, push: 'inSingleQuote' },
			separator: { match: new RegExp(`${mergedConfig.separator}`), next: 'key' },
			keyText: { match: /[^]+?/, lineBreaks: true },
		},
		firstValue: {
			startObject: { match: /{/, push: 'inObject' },
			startArray: { match: /\[/, push: 'inArray' },
			startQuote: { match: /"/, push: 'inQuote' },
			startSingleQuote: { match: /'/, push: 'inSingleQuote' },
			valueText: { match: /[^]+?/, lineBreaks: true, next: 'value' },
		},
		value: {
			separator: { match: new RegExp(`${mergedConfig.separator}`), next: 'key' },
			valueText: { match: /[^]+?/, lineBreaks: true },
		},
		inObject: {
			startObject: { match: /{/, push: 'inObject' },
			endObject: { match: /}/, pop: 1 },
			objectText: { match: /[^]+?/, lineBreaks: true },
		},
		inArray: {
			endArray: { match: /\]/, pop: 1 },
			arrayText: { match: /[^]+?/, lineBreaks: true },
		},
		inQuote: {
			endQuote: { match: /"/, pop: 1 },
			quotedText: { match: /[^]+?/, lineBreaks: true },
		},
		inSingleQuote: {
			endSingleQuote: { match: /'/, pop: 1 },
			quotedText: { match: /[^]+?/, lineBreaks: true },
		},
	})

	lexer.reset(line)
	const parsedObject = {}

	let currentKey = ''
	let currentValue = ''

	let hasSeenOperator = false

	const convertValue = (value, onlyBasics = false) => {
		if (isNumeric(value)) {
			if (value.includes('.')) {
				return parseFloat(value)
			}
			if (value.startsWith('0x')) {
				return parseInt(value, 16)
			}
			return parseInt(value, 10)
		}
		if (value === 'true') {
			return true
		}
		if (value === 'false') {
			return false
		}
		if (!onlyBasics) {
			if (value.startsWith('{') && value.endsWith('}')) {
				console.log(value)
				return json5.parse(value)
			}
			if (value.startsWith('[') && value.endsWith(']')) {
				return json5.parse(value)
			}
			if (value.startsWith("'") && value.endsWith("'")) {
				return value.slice(1, value.length - 1)
			}
			if (value.startsWith('"') && value.endsWith('"')) {
				return value.slice(1, value.length - 1)
			}
		}
		
		return value
	}

	const addValueToParsedObject = () => {
		// create a parsed value
		currentKey = currentKey.trim()
		currentValue = currentValue.trim()
		if (!currentKey) {
			currentKey = ''
			currentValue = ''
			hasSeenOperator = false
			return
		}
		if (!currentValue) {
			if (!parsedObject._) {
				parsedObject._ = []
			}

			parsedObject._.push(convertValue(currentKey, true))
		} else {
			// TODO: add some ability to JSON parse or sync.
			parsedObject[currentKey] = convertValue(currentValue)
		}

		currentKey = ''
		currentValue = ''
		hasSeenOperator = false
	}

	for (let token of Array.from(lexer)) {
		switch (token.type) {
			case 'keyText':
				currentKey += token.value
				break
			case 'separator':
				addValueToParsedObject()
				break
			case 'operator':
				hasSeenOperator = true
				break
			case 'valueText':
			case 'startObject':
			case 'startArray':
			case 'endObject':
			case 'endArray':
			case 'objectText':
			case 'arrayText':
				currentValue += token.value
				break
			case 'startQuote':
			case 'endQuote':
			case 'startSingleQuote':
			case 'endSingleQuote':
			case 'quotedText':
				if (hasSeenOperator) {
					currentValue += token.value
				} else {
					currentKey += token.value
				}
		}
	}

	addValueToParsedObject()
	return parsedObject
}
