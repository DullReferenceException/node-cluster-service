
/*
 * question - Question to split apart.
	Ex: prop1 "prop #2" { "prop": 3 } [ "prop #4" ] 5
 * delimiter - What splits the properties? Can be one or more characters.
 * return - An array of arguments.
	Ex: [ "prop1", "prop #2", { "prop": 3 }, [ "prop #4" ], 5 ]
*/
exports.getArgsFromQuestion = function(question, delimiter) {

	// OLD WAY - simply breaks args by delimiter
	//var split = question.split(" ");
	//var args = [split[0], onCallback].concat(split.slice(1));
	
	// parser needs to be smarter, to account for various data types:
	// single word strings: hello
	// phrases: "hello world"
	// numbers: 1 or 1.3
	// JSON: [] or { "a": { "b": "hello \"world\"" } }
	var arg = [], args = [], stringOpen = false, jsonLevel = 0, arrayLevel = 0, i, isDelim, c, cprev, cnext;

	for (i = 0; i < question.length; i++) {
		cprev = i > 0 ? question[i - 1] : "";
		c = question[i];
		cnext = (i < question.length - 1) ? question[i + 1] : "";
		isDelim = (c === delimiter);
		if (stringOpen === true) { // processing quotted string
			if (c === "\"" && cprev !== "\\") { // closer
				// close string
				stringOpen = false;
				// add string arg, even if empty
				args.push(getArgFromValue(arg.join("")));
				// reset arg
				arg = [];
			} else { // just another char
				arg.push(c);
			}
		} else if (jsonLevel > 0) { // processing JSON object
			if (c === "}" && cprev !== "\\") { // closer
				jsonLevel--;
			} else if (c === "{" && cprev !== "\\") { // opener
				jsonLevel++;
			}

			arg.push(c);

			if (jsonLevel === 0) { // closed
				args.push(getArgFromValue(arg.join("")));
				// reset arg
				arg = [];
			}
		}  else if (arrayLevel > 0) { // processing JSON object
			if (c === "]" && cprev !== "\\") { // closer
				arrayLevel--;
			} else if (c === "[" && cprev !== "\\") { // opener
				arrayLevel++;
			}

			arg.push(c);

			if (arrayLevel === 0) { // closed
				args.push(getArgFromValue(arg.join("")));
				// reset arg
				arg = [];
			}
		} else { // processing basic arg
			if (c === delimiter) { // delimiter
				if (arg.length > 0) { // if arg, add it
					args.push(getArgFromValue(arg.join("")));
					// reset arg
					arg = [];
				}
			} else  if (c === "{" && arg.length === 0) { // JSON opener
				jsonLevel++;
				arg.push(c);
			}  else  if (c === "[" && arg.length === 0) { // Array opener
				arrayLevel++;
				arg.push(c);
			} else if (c === "\"" && arg.length === 0) { // string opener
				stringOpen = true;
			} else { // add it
				arg.push(c);
			}
		}
	}

	if (arg.length > 0) { // if arg remains, add it too
		args.push(getArgFromValue(arg.join("")));
	}

	return args;
};

function getArgFromValue(val) {
	try {
		// \" tags should be standard quotes after parsed
		val = val.replace(/\\\"/g, '"');

		// try to process as JSON first
		// Typical use cases:
		// 1 - number
		// 1.3 - number
		// [] - array
		// { "a": { } } - object
		return JSON.parse(val);
	} catch (ex) {
		return val; // use as-is
	}
}
