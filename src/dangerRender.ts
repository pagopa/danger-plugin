/**
 * Implements methods for rendering tickets / stories via danger markdown
 */

import { pipe } from "fp-ts/lib/function";
import * as RA from "fp-ts/ReadonlyArray";
import * as E from "fp-ts/Either";
import { MarkdownString } from "../node_modules/danger/distribution/dsl/Aliases";
import { GenericTicketType, GenericTicket } from "./types";

const StoryEmoji: Record<GenericTicketType, string> = {
  chore: "⚙️",
  epic: "⚡",
  feat: "🌟",
  fix: "🐞",
};

export const renderTicket = (ticket: GenericTicket): string =>
  `${StoryEmoji[ticket.type]} [${ticket.idPrefix ? ticket.idPrefix : ""}${
    ticket.id
  }](${ticket.url}): ${ticket.title}`;

export const renderTickets = (
  ticketList: ReadonlyArray<GenericTicket>
): E.Either<Error, MarkdownString> =>
  pipe(
    ticketList,
    RA.reduce("", (acc, s) => {
      const subtask = s.parent
        ? ` \n _subtask of_\n     * ${renderTicket(s.parent)}`
        : "";
      return acc + ` * ${renderTicket(s)}${subtask}\n`;
    }),
    E.fromNullable(new Error("Invalid ticket list")),
    E.map(
      (ticketListToString) => `
 ## Affected stories\n${ticketListToString}\n`
    )
  );
