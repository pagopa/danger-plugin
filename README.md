# Custom DangerJS rules plugin

![npm](https://img.shields.io/npm/v/@pagopa/danger-plugin?color=green&label=%40pagopa%2Fdanger-plugin&logo=npm)
![Azure DevOps builds](https://img.shields.io/azure-devops/build/pagopaspa/a1eb6f06-1593-4a60-b2aa-9ff49c60340d/672?label=Code%20review)
![Azure DevOps builds](https://img.shields.io/azure-devops/build/pagopaspa/a1eb6f06-1593-4a60-b2aa-9ff49c60340d/671?label=Deploy)
![npm type definitions](https://img.shields.io/npm/types/@pagopa/danger-plugin)

This module provides custom rules over [Danger](https://danger.systems/js/) CI automation.

## Features

- Cross-link with [Jira](https://pagopa.atlassian.net/jira) stories, based on PR title
- Warn when a PR has no description
- Update the PR title with the right changelog configuration and scope
- Update the generated changelog, adding the link to the related Jira ticket
- Perform sanity checks on yarn.lock
- Warn if `npm`-related files are added (as we use `yarn`)

## Installation

Adding the Danger module by `yarn add @pagopa/danger-plugin --dev`. This will add Danger as a devDependency and make the command danger available by running `yarn danger`.

### Creating a bot account for Danger to use

In order to get the most out of Danger, we recommend giving it the ability to post comments in your Pull Requests. This is a regular GitHub account, but depending on whether you are working on a private or public project, you will want to give different levels of access to this bot.

### Environment variables

A tokem related to github bot account is required to enable the reading of the repo and comment the PR on github to be set in the environment variable:

```
DANGER_GITHUB_API_TOKEN="....."
```

Furthermore, to access the Jira API it is necessary to create a token relating to a service account and set the following environment variables:

```
JIRA_USERNAME=account@pagopa.it
JIRA_PASSWORD=token...
```

## How to use
To use this plugin it is necessary to import the main function inside the Dangerfile.ts file and define a RecordScope that allows you to make a mapping between a ticket projectid or ticket tag with a scope that is mainly a string that allows you to better describe it.

```
export type Scope = string;

export interface RecordScope {
  readonly tagToScope: Record<string, Scope>;
  readonly projectToScope: Record<string, Scope>;
}
```

Look at the [Dangerfile.ts](https://github.com/pagopa/danger-plugin/blob/master/Dangerfile.ts) file to better understand how to structure it.
