
## Description

A simple REST API to support the [Coding Coach mentors' app](https://mentors.codingcoach.io/).

## Installation

```bash
$ yarn install
```

```bash
cp .env.example .env
```
Make sure to set the new `.env` file up with the appropriate variables

### Running the app in a container
The following command can be used to run both, the api and the database, in
separate containers (e.g. if you don't have node on your machine):
```bash
# start both containers
$ docker-compose up

# use ctrl-c to stop both containers
```

## Running the app
The following steps can be used to run the database in a container and the
api locally:
```bash
# start mongo DB in a container in the background
$ docker-compose -f docker-compose-db.yml up -d

# development
$ yarn start

# development in watch mode
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
