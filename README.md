Unofficial AppVeyor REST API Swagger Definition
===============================================

This project aims to provide a
[Swagger](http://swagger.io)/[OpenAPI](https://www.openapis.org/) definition
of the [AppVeyor REST API](https://www.appveyor.com/docs/api/).  It is
neither supported nor endorsed by AppVeyor.  Any differences between this
definition and the AppVeyor REST API are errors in this definition and users
are encouraged to [report the
issue](https://github.com/kevinoid/appveyor-swagger/issues/new).

## Implementation Notes

`swagger-polymorphic.yaml` attempts to provide stricter type definitions by
applying polymorphism using the
[`discriminator`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#user-content-schemaDiscriminator)
property.  Most tools provide limited or no support for this property.
Therefore, this file is mostly kept for reference and in the hopes that future
tools may be able to make use of it.

The types could be made stricter by splitting the PUT types from the GET
types.  This would allow making most properties required in the PUT types
which could result in non-nullable codegen.  The down-side is that unless the
codegen includes copy-constructors, doing a GET+modify+PUT becomes more
painful than it should be.

### Polymorphism

Polymorphic types are problematic for several reasons, not least of which is
the requirement that Schema name match the `discriminator` property value,
which can cause collisions and require ugly names.
[OAI/OpenAPI-Specification#403](https://github.com/OAI/OpenAPI-Specification/issues/403)
There are various extensions available:

* AutoRest uses
  [`x-ms-discriminator-value`](https://github.com/Azure/autorest/pull/474)
* Swagger Codegen has an open PR to use
  [`x-discriminator-value`](https://github.com/swagger-api/swagger-codegen/pull/4252)

There are also plans to support `oneOf` and `anyOf` in OpenAPI v3.0
[OAI/OpenAPI-Specification#741](https://github.com/OAI/OpenAPI-Specification/pull/741)
along with adding a value to type map for `discriminator`.

The definition in this project uses [`discriminator` as defined in OpenAPI
v2.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schemaDiscriminator)
without extension, with the supertype defined in a way that it will work with
tools which do not support `discriminator`.

### Shared responses

The next version of the spec includes support for version ranges using `4XX`
notation
([OAI/OpenAPI-Specification#638](https://github.com/OAI/OpenAPI-Specification/pull/638)).
There is also discussion of including a mechanism for defining default
responses in
[OAI/OpenAPI-Specification#521](https://github.com/OAI/OpenAPI-Specification/issues/521)
and
[OAI/OpenAPI-Specification#563](https://github.com/OAI/OpenAPI-Specification/issues/563)
Unfortunately, since neither of these is supported in OpenAPI v2.0, the
definition in this project contains a redundant error response definition for
error for each API path.

### Request examples

[swagger-api/swagger-ui#1980](https://github.com/swagger-api/swagger-ui/issues/1980)
requests that swagger-ui support request examples using `x-example`.  In hopes
that this is done, request examples are provided as such.
