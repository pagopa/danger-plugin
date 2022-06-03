/**
 * Implements methods for rendering tickets / stories via danger markdown
 */

import { MarkdownString } from "../node_modules/danger/distribution/dsl/Aliases";
import { GenericTicketType, GenericTicket } from "./types";

export declare function warn(message: string): void;
export declare function markdown(message: MarkdownString): void;
export declare function schedule<T>(asyncFunction: Promise<T>): void;

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
): void => {
  const ticketListToString = ticketList
    .map((s) => {
      const subtask = s.parent
        ? ` \n _subtask of_\n     * ${renderTicket(s.parent)}`
        : "";
      return ` * ${renderTicket(s)}${subtask}`;
    })
    .join("\n");
  markdown(`
  ## Affected stories\n${ticketListToString}\n`);
};
