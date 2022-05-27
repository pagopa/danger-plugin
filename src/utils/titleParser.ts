import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";

const jiraRegex = /\[([A-Z0-9]+-\d+(,[A-Z0-9]+-\d+)*)]\s.+/;

/**
 * Extracts Jira ticket ids from the pr title (if any)
 *
 * @param title
 */
export const getJiraIdFromPrTitle = (
  title: string
): O.Option<ReadonlyArray<string>> =>
  pipe(
    title.match(jiraRegex),
    O.fromNullable,
    O.map((a) => a[1].split(","))
  );
