# Contributing
Thank you for your interest on contributing to Coding Coach! In this guide you will learn how to setup the backend on your local machine.

## Workflow

This section describes the workflow we are going to follow when working in a new feature or fixing a bug. If you want to contribute, please follow these steps:

1. Fork this project
2. Clone the forked project to your local environment, for example: `git clone git@github.com:crysfel/find-a-mentor-api.git` (Make sure to replace the URL to your own forked repository).
3. Add the original project as a remote, in this example the name is `upstream`, feel free to use whatever name you want. `git remote add upstream git@github.com:Coding-Coach/find-a-mentor-api.git`.

Forking the project will create a copy of that project in your own GitHub account, you will commit your work against your own repository.

### Updating your local

In order to update your local environment to the latest version on `master`, you will have to pull the changes using the `upstream` repository, for example: `git pull upstream master`. This will pull all the new commits from the origin repository to your local environment.

### Features/Bugs

When working on a new feature, create a new branch `feature/something` from the `develop` branch, for example `feature/login-form`. Commit your work against this new branch and push everything to your forked project. Once everything is completed, you should create a PR to the original project. Make sure to add a description about your work.

When fixing a bug, create a new branch `fix/something` from the `develop` branch, for example `fix/css-btn-issues`. When completed, push your commits to your forked repository and create a PR from there. Please make sure to describe what was the problem and how did you fix it.

### Updating your local branch

Let's say you've been working on a feature for a couple days, most likely there are new changes in `master` and your branch is behind. In order to update it to the latest (You might not need/want to do this) you need to pull the latest changes on `master` and then rebase your current branch.

```bash
$ git checkout master
$ git pull upstream master
$ git checkout feature/something-awesome
$ git rebase master
```

After this, your commits will be on top of the `master` commits. From here you can push to your `origin` repository and create a PR.

You might have some conflicts while rebasing, try to resolve the conflicts for each individual commit. Rebasing is intimidating at the beginning, if you need help don't be afraid to reach out in slack.

### Pull Requests

In order to merge a PR, it will first go through a review process. Once approved, we will merge to `master` branch using the `Squash` button in github.

When using squash, all the commits will be squashed into one. The idea is to merge features/fixes as oppose of merging each individual commit. This helps when looking back in time for changes in the code base, and if the PR has a great comment, it's easier to know why that code was introduced.


## Setting up vendors
Before setting up the project, you will need to signup to the following third party vendors:

- [Auth0](https://auth0.com/signup), we use auth0 to handle authentication in the app.
- [SendGrid](https://sendgrid.com/pricing/), we use this service to send emails, you can use the free tier.

In order to setup the third party vendors, you will need to create your `.env` file at the root folder. There's an `.env.example` file that you can use for reference. Just duplicate this file and name it `.env`.

```bash
$ cp .env.example .env
```

### Configuring Auth0
After creating a new account, setting your tenant domain and region. You will need to create two applications.

- **Single Page Web Application**, for the client app to handle the redirects and tokens.
- **Machine to Machine Application**, for the backend server to pull data from auth0 to create a user profile.

#### Single Page Web Application
Click the `Create Application` button on the dashboard page, give it a name and select `Single Page Web Applications` from the given options, then click the `Create` button.

Once the app gets created click the `Settings` tab, from here you will need to copy to your `.env` file the following values:

```
AUTH0_DOMAIN=YOUR-DOMAIN.eu.auth0.com
AUTH0_FRONTEND_CLIENT_ID=client-id-from-auth0
AUTH0_FRONTEND_CLIENT_SECRET=client-secret-from-auth0
```

Next, you need to set `http://localhost:3000` as the value for `Allowed Callback URLs`, `Allowed Web Origins`, `Allowed Logout URLs` and `Allowed Origins (CORS)`. These fields are on the settings tabs of your new SPA app in auth0.

#### Machine to Machine Application
Click the `Create Application` button on the dashboard page, give it a name and select `Machine to Machine Applications` from the given options, then click the `Create` button.

Machine to Machine Applications require at least one authorized API, from the dropdown select the `Auth0 Management Api`.

After that you will need to select the following scopes:

- `read:users`
- `read:roles`
- `delete:users`

These are the only scopes we need, but you can select all if you want.

After selecting the scope, click the `Authorize` button to create the app, then go to the `Settings` tab.

Open the `.env` file, and then add the following two values to the these configs:

```
AUTH0_BACKEND_CLIENT_ID=client-id-from-auth0
AUTH0_BACKEND_CLIENT_SECRET=client-secret-from-auth0
```

And that's all! Your environment is ready to use Auth0 to authenticate users! 🎉

### Configuring SendGrid
We use sendgrid to send transactional emails, as well as managing our newsletter.

After signing up for the free plan, in the left menu go to `Settings - API Keys` and click the `Create Create Api` button at the top.

Give it a name to your new api key, select `Full Access` from the menu and click `Create & View` button.

Make sure to copy the key and save it in a safe place (because SendGrid will not show this key again), then open your `.env` file an set the key value as follow:

```
SENDGRID_API_KEY=sendgrid-api-key-here
```

That's all! Now you can start sending emails from the app.