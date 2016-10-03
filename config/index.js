/* eslint key-spacing:0 spaced-comment:0 */
/* eslint-disable quote-props */

import path from 'path';
import _debug from 'debug';
import { argv } from 'yargs';
import ip from 'ip';

const localip = ip.address();
const debug = _debug('app:config');
const localEnv = (() => {
  try {
    return require('./.env');
  }
  catch (err) {
    return {};
  }
})();

debug('Creating default configuration.');
// ========================================================
// Default Configuration
// ========================================================
const config = {
  env : process.env.NODE_ENV || 'development',

  // ----------------------------------
  // Project Structure
  // ----------------------------------
  path_base  : path.resolve(__dirname, '..'),
  dir_client : 'src',
  dir_dist   : 'dist',
  dir_server : 'server',

  // ----------------------------------
  // Server Configuration
  // ----------------------------------
  server_host : localip, // use string 'localhost' to prevent exposure on local network
  server_port : process.env.PORT || 3000,

  // ----------------------------------
  // Compiler Configuration
  // ----------------------------------
  compiler_css_modules     : true,
  compiler_devtool         : 'source-map',
  compiler_hash_type       : 'hash',
  compiler_fail_on_warning : false,
  compiler_quiet           : false,
  compiler_public_path     : '/',
  compiler_stats           : {
    chunks : false,
    chunkModules : false,
    colors : true,
  },
  compiler_vendor : [
    'history',
    'react',
    'react-redux',
    'react-router',
    'react-router-redux',
    'redux',
  ],
};

/************************************************
-------------------------------------------------

All Internal Configuration Below
Edit at Your Own Risk

-------------------------------------------------
************************************************/

// ------------------------------------
// Environment
// ------------------------------------
// N.B.: globals added here must _also_ be added to .eslintrc

config.globals = {
  'process.env'  : {
    'NODE_ENV' : JSON.stringify(config.env),
  },
  'NODE_ENV'     : config.env,
  '__DEV__'      : config.env === 'development',
  '__PROD__'     : config.env === 'production',
  '__TEST__'     : config.env === 'test',
  '__DEBUG__'    : config.env === 'development' && !argv.no_debug,
  '__COVERAGE__' : !argv.watch && config.env === 'test',
  '__BASENAME__' : JSON.stringify(process.env.BASENAME || ''),
  '__CONTROLLER_API__' : JSON.stringify(process.env.CONTROLLER_SERVICE || localEnv.controller_service || ''),
  '__GOOGLE_MAPS_KEY__' : JSON.stringify(process.env.GOOGLE_MAPS_KEY || localEnv.google_maps_key || ''),
};

// ------------------------------------
// Validate Vendor Dependencies
// ------------------------------------
const pkg = require('../package.json');

config.compiler_vendor = config.compiler_vendor
  .filter((dep) => {
    if (pkg.dependencies[dep]) return true;

    debug(
      `Package "${dep}" was not found as an npm dependency in package.json; ` +
      `it won't be included in the webpack vendor bundle.
       Consider removing it from vendor_dependencies in ~/config/index.js`
    );
  });

// ------------------------------------
// Utilities
// ------------------------------------
const resolve = path.resolve;
const base = (...args) =>
  Reflect.apply(resolve, null, [config.path_base, ...args]);

config.utils_paths = {
  base,
  client : base.bind(null, config.dir_client),
  dist   : base.bind(null, config.dir_dist),
};
// ========================================================
// Environment Configuration
// ========================================================
debug(`Looking for environment overrides for NODE_ENV "${config.env}".`);
const environments = require('./environments').default;
const overrides = environments[config.env];
if (overrides) {
  debug('Found overrides, applying to default configuration.');
  Object.assign(config, overrides(config));
}
else {
  debug('No environment overrides found, defaults will be used.');
}

export default config;