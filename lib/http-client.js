var
	readline = require("readline"),
	util = require("util"),
	rl = readline.createInterface({ input: process.stdin, output: process.stdout }),
	request = require("request"),
	querystring = require("querystring"),
	locals = null,
	options = null,
	cservice = require("../cluster-service")
;

exports.init = function(l, o) {
	locals = l;
	options = o;

	cservice.log("Service already running. Attached CLI to master service. Enter 'help [enter]' for help.".info);

	if (!options || options.silentMode !== true) {
	    rl.question("cservice> ".cservice, onCommand);
	}
};

exports.execute = onCommand;

function onCommand(question, cb) {
	var split = question.split(" ");
	if (split[0] === "exit") {
		cservice.log("Exiting CLI ONLY.".yellow);
		process.kill(process.pid, "SIGKILL"); // exit by force
		return;
	}
	var qs = querystring.stringify({
		cmd: question,
		accessKey: options.accessKey
	});
	var url = "http://" + (options.host || "localhost") + ":" + (options.port || 11987) + "/cli"
		+ "?" + qs
	;
	cservice.log("Running remote command: ".warn + url.data);
	request.post(url, function (err, res, body) {
		if (res.statusCode !== 200 && !err && body) {
		    err = body;
		}
		onCallback(err, body, res, cb);
	});
}

function onCallback(err, result, res, cb) {
	if (err) {
	    cservice.error("Error: ", err);
	    result = { statusCode: res.statusCode, error: err };
    } else if (result) {
		if (typeof result === "string" && (result.indexOf("{") === 0 || result.indexOf("[") === 0)) {
			result = JSON.parse(result); // deserialize
		}
	}
	cservice.log(util.inspect(result, { depth: null, colors: true }));

	//cservice.log("");//newline
	
	if (!options || options.silentMode !== true) {
	    rl.question("cservice> ".cservice, onCommand);
	}
	
	cb && cb(err, result);
}
