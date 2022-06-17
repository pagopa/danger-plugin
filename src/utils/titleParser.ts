/**
 * Implement methods for working with the title of a ticket / story
 */

import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/lib/Option";
import { ap } from "fp-ts/lib/Identity";
import { sequenceS } from "fp-ts/lib/Apply";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import { fromJiraToGenericTicket, GenericTicket } from "../types";
import { getJiraIssues } from "../jira";
import { popFromRegex } from "./validator";

const jiraRegex = /\[([A-Z0-9]+-\d+(,[A-Z0-9]+-\d+)*)]\s.+/;
const titleSplitter = new RegExp(/(\[.*]\s*)(.+)/g);
const cleanChangelogRegex =
  /^(fix(\(.+\))?!?: |feat(\(.+\))?!?: |chore(\(.+\))?!?: )?(.*)$/;

export const getJiraIdFromTitle = (
  title: string
): O.Option<ReadonlyArray<string>> =>
  pipe(
    title.match(jiraRegex),
    O.fromNullable,
    O.chainNullableK((el) => el[1]),
    O.map((el) => el.split(","))
  );

export const getGenericTicketFromTitle = (
  title: string
): TE.TaskEither<Error, ReadonlyArray<GenericTicket>> =>
  pipe(
    title,
    getJiraIdFromTitle,
    TE.fromOption(
      () =>
        new Error(
          "Jira ID not found in PR title. Please use the format [<project_id>-<sequence>]"
        )
    ),
    TE.chain(getJiraIssues),
    TE.map(RA.map(fromJiraToGenericTicket))
  );

export const cleanTitle = (title: string): string =>
  pipe(
    popFromRegex,
    ap(title),
    ap(cleanChangelogRegex),
    O.getOrElse(() => title)
  );

export const splitTitle = (
  title: string
): O.Option<{
  readonly taskId: string;
  readonly title: string;
}> =>
  pipe(
    title,
    titleSplitter.exec,
    O.fromNullable,
    O.chain((regs) =>
      sequenceS(O.Apply)({
        taskId: pipe(regs, RA.lookup(1)),
        title: pipe(
          regs,
          RA.lookup(2),
          O.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        ),
      })
    )
  );

export const composeTitle = (title: string): string =>
  pipe(
    title,
    cleanTitle,
    splitTitle,
    O.fold(
      () => title,
      (s) => `${s.taskId}${s.title}`
    )
  );
