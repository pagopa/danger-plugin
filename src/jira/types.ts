import * as IO from "io-ts";

export const JiraIssueTypeName = IO.union([
  IO.literal("Story"),
  IO.literal("Epic"),
  IO.literal("Bug"),
  IO.literal("Sottotask"),
  IO.literal("Sub-task"),
  IO.literal("Task"),
]);

export type JiraIssueTypeName = IO.TypeOf<typeof JiraIssueTypeName>;

const IssueType = IO.interface({
  name: JiraIssueTypeName,
  subtask: IO.boolean,
});

export const JiraIssueResponse = IO.exact(
  IO.interface({
    key: IO.string,
    fields: IO.intersection([
      IO.interface({
        summary: IO.string,
        issuetype: IssueType,
        labels: IO.array(IO.string),
        project: IO.interface({
          name: IO.string,
          key: IO.string,
          id: IO.string,
        }),
      }),
      IO.partial({
        parent: IO.interface({
          key: IO.string,
          fields: IO.interface({
            summary: IO.string,
            issuetype: IssueType,
          }),
        }),
      }),
    ]),
  })
);
export type JiraIssueResponse = IO.TypeOf<typeof JiraIssueResponse>;
