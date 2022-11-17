#!/usr/bin/env node
/**
 * Script to convert the AppVeyor OpenAPI 3 document to all supported variants.
 *
 * @copyright Copyright 2019 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const { mkdir } = require('node:fs/promises');
const path = require('node:path');

const { appveyorRootToUser } = require('./root-to-user.js');
const { appveyorV3ToV2 } = require('./oas3-to-oas2.js');
const { flattenDiscriminators } = require('./flatten-discriminators.js');
const { readFile, writeFile } = require('./lib/file-utils.js');
const { toAppveyorSwagger } = require('./to-appveyor-swagger.js');

exports.buildAll = function buildAll(spec) {
  const variants = [
    {
      flat: false,
      spec,
      apiVersion: 1,
      openapiVersion: 3,
    },
  ];

  Array.prototype.push.apply(
    variants,
    variants.map((variant) => ({
      flat: true,
      spec: flattenDiscriminators(variant.spec),
      apiVersion: variant.apiVersion,
      openapiVersion: variant.openapiVersion,
    })),
  );

  Array.prototype.push.apply(
    variants,
    variants.map((variant) => ({
      flat: variant.flat,
      spec: appveyorRootToUser(variant.spec),
      apiVersion: 2,
      openapiVersion: variant.openapiVersion,
    })),
  );

  return Promise.all(
    variants.map((variant) => appveyorV3ToV2(variant.spec)
      .then((v2Spec) => ({
        flat: variant.flat,
        spec: v2Spec,
        apiVersion: variant.apiVersion,
        openapiVersion: 2,
      }))),
  )
    .then((v2Variants) => {
      const specByName = [...variants, ...v2Variants]
        .reduce((partialSpecByName, variant) => {
          const name =
            `openapi${variant.openapiVersion
            }-v${variant.apiVersion
            }${variant.flat ? '-flat' : ''}`;
          partialSpecByName[name] = variant.spec;
          return partialSpecByName;
        }, Object.create(null));
      specByName.swagger =
        toAppveyorSwagger(specByName['openapi2-v1-flat']);
      return specByName;
    });
};

exports.main = function main(args, options, cb) {
  if (args[2] === '--help') {
    options.stdout.write(`Usage: ${args[1]} [oas3 doc] [output dir]\n`);
    cb(0);
    return;
  }

  const inputPathOrDesc = !args[2] || args[2] === '-' ? 0 : args[2];
  const outputPath = args[3] || '.';

  // eslint-disable-next-line promise/catch-or-return
  readFile(inputPathOrDesc, { encoding: 'utf8' })
    .then((spec) => exports.buildAll(JSON.parse(spec)))
    .then(
      (specByName) => mkdir(outputPath)
        .then(
          () => specByName,
          (err) => {
            if (err.code === 'EEXIST') {
              return specByName;
            }

            throw err;
          },
        ),
    )
    .then((specByName) => Promise.all(
      Object.keys(specByName)
        .map((name) => writeFile(
          path.join(outputPath, `${name}.json`),
          JSON.stringify(specByName[name], undefined, 2),
        )
          .then(
            () => 0,
            (err) => {
              options.stderr.write(`${err.stack}\n`);
              return 1;
            },
          )),
    ))
    .then(
      // eslint-disable-next-line promise/no-callback-in-promise
      (codes) => cb(Math.max(...codes)),
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
