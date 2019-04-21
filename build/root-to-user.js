#!/usr/bin/env node
/**
 * Script to convert the OpenAPI 3 spec for the v1 (non-user-level) AppVeyor
 * API to a specification for the v2 (user-level) API.
 *
 * @copyright Copyright 2019 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('node:assert');
const { readFile, writeFile } = require('./lib/file-utils.js');

const PATH_METHODS = [
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'trace',
];

function ensureReplace(name, str, search, replacement) {
  let didReplace = false;
  const result = str.replace(search, () => {
    didReplace = true;
    return replacement;
  });
  assert(didReplace, `Expected ${name} to contain ${search}`);
  return result;
}

exports.appveyorRootToUser = function appveyorRootToUser(rootSpec) {
  const userSpec = { ...rootSpec };

  userSpec.info = { ...userSpec.info };
  userSpec.info.title = ensureReplace(
    'info.title',
    ensureReplace('info.title', userSpec.info.title, /\bv1\b/g, 'v2'),
    /\bnon-user-level\b/g,
    'user-level',
  );

  // Add '/account/{accountName}' to server URL
  userSpec.servers = rootSpec.servers.map((server) => ({

    ...server,
    url: `${server.url + (server.url.endsWith('/') ? '' : '/')
    }account/{accountName}`,
    variables: {
      accountName: {
      // There is no meaningful default, but it is required by OAS3
        default: 'account-name',
        // Use same description as accountName parameter
        description: rootSpec.components.parameters.accountName.description,
      },
      ...server.variables,
    },
  }));

  userSpec.components = { ...rootSpec.components };
  userSpec.components.securitySchemes =
    { ...userSpec.components.securitySchemes };
  userSpec.components.securitySchemes.apiToken =
    { ...userSpec.components.securitySchemes.apiToken };

  // Replace API version warning and append
  userSpec.components.securitySchemes.apiToken.description = ensureReplace(
    'components.securitySchemes.apiToken.description',
    userSpec.components.securitySchemes.apiToken.description,
    /\*\*IMPORTANT:\*\*.*/,
    `**IMPORTANT:** Token must start with \`"v2."\`.  Tokens that do not
start with \`"v2."\` must use the non-user-level (aka v1) API.`,
  );

  userSpec.paths = Object.keys(rootSpec.paths).reduce((userPaths, path) => {
    const pathItem = rootSpec.paths[path];

    // Operations change based on whether authentication is required.
    const authPathItem = { ...pathItem };
    const noAuthPathItem = { ...pathItem };
    let haveAuth = false;
    let haveNoAuth = false;
    for (const method of PATH_METHODS) {
      const operation = pathItem[method];
      if (operation) {
        if (Array.isArray(operation.security)
            && operation.security.length === 0) {
          haveNoAuth = true;
          delete authPathItem[method];
        } else {
          haveAuth = true;
          delete noAuthPathItem[method];
        }
      }
    }

    // Operations which don't require authentication stay at server root
    // (including the old basePath which is preserved via servers).
    if (haveNoAuth) {
      noAuthPathItem.servers = rootSpec.servers;
      assert(!userPaths[path], `Duplicate path ${path}`);
      userPaths[path] = noAuthPathItem;
    }

    // Operations which require authentication move {accountName} from path
    // to server parameter.
    if (haveAuth) {
      const newPath = path
        .replace('/{accountName}', '')
        .replace(/^\/account\//, '/');
      assert(!userPaths[newPath], `Duplicate path ${newPath}`);
      userPaths[newPath] = authPathItem;
    }

    return userPaths;
  }, {});

  return userSpec;
};

exports.main = function main(args, options, cb) {
  if (args[2] === '--help') {
    options.stdout.write(`Usage: ${args[1]} [input] [output]\n`);
    cb(0);
    return;
  }

  const inputPathOrDesc = !args[2] || args[2] === '-' ? 0 : args[2];
  const outputPathOrDesc = !args[3] || args[3] === '-' ? 1 : args[3];

  // eslint-disable-next-line promise/catch-or-return
  readFile(inputPathOrDesc, { encoding: 'utf8' })
    .then((rootSpecStr) => {
      const rootSpec = JSON.parse(rootSpecStr);
      const userSpec = exports.appveyorRootToUser(rootSpec);
      const userSpecStr = JSON.stringify(userSpec, undefined, 2);
      return writeFile(outputPathOrDesc, userSpecStr);
    })
    .then(
      () => cb(0), // eslint-disable-line promise/no-callback-in-promise
      (err) => {
        options.stderr.write(`Error: ${err}\n`);
        cb(1);  // eslint-disable-line promise/no-callback-in-promise
      },
    );
};

if (require.main === module) {
  // This file was invoked directly.
  module.exports.main(process.argv, process, (exitCode) => {
    process.exitCode = exitCode;
  });
}
