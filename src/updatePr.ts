/**
 * Implements methods for update a PR title and label with  tickets / stories information via danger
 */

import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { DangerDSLType } from "danger/distribution/dsl/DangerDSL";
import * as Rr from "fp-ts/Reader";
import { match } from "fp-ts/boolean";
import { MarkdownString } from "danger/distribution/dsl/Aliases";
import { GenericTicket, Configuration } from "./types";
import { getTicketsScope } from "./changelog/ticketChangelog";
import { composeTitle } from "./utils/titleParser";
import {
  areMultipleTicketsType,
  getTagFromTickets,
} from "./utils/ticketParser";

declare const danger: DangerDSLType;

export const updatePrLabel =
  (
    ticketList: ReadonlyArray<GenericTicket>
  ): Rr.Reader<Configuration, TE.TaskEither<Error, MarkdownString>> =>
  (configuration) =>
    pipe(
      configuration.updateLabel,
      match(
        () => TE.right(""),
        () =>
          pipe(
            getTicketsScope(ticketList)(configuration),
            TE.fromEither,
            TE.chain((sc) =>
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
                TE.map(() => "✅ Label added\n")
              )
            )
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
        () => TE.right(""),
        () =>
          pipe(
            getTicketsScope(ticketList)(configuration),
            TE.fromEither,
            TE.chain((scope) => {
              const tag = pipe(ticketList, getTagFromTickets);
              const finalTitle = pipe(danger.github.pr.title, composeTitle);

              return pipe(
                TE.tryCatch(
                  () =>
                    danger.github.api.pulls.update({
                      owner: danger.github.thisPR.owner,
                      repo: danger.github.thisPR.repo,
                      pull_number: danger.github.thisPR.number,
                      title: `${tag}${scope}: ${finalTitle}`,
                    }),
                  () => new Error("Eror during github title update")
                ),
                TE.map(() =>
                  pipe(ticketList, areMultipleTicketsType, (check) =>
                    check
                      ? "⚠ Multiple stories with different types are associated with this Pull request.\n" +
                        "Only one tag will be added, following the order: `feature > bug > chore`\n"
                      : "✅ Title updated\n"
                  )
                )
              );
            })
          )
      )
    );
