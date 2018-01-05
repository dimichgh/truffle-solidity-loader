var merge                   = require('lodash.merge')
var Logger                  = require('./logger_decorator')
var QueryStringParser       = require('./query_string_parser')
var ScratchDir              = require('./scratch_dir')
var TruffleConfig           = require('truffle-config')

var BuildOptionNormalizer = {
  normalize: function(buildOpts, query) {

    if (!buildOpts.migrations_directory) {
      Logger.warn('Truffle migrations directory (migrations_directory) not provided.')
      Logger.warn('You can do this through the Truffle Configuration file or a loader query string.')
      Logger.warn('Defaulting to migrations_directory to ./migrations')
      buildOpts.migrations_directory = path.resolve(buildOpts.working_directory, 'migrations'),
    }

    var config = TruffleConfig.detect(buildOpts)
    
    if (query !== "undefined") {
      merge(config, QueryStringParser.parse(query))
    }

    // define the contracts_build_directory (default: build/contracts) if not done so already
    var scratchPath = new ScratchDir()
    scratchPath.createIfMissing()
    config.contracts_build_directory = config.contracts_build_directory || scratchPath.path()

    // define network like truffle develop (https://github.com/trufflesuite/truffle-core/blob/develop/lib/commands/develop.js)
    if (
      !config.network || // network is not specified or
      !config.networks || // networks are not provided or
      (config.networks && !config.networks[config.network]) // networks are provided but the specified network is not one of them
    ) {
      Logger.error('The required network configurations (network, networks) have not been provided.')
      Logger.warn('Defaulting to development network:')
      Logger.warn('  host: "localhost"')
      Logger.warn('  port: 8545')
      Logger.warn('  network_id: "*"')
      config.networks = {
        development: {
          host: 'localhost',
          port: 8545,
          network_id: "*" // Match any network id
        }
      }
      config.network = 'development'
    }

    return config
  }
}

module.exports = BuildOptionNormalizer
