#!/usr/bin/env node
/**
 * Script to convert an appveyor-openapi2 OpenAPI 2 document to a
 * backward-compatible one for the appveyor-swagger package.
 *
 * @copyright Copyright 2019 Kevin Locke <kevin@kevinlocke.name>
 * @license MIT
 */

'use strict';

const assert = require('node:assert');
const { isDeepStrictEqual } = require('node:util');

const { readFile, writeFile } = require('./lib/file-utils.js');

const binaryStringSchema = {
  type: 'string',
  format: 'binary',
};

// HTTP methods specified on Path Item Objects
// https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#path-item-object
const HTTP_METHODS = [
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'trace',
];

function replaceRefs(obj, replacer) {
  const haveChanges = false;
  const changed = Object.create(null);
  for (const propName of Object.keys(obj)) {
    const val = obj[propName];
    if (val && typeof val === 'object') {
      const replacement =
        typeof val.$ref === 'string' ? replacer(val)
          : replaceRefs(val, replacer);
      if (replacement !== val) {
        changed[propName] = replacement;
      }
    }
  }
  if (!haveChanges) {
    return obj;
  }
  return Object.assign(
    Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj)),
    obj,
    changed,
  );
}

/** Convert OpenAPI 2 document with tag names used in appveyor-openapi to
 * one with tag names used in appveyor-swagger.
 *
 * @param {!object} spec OpenAPI 2 document with appveyor-openapi tag names.
 * @returns {!object} OpenAPI 2 document with appveyor-swagger tag names.
 */
function convertTags(spec) {
  const oasToSwagName = {
    Account: 'Project',
    BuildJobs: 'Build',
    Builds: 'Build',
    Collaborators: 'Collaborator',
    Deployments: 'Deployment',
    Environments: 'Environment',
    Projects: 'Project',
    Roles: 'Role',
    Users: 'User',
  };
  const oasOnlyNames = {
    Account: true,
    BuildJobs: true,
    User: true,
  };
  const swagTags = spec.tags
    .filter((tag) => !oasOnlyNames[tag.name])
    .map((tag) => {
      const swagName = oasToSwagName[tag.name];
      return swagName ? { ...tag, name: swagName } : tag;
    });

  const swagPaths = Object.assign(Object.create(null), spec.paths);
  for (const path of Object.keys(spec.paths)) {
    const oasPathItem = spec.paths[path];

    let changedItem = false;
    const swagPathItem = {};
    for (const method of HTTP_METHODS) {
      const op = oasPathItem[method];
      if (!op) {
        continue;
      }

      let changedTags = false;
      const swagOpTags = op.tags && op.tags.map((oasName) => {
        const swagName = oasToSwagName[oasName];
        if (swagName) {
          changedTags = true;
        }
        return swagName || oasName;
      });

      if (changedTags) {
        changedItem = true;
        swagPathItem[method] = {
          ...op,
          tags: swagOpTags,
        };
      }
    }

    if (changedItem) {
      swagPaths[path] = {
        ...oasPathItem,
        ...swagPathItem,
      };
    }
  }

  const pathTagOverrides = {
    '/projects/{accountName}/{projectSlug}/artifacts/{fileName}': ['Project'],
  };
  for (const path of Object.keys(pathTagOverrides)) {
    const tagOverride = pathTagOverrides[path];
    const oasItem = swagPaths[path];
    const swagItem = Object.create(null);
    for (const method of HTTP_METHODS) {
      const op = oasItem[method];
      if (op) {
        swagItem[method] = {
          ...op,
          tags: tagOverride,
        };
      }
    }
    swagPaths[path] = swagItem;
  }

  return {
    ...spec,
    tags: swagTags,
    paths: swagPaths,
  };
}

/** Convert OpenAPI 2 document with operationIds used in appveyor-openapi to
 * one with operationIds used in appveyor-swagger.
 *
 * @param {!object} spec OpenAPI 2 document with appveyor-openapi operationIds.
 * @returns {!object} OpenAPI 2 document with appveyor-swagger operationIds.
 */
