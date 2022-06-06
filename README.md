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
- Warn if `npm`-related files are added (as we use `yarn`)

## Usage

To use you must already have `danger-js` set up in your repo. 
If you haven't configured it yet:

```sh
yarn add danger --dev
```

### Install

```sh
yarn add @pagopa/danger-plugin --dev
```

### At a glance
Create a new file `Dangerfile.ts` in your root working dir. It is necessary to define a `RecordScope` that allows you to make a mapping between a ticket projectid or ticket tag with a scope that is mainly a string that allows you to better describe it. 

```js
// Dangerfile.ts
import customRules from "@pagopa/danger-plugin";
import { RecordScope } from "@pagopa/danger-plugin/dist/types";

const recordScope: RecordScope = {
  projectToScope: {
    IAC: "Bonus Pagamenti Digitali",
    IOACGN: "Carta Giovani Nazionale",
    IAGP: "EU Covid Certificate",
  },
  tagToScope: {
    android: "Android",
    ios: "iOS",
    messages: "Messages",
    payments: "Payments",
    services: "Services",
  },
};

customRules(recordScope);


```
Look at the [Dangerfile.ts](https://github.com/pagopa/danger-plugin/blob/master/Dangerfile.ts) file to better understand how to structure it.

### Creating a bot account for Danger to use

In order to get the most out of Danger, we recommend giving it the ability to post comments in your Pull Requests. This is a regular GitHub account, but depending on whether you are working on a private or public project, you will want to give different levels of access to this bot.

### Environment variables

A token related to github bot account is required to enable the reading of the repo and comment the PR on github to be set in the environment variable:

```
DANGER_GITHUB_API_TOKEN="....."
```

Furthermore, to access the Jira API it is necessary to create a token relating to a service account and set the following environment variables:

```
JIRA_USERNAME=account@pagopa.it
JIRA_PASSWORD=token...
```

### DevOps pipeline
example of a pipeline stage for the code review

```yml
stages:
  - stage: Static_analysis
    dependsOn: []
    jobs:
      - job: danger
        condition: and(
          succeeded(),
          and(
          eq(variables['Build.Reason'], 'PullRequest'),
          ne(variables['DANGER_GITHUB_API_TOKEN'], 'skip')
          )
          )
        steps:
          - template: templates/node-job-setup/template.yaml@pagopaCommons
          - bash: |
              yarn danger ci
            env:
              DANGER_GITHUB_API_TOKEN: "$(DANGER_GITHUB_API_TOKEN)"
              JIRA_USERNAME: "$(JIRA_USERNAME)"
              JIRA_PASSWORD: "$(JIRA_PASSWORD)"
            displayName: "Danger CI"

```
