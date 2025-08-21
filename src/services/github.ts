import { Octokit } from '@octokit/rest';
import { GitHubIssue } from '../types';
import { githubToken } from '../config';

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(owner: string, repo: string) {
    this.octokit = new Octokit({
      auth: githubToken
    });
    this.owner = owner;
    this.repo = repo;
  }

  async createIssue(issue: GitHubIssue): Promise<number> {
    try {
      const response = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: issue.title,
        body: issue.body || '',
        labels: issue.labels || [],
        assignees: issue.assignees || []
      });

      console.log(`Created issue #${response.data.number}: ${issue.title}`);
      return response.data.number;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  async updateIssue(issueNumber: number, issue: Partial<GitHubIssue>): Promise<void> {
    try {
      await this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        labels: issue.labels,
        assignees: issue.assignees
      });

      console.log(`Updated issue #${issueNumber}`);
    } catch (error) {
      console.error(`Error updating issue #${issueNumber}:`, error);
      throw error;
    }
  }

  async getIssue(issueNumber: number): Promise<GitHubIssue | null> {
    try {
      const response = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber
      });

      return {
        number: response.data.number,
        title: response.data.title,
        body: response.data.body || '',
        state: response.data.state as 'open' | 'closed',
        labels: response.data.labels.map((label: any) => 
          typeof label === 'string' ? label : label.name
        ),
        assignees: response.data.assignees?.map((assignee: any) => assignee.login) || []
      };
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error(`Error getting issue #${issueNumber}:`, error);
      throw error;
    }
  }

  async listAllIssues(): Promise<GitHubIssue[]> {
    try {
      const issues: GitHubIssue[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.octokit.issues.listForRepo({
          owner: this.owner,
          repo: this.repo,
          state: 'all',
          per_page: 100,
          page
        });

        if (response.data.length === 0) {
          hasMore = false;
        } else {
          response.data.forEach(issue => {
            if (!issue.pull_request) {
              issues.push({
                number: issue.number,
                title: issue.title,
                body: issue.body || '',
                state: issue.state as 'open' | 'closed',
                labels: issue.labels.map((label: any) => 
                  typeof label === 'string' ? label : label.name
                ),
                assignees: issue.assignees?.map((assignee: any) => assignee.login) || []
              });
            }
          });
          page++;
        }
      }

      return issues;
    } catch (error) {
      console.error('Error listing issues:', error);
      throw error;
    }
  }

  async findIssueByTitle(title: string): Promise<number | null> {
    try {
      const response = await this.octokit.search.issuesAndPullRequests({
        q: `repo:${this.owner}/${this.repo} is:issue "${title}" in:title`,
        per_page: 1
      });

      if (response.data.items.length > 0) {
        return response.data.items[0].number;
      }

      return null;
    } catch (error) {
      console.error('Error searching for issue:', error);
      return null;
    }
  }
}