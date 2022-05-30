/**
 * Implements the methods to connect to the Jira api and receive the list of tickets / stories
 */

import JiraApi = require("jira-client");
import * as TE from "fp-ts/lib/TaskEither";
import * as A from "fp-ts/lib/ReadonlyArray";
import { toError } from "fp-ts/lib/Either";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { pipe } from "fp-ts/lib/function";
import { JiraIssueResponse } from "./types";

export const JIRA_HOST_NAME = "pagopa.atlassian.net";
const jiraApi = new JiraApi({
  host: JIRA_HOST_NAME,
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_PASSWORD,
});

const parseJiraIssue = (
  response: JiraApi.JsonResponse
): TE.TaskEither<Error, JiraIssueResponse> =>
  pipe(
    TE.fromEither(JiraIssueResponse.decode(response)),
    TE.mapLeft(
      (errs) =>
        new Error(
          `Cannot decode Response|${errorsToReadableMessages(errs).join("/")}`
        )
    )
  );

export const getJiraIssue = (
  id: string
): TE.TaskEither<Error, JiraIssueResponse> =>
  pipe(
    TE.tryCatch(() => jiraApi.getIssue(id), toError),
    TE.chain(parseJiraIssue)
  );

export const getJiraIssues = (
  ids: ReadonlyArray<string>
): TE.TaskEither<Error, ReadonlyArray<JiraIssueResponse>> =>
  pipe(ids, A.map(getJiraIssue), TE.sequenceArray);
