var express = require('express');
const https = require("https");
const fs = require("fs");
var app = express();
var timeout = require('connect-timeout'); 
const config = require('../config/config.js');
const blockchainInstance = require("../lib/blockchainInstance");
const {sendSignedTransaction, confirmTransaction, rejectTransaction, getTxInfo} = require('../controllers/transactions')
const {changeOwner, pause, unpause, destroy,remint} = require('../controllers/contract')
const {mintSecurity, call, getSecurityAddress} = require('../controllers/extra')


const options = {
    key: fs.readFileSync(__dirname+"/../config/key.pem"),
    passphrase:'whitney',
    cert: fs.readFileSync(__dirname+"/../config/cert.pem")
  };

function haltOnTimedout(req, res, next){
  if (!req.timedout) next();
}
const bodyParser = require("body-parser");

const { BlockchainConnection } = require("../lib/blockchain");
const logger = require('../lib/log').getLogger('RestApi');

const port = process.env['PORT'] || 8032
let envConfig
if (!process.env['NODE_ENV'] ){
    process.env['NODE_ENV'] = 'local'
    envConfig = config.BC[process.env['NODE_ENV']]
    console.log(`Running in local mode, will connect to node running at ${envConfig.rpcEndpoint}`)
} 
else {
    envConfig = config.BC[process.env['NODE_ENV']]
    try {
        console.log(`Running in remote mode, will connect to node running at ${envConfig.rpcEndpoint}, to chain ${JSON.stringify(envConfig.chainId), null, 2}`)
    } catch (error) {
        logger.Fatal(`Environment ${process.env['NODE_ENV']} not recognized, please select a valid one located in config.js`)
        return
    }
}

process.env.LOG = process.env.LOG || 'debug'
process.env.TX_SPEED = process.env.TX_SPEED || "fast"
process.env.MAX_GASPRICE = process.env.MAX_GASPRICE || 200000000000
process.env.MIN_GASPRICE = process.env.MIN_GASPRICE || 10000000000

const blockchain = new BlockchainConnection(process.env.NODE_ENV);
blockchainInstance.set(blockchain)

app.use(timeout(60000));
app.use(haltOnTimedout);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/:contractAddress/transaction/:function', sendSignedTransaction)
app.post('/:contractAddress/transaction/:id/confirm', confirmTransaction)
app.post('/:contractAddress/transaction/:id/reject', rejectTransaction)
app.get('/:contractAddress/transaction/:id', getTxInfo)

app.post('/:contractAddress/changeOwner', changeOwner)
app.post('/:contractAddress/pause', pause)
app.post('/:contractAddress/unPause', unpause)
app.post('/:contractAddress/destroy', destroy)
app.post('/:contractAddress/remint', remint)
app.get('/:contractAddress/:function', call) // query params: params, contractName

app.post('/mintSecurity', mintSecurity)
app.get('/securityAddress', getSecurityAddress) // query params: TSIN, salt

var server = app.listen(port, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Mint service listening unprotected at http://localhost%s", host, port)
})

module.exports = server     // for testing purposes

https.createServer(options, app).listen(port+1);
console.log(`Mint service listening encrypted at https://localhost:${port+1}`)