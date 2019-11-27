import * as core from "@actions/core";
import * as github from "@actions/github";

jest.mock("@actions/core");
jest.mock("@actions/github");

import { run } from "./main";

describe("with missing repo token", () => {
  it("fails with error message", async () => {
    (core.getInput as jest.Mock).mockReturnValueOnce(null);

    await run();

    expect(core.setFailed).toBeCalledWith("No GitHub token found");
    expect(github.GitHub).not.toBeCalled();
  });
});

describe("non pull_request event", () => {
  it("fails with error message", async () => {
    (core.getInput as jest.Mock).mockReturnValueOnce("fake-token");
    github.context.payload.pull_request = undefined;

    await run();

    expect(core.setFailed).toBeCalledWith("Not a pull request event. Exiting.");
  });
});

describe("with valid input", () => {
  const mockGetPulls = jest.fn();
  const mockCreateComment = jest.fn();

  beforeEach(() => {
    (core.getInput as jest.Mock).mockReturnValueOnce("fake-token");

    github.context.payload.pull_request = {
      number: 1,
      body: "A pull request",
      html_url: "https://github.com/repo/pulls/1"
    };

    (github.context as any).repo = { owner: "owner", repo: "repo" };

    ((github.GitHub as any) as jest.Mock).mockImplementationOnce(() => ({
      pulls: {
        get: mockGetPulls
      },
      issues: {
        createComment: mockCreateComment
      }
    }));
  });

  describe("missing reference", () => {
    it("adds comment to pull request", async () => {
      mockGetPulls.mockResolvedValueOnce({
        data: {
          title: "Hello World",
          body: "Body",
          user: {
            login: "user"
          }
        }
      });

      await run();

      expect(mockCreateComment).toBeCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 1,
        body:
          "Hey there @user!\n\nIt looks like your pull request title doesn't contain a Jira reference.\n\nThis might be intentional, but if there's a Jira issue that can be associated to this pull request, please add a reference like \"[PRJ-123]\" at the start your title!"
      });
    });
  });

  describe("description missing", () => {
    it("adds comment to pull request", async () => {
      mockGetPulls.mockResolvedValueOnce({
        data: {
          title: "[PRJ-123] Make Changes",
          body: "",
          user: {
            login: "user"
          }
        }
      });

      await run();

      expect(mockCreateComment).toBeCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 1,
        body:
          "Hey there @user!\n\nIt looks like your pull request is missing a description. Please add a description to help reviewers understand your changes!"
      });
    });
  });

  describe("reference and description missing", () => {
    it("adds both comments to pull request", async () => {
      mockGetPulls.mockResolvedValueOnce({
        data: {
          title: "Title",
          body: "",
          user: {
            login: "user"
          }
        }
      });

      await run();

      expect(mockCreateComment).toBeCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 1,
        body:
          "Hey there @user!\n\nIt looks like your pull request title doesn't contain a Jira reference.\n\nThis might be intentional, but if there's a Jira issue that can be associated to this pull request, please add a reference like \"[PRJ-123]\" at the start your title!\n\nIt looks like your pull request is missing a description. Please add a description to help reviewers understand your changes!"
      });
    });
  });

  describe("valid pull request", () => {
    it("does not make a comment", async () => {
      mockGetPulls.mockResolvedValueOnce({
        data: {
          title: "[PRJ-123] Make Changes",
          body: "Made some changes 🙃",
          user: {
            login: "user"
          }
        }
      });

      await run();

      expect(mockCreateComment).not.toBeCalled();
    });
  });
});
