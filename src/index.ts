/* eslint-disable @typescript-eslint/no-shadow */
// Provides dev-time typing structure for  `danger` - doesn't affect runtime.
// https://github.com/danger/danger-js/blob/main/docs/usage/extending-danger.html.md#writing-your-plugin
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import { pipe } from "fp-ts/function";

import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL";
import { getJiraIdFromPrTitle } from "./utils/titleParser";
import { printWarningError, renderTickets } from "./dangerRender";
import { getJiraIssues } from "./jira";
import { fromJiraToGenericTicket } from "./types";
import { checkMinLength, matchRegex } from "./utils/validator";
const MIN_LEN_PR_DESCRIPTION = 10;

declare const danger: DangerDSLType;
export declare function schedule<T>(asyncFunction: Promise<T>): void;

export const checkDangers = async (): Promise<void> => {
  const addJiraTicket = pipe(
    danger.github.pr.title,
    getJiraIdFromPrTitle,
    TE.fromOption(() => new Error("Jira ID not found in PR title")),
    TE.chain(getJiraIssues),
    TE.map((_) => _.map(fromJiraToGenericTicket)),
    TE.map(renderTickets),
    TE.mapLeft((err) => printWarningError(err))
  );

  schedule(addJiraTicket());

  pipe(
    checkMinLength(danger.github.pr.body, MIN_LEN_PR_DESCRIPTION),
    E.mapLeft(() =>
      printWarningError(
        new Error("Please include a longer description in the Pull Request.")
      )
    )
  );

  pipe(
    matchRegex(danger.github.pr.body, /(WIP|work in progress)/i),
    E.map(() =>
      printWarningError(
        new Error(
          "WIP keyword in PR title is deprecated, please create a Draft PR instead."
        )
      )
    )
  );
};
