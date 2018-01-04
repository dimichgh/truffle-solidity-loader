var fs = require('fs')

// Read the contract source file and pass it to the `compilationFinished` callback
function returnContractAsSource (filePath, compilationFinished, contractName) {
  fs.readFile(filePath, 'utf8', function (err, artifactJSON) {
    if (err) {
      Logger.error(err)
      return compilationFinished(err, null)
    }

    compilationFinished(err, `
      var truffleContract = require('truffle-contract')
        , contracts = require('truffle-solidity-loader/lib/contracts_cache')
        , contractName = '${contractName}'

      if(!contracts[contractName]){
        var artifact = ${artifactJSON}
        contracts[contractName] = truffleContract(artifact)
      }
      
      module.exports = contracts[contractName]
    `)
  })
}

module.exports = returnContractAsSource