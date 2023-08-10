"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    const provider = vscode.languages.registerCompletionItemProvider('modelfile', {
        provideCompletionItems(document, position, token, context) {
            const simpleCompletion = new vscode.CompletionItem('This is matt');
            const snippetCompletion = new vscode.CompletionItem('Good part of the day');
            snippetCompletion.insertText = new vscode.SnippetString('Good ${1|morning,afternoon,evening|}. It is ${1}, right?');
            const docs = new vscode.MarkdownString("Inserts a snippet that lets you select [link](x.ts).");
            snippetCompletion.documentation = docs;
            docs.baseUri = vscode.Uri.parse('http://example.com/a/b/c/');
            return [simpleCompletion, snippetCompletion];
        }
    });
    context.subscriptions.push(provider);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map