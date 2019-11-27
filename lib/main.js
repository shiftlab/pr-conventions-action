"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const pr = yield octokit.pulls.get({
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
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
run();
