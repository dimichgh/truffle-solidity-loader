/* External Module Dependencies */
var Web3 = require('web3')
var SolidityParser = require('solidity-parser')
var TruffleConfig = require('truffle-config')
var TruffleCompiler = require('truffle-core/lib/contracts')
var TruffleMigrator = require('truffle-migrate')
var TruffleArtifactor = require('truffle-artifactor')
var TruffleResolver = require('truffle-resolver')

/* Internal Module Dependencies */
var Logger = require('./lib/logger_decorator')
var BuildOptionNormalizer = require('./lib/build_option_normalizer')
var ScratchDir = require('./lib/scratch_dir')
var compiledContractExists = require('./lib/contract_checker')
var returnContractAsSource = require('./lib/contract_returner')

/* Native Node Imports */
var path = require('path')
var fs = require('fs')

// This acts as a mutex to prevent multiple compilation runs
var isCompilingContracts = false

module.exports = function (source) {
  this.cacheable && this.cacheable()

  var buildOpts = TruffleConfig.detect()
  buildOpts.logger = Logger;
  buildOpts = BuildOptionNormalizer.normalize(buildOpts, this.query);

  var scratchPath = new ScratchDir()
  scratchPath.createIfMissing()

  buildOpts.contracts_build_directory = buildOpts.contracts_build_directory || scratchPath.path()

  var compilationFinished = this.async()
  var contractPath = this.context
  var contractFilePath = this.resourcePath
  var contractFileName = path.basename(contractFilePath)
  var contractName = contractFileName.charAt(0).toUpperCase() + contractFileName.slice(1, contractFileName.length - 4)
  var compiledContractPath = path.resolve(buildOpts.contracts_build_directory, contractName + '.json') // compiled artifact JSON

  var imports = SolidityParser.parseFile(contractFilePath, 'imports')

  imports.forEach(function (solidityImport) {
    var dependencyPath = path.resolve(contractPath, solidityImport)
    this.addDependency(dependencyPath)

    if (compiledContractExists(compiledContractPath)) {
      fs.unlinkSync(compiledContractPath)
    }
  }.bind(this))

  function waitForContractCompilation () {
    setTimeout(function () {
      if (compiledContractExists(compiledContractPath)) {
        returnContractAsSource(compiledContractPath, compilationFinished, contractName)
      } else {
        waitForContractCompilation()
      }
    }.bind(this), 500)
  }

  if (!isCompilingContracts) {
    Logger.log('Writing temporary contract build artifacts to ' + buildOpts.contracts_build_directory)
    isCompilingContracts = true

    var compilerOpts = buildOpts
    compilerOpts.contracts_directory = contractPath
    compilerOpts.logger = Logger
    compilerOpts.all = false

    var provisionOpts = {
      provider: new Web3.providers.HttpProvider(buildOpts.web3_rpc_uri),
      contracts_build_directory: buildOpts.contracts_build_directory
    }

    TruffleCompiler.compile(compilerOpts, function (err, contracts) {
      if (err) {
        Logger.error(err)
        return compilationFinished(err, null)
      }

      isCompilingContracts = false
      Logger.log('COMPILATION FINISHED')
      Logger.log('RUNNING MIGRATIONS')

      var web3 = new Web3(provisionOpts.provider)
      var migrationOpts = compilerOpts
      migrationOpts.from = buildOpts.from || web3.eth.accounts[0] // similar to https://github.com/trufflesuite/truffle-core/blob/ed0f27b29f1f5eea54dc82f1eb17e63819a10614/test/migrate.js#L44
      migrationOpts.provider = provisionOpts.provider
      migrationOpts.logger = Logger
      migrationOpts.reset = true // Force the migrations to re-run
      migrationOpts.resolver = new TruffleResolver(migrationOpts)
      migrationOpts.artifactor = new TruffleArtifactor(buildOpts.contracts_build_directory)

      // Once all of the contracts have been compiled, we know we can immediately
      // try to run the migrations safely.
      TruffleMigrator.run(migrationOpts, function (err, result) {
        if (err) {
          Logger.error(err)
          return compilationFinished(err, null)
        }
        // Finally return the contract source we were originally asked for.
        returnContractAsSource(compiledContractPath, compilationFinished, contractName)
      })
    })

    return
  }

  if (compiledContractExists(compiledContractPath)) {
    returnContractAsSource(compiledContractPath, compilationFinished, contractName)
  } else {
    waitForContractCompilation()
  }
}
