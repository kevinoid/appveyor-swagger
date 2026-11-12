#!/usr/bin/env node
/**
 * Script to convert the OpenAPI 3 spec for the AppVeyor API to OpenAPI 2.
 *
 * @copyright Copyright 2019 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const Converter = require('api-spec-converter');
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

/** Do given sets (represented as Arrays) have the same elements?
 * Optimized for very short Arrays.
 *
 * @param {!Array} set1 First Array set to compare.
 * @param {!Array} set2 Second Array set to compare.
 * @returns {boolean} true if all elements in set 1 are in set 2, false
 * otherwise.
 */
function isSetEqual(set1, set2) {
  if (set1.length !== set2.length) {
    return false;
  }

  return !set1.some((elem1) => !set2.includes(elem1));
}

exports.tuneAppveyorV2Spec = function tuneAppveyorV2Spec(v2Spec) {
  // Deep copy to avoid unexpected aliasing and modifying argument value.
  const spec = JSON.parse(JSON.stringify(v2Spec));

  // OAS2 doesn't support the HTTP Bearer (RFC 6750) scheme natively.
  spec.securityDefinitions.apiToken.description += `

AppVeyor requires \`"Bearer <token>"\`in the \`Authorization\` header.
Since [bearer token authentication support is not explicitly supported in
  OpenAPI 2.0](https://github.com/OAI/OpenAPI-Specification/issues/583), client
code will vary.  Clients created with [OpenAPI
Generator](https://github.com/OpenAPITools/openapi-generator) or
[Swagger Codegen](https://github.com/swagger-api/swagger-codegen) should
set \`apiKeyPrefix\` to \`"Bearer"\` and set \`apiKey\` to the token.  Clients
generated using other tools may need to set \`apiKey\` to the string
\`"Bearer <token>"\` or set the \`Authorization\` header explicitly.`;

  // Use default consumes/produces to avoid re-declaring on each operation
  assert(!spec.consumes);
  spec.consumes = ['application/json'];
  assert(!spec.produces);
  spec.produces = ['application/json', 'application/xml'];

  // Declare Error response to avoid re-declaring on each operation response
  assert(!spec.responses);
  const errorResponse = {
    description: 'Error',
    schema: {
      $ref: '#/definitions/Error',
    },
  };
  const errorRef = { $ref: '#/responses/Error' };
  spec.responses = { Error: errorResponse };

  // Consolidate parameters
  spec.parameters = spec.parameters || {};
  function addSpecParam(param) {
    const specParam = spec.parameters[param.name];
    if (specParam) {
      assert.deepStrictEqual(param, specParam);
    } else {
      spec.parameters[param.name] = param;
    }
  }

  let pathParamRefs;
  function addPathParam(param) {
    addSpecParam(param);
    pathParamRefs.add(`#/parameters/${param.name}`);
  }

  for (const path of Object.keys(spec.paths)) {
    const pathItem = spec.paths[path];
    pathParamRefs = new Set();

    if (pathItem.parameters) {
      pathItem.parameters.map(addPathParam);
    }

    for (const method of PATH_METHODS) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }

      if (!operation.parameters) {
        delete operation.parameters;
      } else {
        const opParams = [];
        for (const param of operation.parameters) {
          if (param.in === 'body') {
            opParams.push(param);
          } else if (param.in === 'path') {
            addPathParam(param);
          } else {
            addSpecParam(param);
            opParams.push({ $ref: `#/parameters/${param.name}` });
          }
        }

        if (opParams.length === 0) {
          delete operation.parameters;
        } else {
          operation.parameters = opParams;
        }
      }

      if (operation.consumes) {
        if (isSetEqual(operation.consumes, spec.consumes)) {
          delete operation.consumes;
        } else {
          const mediaRange =
            operation.consumes.find((c) => c.includes('*'));
          assert(
            !mediaRange,
            `${path}.${method}.consumes should not contain media ranges.  `
              + `Found ${mediaRange}.`,
          );
        }
      }

      if (operation.produces) {
        if (isSetEqual(operation.produces, spec.produces)) {
          delete operation.produces;
        } else if (operation.produces.length === 1
                   && operation.produces[0] === '*/*') {
          operation.produces = ['application/octet-stream'];
        } else {
          const mediaRange =
            operation.produces.find((p) => p.includes('*'));
          assert(
            !mediaRange,
            `${path}.${method}.produces should not contain media ranges.  `
              + `Found ${mediaRange}.`,
          );
        }
      }

      if (operation.responses.default) {
        assert.deepStrictEqual(operation.responses.default, errorResponse);
        operation.responses.default = errorRef;
      }
    }

    if (pathParamRefs.size > 0) {
      pathItem.parameters = [...pathParamRefs].map(($ref) => ({ $ref }));
    }
  }

  /* Could change binary string responses to type: file.
   * Since best choice is dependent on expected size and usage, leave as-is
   * for now.
  [
    '/buildjobs/{jobId}/artifacts/{artifactFileName}',
    '/buildjobs/{jobId}/log',
    '/projects/status/{badgeRepoProvider}/{repoAccountName}/{repoSlug}',
    '/projects/status/{statusBadgeId}',
    '/projects/status/{statusBadgeId}/branch/{buildBranch}',
    '/projects/{accountName}/{projectSlug}/artifacts/{artifactFileName}'
  ].forEach((path) => {
    const response = spec.paths[path].get.responses[200];
    assert.deepStrictEqual(response.schema, {
      format: 'binary',
      type: 'string'
    });
    response.schema = {type: 'file'};
  });
  */

  delete spec['x-components'];

  return spec;
};

exports.appveyorV3ToV2 = function appveyorV3ToV2(v3Spec) {
  return Converter.convert({
    from: 'openapi_3',
    source: v3Spec,
    to: 'swagger_2',
  })
    .then((format) => exports.tuneAppveyorV2Spec(format.spec));
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
    .then((v3SpecStr) => this.appveyorV3ToV2(JSON.parse(v3SpecStr)))
    .then((v2Spec) => writeFile(
      outputPathOrDesc,
      JSON.stringify(v2Spec, undefined, 2),
    ))
    .then(
      () => cb(0),  // eslint-disable-line promise/no-callback-in-promise
      (err) => {
        options.stderr.write(`${err.stack}\n`);
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
