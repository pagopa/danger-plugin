/**
 * Implements methods for working with ticket scopes, with the ability to search
 * for common scopes both within the project and within the tags
 */

import * as E from "fp-ts/Either";
import * as RA from "fp-ts/ReadonlyArray";
import * as R from "fp-ts/Record";
import * as Rr from "fp-ts/Reader";
import { pipe } from "fp-ts/lib/function";
import { GenericTicket, Configuration, Scope } from "../types";
import { isSameScope } from "../utils/validator";

/**
 *Try to detect the {@link Scope} of the ticket by projectId
 */
export const getProjectScope =
  (ticket: GenericTicket): Rr.Reader<Configuration, E.Either<Error, Scope>> =>
  (configuration) =>
    pipe(
      configuration.projectToScope,
      R.lookup(ticket.projectId),
      E.fromOption(
        () =>
          new Error(
            `I can't find a scope related to the project ${ticket.projectId}`
          )
      )
    );

/**
 * Try to detect the {@link Scope} of the ticket by projectId
 */
export const getTicketScope =
  (ticket: GenericTicket): Rr.Reader<Configuration, E.Either<Error, Scope>> =>
  (configuration) =>
    pipe(getProjectScope(ticket)(configuration));

const findCommonScope = (
  either_array: ReadonlyArray<E.Either<Error, string>>
): E.Either<Error, string> =>
  pipe(
    either_array,
    RA.sequence(E.Applicative),
    E.chain((el) =>
      isSameScope(el)
        ? pipe(
            RA.head(el),
            E.fromOption(
              () =>
                new Error("I'm unable to find a common scope for this tickets")
            )
          )
        : E.left(
            new Error(
              `Different scopes were found on the stories related to the pull request: [${el.join(
                ","
              )}].\n
         It is not possible to assign a single scope to this pull request!`
            )
          )
    )
  );

/**
 * Try to detect a common {@link Scope} for all @param tickets
 */
export const getTicketsScope = (
  tickets: ReadonlyArray<GenericTicket>
): Rr.Reader<Configuration, E.Either<Error, Scope>> =>
  pipe(
    tickets,
    RA.map(getTicketScope),
    RA.sequence(Rr.Applicative),
    Rr.map(findCommonScope)
  );