function convertOperationIds(spec) {
  const oasToSwagId = {
    createDeployment: 'startDeployment',
    deleteAccountUser: 'deleteUser',
    deleteAccountUserInvitation: 'cancelUserInvitation',
    encryptData: 'encryptValue',
    getAccountUser: 'getUser',
    getAccountUserInvitations: 'getUserInvitations',
    getAccountUsers: 'getUsers',
    getBuildArtifact: 'downloadArtifact',
    getBuildArtifacts: 'getArtifacts',
    getBuildLog: 'downloadLog',
    getProjectArtifact: 'downloadLastSuccessfulArtifact',
    getProjectCurrentBuild: 'getProjectLastBuild',
    getProjectSettingsEnvironmentVariables: 'getProjectEnvironmentVariables',
    getProjectSettingsYml: 'getProjectSettingsYaml',
    getProjectStatusImage: 'getProjectStatusBadge',
    getProjectStatusImageByBranch: 'getProjectBranchStatusBadge',
    getProjectStatusImageByRepositoryName: 'getPublicProjectStatusBadge',
    getProjectVersionBuild: 'getProjectBuildByVersion',
    getRoleById: 'getRole',
    inviteAccountUser: 'inviteUser',
    joinAccountAsCollaborator: 'joinAccount',
    reRunBuild: 'reBuild',
    stopDeployment: 'cancelDeployment',
    updateAccountUser: 'updateUser',
    updateProjectSettingsEnvironmentVariables:
      'updateProjectEnvironmentVariables',
  };

  const swagPaths = Object.assign(Object.create(null), spec.paths);
  for (const path of Object.keys(spec.paths)) {
    const pathItem = spec.paths[path];
    let changedItem = false;
    const swagPathItem = Object.create(null);
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (op && op.operationId) {
        const swagId = oasToSwagId[op.operationId];
        if (swagId) {
          changedItem = true;
          swagPathItem[method] = {
            ...op,
            operationId: swagId,
          };
        }
      }
    }

    if (changedItem) {
      swagPaths[path] = {
        ...pathItem,
        ...swagPathItem,
      };
    }
  }

  return {
    ...spec,
    paths: swagPaths,
  };
}

/** Convert OpenAPI 2 document with parameter names and ids used in
 * appveyor-openapi to the one used in appveyor-swagger.
 *
 * @param {!object} spec OpenAPI 2 document with appveyor-openapi parameter
 * names and ids.
 * @returns {!object} OpenAPI 2 document with appveyor-swagger parameter names
 * and ids.
 */
function convertParameters(spec) {
  const oasToSwagId = {
    artifactFileName: 'fileName',
    environmentId: 'deploymentEnvironmentId',
    repositoryType: 'badgeRepoProvider',
  };
  const oasToSwagName = {
    artifactFileName: 'fileName',
    environmentId: 'deploymentEnvironmentId',
    repositoryType: 'badgeRepoProvider',
  };

  const { parameters, paths } = spec;
  const swagParameters = Object.create(null);
  for (const oasParamId of Object.keys(parameters)) {
    const param = parameters[oasParamId];
    const swagParamId = oasToSwagId[oasParamId] || oasParamId;
    const swagName = oasToSwagName[param.name];
    swagParameters[swagParamId] =
      swagName ? { ...param, name: swagName } : param;
  }

  function updateParameters(oasParams) {
    let updatedParams = false;
    const swagParams = oasParams.map((oasParam) => {
      const { $ref } = oasParam;
      const slashInd = $ref.lastIndexOf('/');
      const oasId = $ref.slice(slashInd);
      const swagId = oasToSwagId[oasId];
      if (swagId) {
        updatedParams = true;
        return { $ref: $ref.slice(0, slashInd + 1) + swagId };
      }
      return oasParam;
    });
    return updatedParams ? swagParams : undefined;
  }

  const swagPaths = Object.create(null);
  for (const path of Object.keys(paths)) {
    const pathItem = paths[path];

    // Update names in path template
    const oasPath = path.replace(/\{[^}]+\}/g, (match) => {
      const swagName = oasToSwagName[match.slice(1, -1)];
      return swagName ? `{${swagName}}` : match;
    });

    // Update ids in operation parameters
    let changedItem = false;
    const swagPathItem = Object.create(null);
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      const swagOpParams =
        op && op.parameters && updateParameters(op.parameters);
      if (swagOpParams) {
        changedItem = true;
        swagPathItem[method] = { ...op, parameters: swagOpParams };
      }
    }

    // Update ids in path parameters
    const swagPathParams =
      pathItem.parameters && updateParameters(pathItem.parameters);
    if (swagPathParams) {
      changedItem = true;
      swagPathItem.parameters = swagPathParams;
    }

    swagPaths[oasPath] =
      changedItem ? { ...pathItem, ...swagPathItem } : pathItem;
  }

  return {
    ...spec,
    parameters: swagParameters,
    paths: swagPaths,
  };
}

