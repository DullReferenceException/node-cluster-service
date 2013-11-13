var
	cservice = require("../cluster-service"),
	cluster = require("cluster"),
	httpserver = require("./http-server"),
	startRequests = [] // queued start requests
;

exports.start = startMaster;

function startMaster(options, cb) {
	options = options || {};
	options.workerCount = options.workerCount || 1;

	if (cservice.locals.state === 0) { // one-time initializers
		cservice.locals.state = 1; // starting
		
		/*process.on("uncaughtException", function(err) {
			cservice.log("uncaughtException", util.inspect(err));
		});*/
		
		// queue up our request
		startRequests.push(function() {
			startMaster(options, cb);
		});
		
		startListener(options, function(err) {
			if (err) {
				cservice.locals.isAttached = true;

				// start the http client
				require("./http-client").init(cservice.locals, options);
			} else { // we're the single-master	
				cservice.locals.isAttached = false;

				cluster.setupMaster({ silent: (options.silent === true) });
				
				cluster.on("online", function(worker) {
					cservice.trigger("workerStart", worker.process.pid);
				});

				cluster.on("exit", function(worker, code, signal) {
					cservice.trigger("workerExit", worker.process.pid);

					// do not restart if there is a reason, or disabled
					/*if (typeof (cservice.locals.reason) === "undefined" && worker.suicide !== true && options.restartOnFailure === true) {						
						setTimeout(function() {
							// lets replace lost worker.
							cservice.newWorker(worker.cservice.worker, null, options);
						}, options.restartDelayMs);
					}*/
				});

				if (options.cliEnabled === true) {
					// wire-up CLI
					cli = require("./cli");
					cli.init(cservice.locals, options);
				}
			}

			cservice.locals.state = 2; // running

			// now that listener is ready, process queued start requests
			for (var i = 0; i < startRequests.length; i++) {
				startRequests[i](); // execute
			}
			startRequests = [];
		});
	} else if (cservice.locals.state === 1) { // if still starting, queue requests
		startRequests.push(function() {
			startMaster(options, cb);
		});
	} else if (cservice.locals.isAttached === false && typeof options.worker === "string") { // if we're NOT attached, we can spawn the workers now		
		// fork it, i'm out of here
		var workersRemaining = options.workerCount;
		for (var i = 0; i < options.workerCount; i++) {
			cservice.newWorker(options.worker, null, options, function() {
				workersRemaining--;
				if (workersRemaining === 0) {
					cb && cb();
				}
			});
		}
	} else { // nothing else to do
		cb && cb();
	}
};

function startListener(options, cb) {
	if (typeof options.accessKey !== "string") { // in-proc mode only
		cservice.log("cluster-service is in LOCAL ONLY MODE. Run with 'accessKey' option to enable communication channel.".magenta);
		cb();
		return;
	}
	
	httpserver.init(cservice.locals, options, function(err) {
		if (!err) {
			cservice.log(("cluster-service is listening at " + (options.host + ":" + options.port).cyan).magenta);
		}

		cb(err);	
	});
}
