const chai = require('chai');
const assert = require('chai').assert
const expect = require('chai').expect
const Web3 = require('web3');

const { assertRevert } = require("./helpers/assertRevert");
const { BlockchainConnection } = require("../lib/blockchain");

const WT_ABI = require('../config/tests/WhitneyToken.json').abi
const WT_B = require('../config/tests/WhitneyToken.json').bytecode

const FACTORY_ABI = require('../config/tests/Factory.json').abi
const FACTORY_B = require('../config/tests/Factory.json').bytecode

let FACTORY_ADDRESS = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"
let WT_ADDRESS = "0x5b1869D9A4C187F2EAa108f3062412ecf0526b24"

let accounts
const pks = [
    "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
    "0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1"
]

const blockchain = new BlockchainConnection('test');
const should = chai.should();
const web3 = new Web3('http://localhost:8545');

describe('BlokchainConnection Tests', function () {

    this.timeout(10000)

    describe('Error with no initialization', function () {

        it('Should thow an error when there is no Factory Initialized', function (done) {
            const blockchainTest = new BlockchainConnection('test');
            blockchainTest.deploy()
                .then(() => {
                    done(new Error('Should\'ve been rejected'))
                }).catch((error) => {
                    error.message.should.be.eql('Contract Factory needs to be defined inside the configuration file')
                    done()
                })
        })
    })

    describe('Initial deployments', function () {

        it('Deploying...', async function () {
            accounts = await web3.eth.getAccounts()
                .catch((err) => {
                    console.log(err)
                })
            factory = await new web3.eth.Contract(FACTORY_ABI)
                .deploy({ data: FACTORY_B, arguments: [] })
                .send({ from: accounts[0], gas: 6721975 })
                .catch((err) => {
                    console.log(err)
                })
            FACTORY_ADDRESS = factory._address

            wt = await new web3.eth.Contract(WT_ABI)
                .deploy({ data: WT_B, arguments: [100, 0, "Mock", "M"] })
                .send({ from: accounts[0], gas: 6721975 })
                .catch((err) => {
                    console.log(err)
                })
            WT_ADDRESS = wt._address
        })
    })

    describe('constructor()', function () {

        it('should use web3 provider when passed it on', function () {
            new BlockchainConnection('test', web3)
        })
    })

    describe('deploy()', function () {

        it('Sould deploy a contract when passed on its bytecode & salt', function (done) {

            const { address, privateKey } = blockchain.getIdentity()

            blockchain.deploy(FACTORY_ADDRESS, WT_B, ['uint256', 'uint8', 'string', 'string'], [100, 0, "Test", "T"], 1, address, privateKey, '7357', undefined /*no nonce*/,
                function (err) {
                    done(new Error('This should have worked out. ' + err.message))
                }, function (receipt) {
                    const newSecurity = blockchain.getDeploymentAddressFromFactoryTx(receipt)
                    newSecurity.deploymentAddress.should.be.a('string')

                    // check that there is a contract in that address indeed
                    web3.eth.getCode(newSecurity.deploymentAddress, undefined, function (err, result) {
                        should.not.exist(err)
                        should.exist(result)
                        result.should.not.eql('0x')
                        done()
                    })
                })
        })

        it('Sould revert when deploying a security with an existing TSIN', function (done) {

            const { address, privateKey } = blockchain.getIdentity()

            blockchain.deploy(FACTORY_ADDRESS, WT_B, ['uint256', 'uint8', 'string', 'string'], [100, 0, "Test", "T"], 1, address, privateKey, '7357', undefined /*no nonce*/,
                function (err) {
                    err.should.be.a('error')
                    done()
                }, function () {
                    done(new Error('Should\'ve errored'))
                })
        })

        it('Sould fail when passed on a incorrect address', function (done) {

            const { address, privateKey } = blockchain.getIdentity()

            blockchain.deploy(accounts[0], WT_B, ['uint256', 'uint8', 'string', 'string'], [100, 0, "Test2", "T"], 1, address, privateKey, '7357', undefined /*no nonce*/,
                function () {
                    done(new Error('Should\'ve errored'))
                }, function () {
                    done(new Error('Should\'ve errored'))
                })
                .catch((err) => {
                    expect(err.message).to.be.equals(`Contract Factory is not deployed on ${accounts[0]}, please deploy it (IE truffle) and paste the correct address inside the configuration file`)
                    done()
                })
        })
    })

    describe('sendRawTransaction()', function () {
        it('should return txHash & receipt with succesful state', function (done) {
            const contractOptions = {
                functionName: 'mint',
                functionParams: [accounts[0], 100],
                contractName: 'WhitneyToken',
                contractAddress: WT_ADDRESS
            }

            const callbakcs = {
                txHashCallback: function (hash) {
                    expect(hash).to.be.a('string')
                },
                txReceiptCallback: function (receipt) {
                    expect(receipt.status).to.be.true
                    done()
                },
                errorCallback: function (error) {
                    done(new Error('An error occurred'))
                }
            }

            const options = {
                chainId: 7357,
                ether: '0x00',
            }

            blockchain.sendRawTransaction(contractOptions, callbakcs, options)
        })

        it('should return error with incorrect contract address', function (done) {
            const contractOptions = {
                functionName: 'mint',
                functionParams: [accounts[0], 100],
                contractName: 'WhitneyToken',
                contractAddress: FACTORY_ADDRESS
            }

            const callbakcs = {
                txHashCallback: function (hash) {
                    expect(hash).to.be.a('string')
                },
                txReceiptCallback: function () {
                    done(new Error('Transaction should habe errored'))
                },
                errorCallback: function () {
                    done()
                }
            }

            const options = {
                chainId: 7357,
                ether: '0x00',
            }

            blockchain.sendRawTransaction(contractOptions, callbakcs, options)
        })

    })

    describe('createTransaction()', function () {

        it('should create the correct transaction object', function (done) {
            const { address, privateKey } = blockchain.getIdentity()

            blockchain.createTransaction('transfer', [accounts[0], 1],
                'WhitneyToken', address, "0x00", undefined)
                .then((res) => {
                    should.exist(res)
                    done()
                })
                .catch((err) => {
                    done(new Error('This should have worked out. ' + err.message))
                })
        })

        it('should create transaction when passed on a contract instance', function (done) {
            const { address, privateKey } = blockchain.getIdentity()
            const contractTest = new web3.eth.Contract(WT_ABI, WT_ADDRESS)

            blockchain.createTransaction('transfer', [accounts[0], 1],
                contractTest, address, "0x00", undefined)
                .then((res) => {
                    should.exist(res)
                    done()
                })
                .catch((err) => {
                    done(new Error('This should have worked out. ' + err.message))
                })
        })

        it('should crate transaction when passed on custom nonce', function (done) {
            const { address, privateKey } = blockchain.getIdentity()

            web3.eth.getTransactionCount(accounts[0], "pending")
                .then((nonce) => {
                    blockchain.createTransaction('transfer', [accounts[0], 1],
                        'WhitneyToken', address, undefined, nonce)
                        .then((res) => {
                            should.exist(res)
                            done()
                        })
                        .catch((err) => {
                            done(new Error('This should have worked out. ' + err.message))
                        })
                })
                .catch(() => {
                    done(new Error('Error retreving account nonce'))
                })
        })

        it('should create transaction when passed on no value', function (done) {
            const { address, privateKey } = blockchain.getIdentity()
            const contractTest = new web3.eth.Contract(WT_ABI, WT_ADDRESS)

            blockchain.createTransaction('transfer', [accounts[0], 1],
                contractTest, address, privateKey, undefined)
                .then((res) => {
                    should.exist(res)
                    done()
                })
                .catch((err) => {
                    done(new Error('This should have worked out. ' + err.message))
                })
        })

        it('should fail when contract instance does not exists', function (done) {
            const { address, privateKey } = blockchain.getIdentity()

            blockchain.createTransaction('transfer', [accounts[0], 1],
                '404', address, "0x00", undefined)
                .then(() => {
                    done(new Error('This should\'ve returned an error'))
                })
                .catch(() => {
                    done()
                })
        })
    })

    describe('sendSignedTransaction()', function () {

        it('should fail when trying to send a transaction signed incorrectly', function (done) {

            const { address, privateKey } = blockchain.getIdentity()

            blockchain.createTransaction('transfer', [accounts[0], 1],
                'WhitneyToken', address, '0x' + privateKey, undefined)
                .then((tx) => {
                    try {
                        const signedTx = blockchain.signTransaction('6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1', tx, 'test')
                        blockchain.sendSignedTransaction(signedTx,
                            function (txHash) {

                            },
                            function (error) {
                                done()
                            },
                            function (receipt) {
                                done(new Error('This should\'ve failed'))
                            })
                    } catch (err) {
                        expect(err.message).to.be.eql('private key length is invalid')
                        done()
                    }
                })
                .catch((err) => {
                    done(new Error('This should\'ve worked out. ' + err.message))
                })
        })
    })

    describe('sendCall()', function () {

        it('should return the correct result', function (done) {

            blockchain.sendCall('balanceOf', [accounts[0]], 'WhitneyToken', WT_ADDRESS)
                .then((result) => {
                    done()
                })
                .catch((err) => {
                    done(new Error('This should have worked out. ' + err.message))
                })
        })

        it('should return the correct result when passed on a contract instance', function (done) {

            const contractTest = new web3.eth.Contract(WT_ABI, WT_ADDRESS)

            blockchain.sendCall('balanceOf', [accounts[0]], contractTest, WT_ADDRESS)
                .then((result) => {
                    done()
                })
                .catch((err) => {
                    done(new Error('This should have worked out. ' + err.message))
                })
        })

        it('should fail when contract instance does not exists', function (done) {

            blockchain.sendCall('balanceOf', [accounts[0]], 'WhitneyToke', WT_ADDRESS)
                .then(() => {
                    done(new Error('This should\'ve errored'))
                })
                .catch(() => {
                    done()
                })

        })

        it('should fail when contract name is undefined', function (done) {

            blockchain.sendCall('balanceOf', [accounts[0]], undefined, WT_ADDRESS)
                .then(() => {
                    done(new Error('This should\'ve errored'))
                })
                .catch(() => {
                    done()
                })

        })

        it('should fail when contract address does not exists', function (done) {

            blockchain.sendCall('balanceOf', [accounts[0]], 'WhitneyToken', accounts[0])
                .then(() => {
                    done(new Error('This should\'ve errored'))
                })
                .catch(() => {
                    done()
                })

        })
    })

    describe('getChainId()', function () {

        it('Should get the correct chain ID', function () {
            const chainId = blockchain.getChainId()
            expect(chainId).to.be.eql('7357')
        })
    })

    describe('createTransactionWContractAddress()', function () {

        it('should return error when called with an incorrect contract address', function (done) {

            const { address, privateKey } = blockchain.getIdentity()

            blockchain.createTransactionWContractAddress('transfer', [accounts[0], 1],
                'WhitneyToken', accounts[0], address, '0x00', undefined)
                .then(() => {
                    done(new Error('Shoul\'ve errored'))
                })
                .catch((err) => {
                    expect(err.message).to.be.eql('Error: There is no contract with the specified address')
                    done()
                })
        })

        it('should return the correct result when called with a contract instance', function (done) {

            const { address, privateKey } = blockchain.getIdentity()
            const contractTest = new web3.eth.Contract(WT_ABI, WT_ADDRESS)

            blockchain.createTransactionWContractAddress('transfer', [accounts[0], 1],
                contractTest, WT_ADDRESS, address, '0x00', undefined)
                .then(() => {
                    done()
                })
                .catch((err) => {
                    done(new Error('This should have worked out. ' + err.message))
                })
        })

        it('should return the correct result when called with hardcoded nonce', function (done) {

            const { address, privateKey } = blockchain.getIdentity()
            web3.eth.getTransactionCount(accounts[0], "pending")
                .then((nonce) => {
                    blockchain.createTransactionWContractAddress('transfer', [accounts[0], 1],
                        'WhitneyToken', WT_ADDRESS, address, '0x00', nonce)
                        .then(() => {
                            done()
                        })
                        .catch((err) => {
                            done(new Error('This should have worked out. ' + err.message))
                        })
                })
                .catch(() => {
                    done(new Error('Error retreving account nonce'))
                })
        })

        it('should return the correct result when called with undefined value', function (done) {

            const { address, privateKey } = blockchain.getIdentity()

            blockchain.createTransactionWContractAddress('transfer', [accounts[0], 1],
                'WhitneyToken', WT_ADDRESS, address, undefined, undefined)
                .then(() => {
                    done()
                })
                .catch((err) => {
                    done(new Error('This should have worked out. ' + err.message))
                })
        })
    })

    describe('signTransaction()', function () {

        it('should return error when passed on an incorrect private key', function (done) {

            const { address, privateKey } = blockchain.getIdentity()

            blockchain.createTransaction('transfer', [accounts[0], 1],
                'WhitneyToken', address, '0x' + privateKey, undefined)
                .then((tx) => {
                    try {
                        blockchain.signTransaction(privateKey + 'aaaaaaaaaaaaaaaaaaaaaaaaaaa', tx, 'test')
                        done(new Error('This should\'ve failed'))
                    } catch (err) {
                        expect(err.message).to.be.eql('private key length is invalid')
                        done()
                    }
                })
                .catch((err) => {
                    done(new Error('This should\'ve worked out. ' + err))
                })
        })
    })

    describe('addContractInstanceToMap()', function () {

        it('should add a new instance', function (done) {

            const contractTest = new web3.eth.Contract(WT_ABI, WT_ADDRESS)
            blockchain.addContractInstanceToMap('WhitneyTokenTest', contractTest)

            // This shoould work if the new Instance was succesfully added
            blockchain.sendCall('balanceOf', [accounts[0]], 'WhitneyTokenTest', WT_ADDRESS)
                .then((result) => {
                    done()
                })
                .catch((err) => {
                    done(new Error('This should\'ve worked out. ' + err.message))
                })

        })
    })

    describe('toBytes32()', function () {

        it('should convert to bytes32 format succesfully', function () {

            expect(blockchain.toBytes32('WhitneyTokenTest')).to.be.eql('0x576869746e6579546f6b656e54657374')

        })
    })

    describe('toBytes32()', function () {

        it('should convert from bytes32 format succesfully', function () {

            expect('234').to.be.eql(blockchain.hexToNumberString('0xea'))

        })
    })

    describe('getDeploymentAddressFromFactoryTx()', function () {

        it('should fail to retrieve the deployment address from a failed tx', function () {

            const failedReceipt = {
                transactionHash: '0x387a40297eba938971dca6484b70e988e649d359b1e040423bde75914c19884c',
                transactionIndex: 0,
                blockHash: '0x3d3b39c27e592e02e4858ef8eb0b7461b7913e8779643de5ef2b14419dd769c2',
                blockNumber: 7,
                from: '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1',
                to: '0xe78a0f7e598cc8b0bb87894b0f60dd2a88d6a8ab',
                gasUsed: 2882733,
                cumulativeGasUsed: 2882733,
                contractAddress: null,
                logs: [
                ],
                status: false,
                logsBloom: '0x00000000000000000000000000000000000000000000000010800000000000000000000000000000080080200000000000000000000000000000000000000000201000000000000000000000000000000001000000000000000000000000002000000000020080000000000000000800000000000000000000000000000000400000000000000000000000000004000000000000000000000000100000000020000000000040000000000000000000000000400000000000000000000000000000000000000000100000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000800000000000000000000',
                v: '0x26',
                r: '0x7df61488eb6bbe5801ac901dc630b98cdfc70ec2ed3e1765fb858dcae0466dcc',
                s: '0xd77aeefe5f4c30a99c260b65eba92a0b1c63365247ee4c7ec8445d08b4f03ec'
            }
            const res = blockchain.getDeploymentAddressFromFactoryTx(failedReceipt)
            res.should.have.property('error').and.to.be.eql('Deployment transaction mined and failed, look at the receipt for more information');
        })

    })
})
