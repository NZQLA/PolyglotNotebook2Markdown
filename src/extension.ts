// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { listenerCount } from 'process';
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Hello , polyglot-nb-to-markdown is Ready!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('polyglot-nb-to-markdown.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello , polyglot-nb-to-markdown is Ready!');
	});

	const disposableToMd = vscode.commands.registerCommand('polyglot-nb-to-markdown.ConvertToMarkdown', () => {

		// Get the active text editor
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		// print the file name on the console 
		console.log(editor.document.fileName);
		let fileName = editor.document.fileName;

		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage(`Copy that, converting ${fileName} ...`);
	});



	context.subscriptions.push(disposable);
	context.subscriptions.push(disposableToMd);
}





// This method is called when your extension is deactivated
export function deactivate() { }
