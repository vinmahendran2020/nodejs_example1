const logger = require('../lib/log').getLogger('utils/getAddressFromTSIN')
const config = require('../config/config')
const blockchainInstance = require("../lib/blockchainInstance");


let envConfig
/* istanbul ignore next */
if (!process.env['NODE_ENV']) {
    process.env['NODE_ENV'] = 'local'
    envConfig = config.BC[process.env['NODE_ENV']]
}
/* istanbul ignore next */
else {
    envConfig = config.BC[process.env['NODE_ENV']]

}

//TODO CAN'T GET address FROM HERE with a harcoded owner ON PRODUCTION
module.exports = (TSIN, salt) => {
    logger.Debug(`TSIN provided, address will be calculated using it`)
    const blockchain = blockchainInstance.get()
    const WT = blockchain.contracts.get('WhitneyToken')
    const FC = blockchain.contracts.get('Factory')
    /* istanbul ignore next */
    if (WT == undefined){
        logger.Err('Contract WhitneyToken needs to be defined inside the configuration');
        return
    }
    /* istanbul ignore next */
    if (FC == undefined){
        logger.Err('Contract WhitneyToken needs to be defined inside the configuration');
        return
    }
    if(!salt) salt = 1;
    const paramsTypes = ['uint256', 'uint8', 'string', "string"]
    const acrm = "WT" || "WT"
    const paramsData = [0, 0, TSIN, acrm]
    const bytecode = `${WT.bytecode}${blockchain.encodeParameters(paramsTypes, paramsData).slice(2)}`
    const address = blockchain.buildCreate2Address(FC._address, blockchain.numberToUint256(salt), bytecode)
    logger.Debug(address)
    return address
}