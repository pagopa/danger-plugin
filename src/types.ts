/**
 * type definition for generic tickets / stories and Jira conversion
 */

import { JIRA_HOST_NAME } from "./jira";
import { JiraIssueTypeName, JiraIssueResponse } from "./jira/types";

export type GenericTicketType = "feat" | "fix" | "chore" | "epic";

export interface GenericTicket {
  readonly id: string;
  // a prefix that should be used to represent the ticket id
  readonly idPrefix?: string;
  readonly title: string;
  readonly type: GenericTicketType;
  readonly projectId: string;
  readonly tags: ReadonlyArray<string>;
  // the url to reach the ticket
  readonly url: string;
  // is a subtask linked with a father ticket?
  readonly parent?: GenericTicket;
}

/**
 * From {@link JiraIssueTypeName} to {@link GenericTicketType}
 *
 * @param jiraType
 */
const convertJiraTypeToGeneric = (
  jiraType: JiraIssueTypeName
): GenericTicketType => {
  switch (jiraType) {
    case "Bug":
      return "fix";
    case "Epic":
      return "epic";
    case "Sub-task":
    case "Sottotask":
      return "chore";
    case "Story":
      return "feat";
    case "Task":
      return "chore";
    default:
      return "chore";
  }
};

/**
 * From {@link JiraIssueResponse} to {@link GenericTicket}
 *
 * @param jira
 */
export const fromJiraToGenericTicket = (
  jira: JiraIssueResponse
): GenericTicket => ({
  id: jira.key,
  parent: jira.fields.parent
    ? fromJiraToGenericTicket({
        ...jira.fields.parent,
        fields: {
          ...jira.fields.parent.fields,
          labels: [],
          project: jira.fields.project,
        },
      })
    : undefined,
  projectId: jira.fields.project.key,
  tags: jira.fields.labels,
  title: jira.fields.summary,
  type: convertJiraTypeToGeneric(jira.fields.issuetype.name),
  url: new URL(jira.key, `https://${JIRA_HOST_NAME}/browse/`).toString(),
});
