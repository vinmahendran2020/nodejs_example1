
const Web3 = require('web3')

// Web3 initialization (should point to the JSON-RPC endpoint)
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8590'))

var V3KeyStore = web3.eth.accounts.encrypt("0x2209AFA5E79CF2704224CAE407931FE80C45C140388B5B3BF6BE60C9AF4593BF", "password");
console.log(JSON.stringify(V3KeyStore));
process.exit();