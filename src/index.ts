import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as S from "fp-ts/string";
import * as RA from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/function";
import { ap } from "fp-ts/lib/Identity";
import { concatAll } from "fp-ts/Monoid";
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL";
import { MarkdownString } from "../node_modules/danger/distribution/dsl/Aliases";
import { getGenericTicketFromTitle } from "./utils/titleParser";
import { renderTickets } from "./dangerRender";
import { Configuration } from "./types";
import { checkMinLength, matchRegex } from "./utils/validator";
import { updatePrLabel, updatePrTitle } from "./updatePr";

// Provides dev-time typing structure for  `danger` - doesn't affect runtime.
// https://github.com/danger/danger-js/blob/main/docs/usage/extending-danger.html.md#writing-your-plugin
declare const danger: DangerDSLType;
declare function schedule<T>(asyncFunction: Promise<T>): void;
declare function warn(message: string): void;
declare function markdown(message: MarkdownString): void;

// This is the main method called at the begin from Dangerfile.ts
const customRules = async (configuration: Configuration): Promise<void> => {
  const renderOnGithub = pipe(
    danger.github.pr.title,
    getGenericTicketFromTitle,
    TE.chain((tickets) => {
      const ticketRender = pipe(tickets, renderTickets, TE.fromEither);
      const labelRender = updatePrLabel(tickets)(configuration);
      const titleRender = updatePrTitle(tickets)(configuration);

      return pipe(
        [ticketRender, labelRender, titleRender],
        RA.fromArray,
        RA.sequence(T.ApplicativeSeq),
        TE.fromTask,
        TE.mapLeft(() => new Error("Error while updating github")),
        TE.map((e) => pipe(e, RA.separate))
      );
    })
  );

  schedule(
    pipe(
      renderOnGithub,
      TE.bimap(
        (error) => pipe(error.message, warn),
        (tbr) => {
          pipe(
            tbr.left,
            RA.map((error) => pipe(error.message, warn))
          );
          pipe(tbr.right, concatAll(S.Monoid), markdown);
        }
      )
    )()
  );

  pipe(
    checkMinLength(danger.github.pr.body, configuration.minLenPrDescription),
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
