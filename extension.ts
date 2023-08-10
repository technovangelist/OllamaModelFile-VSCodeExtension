import * as vscode from "vscode";
import axios from "axios";
import * as path from "path";

async function getRepositoryList(): Promise<string[]> {
  const response = await axios.get("https://registry.ollama.ai/v2/_catalog");
  const repositories = response.data.repositories;
  return repositories;
}

async function getTagsForRepository(repository: string): Promise<string[]> {
  const response = await axios.get(
    `https://registry.ollama.ai/v2/${repository}/tags/list`
  );
  const tags = response.data.tags;
  return tags;
}

async function getPulledModels(): Promise<vscode.CompletionItem[]> {
  let allModels: vscode.CompletionItem[] = [];
  const response = await axios.get("http://localhost:11434/api/tags");
  const models = response.data.models;
  for (const model of models) {
    const item = new vscode.CompletionItem(`${model.name} - pulled`);
    item.kind = vscode.CompletionItemKind.Text;
    item.insertText = model.name;
    allModels.push(item);
  }

  return allModels;
}

async function getModels(): Promise<string[]> {
  const repos = await getRepositoryList();
  let allModels: string[] = [];
  for (const repo of repos) {
    const tags = await getTagsForRepository(repo);
    for (const tag of tags) {
      allModels.push(`${repo.substring(8)}:${tag}`);
    }
  }
  return allModels;
}

function getFilterText(input: string): string | undefined {
  let filtertext;
  if (input.includes("beluga")) {
    filtertext = `${input} beluga`;
  }

  return filtertext;
}

export async function activate(context: vscode.ExtensionContext) {
  const allModels = await getModels();
  const pulledModels = await getPulledModels();

  const createModel = vscode.commands.registerCommand(
    "ollamamodelfile.createModel",
    async () => {
      const filePath =
        vscode.window.activeTextEditor?.document.uri.fsPath || "";
      const parentFolder = path.basename(path.dirname(filePath));
      const modelName = await vscode.window.showInputBox({
        placeHolder: "Name for the Model",
        prompt: "Enter the name of the Model to create",
        value: parentFolder,
      });

      vscode.window.terminals[0].sendText(
        `ollama create ${modelName} -f ${filePath}`
      );
      // const model = await axios.post("http://localhost:11434/api/create", {
      //   name: modelName,
      //   path: vscode.window.activeTextEditor?.document.uri.fsPath,
      // });
    }
  );

  const runModel = vscode.commands.registerCommand(
    "ollamamodelfile.runModel",
    async () => {
      const filePath =
        vscode.window.activeTextEditor?.document.uri.fsPath || "";
      const parentFolder = path.basename(path.dirname(filePath));
      const modelName = await vscode.window.showInputBox({
        placeHolder: "Name for the Model",
        prompt: "Enter the name of the Model to create",
        value: parentFolder,
      });
      vscode.window.terminals[0].sendText(`ollama run ${modelName}`, true);
    }
  );

  const runModelVerbose = vscode.commands.registerCommand(
    "ollamamodelfile.runModelVerbose",
    async () => {
      const filePath =
        vscode.window.activeTextEditor?.document.uri.fsPath || "";
      const parentFolder = path.basename(path.dirname(filePath));
      const modelName = await vscode.window.showInputBox({
        placeHolder: "Name for the Model",
        prompt: "Enter the name of the Model to create",
        value: parentFolder,
      });
      vscode.window.terminals[0].sendText(
        `ollama run ${modelName} --verbose`,
        true
      );
    }
  );

  const provider = vscode.languages.registerCompletionItemProvider(
    "modelfile",
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
      ) {
        // let modelArray = [new vscode.CompletionItem('model')];
        let modelArray: vscode.CompletionItem[] = [];
        allModels.forEach((m) => {
          const item = new vscode.CompletionItem(m);
          item.kind = vscode.CompletionItemKind.Text;
          item.filterText = getFilterText(m);
          modelArray.push(item);
        });
        modelArray = modelArray.concat(pulledModels);
        // const simpleCompletion = new vscode.CompletionItem(`FROM ${allModels}`);
        // const snippetCompletion = new vscode.CompletionItem('Good part of the day');

        // snippetCompletion.insertText = new vscode.SnippetString('Good ${1|morning,afternoon,evening|}. It is ${1}, right?');
        // const docs: any = new vscode.MarkdownString("Inserts a snippet that lets you select [link](x.ts).");
        // snippetCompletion.documentation = docs;
        // docs.baseUri = vscode.Uri.parse('http://example.com/a/b/c/');

        return modelArray;
      },
    }
  );

  context.subscriptions.push(provider, createModel, runModel);
}
