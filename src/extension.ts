import { exec } from "child_process";
import * as vscode from "vscode";

type WorkItemResponse = {
  fields: {
    "System.Title": string;
  };
};

async function getWorkItemTitle(organization: string, pat: string, id: number) {
  const response = await fetch(`https://dev.azure.com/${organization}/_apis/wit/workitems/${id}?api-version=7.0&fields=System.Title`, {
    headers: {
      Authorization: `Basic ${Buffer.from(":" + pat).toString("base64")}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch work item: ${response.statusText}`);
  }

  const data = (await response.json()) as WorkItemResponse;
  return data.fields["System.Title"];
}

function checkoutGitBranch(cwd: string, branchName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `git checkout -b ${branchName}`,
      {
        cwd,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else if (stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

// trim spaces, replace spaces with dashes, and make lowercase
function getGitBranchName(workItemTitle: string) {
  return workItemTitle.trim().replace(/\s+/g, "-").toLowerCase();
}

export function activate(context: vscode.ExtensionContext) {
  // Current working directory
  const cwd = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (cwd === undefined) {
    vscode.window.showErrorMessage("No workspace folder is open.");
    return;
  }

  const disposable = vscode.commands.registerCommand("turbo-task-3000.createWorkItemWithBranch", async () => {
    // Check if the user has configured the organization and PAT
    const organization = vscode.workspace.getConfiguration("turbo-task-3000").get<string>("organization");
    if (!organization) {
      vscode.window.showErrorMessage("Please configure the organization in settings.");
      return;
    }
    const pat = vscode.workspace.getConfiguration("turbo-task-3000").get<string>("pat");
    if (!pat) {
      vscode.window.showErrorMessage("Please configure the Personal Access Token (PAT) in settings.");
      return;
    }

    // Prompt the user for the work item number
    const workItemNumber = await vscode.window.showInputBox({
      prompt: "Enter the work item number:",
      validateInput: (value) => {
        // Check if the input is a positive integer
        const parsed = parseInt(value);
        if (isNaN(parsed) || parsed <= 0) {
          return "Please enter a positive integer.";
        }
        return null;
      },
    });

    if (workItemNumber !== undefined) {
      try {
        const workItemTitle = await getWorkItemTitle(organization, pat, +workItemNumber);
        console.log(workItemTitle);
        const branchName = `${workItemNumber}-${getGitBranchName(workItemTitle)}`;

        await checkoutGitBranch(cwd, branchName);

        vscode.window.showInformationMessage(`Created branch: ${branchName}`);
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(error.message);
        }
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
