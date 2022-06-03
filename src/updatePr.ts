/**
 * Implements methods for update a PR title and label with  tickets / stories information via danger
 */

import { pipe } from "fp-ts/lib/function";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import * as RA from "fp-ts/lib/ReadonlyArray";
import { DangerDSLType } from "danger/distribution/dsl/DangerDSL";
import { sequenceS } from "fp-ts/lib/Apply";
import { ap } from "fp-ts/lib/Identity";
import { GenericTicket, ticketOrdByType } from "./types";
import { getTicketsScope } from "./changelog/ticketChangelog";
import { popFromRegexC } from "./utils/validator";

declare const danger: DangerDSLType;
export declare function warn(message: string): void;
export declare function markdown(message: string): void;
export declare function schedule<T>(asyncFunction: Promise<T>): void;

const cleanChangelogRegex =
  /^(fix(\(.+\))?!?: |feat(\(.+\))?!?: |chore(\(.+\))?!?: )?(.*)$/;

export const updatePrTitleAndLabel = (
  ticketList: ReadonlyArray<GenericTicket>
): void => {
  const scope = pipe(
    getTicketsScope(ticketList),
    E.bimap(
      (err) => warn(err.message),
      (s) => `(${s})`
    ),
    E.fold(
      () => "",
      (s) => s
    )
  );

  const updateLabel = danger.github.utils.createOrAddLabel({
    name: scope.replace("(", "").replace(")", ""),
    // The color is not used and can be customized from the "label" tab in the github page
    color: "#FFFFFF",
    description: scope,
  });

  schedule(updateLabel);

  const ticketsSameType = pipe(
    ticketList,
    RA.sort(ticketOrdByType),
    RA.uniq(ticketOrdByType)
  );

  if (ticketsSameType.length > 1) {
    warn(
      "Multiple stories with different types are associated with this Pull request.\n" +
        "Only one tag will be added, following the order: `feature > bug > chore`"
    );
  }

  const tag = pipe(
    RA.head(ticketsSameType),
    O.map((t) => t.type),
    O.getOrElse(() => "")
  );

  const title = pipe(
    popFromRegexC,
    ap(danger.github.pr.title),
    ap(cleanChangelogRegex),
    O.getOrElse(() => danger.github.pr.title)
  );

  const titleSplitter = new RegExp(/(\[.*]\s*)(.+)/g);
  const splittingResults = titleSplitter.exec(title);

  const upperCaseTitle = pipe(
    splittingResults,
    O.fromNullable,
    O.map((el) =>
      sequenceS(O.Apply)({
        task_id: pipe(el, RA.lookup(1)),
        title: pipe(
          el,
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

  const updateTitle = danger.github.api.pulls.update({
    owner: danger.github.thisPR.owner,
    repo: danger.github.thisPR.repo,
    pull_number: danger.github.thisPR.number,
    title: `${tag}${scope}: ${upperCaseTitle}`,
  });

  schedule(updateTitle);
};
