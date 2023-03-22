# azure-git-brancher README

Creates a git branch in the format below when provided with a work item number:

`{workItemNumber}-{workItemTitle}`

The branch name goes through a few transformations to make it more git friendly:

- Trim additional spaces
- Replace spaces with dashes
- Lowercase the branch name

## Requirements

1. `az` CLI - Installation Instructions: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
2. Setup the `AZURE_DEVOPS_EXT_PAT` environment variable: https://learn.microsoft.com/en-us/azure/devops/cli/log-in-via-pat?view=azure-devops&tabs=windows#use-the-azure_devops_ext_pat-environment-variable

## Release Notes

1.0.0 - Initial release
