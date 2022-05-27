import * as E from "fp-ts/Either";

export const checkMinLength = (s: string, n: number): E.Either<Error, string> =>
  s.length >= n
    ? E.right(s)
    : E.left(new Error(`at least ${n} characters required`));

export const matchRegex = (s: string, regex: RegExp): E.Either<Error, string> =>
  s.match(regex) ? E.right(s) : E.left(new Error(`Match not found`));
