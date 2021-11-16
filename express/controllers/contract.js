const logger = require('../lib/log').getLogger('Controller/contract')
const service = require('../services/contract')
const getAddressFromTSIN = require("../utils/getAddressFromTSIN");

async function changeOwner(req, res) {
    logger.Debug('Called function "changeOwner" with body', req.body)

    var response = {}

    try {

        const { contractAddress } = req.params

        const { newOwner, nonce} = req.body;

        response = await service.changeOwner(contractAddress, newOwner, nonce)
            
        res.status(200).send(response)
        return

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);
        return

    }
}

async function pause(req, res) {
    logger.Debug('Called function "pause" with body', req.body)

    var response = {}

    try {

        const { contractAddress } = req.params

        const { nonce} = req.body;

        response = await service.pause(contractAddress, nonce)
            
        res.status(200).send(response)
        return

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);
        return

    }
}

async function remint(req, res) {
    logger.Debug('Called function "pause" with body', req.body)

    var response = {}

    try {

        const { contractAddress } = req.params

        const { oldAddress, newAddress, amount, nonce} = req.body

        response = await service.remint(contractAddress, nonce, oldAddress, newAddress, amount)
            
        res.status(200).send(response)
        return

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);
        return

    }
}

async function unpause(req, res) {
    logger.Debug('Called function "unPause" with body', req.body)

    var response = {}

    try {

        const { contractAddress } = req.params

        const { nonce} = req.body;

        response = await service.unPause(contractAddress, nonce)
            
        res.status(200).send(response)
        return

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);
        return

    }
}

async function destroy(req, res) {
    logger.Debug('Called function "destroy" with body', req.body)

    var response = {}

    try {

        const { contractAddress } = req.params

        const { nonce} = req.body;

        response = await service.destroy(contractAddress, nonce)
        
        res.status(200).send(response)
        return

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);
        return

    }
}

module.exports = {
    changeOwner,
    pause,
    unpause,
    destroy,
    remint
}