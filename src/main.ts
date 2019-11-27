import * as core from "@actions/core";
import * as github from "@actions/github";

export async function run() {
  try {
    const token = core.getInput("repo-token");

    if (!token) {
      core.setFailed("No GitHub token found");
      return;
    }

    const octokit = new github.GitHub(token);

    if (!github.context.payload.pull_request) {
      core.setFailed("Not a pull request event. Exiting.");
      return;
    }

    const repo = github.context.repo;
    const prNumber = github.context.payload.pull_request.number;

    const pr = await octokit.pulls.get({
      owner: repo.owner,
      repo: repo.repo,
      pull_number: prNumber
    });

    const greeting = `Hey there @${pr.data.user.login}!`;
    let commentBody = `${greeting}`;

    const missingReferenceComment = `\n\nIt looks like your pull request title doesn't contain a Jira reference.\n\nThis might be intentional, but if there's a Jira issue that can be associated to this pull request, please add a reference like "[PRJ-123]" at the start your title!`;
    const missingDescriptionComment = `\n\nIt looks like your pull request is missing a description. Please add a description to help reviewers understand your changes!`;

    if (!pr.data.title.match(/^\[[A-Z]+-[0-9]+\]/)) {
      commentBody += missingReferenceComment;
    }

    if (!pr.data.body || pr.data.body === "") {
      commentBody += missingDescriptionComment;
    }

    if (commentBody !== greeting) {
      octokit.issues.createComment({
        owner: repo.owner,
        repo: repo.repo,
        issue_number: prNumber,
        body: commentBody
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
