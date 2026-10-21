#!/usr/bin/env node
/**
 * Script to convert an AppVeyor OpenAPI 3 document which uses discriminator to
 * one which does not.
 *
 * Note:  This implementation is specific to the AppVeyor.  A generic
 * implementation was abandoned due to several significant complications.
 *
 * @copyright Copyright 2019 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('node:assert');

const { readFile, writeFile } = require('./lib/file-utils.js');

function flattenSchema(spec, parentSchemaName, enumName, promoteProperties) {
  const { schemas } = spec.components;
  const parentSchema = { ...schemas[parentSchemaName] };
  const { propertyName, mapping } = parentSchema.discriminator;
  delete parentSchema.discriminator;
  schemas[parentSchemaName] = parentSchema;

  assert(!hasOwnProperty.call(schemas, enumName));
  schemas[enumName] = {
    type: 'string',
    enum: Object.keys(mapping),
  };

  parentSchema.properties = { ...parentSchema.properties };
  parentSchema.properties[propertyName] = {
    $ref: `#/components/schemas/${enumName}`,
  };

  for (const mappingValue of Object.keys(mapping)) {
    const childSchemaName = mapping[mappingValue].replace(/^.*\//, '');

    if (promoteProperties) {
      const childProps = schemas[childSchemaName].allOf[1].properties;
      for (const propName of Object.keys(childProps)) {
        if (hasOwnProperty.call(parentSchema.properties, propName)) {
          assert.deepStrictEqual(
            parentSchema.properties[propName],
            childProps[propName],
            `Can't merge property ${propName} of ${childSchemaName} into ${
              parentSchemaName}`,
          );
          continue;
        }

        parentSchema.properties[propName] = childProps[propName];
      }
    }

    delete schemas[childSchemaName];
  }
}

exports.flattenDiscriminators = function(spec) {
  const flatSpec = { ...spec };
  flatSpec.components = { ...spec.components };
  const flatSchemas = { ...spec.components.schemas };
  flatSpec.components.schemas = flatSchemas;

  flattenSchema(
    flatSpec,
    'NotificationProviderSettings',
    'NotificationProviderType',
  );

  // Add settings required property with schema NotificationSettings
  assert(!hasOwnProperty.call(
    flatSchemas.NotificationProviderSettings.properties,
    'settings',
  ));
  // Note: .properties already modified by flattenSchema.  No need to clone.
  flatSchemas.NotificationProviderSettings.properties.settings = {
    $ref: '#/components/schemas/NotificationSettings',
  };
  // Note: .NotificationProviderSettings already modified by flattenSchema.
  flatSchemas.NotificationProviderSettings.required =
    [...flatSchemas.NotificationProviderSettings.required, 'settings'];

  flattenSchema(
    flatSpec,
    'NotificationSettings',
    'NotificationSettingsType',
    true,
  );

  // Add x-enum-varnames of class name to NotificationSettingsType
  flatSchemas.NotificationSettingsType['x-enum-varnames'] =
    flatSchemas.NotificationSettingsType.enum
      .map((val) => /^Appveyor\.Models\.([A-Za-z0-9]+), Appveyor\.Models$/
        .exec(val)[1]);

  return flatSpec;
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
    .then((specStr) => this.flattenDiscriminators(JSON.parse(specStr)))
    .then((flattenedSpec) => writeFile(
      outputPathOrDesc,
      JSON.stringify(flattenedSpec, undefined, 2),
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
