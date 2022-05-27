/* eslint-disable @typescript-eslint/no-shadow */
// Provides dev-time typing structure for  `danger` - doesn't affect runtime.
// https://github.com/danger/danger-js/blob/main/docs/usage/extending-danger.html.md#writing-your-plugin
import { GenericTicketType, I_GenericTicket } from "./types";
export declare function warn(message: string): void;
export declare function markdown(message: string): void;
export declare function schedule<T>(asyncFunction: Promise<T>): void;

const StoryEmoji: Record<GenericTicketType, string> = {
  chore: "⚙️",
  epic: "⚡",
  feat: "🌟",
  fix: "🐞",
};

export const printWarningError = (e: Error): void => {
  warn(e.message);
};

/**
 * Comments with the ticket type, id and title
 *
 * @param ticket
 */
export const renderTicket = (ticket: I_GenericTicket): string =>
  `${StoryEmoji[ticket.type]} [${ticket.idPrefix ? ticket.idPrefix : ""}${
    ticket.id
  }](${ticket.url}): ${ticket.title}`;

export const renderTickets = (
  ticketList: ReadonlyArray<I_GenericTicket>
): void => {
  const ticketListToString = ticketList
    .map((s) => {
      const subtask = s.parent
        ? ` \n _subtask of_\n     * ${renderTicket(s.parent)}`
        : "";
      return `  * ${renderTicket(s)}${subtask}`;
    })
    .join("\n");
  markdown(`
  ## Affected stories
  ${ticketListToString}\n`);
};
