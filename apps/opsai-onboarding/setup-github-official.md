# Using Official GitHub Connector in Airbyte

Instead of the custom connector, you can use Airbyte's official GitHub connector which has more features:

## Option 1: Via API (if Airbyte token is valid)

```bash
curl -X POST https://api.airbyte.com/v1/sources \
  -H "Authorization: Bearer YOUR_AIRBYTE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "YOUR_WORKSPACE_ID",
    "name": "GitHub - My Account",
    "sourceDefinitionId": "ef69ef6e-aa7f-4af1-a01d-ef775033524e",
    "connectionConfiguration": {
      "credentials": {
        "option_title": "PAT Credentials",
        "personal_access_token": "ghp_YOUR_GITHUB_TOKEN"
      },
      "start_date": "2021-01-01T00:00:00Z",
      "repository": "username/repo1 username/repo2",
      "page_size_for_large_streams": 100
    }
  }'
```

## Option 2: Via Airbyte UI

1. Go to Airbyte Cloud
2. Click "Sources" → "New Source"
3. Search for "GitHub"
4. Configure:
   - **Authentication**: Personal Access Token
   - **PAT**: Your GitHub token
   - **Start Date**: When to start syncing from
   - **Repositories**: Space-separated list (or leave empty for all)

## Available Streams in Official Connector:

- **assignees** - Users that can be assigned to issues
- **branches** - Repository branches
- **collaborators** - Repository collaborators  
- **comments** - Issue and PR comments
- **commit_comment_reactions** - Reactions on commit comments
- **commit_comments** - Comments on commits
- **commits** - Git commits
- **deployments** - Deployment history
- **events** - Repository events
- **issue_comment_reactions** - Reactions on issue comments
- **issue_events** - Issue activity events
- **issue_labels** - Labels on issues
- **issue_milestones** - Project milestones
- **issue_reactions** - Reactions on issues
- **issues** - GitHub issues
- **organizations** - Organization data
- **projects** - GitHub projects
- **project_cards** - Project board cards
- **project_columns** - Project board columns
- **pull_request_comment_reactions** - PR comment reactions
- **pull_request_commits** - Commits in PRs
- **pull_request_stats** - PR statistics
- **pull_requests** - Pull requests
- **releases** - GitHub releases
- **repositories** - Repository metadata
- **review_comments** - PR review comments
- **reviews** - PR reviews
- **stargazers** - Users who starred repos
- **tags** - Git tags
- **teams** - Organization teams
- **team_members** - Team membership
- **team_memberships** - User's team memberships
- **users** - GitHub users
- **workflows** - GitHub Actions workflows
- **workflow_runs** - Workflow execution history
- **workflow_jobs** - Individual workflow jobs

## Required Scopes for GitHub Token:

```
repo (Full control of private repositories)
read:org (Read org and team membership)
read:user (Read user profile data)
user:email (Access user email addresses)
read:discussion (Read team discussions)
workflow (Update GitHub Action workflows)
```

## Create Token:
https://github.com/settings/tokens/new?scopes=repo,read:org,read:user,user:email,read:discussion,workflow