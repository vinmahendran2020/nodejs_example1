const chai = require('chai');
const chaiHttp = require('chai-http');
const Web3 = require('web3')

const server = require('../API/RestApi');
const should = chai.should();

const WT_ABI = require('../config/tests/WhitneyToken.json').abi
const WT_B = require('../config/tests/WhitneyToken.json').bytecode

const FACTORY_ABI = require('../config/tests/Factory.json').abi
const FACTORY_B = require('../config/tests/Factory.json').bytecode

const web3 = new Web3('http://localhost:8545');

const WT_ADDRESS = '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24'

chai.use(chaiHttp);

describe('API Tests', async function () {

    this.timeout(10000)

    let tsin = 0

    let accounts = []

    before(async function () {

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

        wt = await new web3.eth.Contract(WT_ABI)
            .deploy({ data: WT_B, arguments: [100, 0, tsin.toString(), tsin.toString()] })
            .send({ from: accounts[0], gas: 6721975 })
            .catch((err) => {
                console.log(err)
            })
    })

    // beforeEach(async function () {
    //     wt = await new web3.eth.Contract(WT_ABI)
    //         .deploy({ data: WT_B, arguments: [100, 0, tsin.toString(), tsin.toString()] })
    //         .send({ from: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', gas: 6721975 })
    //         .catch((err) => {
    //             console.log(err)
    //         })
    // })

    afterEach(function () {
        // sleep.msleep(500)
        tsin++
    })

    describe('Extra', function () {

        describe('mintSecurity()', function () {

            it('should return expected object', function (done) {

                //Generate a new address for the security contract
                const mintSecurityTx = {
                    tsin: "aaaa",
                    records: [
                        { address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", tokens: 100 }
                    ]
                }
                chai.request(server)
                    .post('/mintSecurity')
                    .send(mintSecurityTx)
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property('batchMintTransaction').and.to.be.a('string');
                        res.body.newSecurity.should.have.property('deploymentAddress').and.to.be.a('string');
                        res.body.newSecurity.should.have.property('deploymentTransaction').and.to.be.a('string');
                        done()
                    })
            })

            // it('should return error when minting a security with an invalid name', function (done) {

            //     // Generate a new address for the security contract
            //     const mintSecurityTx = {
            //         tsin: "",
            //         records: [
            //             { address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", tokens: 100 }
            //         ]
            //     }
            //     chai.request(server)
            //         .post('/mintSecurity')
            //         .send(mintSecurityTx)
            //         .end((err, res) => {
            //             res.should.have.status(500)
            //             res.body.should.have.property('error').and.to.be.a('string');
            //             sleep.msleep(300)
            //             done()
            //         });
            // })

            it('should return error when batchMinting too many addresses', function (done) {

                const mintSecurityTx = {
                    tsin: "ab",
                    records: new Array(1000).fill({ address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", tokens: 100 })
                }
                chai.request(server)
                    .post('/mintSecurity')
                    .send(mintSecurityTx)
                    .end((err, res) => {
                        res.should.have.status(500)
                        res.body.should.have.property('error').and.to.be.a('string');
                        done()
                    });
            })

            it('should return error when minting a security with an existing name', function (done) {

                // Generate a new address for the security contract
                const mintSecurityTx = {
                    tsin: "aaaa",
                    records: [
                        { address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", tokens: 100 }
                    ]
                }
                chai.request(server)
                    .post('/mintSecurity')
                    .send(mintSecurityTx)
                    .end((err, res) => {
                        res.should.have.status(500)
                        res.body.should.have.property('error').and.to.be.a('string');
                        done()
                    });
            })
        })

        describe('remint()', function () {

            it('should return the tx hash', function (done) {
                const tx = {
                    oldAddress: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
                    newAddress: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
                    amount: 100,
                }
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/remint')
                    .send(tx)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('txHash').and.to.be.a('string')
                        done();
                    });
            })


            it('should return an error when params are not correct', function (done) {
                const tx = {
                    oldAddress: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
                    newAddres: accounts[1],
                    amount: 100,
                }
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/remint')
                    .send(tx)
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.body.should.have.property('error').and.to.be.a('string')
                        done();
                    });
            })
        })

        describe('call()', function () {

            it('should return expected object', function (done) {

                chai.request(server)
                    .get('/' + WT_ADDRESS + '/balanceOf' + '?params[]=0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1&contractName=WhitneyToken')
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property('result').and.to.be.a('string');
                        done()

                    });
            })


            it('should return error when calling a non exisiting function', function (done) {

                chai.request(server)
                    .get('/' + WT_ADDRESS + '/balanceO' + '?params[]=0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1&contractName=WhitneyToken')
                    .end((err, res) => {
                        res.should.have.status(500)
                        res.body.should.have.property('error').and.to.be.eql('contract.methods[functionName] is not a function');
                        done()
                    });
            })

            it('should return error when calling a function with invalid number of params', function (done) {
                chai.request(server)
                    .get('/' + WT_ADDRESS + '/balanceOf' + '?params=0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1&params=2&contractName=WhitneyToken')
                    .end((err, res) => {
                        res.should.have.status(500)
                        res.body.should.have.property('error').and.to.be.eql('Invalid number of parameters for \"balanceOf\". Got 2 expected 1!');
                        done()
                    });
            })
        })

        describe('getSecurityAddress()', function () {

            it('should return expected object', function (done) {

                chai.request(server)
                    .get('/securityAddress?TSIN=TESTSECURITY&salt=1')
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property('result').and.to.be.a('string');
                        done()

                    });
            })

            it('should return expected object when no salt passed on', function (done) {

                chai.request(server)
                    .get('/securityAddress?TSIN=TESTSECURITY')
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property('result').and.to.be.a('string');
                        done()

                    });
            })

            it('should return an error when no TSIN passed on', function (done) {

                const callReq = {
                    salt: 1
                }
                chai.request(server)
                    .get('/securityAddress?salt=1')
                    .end((err, res) => {
                        res.should.have.status(500)
                        res.body.should.have.property('error').and.to.be.a('string');
                        done()

                    });
            })
        })
    })

    describe('Transactions', function () {

        describe('sendSignedTransaction()', function () {

            it('should return the tx hash', function (done) {
                const tx = {
                    params: ["0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", 100],
                    contractName: "WhitneyToken",
                }
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/transaction/transfer')
                    .send(tx)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('txHash').and.to.be.a('string')
                        done();
                    });
            })


            it('should return an error when params are not correct', function (done) {
                const tx = {
                    params: ["0x90F8bf6A479f320ead07447944Ea8c9C", 100],
                    contractName: "WhitneyToken",
                }
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/transaction/mint')
                    .send(tx)
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.body.should.have.property('error').and.to.be.a('string')
                        done();
                    });
            })
        })

        describe('confirmTransaction()', function () {

            it('should return the tx hash', function (done) {
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/transaction/0/confirm')
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('txHash').and.to.be.a('string')
                        done();
                    });
            })

            it('should return an error when the tx does not exist', function (done) {

                chai.request(server)
                    .post('/' + WT_ADDRESS + '/transaction/100/confirm')
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.body.should.have.property('error').and.to.be.a('string')
                        done();
                    });
            })
        })

        describe('rejectTransaction()', function () {
            // Make a transfer to generate a new transaction, assume it will work

            it('Making new transaction', function (done) {

                const txAux = {
                    params: ["0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", 100],
                    contractName: "WhitneyToken",
                }
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/transaction/transfer')
                    .send(txAux)
                    .end((err, res) => {
                        done()
                    });
            })

            it('should return the tx hash', function (done) {
                const tx = {
                    errorCodes: [0],
                }
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/transaction/1/reject')
                    .send(tx)
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.should.have.property('txHash').and.to.be.a('string')
                        done();
                    });

            })

            it('should return an error when de tx does not exists', function (done) {
                const tx = {
                    errorCodes: [0],
                }
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/transaction/100/reject')
                    .send(tx)
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.body.should.have.property('error').and.to.be.a('string')
                        done();
                    });
            })
        })

        describe('getTxInfo()', function () {

            it('should return the tx info', function (done) {
                chai.request(server)
                    .get('/' + WT_ADDRESS + '/transaction/0')
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.body.result.should.have.property('0').and.to.be.eql('0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1')
                        res.body.result.should.have.property('1').and.to.be.eql('0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1')
                        res.body.result.should.have.property('2').and.to.be.eql('100')
                        res.body.result.should.have.property('3').and.to.be.eql('1')
                        res.body.result.should.have.property('4').and.to.be.eql('100')
                        res.body.result.should.have.property('5').and.to.be.eql('100')
                        done();
                    });
            })

            it('should return an error when the address does not exists', function (done) {

                chai.request(server)
                    .get('/' + WT_ADDRESS + 'a' + '/transaction/0')
                    .end((err, res) => {
                        res.should.have.status(500);
                        res.body.should.have.property('error').and.to.be.a('string')
                        done();
                    });
            })
        })

    })

    describe('Contract', function () {

        describe('changeOwner()', function () {

            it('should return tx hash', function (done) {

                const tx = {
                    newOwner: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
                }
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/changeOwner')
                    .send(tx)
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property('txHash').and.to.be.a('string');
                        done()
                    })
            })

            it('should return error when the addres format is not correct', function (done) {

                const tx = {
                    newOwner: "0x90F8bf6A479f320ead074411a4B07944Ea8c9C1",
                }
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/changeOwner')
                    .send(tx)
                    .end((err, res) => {
                        res.should.have.status(500)
                        res.body.should.have.property('error').and.to.be.a('string');
                        done()
                    })
            })
        })

        describe('pause()', function () {

            it('should return tx hash', function (done) {
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/pause')
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property('txHash').and.to.be.a('string');
                        done()
                    })
            })

            it('should return error when trying to pause when is already paused', function (done) {

                chai.request(server)
                    .post('/' + WT_ADDRESS + '/pause')
                    .end((err, res) => {
                        res.should.have.status(500)
                        res.body.should.have.property('error').and.to.be.a('string');
                        done()
                    })
            })
        })

        describe('unpause()', function () {

            it('should return tx hash', function (done) {
                chai.request(server)
                    .post('/' + WT_ADDRESS + '/unpause')
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property('txHash').and.to.be.a('string');
                        done()
                    })
            })

            it('should return error when trying to unpause a contract that is no paused', function (done) {

                chai.request(server)
                    .post('/' + WT_ADDRESS + '/unpause')
                    .end((err, res) => {
                        res.should.have.status(500)
                        res.body.should.have.property('error').and.to.be.a('string');
                        done()
                    })
            })
        })

        describe('destroy()', function () {

            it('should return tx hash', function (done) {

                chai.request(server)
                    .post('/' + WT_ADDRESS + '/destroy')
                    .end((err, res) => {
                        res.should.have.status(200)
                        res.body.should.have.property('txHash').and.to.be.a('string');
                        done()
                    })
            })


            it('should return error when trying to destroy an already destroyed contract', function (done) {

                chai.request(server)
                    .post('/' + WT_ADDRESS + '/destroy')
                    .end((err, res) => {
                        res.should.have.status(500)
                        res.body.should.have.property('error').and.to.be.a('string');
                        done()
                    })
            })
        })
    })
})