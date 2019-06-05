
## Description

A simple REST API to support [Coding Coach (alpha)](https://mentors.codingcoach.io/).

## Installation

```bash
$ yarn install
```

```bash
cp .env.example
```
Make sure to set the new `.env` file up with the appropriate variables

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Endpoints
We are using swagger to document the endpoints, after running the project just open your browser and go to http://localhost:3000/docs/

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

