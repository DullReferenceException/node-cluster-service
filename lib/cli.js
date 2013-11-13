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

	util.inspect.styles.name = "grey";

	cservice.log("cluster-service CLI is now available. Enter 'help [enter]' for instructions.".magenta);
	
	// wait momentarily before attaching CLI. allows workers a little time to output as needed
	setTimeout(function() {
		rl.question("cservice> ".grey, onCommand);
	}, 1000);
};

exports.close = function() {
	try {
		rl.close();
	} catch (ex) {
	}
};

function onCommand(question) {
	var args = require("./util").getArgsFromQuestion(question, " ");
	args = [args[0], onCallback].concat(args.slice(1));
	
	if (!locals.events[args[0]]) {
		onCallback("Command " + args[0] + " not found. Try 'help'.");

		return;
	}
	
	try {
		cservice.trigger.apply(null, args);
	} catch(ex) {
		cservice.error("Command Error " + args[0], util.inspect(ex, { depth:null } ), ex.stack || new Error().stack);

		onCallback();
	}
}

function onCallback(err, result) {
	delete locals.reason;
	
	if (err) {
		cservice.error("Error: ", err, err.stack ? util.inspect(err.stack, { depth:null, colors: true}) : "");
	} else if (result) {
		cservice.log(util.inspect(result, { depth: null, colors: true }));
	}

	//cservice.log("");//newline
	
	rl.question("cservice> ".grey, onCommand);
}