/** Convert OpenAPI 2 document with schema names used in appveyor-openapi to
 * one with schema names used in appveyor-swagger.
 *
 * @param {!object} spec OpenAPI 2 document with appveyor-openapi schema names.
 * @returns {!object} OpenAPI 2 document with appveyor-swagger schema names.
 */
function convertSchemaNames(spec) {
  const oasToSwagName = {
    AddDeploymentRequest: 'DeploymentStartRequest',
    AddEnvironmentRequest: 'DeploymentEnvironmentAddition',
    AddProjectRequest: 'ProjectAddition',
    AddRoleRequest: 'RoleAddition',
    ArtifactEntry: 'Artifact',
    BuildConfigurationModel: 'ProjectConfiguration',
    BuildModel: 'Build',
    BuildModelBase: 'BuildLookupModel',
    BuildScript: 'Script',
    BuildWorkerImageModel: 'BuildWorkerImage',
    CampfireNotificationEntry: 'CampfireNotificationProviderSettings',
    DeploymentEnvironmentModel: 'DeploymentEnvironment',
    DeploymentEnvironmentModelBase: 'DeploymentEnvironmentLookupModel',
    DeploymentEnvironmentProjectModel: 'DeploymentEnvironmentProject',
    DeploymentEnvironmentSettingsModel: 'DeploymentEnvironmentSettings',
    DeploymentJobModel: 'DeploymentJob',
    DeploymentModel: 'Deployment',
    DeploymentModelResults: 'ProjectDeployment',
    DeploymentSettings: 'DeploymentProvider',
    EmailNotificationEntry: 'EmailNotificationProviderSettings',
    EncryptRequest: 'EncryptDataRequest',
    GitHubPullRequestNotificationEntry:
      'GitHubPullRequestNotificationProviderSettings',
    HipChatNotificationEntry: 'HipChatNotificationProviderSettings',
    InviteAccountUserRequest: 'InviteUserRequest',
    JoinAccountAsCollaboratorRequest: 'JoinAccountRequest',
    MatrixVariablesGroup: 'StoredNameValueMatrix',
    NotificationEntry: 'NotificationProviderSettings',
    NuGetFeedModel: 'NuGetFeed',
    PermissionGroup: 'GroupPermissions',
    PermissionGroupName: 'GroupName',
    ProjectModel: 'Project',
    ProjectModelBase: 'ProjectLookupModel',
    ReBuildRequest: 'ReRunBuildRequest',
    RoleModel: 'Role',
    RolePermissionModel: 'PermissionState',
    SecurableValue: 'StoredValue',
    SecurableVariable: 'StoredNameValue',
    SecurityDescriptorModel: 'SecurityDescriptor',
    SlackNotificationEntry: 'SlackNotificationProviderSettings',
    StartBuildRequest: 'BuildStartRequest',
    StopDeploymentRequest: 'DeploymentCancellation',
    StringValue: 'StringValueObject',
    UpdateAccountCollaboratorRequest: 'CollaboratorUpdate',
    UpdateProjectBuildNumberRequest: 'ProjectBuildNumberUpdate',
    UpdateUserModel: 'UserAccountRolesResults',
    UserAccountNotificationSettingsModel: 'UserAccountSettings',
    UserModel: 'UserAccount',
    VSOTeamRoomNotificationEntry: 'VSOTeamRoomNotificationProviderSettings',
    WebhookNotificationEntry: 'WebhookNotificationProviderSettings',
  };

  const swagDefinitions = Object.create(null);
  for (const oasName of Object.keys(oasToSwagName)) {
    assert(spec.definitions[oasName], `${oasName} must exist`);
    const swagName = oasToSwagName[oasName] || oasName;
    assert(!swagDefinitions[swagName], `${swagName} must not already exist`);
    swagDefinitions[swagName] = spec.definitions[oasName];
  }

  return replaceRefs({ ...spec, definitions: swagDefinitions }, (ref) => {
    if (ref.$ref.startsWith('#/definitions/')) {
      const refName = ref.$ref.slice(14);
      const swagName = oasToSwagName[refName];
      if (swagName) {
        return {
          $ref: `#/definitions/${swagName}`,
        };
      }
    }

    return ref;
  });
}

/** Convert OpenAPI 2 document with binary string schemas (as used in
 * appveyor-openapi) to one with file schemas (as used in appveyor-swagger).
 *
 * @param {!object} spec OpenAPI 2 document with binary string schemas.
 * @returns {!object} OpenAPI 2 document with file schemas.
 */
