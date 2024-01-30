const ethers = require('ethers');
const {chain,[chain]:rpc} = require('./settings.json')

const provider = new ethers.JsonRpcProvider(rpc)

module.exports = provider

