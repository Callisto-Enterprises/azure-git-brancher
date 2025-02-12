// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec } from "child_process";
import * as vscode from "vscode";
import axios from "axios";

async function getWorkItemTitle(id: number) {
  const organization = vscode.workspace.getConfiguration("azure-git-brancher").get("organization");
  const pat = vscode.workspace.getConfiguration("azure-git-brancher").get("pat");

  console.log(organization);
  console.log(pat);

  const response = await axios.get(`https://dev.azure.com/${organization}/_apis/wit/workitems/${id}?api-version=7.0&fields=System.Title`, {
    headers: {
      Authorization: `Basic ${Buffer.from(":" + pat).toString("base64")}`,
    },
  });

  const x: { fields: { "System.Title": string } } = response.data;
  return x.fields["System.Title"];
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

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "azure-git-brancher" is now active!');

  // Current working directory
  const cwd = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  if (cwd === undefined) {
    vscode.window.showErrorMessage("No workspace folder is open.");
    return;
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("azure-git-brancher.createBranchFromWorkItem", async () => {
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
        const workItemTitle = await getWorkItemTitle(+workItemNumber);
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

  let disposable2 = vscode.commands.registerCommand("azure-git-brancher.createBranchFromWorkItem", async () => {
    // Prompt the user for the work item number
    const workItemName = await vscode.window.showInputBox({
      prompt: "Enter the work item name:",
      validateInput: (value) => {
        // Check if the input is a positive integer
        if (value === "") {
          return "Please enter a work item name.";
        }
        return null;
      },
    });

    if (workItemName !== undefined) {
      try {
        // const workItemTitle = await getWorkItemTitle(+workItemNumber);
        // console.log(workItemTitle);
        // const branchName = `${workItemNumber}-${getGitBranchName(workItemTitle)}`;

        // await checkoutGitBranch(cwd, branchName);

        vscode.window.showInformationMessage(`Created branch: ${workItemName}`);
      } catch (error) {
        if (error instanceof Error) {
          vscode.window.showErrorMessage(error.message);
        }
      }
    }
  });

  context.subscriptions.push(disposable2);
}

// This method is called when your extension is deactivated
export function deactivate() {}
