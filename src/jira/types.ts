/**
 * type definition for Jira tickets / stories
 */

import * as t from "io-ts";

export const JiraIssueTypeName = t.keyof({
  Story: null,
  Epic: null,
  Bug: null,
  Sottotask: null,
  "Sub-task": null,
  Task: null,
});

export type JiraIssueTypeName = t.TypeOf<typeof JiraIssueTypeName>;

const IssueType = t.interface({
  name: JiraIssueTypeName,
  subtask: t.boolean,
});

export const JiraIssueResponse = t.exact(
  t.interface({
    key: t.string,
    fields: t.intersection([
      t.interface({
        summary: t.string,
        issuetype: IssueType,
        labels: t.array(t.string),
        project: t.interface({
          name: t.string,
          key: t.string,
          id: t.string,
        }),
      }),
      t.partial({
        parent: t.interface({
          key: t.string,
          fields: t.interface({
            summary: t.string,
            issuetype: IssueType,
          }),
        }),
      }),
    ]),
  })
);
export type JiraIssueResponse = t.TypeOf<typeof JiraIssueResponse>;
