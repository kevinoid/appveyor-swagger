#!/usr/bin/env node
/**
 * Script to convert an OpenAPI 3 spec for the v2 (user-level) AppVeyor
 * API to a specification for the v1 (non-user-level) API.
 *
 * @copyright Copyright 2019 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('node:assert');
const { readFile, writeFile } = require('./lib/file-utils.js');

function ensureReplace(name, str, search, replacement) {
  let didReplace = false;
  const result = str.replace(search, () => {
    didReplace = true;
    return replacement;
  });
  assert(didReplace, `Expected ${name} to contain ${search}`);
  return result;
}

exports.appveyorRootToUser = function appveyorRootToUser(v2Spec, options) {
  const v1Spec = { ...v2Spec };

  v1Spec.info = { ...v1Spec.info };
  v1Spec.info.title = ensureReplace(
    'info.title',
    v1Spec.info.title,
    /v2 aka user-level/g,
    'v1 aka non-user-level',
  );

  v1Spec.components = { ...v1Spec.components };
  v1Spec.components.securitySchemes =
    { ...v1Spec.components.securitySchemes };

  v1Spec.components.securitySchemes.apiTokenV1 = {
    description: 'A non-user-level API key (not v2).\n'
      + 'API token may have been acquired from '
      + 'https://ci.appveyor.com/api-keys before it was updated to provide '
      + 'v2 tokens.  No current source is known.\n'
      + '\n'
      + '**IMPORTANT:** Token must not start with `"v2."`.  Tokens that '
      + 'start with `"v2."` must use the user-level (aka v2) API operations.',
    type: 'http',
    scheme: 'bearer',
  };
  delete v1Spec.components.securitySchemes.apiTokenV2;
  v1Spec.security = [{ apiTokenV1: [] }];

  v1Spec.paths = Object.keys(v2Spec.paths).reduce((v1Paths, v2Path) => {
    let pathItem = v2Spec.paths[v2Path];

    const v1Path = v2Path
      .replace(/^\/account\/\{account\}\/encrypt$/, '/account/encrypt')
      .replace(/^\/account\/\{account\}\//, '/');

    // Remove account from parameters, if removed from path
    if (v1Path !== v2Path && !v1Path.includes('{account}')) {
      pathItem = { ...pathItem };
      const newParams = pathItem.parameters
        .filter((param) => param.$ref !== '#/components/parameters/account');
      assert.notStrictEqual(pathItem.parameters.length, newParams.length);
      if (newParams.length === 0) {
        delete pathItem.parameters;
      } else {
        pathItem.parameters = newParams;
      }
    }

    assert(!v1Paths[v1Path], `Duplicate path ${v1Path}`);
    v1Paths[v1Path] = pathItem;

    return v1Paths;
  }, {});

  return v1Spec;
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
    .then((v2SpecStr) => {
      const v2Spec = JSON.parse(v2SpecStr);
      const v1Spec = exports.appveyorRootToUser(v2Spec);
      const v1SpecStr = JSON.stringify(v1Spec, undefined, 2);
      return writeFile(outputPathOrDesc, v1SpecStr);
    })
    .then(
      () => cb(0),  // eslint-disable-line promise/no-callback-in-promise
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
