import { exec } from "child_process";
import * as vscode from "vscode";

type WorkItemResponse = {
  id: number;
  fields: {
    "System.Title": string;
  };
};

// Get Project Name from the last part of the URL
// Input: https://callistoenterprises@dev.azure.com/callistoenterprises/turbo-test/_git/turbo-test
// Output: turbo-test
function getProjectNameFromUrl(url: string): string {
  const parts = url.split("/");
  const index = parts.indexOf("_git");
  if (index !== -1 && index > 0) {
    return parts[index - 1];
  }
  throw new Error("Invalid URL format. Unable to extract project name.");
}

// git config --get remote.origin.url
function getGitRemoteUrl(cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec("git config --get remote.origin.url", { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if (stderr) {
        reject(new Error(stderr));
      } else {
        const url = stdout.trim();
        if (!url) {
          reject(new Error("No remote URL found. Please ensure you are in a Git repository."));
        } else {
          resolve(url);
        }
      }
    });
  });
}

async function createWorkItem(organization: string, pat: string, projectName: string, workItemTitle: string) {
  const request = {
    op: "add",
    path: "/fields/System.Title",
    from: null,
    value: workItemTitle,
  };

  const response = await fetch(`https://dev.azure.com/${organization}/${projectName}/_apis/wit/workitems/$Task?api-version=7.1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json-patch+json",
      Authorization: `Basic ${Buffer.from(":" + pat).toString("base64")}`,
    },
    body: JSON.stringify([request]),
  });

  if (!response.ok) {
    throw new Error(`Failed to create work item: ${response.statusText}`);
  }
  const data = (await response.json()) as WorkItemResponse;
  console.log(`Created work item with ID: ${data.id}`);
  return data.id;
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

    const gitRemoteUrl = await getGitRemoteUrl(cwd);
    if (!gitRemoteUrl) {
      vscode.window.showErrorMessage("No remote URL found. Please ensure you are in a Git repository.");
      return;
    }

    // Extract the project name from the remote URL
    const projectName = getProjectNameFromUrl(gitRemoteUrl);
    if (!projectName) {
      vscode.window.showErrorMessage("Unable to extract project name from the remote URL.");
      return;
    }
    console.log(`Project Name: ${projectName}`);

    // Prompt the user for the work item number
    const workItemName = await vscode.window.showInputBox({
      prompt: "Enter Name for the new work item",
    });

    if (!workItemName) {
      vscode.window.showErrorMessage("Work item name cannot be empty.");
      return;
    }

    try {
      const workItemNumber = await createWorkItem(organization, pat, projectName, workItemName);
      const branchName = `${workItemNumber}-${getGitBranchName(workItemName)}`;

      await checkoutGitBranch(cwd, branchName);

      vscode.window.showInformationMessage(`Created branch: ${branchName}`);
    } catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(error.message);
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
