import JiraApi = require("jira-client");
import * as TE from "fp-ts/lib/TaskEither";
import * as A from "fp-ts/lib/ReadonlyArray";
import { toError } from "fp-ts/lib/Either";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { pipe } from "fp-ts/lib/function";
import { JiraIssueResponse } from "./types";

export const jiraHostName = "pagopa.atlassian.net";
const jiraApi = new JiraApi({
  host: jiraHostName,
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_PASSWORD,
});

export const getJiraIssue = (
  id: string
): TE.TaskEither<Error, JiraIssueResponse> =>
  pipe(
    TE.tryCatch(() => jiraApi.getIssue(id), toError),
    TE.chain((response) =>
      pipe(
        TE.fromEither(JiraIssueResponse.decode(response)),
        TE.mapLeft(
          (errs) =>
            new Error(
              `Cannot decode Response|${errorsToReadableMessages(errs).join(
                "/"
              )}`
            )
        )
      )
    )
  );

export const getJiraIssues = (
  ids: ReadonlyArray<string>
): TE.TaskEither<Error, ReadonlyArray<JiraIssueResponse>> =>
  pipe(ids, A.map(getJiraIssue), TE.sequenceArray);
