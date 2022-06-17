import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { GenericTicket, ticketOrdByType } from "./../types";

const ticketsOfSameType = (
  ticketList: ReadonlyArray<GenericTicket>
): ReadonlyArray<GenericTicket> =>
  pipe(ticketList, RA.sort(ticketOrdByType), RA.uniq(ticketOrdByType));

export const areMultipleTicketsType = (
  ticketList: ReadonlyArray<GenericTicket>
): boolean => pipe(ticketList, ticketsOfSameType, RA.size, (len) => len > 1);

export const getTagFromTickets = (
  ticketList: ReadonlyArray<GenericTicket>
): string =>
  pipe(
    ticketList,
    ticketsOfSameType,
    RA.head,
    O.map((t) => t.type),
    O.getOrElse(() => "")
  );
