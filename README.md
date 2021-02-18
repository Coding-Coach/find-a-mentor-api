
[![Build Status](https://travis-ci.org/Coding-Coach/find-a-mentor-api.svg?branch=master)](https://travis-ci.org/Coding-Coach/find-a-mentor-api)

## Description

A simple REST API to support the [Coding Coach mentors' app](https://mentors.codingcoach.io/).

### Contributing
If you would like to contribute to this project, just follow the [contributing guide](CONTRIBUTING.md), it will show you how to setup the project in your local environment.

### Endpoints
We are using swagger to document the endpoints, you can find the current spec at https://api-staging.codingcoach.io/

### e2e Testing

#### Running the e2e suite of tests

If you'd like to run the entire suite of e2e tests locally you can use the command below:

```
yarn test:e2e
```

#### Running tests in a single e2e file

To run the tests for a specific e2e file, use the command below as a starting point:

```
yarn test:e2e ./test/api/mentors.e2e-spec.ts
```