function binaryToFileSchema(spec) {
  const swagPaths = Object.assign(Object.create(null), spec.paths);
  for (const path of Object.keys(spec.paths)) {
    const pathItem = spec.paths[path];
    const swagPathItem = Object.create(null);
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      const swagResponses = Object.create(null);
      if (operation.responses) {
        for (const responseCode of Object.keys(operation.responses)) {
          const response = operation.responses[responseCode];
          if (isDeepStrictEqual(binaryStringSchema, response.schema)) {
            swagResponses[responseCode] = {
              ...response,
              schema: {
                type: 'file',
              },
            };
          }
        }
      }

      if (Object.keys(swagResponses).length > 0) {
        swagPathItem[method] = {
          ...operation,
          responses: swagResponses,
        };
      }
    }

    if (Object.keys(swagPathItem).length > 0) {
      swagPaths[path] = {
        ...pathItem,
        ...swagPathItem,
      };
    }
  }

  // getBuildLog was changed to non-binary string for ease of use
  // convert back to file for backwards-compatibility
  const getBuildLogPathItem = swagPaths['/buildjobs/{jobId}/log'];
  assert.deepStrictEqual(
    getBuildLogPathItem.get.responses[200].schema,
    { type: 'string' },
  );
  swagPaths['/buildjobs/{jobId}/log'] = {
    ...getBuildLogPathItem,
    get: {
      ...getBuildLogPathItem.get,
      responses: {
        ...getBuildLogPathItem.get.responses,
        200: {
          ...getBuildLogPathItem.get.responses[200],
          schema: { type: 'file' },
        },
      },
    },
  };

  return {
    ...spec,
    paths: swagPaths,
  };
}

/** Convert OpenAPI 2 document with non-string enum values in named schemas
 * to one where the enum is not named (i.e. inlined at point of use) to work
 * around issues in swagger-codegen.
 * https://github.com/swagger-api/swagger-codegen/issues/6806
 * https://github.com/swagger-api/swagger-codegen/pull/7059
 *
 * @param {!object} spec OpenAPI 2 document with non-string enum values in
 * named schemas.
 * @returns {!object} OpenAPI 2 document with inlined use of all enums with
 * non-string values.
 */
function inlineNonStringEnums(spec) {
  const nonStringEnumSchemas = Object.create(null);
  const swagDefinitions = Object.create(null);
  for (const schemaName of Object.keys(spec.definitions)) {
    const schema = spec.definitions[schemaName];
    if (Array.isArray(schema.enum)
        && schema.enum.some((val) => typeof val !== 'string')) {
      nonStringEnumSchemas[schemaName] = schema;
    } else {
      swagDefinitions[schemaName] = schema;
    }
  }

  return replaceRefs({ ...spec, definitions: swagDefinitions }, (ref) => {
    if (ref.$ref.startsWith('#/definitions/')) {
      const refName = ref.$ref.slice(14);
      const schema = nonStringEnumSchemas[refName];
      if (schema) {
        return schema;
      }
    }

    return ref;
  });
}

/** Convert OpenAPI 2 document from appveyor-openapi2 to a backwards-compatible
 * one for appveyor-swagger.
 *
 * @param {!object} spec appveyor-openapi2 OpenAPI 2 document.
 * @returns {!object} appveyor-swagger OpenAPI 2 document.
 */
exports.toAppveyorSwagger = function toAppveyorSwagger(spec) {
  spec = convertTags(spec);
  spec = convertParameters(spec);
  spec = convertOperationIds(spec);
  spec = convertSchemaNames(spec);
  spec = binaryToFileSchema(spec);
  spec = inlineNonStringEnums(spec);
  return spec;
};

exports.main = function main(args, options, cb) {
  if (args[2] === '--help') {
    options.stdout.write(`Usage: ${args[1]} [input doc] [output doc]\n`);
    cb(0);
    return;
  }

  const inputPathOrDesc = !args[2] || args[2] === '-' ? 0 : args[2];
  const outputPathOrDesc = !args[3] || args[3] === '-' ? 0 : args[3];

  // eslint-disable-next-line promise/catch-or-return
  readFile(inputPathOrDesc, { encoding: 'utf8' })
    .then((spec) => exports.toAppveyorSwagger(JSON.parse(spec)))
    .then((spec) => writeFile(
      outputPathOrDesc,
      JSON.stringify(spec, undefined, 2),
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
