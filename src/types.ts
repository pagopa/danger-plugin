/**
 * type definition for generic tickets / stories and Jira conversion
 */

import { Ord } from "fp-ts/lib/Ord";
import { JIRA_HOST_NAME } from "./jira";
import { JiraIssueTypeName, JiraIssueResponse } from "./jira/types";

export type GenericTicketType = "feat" | "fix" | "chore" | "epic";
export type Scope = string;

export interface Configuration {
  readonly tagToScope: Record<string, Scope>;
  readonly projectToScope: Record<string, Scope>;
  readonly minLenPrDescription: number;
  readonly updateLabel: boolean;
  readonly updateTitle: boolean;
}

export const ticketPriority: Record<GenericTicketType, number> = {
  chore: 0,
  epic: 3,
  feat: 2,
  fix: 1,
};

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

export const ticketOrdByType: Ord<GenericTicket> = {
  equals: (x, y) => x.type === y.type,
  compare: (x, y) =>
    ticketPriority[x.type] < ticketPriority[y.type]
      ? -1
      : ticketPriority[x.type] > ticketPriority[y.type]
      ? 1
      : 0,
};

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
