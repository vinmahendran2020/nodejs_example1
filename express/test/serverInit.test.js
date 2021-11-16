// Just to prevent the initialization of several tests

const ganache = require("ganache-core");

const ganacheSv = ganache.server({
    network_id: 7357,
    mnemonic: "myth like bonus scare over problem client lizard pioneer submit female collect"
})

ganacheSv.listen(8545, function (err, blockchain) { });