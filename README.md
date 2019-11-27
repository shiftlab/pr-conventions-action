# Shift Lab PR Conventions Actions

This is a GitHub action that (lightly) enforces pull request conventions via automated comments. The action will ensure that a Jira reference and a description exist for all pull requests.

## Usage

Create a `.github/workflows/pr-conventions.yml` file to set up this action. Populate it with the following:

```yml
name: "Enforce PR Conventions"
on: pull_request
jobs:
  enforce-conventions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - run: yarn
      - uses: shiftlab/pr-conventions@v1.0.0
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```
