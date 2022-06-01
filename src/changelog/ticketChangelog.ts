/**
 * Implements methods for working with ticket scopes, with the ability to search
 * for common scopes both within the project and within the tags
 */

import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";
import { GenericTicket } from "../types";
import { popFromRegex, isSameScope } from "../utils/validator";
import { Scope, projectToScope, tagToScope } from "./types";

export declare function warn(message: string): void;
export declare function markdown(message: string): void;
export declare function schedule<T>(asyncFunction: Promise<T>): void;

// pattern used to recognize a scope label
const regex = /(changelog-scope:|epic-)(.*)/m;

/**
 *Try to detect the {@link Scope} of the ticket by projectId
 */
export const getProjectScope = (
  ticket: GenericTicket
): E.Either<Error, Scope> =>
  pipe(
    O.fromNullable(projectToScope[ticket.projectId]),
    E.fromOption(
      () =>
        new Error(
          `I can't find a scope related to the project ${ticket.projectId}`
        )
    )
  );

/**
 * Try to detect the {@link Scope} of the ticket by tags associated
 */
export const getTagsScope = (ticket: GenericTicket): E.Either<Error, Scope> => {
  const possibleScopes = pipe(
    ticket.tags,
    RA.map((l) => popFromRegex(l, regex)),
    RA.filter(O.isSome)
  );

  if (possibleScopes.length === 0) {
    return E.left(
      new Error(
        `No labels match the expression \`${regex}\` for the ticket [#${ticket.id}].\n
     It is not possible to assign a scope to this pull request!`
      )
    );
  } else if (possibleScopes.length > 1) {
    return E.left(
      new Error(
        `Multiple labels match the expression \`${regex}\` for the ticket [#${ticket.id}].\n
     It is not possible to assign a single scope to this pull request!`
      )
    );
  } else {
    return pipe(
      possibleScopes,
      RA.head,
      O.compact,
      O.chainNullableK((el) => tagToScope[el]),
      E.fromOption(
        () =>
          new Error(`The scope of the tag is not present in the allowed list`)
      )
    );
  }
};

/**
 * Try to detect the {@link Scope} of the ticket first by projectId and then by tag
 */
export const getTicketScope = (ticket: GenericTicket): E.Either<Error, Scope> =>
  pipe(
    ticket,
    getProjectScope,
    E.foldW(
      () => getTagsScope(ticket),
      (scope) => E.right(scope)
    )
  );

/**
 * Try to detect a common {@link Scope} for all @param tickets
 */
export const getTicketsScope = (
  tickets: ReadonlyArray<GenericTicket>
): E.Either<Error, Scope> =>
  pipe(
    tickets,
    RA.map(getTicketScope),
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
