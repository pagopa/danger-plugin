/**
 * Implements methods for update a PR title and label with  tickets / stories information via danger
 */

import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import * as TE from "fp-ts/TaskEither";
import { DangerDSLType } from "danger/distribution/dsl/DangerDSL";
import { sequenceS } from "fp-ts/lib/Apply";
import { ap } from "fp-ts/lib/Identity";
import * as Rr from "fp-ts/Reader";
import { match } from "fp-ts/boolean";
import { MarkdownString } from "danger/distribution/dsl/Aliases";
import { GenericTicket, Configuration, ticketOrdByType } from "./types";
import { getTicketsScope } from "./changelog/ticketChangelog";
import { popFromRegex } from "./utils/validator";

declare const danger: DangerDSLType;

const cleanChangelogRegex =
  /^(fix(\(.+\))?!?: |feat(\(.+\))?!?: |chore(\(.+\))?!?: )?(.*)$/;

export const updatePrLabel =
  (
    ticketList: ReadonlyArray<GenericTicket>
  ): Rr.Reader<Configuration, TE.TaskEither<Error, MarkdownString>> =>
  (configuration) =>
    pipe(
      configuration.updateLabel,
      match(
        () => TE.left(new Error("updateLabel is disabled")),
        () =>
          pipe(
            getTicketsScope(ticketList)(configuration),
            TE.fromEither,
            TE.map((sc) =>
              pipe(
                TE.tryCatch(
                  () =>
                    danger.github.utils.createOrAddLabel({
                      name: sc,
                      // The color is not used and can be customized from the "label" tab in the github page
                      color: "#FFFFFF",
                      description: sc,
                    }),
                  () => new Error("Error during github label update")
                ),
                TE.map(() => "")
              )
            ),
            TE.flatten
          )
      )
    );

export const updatePrTitle =
  (
    ticketList: ReadonlyArray<GenericTicket>
  ): Rr.Reader<Configuration, TE.TaskEither<Error, MarkdownString>> =>
  (configuration) =>
    pipe(
      configuration.updateTitle,
      match(
        () => TE.left(new Error("updateTitle is disabled")),
        () =>
          pipe(
            getTicketsScope(ticketList)(configuration),
            TE.fromEither,
            TE.map((sc) => {
              const ticketsSameType = pipe(
                ticketList,
                RA.sort(ticketOrdByType),
                RA.uniq(ticketOrdByType)
              );
              const tag = pipe(
                RA.head(ticketsSameType),
                O.map((t) => t.type),
                O.getOrElse(() => "")
              );
              const title = pipe(
                popFromRegex,
                ap(danger.github.pr.title),
                ap(cleanChangelogRegex),
                O.getOrElse(() => danger.github.pr.title)
              );

              const titleSplitter = new RegExp(/(\[.*]\s*)(.+)/g);
              const splittingResults = titleSplitter.exec(title);

              const upperCaseTitle = pipe(
                splittingResults,
                O.fromNullable,
                O.map((regs) =>
                  sequenceS(O.Apply)({
                    task_id: pipe(regs, RA.lookup(1)),
                    title: pipe(
                      regs,
                      RA.lookup(2),
                      O.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    ),
                  })
                ),
                O.compact,
                O.fold(
                  () => danger.github.pr.title,
                  (s) => `${s.task_id}${s.title}`
                )
              );

              return pipe(
                TE.tryCatch(
                  () =>
                    danger.github.api.pulls.update({
                      owner: danger.github.thisPR.owner,
                      repo: danger.github.thisPR.repo,
                      pull_number: danger.github.thisPR.number,
                      title: `${tag}${sc}: ${upperCaseTitle}`,
                    }),
                  () => new Error("Eror during github title update")
                ),
                TE.map(() => {
                  if (ticketsSameType.length > 1) {
                    return (
                      "Multiple stories with different types are associated with this Pull request.\n" +
                      "Only one tag will be added, following the order: `feature > bug > chore`"
                    );
                  } else {
                    return "";
                  }
                })
              );
            }),
            TE.flatten
          )
      )
    );
