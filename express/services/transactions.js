const logger = require('../lib/log').getLogger('service/tx')
const blockchainInstance = require("../lib/blockchainInstance");

async function sendSignedTransaction(scFunction, contractAddress, scParams, nonce, contractName) {
    try {

        const blockchain = blockchainInstance.get()

        const transaction = await blockchain.createTransactionWContractAddress(
            scFunction, scParams, contractName, contractAddress,
            blockchain.getIdentity().address, "0x00", nonce)

        const signedTransaction = await blockchain.signTransaction(blockchain.getIdentity().privateKey, transaction, blockchain.getChainId());

        return await sendTx(signedTransaction);

    } catch (error) {
        logger.Err(error)
        throw error;
    }
}


async function confirmTransaction(contractAddress, txId, nonce, TSIN, salt) {
    try {

        const blockchain = blockchainInstance.get()

        const transaction = await blockchain.createTransactionWContractAddress(
            'confirmTransaction', [txId], 'WhitneyToken', contractAddress,
            blockchain.getIdentity().address, "0x00", nonce)

        const signedTransaction = await blockchain.signTransaction(blockchain.getIdentity().privateKey, transaction, blockchain.getChainId());

        return await sendTx(signedTransaction);

    } catch (error) {
        logger.Err(error)
        throw error;
    }
}


async function rejectTransaction(contractAddress, txId, errorCodes, nonce, TSIN, salt) {
    try {
        const blockchain = blockchainInstance.get()

        const transaction = await blockchain.createTransactionWContractAddress(
            'rejectTransaction', [txId, errorCodes], 'WhitneyToken', contractAddress,
            blockchain.getIdentity().address, "0x00", nonce)

        const signedTransaction = await blockchain.signTransaction(blockchain.getIdentity().privateKey, transaction, blockchain.getChainId());

        return await sendTx(signedTransaction);

    } catch (error) {
        logger.Err(error)
        throw error;
    }
}

async function getTxInfo(contractAddress, txId) {
    try {
        const blockchain = blockchainInstance.get();

        return {
            result: await blockchain.sendCall("transactionFullData", [txId], "WhitneyToken", contractAddress)
        }

    } catch (error) {
        const response = error.message + ' Or incorrect contract address was used.';
        logger.Warn(response)
        throw new Error(response);
    }

}

function sendTx(signedTransaction) {
    var response = {}
    var responseSent = false
    const blockchain = blockchainInstance.get()

    return new Promise((resolve, reject) => {
        blockchain.sendSignedTransaction(signedTransaction,
            function (txHash) {
                logger.Trace('txHash', txHash);
                responseSent = true
                response['txHash'] = txHash
                resolve(response)
            },
            function (error) {
                logger.Warn(error)
                logger.Warn('Error will be sent to queue')
                responseSent = true
                reject(error)

            },
            function (receipt) {
                logger.Trace('Receipt:', receipt);
            })
            // function (confirmation) {

            // });
    })
}

module.exports = {
    sendSignedTransaction,
    confirmTransaction,
    rejectTransaction,
    getTxInfo
}