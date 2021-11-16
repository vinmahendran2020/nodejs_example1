const logger = require('../lib/log').getLogger('Controller/extra')
const service = require('../services/extra')
const getAddressFromTSIN = require("../utils/getAddressFromTSIN");

async function mintSecurity(req, res) {
    logger.Debug('Called function "mintSecurity" with body', req.body)

    var response = {}

    try {

        const { tsin, records, nonce, acronym } = req.body

        response = await service.mintSecurity(tsin, records, nonce, acronym)

        res.status(200).send(response)


    } catch (error) {
        response['error'] = error.message
        res.status(500).send(response)
        return
    }
}

async function call(req, res) {
    logger.Debug('Called function "call" with body', req.body)

    var response = {}

    try {

        const { function: scFunction, contractAddress } = req.params

        let {
            params: scParams,
            contractName,
        } = req.query

        scParams = scParams || []

        var response = {}

        response = await service.call(scFunction, contractAddress, scParams, contractName)

        res.status(200).send(response)
        
    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);

    }

}

async function getSecurityAddress(req, res) {
    logger.Debug('Called function "call" with body', req.body)

    var response = {}

    try {

        const { TSIN, salt } = req.query

        const contractAddress = getAddressFromTSIN(TSIN, salt)

        res.status(200).send({
            result: contractAddress
        });

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);

    }

}

module.exports = {
    mintSecurity,
    call,
    getSecurityAddress
}