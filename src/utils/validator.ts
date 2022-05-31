import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";
import { Scope } from "../changelog/types";

export const checkMinLength = (s: string, n: number): E.Either<Error, string> =>
  s.length >= n
    ? E.right(s)
    : E.left(new Error(`at least ${n} characters required`));

export const matchRegex = (s: string, regex: RegExp): O.Option<string> =>
  s.match(regex) ? O.some(s) : O.none;

export const popFromRegex = (s: string, regex: RegExp): O.Option<string> =>
  pipe(
    s.match(regex),
    O.fromNullable,
    O.chainNullableK((el) => el.pop())
  );

export const sameScope = (scopes: ReadonlyArray<Scope>): boolean =>
  scopes.every((val, _, arr) => val === arr[0]);
