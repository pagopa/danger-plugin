/**
 * Implement methods for working with the title of a ticket / story
 */

import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";

const jiraRegex = /\[([A-Z0-9]+-\d+(,[A-Z0-9]+-\d+)*)]\s.+/;

export const getJiraIdFromPrTitle = (
  title: string
): O.Option<ReadonlyArray<string>> =>
  pipe(
    title.match(jiraRegex),
    O.fromNullable,
    O.chainNullableK((el) => el[1]),
    O.map((el) => el.split(","))
  );
