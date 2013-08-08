var
	cservice = require("../cluster-service"),
	readline = require("readline"),
	util = require("util"),
	rl = readline.createInterface({ input: process.stdin, output: process.stdout }),
	locals = null,
	options = null
;

exports.init = function(l, o) {
	locals = l;
	options = o;

	rl.question("Command? (or help)\r\n", onCommand);
};

function onCommand(question) {
	var args = require("./util").getArgsFromQuestion(question, " ");
	args = [args[0], onCallback].concat(args.slice(1));
	
	if (!locals.events[args[0]]) {
		onCallback("Command " + args[0] + " not found");

		return;
	}
	
	try {
		cservice.trigger.apply(null, args);
	} catch(ex) {
		console.log("Command Error " + args[0], util.inspect(ex, { depth:null } ), ex.stack || new Error().stack);

		onCallback();
	}
}

function onCallback(err, result) {
	delete locals.reason;
	
	if (err) {
		console.log("Error: ", err, util.inspect(err.stack, {depth:null}));
	} else if (result) {
		console.log(util.inspect(result, { depth: null }));
	}

	console.log("");//newline
	
	rl.question("Command? (or help)\r\n", onCommand);
}
