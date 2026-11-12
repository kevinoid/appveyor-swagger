# Change Log

## [v2.0.0](https://github.com/kevinoid/appveyor-swagger/tree/v2.0.0) (2019-03-26)

- Remove`UserAddition` and `CollaboratorAddition` schemas along with the
  `addUser` and `addCollaborator` operations.
  These operations were removed from the AppVeyor REST API due to abuse.
  See [appveyor/ci#2892](https://github.com/appveyor/ci/issues/2892).
- Remove `Agent` from `DeploymentProviderType` which is no longer supported.
- Add `AzureAppServiceZipDeploy`, `ElasticBeanstalk`, `Environment`, `Local`,
  and `Octopus` to `DeploymentProviderType`.
- Fix HTTP method for `cancelDeployment` (should be `PUT`, not `DELETE`).
- Add `inviteUser`, `getUserInvitations`, `cancelUserInvitation`, `joinAccount`
  operations with `UserInvitationModel`, `InviteUserRequest`,
  `JoinAccountRequest`, `SessionModel`, `SessionUserModel`, and
  `SessionUserAccountModel` schemas.
- Add `x-enum-varnames` to `NotificationSettingsType` to generate more
  reasonable names for the enumerated values.
- Add `*DPSettingName` enumerations with supported setting names for each
  deployment provider (for convenience).
- Add `Visual Studio 2019` to `BuildWorkerImageName`.
- Add `zhaw18` to `BuildWorkerImageName`.
- Add `x-apiClientRegistration`, `x-apisguru-categories`, and
  `x-description-language` extension properties.

- New OpenAPI Specification Version 3 AppVeyor API definition.
- Generate OAS2/Swagger 2 definition from OAS3 definitions.
- Generate non-`discriminator` version of definitions.

### OpenAPI-only  Changes

- New user-level (aka v2) AppVeyor API definition.
- Operations returning `type: file` (`getBuildArtifact`, `getBuildLog`,
  `getProjectArtifact`, `getProjectBranchStatusBadge`, `getProjectStatusBadge`,
  `getPublicProjectStatusBadge`) now return `type: string, format: binary`
  since `type: file` was removed from OAS3.
- Add `DeploymentProjectSelectionMode` enum schema (previously avoided due to
  lack of generator support for non-string enums).
- Move `build` property of `DeploymentLookupModel` to `ProjectDeploymentModel`
  and `EnvironmentDeploymentModel` to prevent conflict with `Deployment`
  (which has a compatible `build` property with schema `Build`, which includes
  `BuildLookupModel`, but prevents code generation with AutoRest).
- Require `environmentVariables` and `providerSettings` in
  `DeploymentEnvironmentSettings` due to `addEnvironment` returning 500.
- Rename `accountName` path parameter to `account` to match name used in error
  responses from the AppVeyor server.
- New tags:
    <!-- Copy revertTagChanges from build/to-appveyor-swagger.js -->
- New operationIds:
    <!-- Copy revertOperationIdChanges from build/to-appveyor-swagger.js -->
- New schema names:
    <!-- Copy revertSchemaNameChanges from build/to-appveyor-swagger.js -->

## [v1.0.0](https://github.com/kevinoid/appveyor-swagger/tree/v1.0.0) (2019-03-05)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20190213.0...v1.0.0)

- Adopt new semantic versioning scheme based on changes to generated code.
- Add `nuGetFeedId` to `NuGetFeed`.

## [v0.20190213.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20190213.0) (2019-02-13)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20190115.0...v0.20190213.0)

- Add `Windows Server 2019` to `BuildWorkerImageName`.
- Add `azure-westus` to `BuildCloudName`.

## [v0.20190115.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20190115.0) (2019-01-15)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20190105.0...v0.20190115.0)

- Add `pro-ubuntu18` to `BuildCloudName`.

## [v0.20190105.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20190105.0) (2019-01-05)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20181229.0...v0.20190105.0)

- Add `disableNuGetPublishForOctopusPackages` to `ProjectConfiguration`.

## [v0.20181229.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20181229.0) (2018-12-29)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20181217.0...v0.20181229.0)

- Add `pro-ubuntu` to `BuildCloudName` enumeration.

## [v0.20181217.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20181217.0) (2018-12-17)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20181211.0...v0.20181217.0)

- Add `starting` to `Status` enumeration.

## [v0.20181211.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20181211.0) (2018-12-11)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20181127.0...v0.20181211.0)

- Add `Visual Studio 2019 Preview` to `BuildWorkerImageName`

## [v0.20181127.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20181127.0) (2018-11-27)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20181117.0...v0.20181127.0)

- Add `reRunBuild` operation and `ReRunBuildRequest` schema.
- Add documentation for `BuildWorkerImageName`.
- Mention user-level API keys (`v2.`) in documentation.

## [v0.20181117.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20181117.0) (2018-11-17)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20181028.0...v0.20181117.0)

- Add `sh` to `ScriptLanguage`
- Add `Previous Ubuntu1604` to `BuildWorkerImageName`
- Add `Previous Ubuntu1804` to `BuildWorkerImageName`

## [v0.20181028.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20181028.0) (2018-10-28)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20180905.0...v0.20181028.0)

- Add `currentBuildId`, `isGitHubApp`, `disablePushWebhooks`, and
  `disablePullRequestWebhooks` to `Project`.
- Add `projectId` to `Build`.
- Add `twoFactorAuthEnabled` to `UserAccount`.
- Remove `UserAccountSettings` from `UserAccount` (no longer returned by API).

## [v0.20180905.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20180905.0) (2018-09-05)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20180817.0...v0.20180905.0)

- Add `Visual Studio 2015 2` to `BuildWorkerImageName`.

## [v0.20180817.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20180817.0) (2018-08-17)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20180815.0...v0.20180817.0)

- Add `Ubuntu1604` to `BuildWorkerImageName`.

## [v0.20180815.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20180815.0) (2018-08-15)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20180607.0...v0.20180815.0)

- Add `Ubuntu1804` to `BuildWorkerImageName`.
- Update devDependency versions and package-lock.json.
- Require Node v6 or later for test scripts.

## [v0.20180607.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20180607.0) (2018-06-07)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20180519.0...v0.20180607.0)

- Add `created` to `ArtifactModel`.
- Update devDependency versions and package-lock.json.

## [v0.20180519.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20180519.0) (2018-05-19)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20180429.0...v0.20180519.0)

- Add `"Previous Ubuntu"` to `BuildWorkerImageName` enum.

## [v0.20180429.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20180429.0) (2018-04-29)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20180426.0...v0.20180429.0)

- Add `Deny` group with `DenyAllProjectsEnvironments` permission.

## [v0.20180426.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20180426.0) (2018-04-26)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20171123.0...v0.20180426.0)

- Add `recordsNumber` query param to `getProjectDeployments`.
- Add `OctopusPackage` to `ArtifactType` enum.
- Add `ElasticBeanstalkPackage` to `ArtifactType` enum.
- Add `matrixExcept` to `ProjectConfiguration`.
- Add `matrixOnly` to `ProjectConfiguration`.
- Add `packageDotnetConsoleProjects` to `ProjectConfiguration`.
- Add `packageAspNetCoreProjects` to `ProjectConfiguration`.
- Add `packageWebApplicationProjectsOctopus` to `ProjectConfiguration`.
- Add `packageWebApplicationProjectsBeanstalk` to `ProjectConfiguration`.
- Add `stacks` array to `ProjectConfiguration`.
- Add `rollingBuildsOnlyForPullRequests` to `Project`.
- Add `pwsh` to `ScriptLanguages`.

## [v0.20171123.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20171123.0) (2017-11-23)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20171031.0...v0.20171123.0)

- Add `getBuildArtifacts` operation and `ArtifactModel` schema for response.
- Add `getBuildArtifact` operation.
- Add `getProjectArtifact` operation.
- Add `tags` property to `DeploymentEnvironment`.
- Add `isPrivateProject` property to `NuGetFeed`.
- Add enumeration values to `ArtifactType` based on `Push-AppveyorArtifact`
  cmdlet on build workers.
- Remove `name` property requirement from `Artifact`.

## [v0.20171031.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20171031.0) (2017-10-31)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20171023.0...v0.20171031.0)

- Add `getProjectEnvironmentVariables` operation.
- Add `updateProjectEnvironmentVariables` operation.

## [v0.20171023.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20171023.0) (2017-10-23)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20171021.0...v0.20171023.0)

- Add `dotnetCsprojAssemblyVersionFormat` to `ProjectConfiguration`.
- Add `dotnetCsprojFileVersionFormat` to `ProjectConfiguration`.
- Add `dotnetCsprojInformationalVersionFormat` to `ProjectConfiguration`.

## [v0.20171021.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20171021.0) (2017-10-21)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20171019.0...v0.20171021.0)

- Add `pro-vs2013` to `BuildCloudName`.

## [v0.20171019.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20171019.0) (2017-10-19)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20170827.0...v0.20171019.0)

- Add `pro-vs2017` to `BuildCloudName`.

## [v0.20170827.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20170827.0) (2017-08-27)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20170803.0...v0.20170827.0)

- Add `saveBuildCacheInPullRequests` to `Project`.

## [v0.20170803.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20170803.0) (2017-08-03)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20170622.0...v0.20170803.0)

- Add `dotnetCsprojFile`, `dotnetCsprojPackageVersionFormat`,
  `dotnetCsprojVersionFormat`, `hotFixScripts` to `ProjectConfiguration`.

## [v0.20170622.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20170622.0) (2017-06-22)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20170518.0...v0.20170622.0)

- Add `Visual Studio 2017 Preview` to `BuildWorkerImageName`

## [v0.20170518.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20170518.0) (2017-05-18)

[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20170507.0...v0.20170518.0)
- Add `Ubuntu` to `OSType`, `BuildCloudName`, `BuildWorkerImageName`

## [v0.20170507.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20170507.0) (2017-05-07)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20170503.0...v0.20170507.0)

- Add `osType` to `BuildJob` and `BuildWorkerImage`.
- Add `rollingBuildsDoNotCancelRunningBuilds` to `Project`.
- Better document `scheduleCrontabExpression`.

## [v0.20170503.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20170503.0) (2017-05-03)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20170308.0...v0.20170503.0)

- **Breaking**  Rename path parameter for `getProjectStatusBadge` and
  `getProjectBranchStatusBadge` to `statusBadgeId` to match its new source,
  which is the new `statusBadgeId` property of `ProjectWithConfiguration`
  objects.  The value of this property matches `webhookId` (the previous
  parameter source) for existing projects but will differ for new projects.
- Add enumeration values for `BuildCloudName` and `BuildWorkerImageName`.
- Add `matrixExclude` property to `ProjectConfiguration`.
- Additional property documentation strings.
- Bump dependency versions.

## [v0.20170308.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20170308.0) (2017-03-08)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20170107.1...v0.20170308.0)

- **API Breaking**  `getEnvironments`, `getEnvironmentDeployments`, and
  `getProjectDeployments` responses now include fewer properties.  Introduce
  `*LookupModel` schemas for these abbreviated types (based on the name in the
  XML) and rework the existing schemas to use them where appropriate.
- Add `encryptValue` operation to encrypt a string value for use in
  `StoredValue` properties (e.g. environment variable values).
- Add more documentation for properties with non-obvious behavior.

## [v0.20170107.1](https://github.com/kevinoid/appveyor-swagger/tree/v0.20170107.1) (2017-01-20)
[Full Changelog](https://github.com/kevinoid/appveyor-swagger/compare/v0.20170107.0...v0.20170107.1)

- Add `getProjectStatusBadge`, `getProjectBranchStatusBadge`, and `getPublicProjectStatusBadge` operations for getting project build status badge images.
- Remove security for operations which do not require authentication.

## [v0.20170107.0](https://github.com/kevinoid/appveyor-swagger/tree/v0.20170107.0) (2017-01-13)


\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*
