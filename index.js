import moo from 'moo'
import json5 from 'json5/dist/index.mjs'

function isNumeric(str) {
	if (typeof str != 'string') return false // we only process strings!
	return (
		!isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
		!isNaN(parseFloat(str))
	) // ...and ensure strings of whitespace fail
}

/**
 * Creates a regex that matches if any one of the elements in the array is matched
 * with backslash being an escape
 * @param {string[] | string} elements
 */
function createORRegex(elements) {
	if (!Array.isArray(elements)) {
		return new RegExp(`${elements}`)
	}
	const regexString = `(?:${elements.join('|')})`
	return new RegExp(regexString)
}

export const parse = (line, configuration = {}) => {
	let mergedConfig = {
		operator: ['=', ':'],
		separator: ',',
		strict: false,
		...configuration,
	}

	const lexer = moo.states({
		key: {
			escape: { match: /\\/, push: 'escape' },
			operator: { match: createORRegex(mergedConfig.operator), next: 'firstValue' },
			startQuote: { match: /"/, push: 'inQuote' },
			startSingleQuote: { match: /'/, push: 'inSingleQuote' },
			separator: { match: createORRegex(mergedConfig.separator), next: 'key' },
			keyText: { match: /[^]+?/, lineBreaks: true },
		},
		escape: {
			escapeText: { match: /[^]+?/, lineBreaks: true, pop: 1 },
		},
		firstValue: {
			escape: { match: /\\/, push: 'escape' },
			startObject: { match: /{/, push: 'inObject' },
			startArray: { match: /\[/, push: 'inArray' },
			startQuote: { match: /"/, push: 'inQuote' },
			startSingleQuote: { match: /'/, push: 'inSingleQuote' },
			valueText: { match: /[^]+?/, lineBreaks: true, next: 'value' },
		},
		value: {
			escape: { match: /\\/, push: 'escape' },
			separator: { match: createORRegex(mergedConfig.separator), next: 'key' },
			valueText: { match: /[^]+?/, lineBreaks: true },
		},
		inObject: {
			escape: { match: /\\/, push: 'escape' },
			startObject: { match: /{/, push: 'inObject' },
			endObject: { match: /}/, pop: 1 },
			objectText: { match: /[^]+?/, lineBreaks: true },
		},
		inArray: {
			escape: { match: /\\/, push: 'escape' },
			endArray: { match: /\]/, pop: 1 },
			arrayText: { match: /[^]+?/, lineBreaks: true },
		},
		inQuote: {
			escape: { match: /\\/, push: 'escape' },
			endQuote: { match: /"/, pop: 1 },
			quotedText: { match: /[^]+?/, lineBreaks: true },
		},
		inSingleQuote: {
			escape: { match: /\\/, push: 'escape' },
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
			try {
				if (value.startsWith('{') && value.endsWith('}')) {
					return json5.parse(value)
				}
				if (value.startsWith('[') && value.endsWith(']')) {
					return json5.parse(value)
				}
			} catch (e) {
				if (mergedConfig.strict) {
					throw e
				}
				console.warn('Failed to convert to JSON5 object, falling back to string. Error: ', e)
				return value
			}
		}
		if (value.startsWith("'") && value.endsWith("'")) {
			return value.slice(1, value.length - 1)
		}
		if (value.startsWith('"') && value.endsWith('"')) {
			return value.slice(1, value.length - 1)
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

			parsedObject._.push(convertValue(currentKey))
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
			case 'escapeText':
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
