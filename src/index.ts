import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as RA from "fp-ts/ReadOnlyArray";
import { pipe } from "fp-ts/function";

// Provides dev-time typing structure for  `danger` - doesn't affect runtime.
// https://github.com/danger/danger-js/blob/main/docs/usage/extending-danger.html.md#writing-your-plugin
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL";
import { getJiraIdFromPrTitle } from "./utils/titleParser";
import { renderTickets } from "./dangerRender";
import { getJiraIssues } from "./jira";
import { fromJiraToGenericTicket } from "./types";
import { checkMinLength, matchRegex } from "./utils/validator";

const MIN_LEN_PR_DESCRIPTION = 10;

declare const danger: DangerDSLType;
export declare function schedule<T>(asyncFunction: Promise<T>): void;
export declare function warn(message: string): void;

// This is the main method called at the begin from Dangerfile.ts
export const main = async (): Promise<void> => {
  const addJiraTicket = pipe(
    danger.github.pr.title,
    getJiraIdFromPrTitle,
    TE.fromOption(() => new Error("Jira ID not found in PR title")),
    TE.chain(getJiraIssues),
    TE.map(RA.map(fromJiraToGenericTicket)),
    TE.bimap((err) => warn(err.message), renderTickets)
  );

  schedule(addJiraTicket());

  pipe(
    checkMinLength(danger.github.pr.body, MIN_LEN_PR_DESCRIPTION),
    E.mapLeft(() =>
      warn("Please include a longer description in the Pull Request.")
    )
  );

  pipe(
    matchRegex(danger.github.pr.body, /(WIP|work in progress)/i),
    E.map(() =>
      warn(
        "WIP keyword in PR title is deprecated, please create a Draft PR instead."
      )
    )
  );
};
