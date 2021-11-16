module.exports = {
    BC: {
        local: {
            rpcEndpoint: "http://localhost:8545",
            testIdentity: {
                address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
                privateKey: "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
            },
            chainId: 'loquesea',
            contractsPath: '/home/maquina2/Documents/EEUU/whitney-ethereum-token/build/contracts',
            contractsNames: ['Factory', 'WhitneyToken'],
        },
        test: {
            rpcEndpoint: "http://localhost:8545",
            testIdentity: {
                address: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
                privateKey: "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
            },
            chainId: '7357',
            contractsPath: '/home/maquina2/Documents/whitney-ethereum-token/build/contracts',
            contractsNames: ['Factory', 'WhitneyToken'],
        },
        rinkeby: {
            rpcEndpoint: "https://rinkeby.infura.io/v3/ae47e104cdf44df7b306dd49490e3012",
            testIdentity: {
                address: "0x33be5519c4018D0d4ad242110A40eBAF0C695403",
                privateKey: "45C5BD9BA76A995E86ADE4573F9A215E3A6C069B798604DA3C80AA18F87C181C"
            },
            chainId: {'chain':'rinkeby'},
            contractsPath: '/opt/whitney-ethereum-token/build/contracts',
            contractsNames: ['Factory', 'WhitneyToken'],
        },
        rinkebyBesu: {
            rpcEndpoint: "http://54.198.203.68:8547",
            wsEndpoint: "wss://54.198.203.68:8548",
            testIdentity: {
                address: "0x919C368FC9d4Ec8A48Fd413d966A1B21c275f594",
                privateKey: "2209AFA5E79CF2704224CAE407931FE80C45C140388B5B3BF6BE60C9AF4593BF"
            },
            chainId: {'chain':'rinkeby'},
            contractsPath: '/opt/whitney-ethereum-token/build/contracts',
            contractsNames: ['Factory', 'WhitneyToken'],
        },
        rinkebyGeth: {
            rpcEndpoint: "http://3.95.155.85:8547",
            wsEndpoint: "ws://3.95.155.85:8548",
            testIdentity: {
                address: "0x33be5519c4018D0d4ad242110A40eBAF0C695403",
                privateKey: "45C5BD9BA76A995E86ADE4573F9A215E3A6C069B798604DA3C80AA18F87C181C"
            },
            chainId: { 'chain': 'rinkeby' },
            contractsPath: '/opt/whitney-ethereum-token/build/contracts',
            contractsNames: ['Factory', 'WhitneyToken'],
        },
        mainnetGeth: {
            rpcEndpoint: "http://3.81.187.157:8547",
            wsEndpoint: "ws://3.81.187.157:8548",
            testIdentity: {
                address: "0x30730f720b7e8204A5cd2e2e7bF699a5a1818AAB",
                privateKey: "8d858ee31731b7ed90f9c38f3c913fd548e515a474fe86b1ab064041f8469590"
            },
            chainId: { 'chain': 'mainnet' },
            contractsPath: '/opt/whitney-ethereum-token/build/contracts',
            contractsNames: ['Factory', 'WhitneyToken'],
        }
    }
}