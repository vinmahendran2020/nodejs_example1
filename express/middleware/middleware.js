const bodyParser = require("body-parser");


function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();
}