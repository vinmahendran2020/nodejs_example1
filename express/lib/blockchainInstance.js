let blockchainInstance = null;

function set(instance){
    blockchainInstance = instance;
}

function get(){
    return blockchainInstance;
}

module.exports = {
    set,
    get
}