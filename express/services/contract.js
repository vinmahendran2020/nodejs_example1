const logger = require('../lib/log').getLogger('service/contract')
const blockchainInstance = require("../lib/blockchainInstance");

async function changeOwner(contractAddress, newOwner, nonce) {
    try {
        const blockchain = blockchainInstance.get()

        const transaction = await blockchain.createTransactionWContractAddress(
            'transferOwnership', [newOwner], 'WhitneyToken', contractAddress,
            blockchain.getIdentity().address, "0x00", nonce)

        const signedTransaction = await blockchain.signTransaction(blockchain.getIdentity().privateKey, transaction, blockchain.getChainId());

        return await sendTx(signedTransaction);

    } catch (error) {
        logger.Err(error)
        throw error;
    }
}

async function remint(contractAddress, nonce, oldAddress, newAddress, amount) {
    try {
        const blockchain = blockchainInstance.get()

        const transaction = await blockchain.createTransactionWContractAddress(
            'remint', [oldAddress, newAddress, amount], 'WhitneyToken', contractAddress,
            blockchain.getIdentity().address, "0x00", nonce)

        const signedTransaction = await blockchain.signTransaction(blockchain.getIdentity().privateKey, transaction, blockchain.getChainId());

        return await sendTx(signedTransaction);

    } catch (error) {
        logger.Err(error)
        throw error;
    }
}

async function pause(contractAddress, nonce) {
    try {
        const blockchain = blockchainInstance.get()

        const transaction = await blockchain.createTransactionWContractAddress(
            'pause', [], 'WhitneyToken', contractAddress,
            blockchain.getIdentity().address, "0x00", nonce)

        const signedTransaction = await blockchain.signTransaction(blockchain.getIdentity().privateKey, transaction, blockchain.getChainId());

        return await sendTx(signedTransaction);

    } catch (error) {
        logger.Err(error)
        throw error;
    }
}

async function unPause(contractAddress, nonce) {
    try {
        const blockchain = blockchainInstance.get()

        const transaction = await blockchain.createTransactionWContractAddress(
            'unpause', [], 'WhitneyToken', contractAddress,
            blockchain.getIdentity().address, "0x00", nonce)

        const signedTransaction = await blockchain.signTransaction(blockchain.getIdentity().privateKey, transaction, blockchain.getChainId());

        return await sendTx(signedTransaction);

    } catch (error) {
        logger.Err(error)
        throw error;

    }
}

async function destroy(contractAddress, nonce) {
    try {
        const blockchain = blockchainInstance.get()

        const transaction = await blockchain.createTransactionWContractAddress(
            'close', [], 'WhitneyToken', contractAddress,
            blockchain.getIdentity().address, "0x00", nonce)

        const signedTransaction = await blockchain.signTransaction(blockchain.getIdentity().privateKey, transaction, blockchain.getChainId());

        return await sendTx(signedTransaction);

    } catch (error) {
        logger.Err(error)
        throw error;
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
    changeOwner,
    pause,
    unPause,
    destroy,
    remint
}