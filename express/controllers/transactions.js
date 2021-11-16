const logger = require('../lib/log').getLogger('Controller/tx')
const service = require('../services/transactions')
const getAddressFromTSIN = require("../utils/getAddressFromTSIN");


async function sendSignedTransaction(req, res) {
    logger.Debug('Called function "sendSignedTransaction" with body', req.body)

    var response = {}

    try {

        const { contractAddress, function: scFunction } = req.params

        const {
            params: scParams,
            nonce,
            contractName,
        } = req.body;

        response = await service.sendSignedTransaction(scFunction, contractAddress, scParams, nonce, contractName)
            .catch((error) => {
                response['error'] = error.message;
                res.status(500).send(response);
                return
            })
        res.status(200).send(response)
        return

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);
        return

    }
}


async function confirmTransaction(req, res) {
    logger.Debug('Called function "confirmTransaction" with body', req.body)

    var response = {}

    try {

        const { contractAddress, id: txId } = req.params

        const { nonce } = req.body;

        response = await service.confirmTransaction(contractAddress, txId, nonce)
            .catch((error) => {
                response['error'] = error.message;
                res.status(500).send(response);
                return
            })
        res.status(200).send(response)
        return

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);
        return

    }
}


async function rejectTransaction(req, res) {
    logger.Debug('Called function "rejectTransaction" with body', req.body)

    var response = {}

    try {

        const { contractAddress, id: txId } = req.params

        const { nonce, errorCodes } = req.body;

        response = await service.rejectTransaction(contractAddress, txId, errorCodes, nonce)

        res.status(200).send(response)
        return

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);
        return

    }
}

async function getTxInfo(req, res) {
    logger.Debug('Called function "getTxInfo" with body', req.body)

    var response = {}

    try {

        const { id: txId, contractAddress } = req.params

        response = await service.getTxInfo(contractAddress, txId)

        res.status(200).send(response)

    } catch (error) {
        response['error'] = error.message;
        res.status(500).send(response);

    }

}

module.exports = {
    sendSignedTransaction,
    confirmTransaction,
    rejectTransaction,
    getTxInfo
}