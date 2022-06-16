import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";

// Provides dev-time typing structure for  `danger` - doesn't affect runtime.
// https://github.com/danger/danger-js/blob/main/docs/usage/extending-danger.html.md#writing-your-plugin
import { ap } from "fp-ts/lib/Identity";
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL";
import { MarkdownString } from "../node_modules/danger/distribution/dsl/Aliases";
import { getJiraIdFromPrTitle } from "./utils/titleParser";
import { renderTickets } from "./dangerRender";
import { getJiraIssues } from "./jira";
import { fromJiraToGenericTicket, Configuration } from "./types";
import { checkMinLength, matchRegex } from "./utils/validator";
import { updatePrLabel, updatePrTitle } from "./updatePr";

const MIN_LEN_PR_DESCRIPTION = 10;

declare const danger: DangerDSLType;
declare function schedule<T>(asyncFunction: Promise<T>): void;
declare function warn(message: string): void;
declare function markdown(message: MarkdownString): void;

// This is the main method called at the begin from Dangerfile.ts
const customRules = async (configuration: Configuration): Promise<void> => {
  const addJiraTicket = pipe(
    danger.github.pr.title,
    getJiraIdFromPrTitle,
    TE.fromOption(
      () =>
        new Error(
          "Jira ID not found in PR title. Please use the format [<project_id>-<sequence>]"
        )
    ),
    TE.chain(getJiraIssues),
    TE.map(RA.map(fromJiraToGenericTicket)),
    TE.map((tickets) => {
      const ticketRender = pipe(
        tickets,
        renderTickets,
        TE.fromEither,
        TE.bimap(
          (err) => warn(err.message),
          (message) => markdown(message)
        )
      );

      const labelRender = updatePrLabel(tickets)(configuration);

      const titleRender = updatePrTitle(tickets)(configuration);

      schedule(ticketRender());
      schedule(labelRender());
      schedule(titleRender());
    })
  );

  schedule(addJiraTicket());

  pipe(
    checkMinLength(danger.github.pr.body, MIN_LEN_PR_DESCRIPTION),
    E.mapLeft(() =>
      warn("Please include a longer description in the Pull Request.")
    )
  );

  pipe(
    matchRegex,
    ap(danger.github.pr.body),
    ap(/(WIP|work in progress)/i),
    O.map(() =>
      warn(
        "WIP keyword in PR title is deprecated, please create a Draft PR instead."
      )
    )
  );
};

export default customRules;
