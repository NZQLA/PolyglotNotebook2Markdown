// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path from 'path';
import * as vscode from 'vscode';
import * as fs from 'fs';


const mdLanguageName = 'markdown';
const nbLanguageName = 'notebook';
const nbFileExtension = '.ipynb';
const mdFileExtension = '.md';
const mdCodeBlockFlag = '```';
const newLineFlag = '\n';
const polyglotCodeLanguage = 'polyglot-notebook';
const originCodeLanguage = '';
const cell_typeCode = 'code';
const cell_typeMarkdown = 'markdown';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Hello , polyglot-2-markdown is Ready!');

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// const disposable = vscode.commands.registerCommand('polyglot-2-markdown.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello , polyglot-2-markdown is Ready!');
	// });

	// // const disposableToMd = vscode.commands.registerCommand('polyglot-2-markdown.ConvertToMarkdown', convertToMarkdown);
	// const disposableConvertCurrentToMd = vscode.commands.registerCommand('polyglot-2-markdown.ConvertToMarkdown', convertAllNoteBooksOpenedToMarkdown);
	const disposableConvertAllOpenedToMd = vscode.commands.registerCommand('polyglot-2-markdown.ConvertAllNoteBooksOpenedToMarkdown', convertAllNoteBooksOpenedToMarkdown);
	const disposableConvertMdOpenedCurrentToNoteBook = vscode.commands.registerCommand('polyglot-2-markdown.ConvertCurrentMarkDownToNoteBook', ConvertMdOpenedCurrentToNoteBook);
	// const disposableConvertOpenedCurrentToMd = vscode.commands.registerCommand('polyglot-2-markdown.ConvertNoteBookCurrentOpenedToMarkdown', convertAllNoteBooksOpenedToMarkdown);


	// context.subscriptions.push(disposable);
	// context.subscriptions.push(disposableConvertCurrentToMd);
	context.subscriptions.push(disposableConvertAllOpenedToMd);
	context.subscriptions.push(disposableConvertMdOpenedCurrentToNoteBook);
	// context.subscriptions.push(disposableConvertOpenedCurrentToMd);
}



async function ConvertMdOpenedCurrentToNoteBook(filePath: any) {
	// try get the current opened markdown file
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		console.log('No active editor');
		return;
	}


	let doc = editor.document;
	let content = doc.getText();
	filePath = doc.uri.fsPath;
	let dirName = path.dirname(doc.uri.fsPath);
	let fileName = path.basename(doc.uri.fsPath);
	let newFileName = fileName.replace(mdFileExtension, nbFileExtension);
	let newFilePath = path.join(dirName, newFileName);

	let nbContent = await ConvertMdContentToNb(content);


	console.log(`Convert ${filePath} to ${newFilePath}`);
	// await fs.writeFileSync(newFilePath, content);
	await fs.writeFileSync(newFilePath, nbContent);
}


// filepath: /D:/Work/Others/VSCode/Plugins/Polyglot2MarkDown/polyglot-2-markdown/src/extension.ts
async function ConvertMdContentToNb(mdContent: string): Promise<string> {
    // 创建notebook对象结构
    const notebook: Notebook = {
        cells: [],
        metadata: {
            kernelspec: {
                display_name: "Polyglot Notebook",
                language: "polyglot-notebook",
                name: "polyglot-notebook"
            },
            language_info: {
                name: "polyglot-notebook",
                version: "1.0"
            },
            polyglot_notebook: {
                kernelInfo: {
                    defaultKernelName: "polyglot-notebook",
                    items: [
                        {
                            aliases: [],
                            name: "polyglot-notebook"
                        }
                    ]
                }
            }
        },
        nbformat: 4,
        nbformat_minor: 5
    };

    // 按行分割Markdown内容
    const lines = mdContent.split('\n');
    
    let inCodeBlock = false;
    let currentLanguage = '';
    let currentCell: NotebookCell | null = null;
    let currentContent: string[] = [];

    // 逐行解析Markdown内容
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 检测代码块开始/结束
        if (line.startsWith(mdCodeBlockFlag)) {
            if (!inCodeBlock) {
                // 如果有累积的Markdown内容，先保存为一个cell
                if (currentContent.length > 0) {
                    notebook.cells.push({
                        cell_type: cell_typeMarkdown,
                        metadata: {},
                        source: currentContent.map(line => line + '\n')
                    });
                    currentContent = [];
                }
                
                // 获取代码块的语言
                currentLanguage = line.substring(mdCodeBlockFlag.length).trim();
                inCodeBlock = true;
                
                // 创建新的代码cell
                currentCell = {
                    cell_type: cell_typeCode,
                    metadata: {
                        dotnet_interactive: {
                            language: currentLanguage
                        },
                        polyglot_notebook: {
                            kernelName: currentLanguage
                        }
                    },
                    source: [],
                    execution_count: null,
                    outputs: []
                };
            } else {
                // 代码块结束
                inCodeBlock = false;
                if (currentCell) {
                    notebook.cells.push(currentCell);
                    currentCell = null;
                }
            }
        } else {
            // 处理普通内容行
            if (inCodeBlock) {
                // 如果在代码块内，添加到当前代码cell
                if (currentCell) {
                    currentCell.source.push(line + '\n');
                }
            } else {
                // 普通Markdown内容
                currentContent.push(line);
            }
        }
    }

    // 处理最后一个cell
    if (currentCell) {
        notebook.cells.push(currentCell);
    } else if (currentContent.length > 0) {
        notebook.cells.push({
            cell_type: cell_typeMarkdown,
            metadata: {},
            source: currentContent.map(line => line + '\n')
        });
    }

    // 将notebook对象转换为JSON字符串
    return JSON.stringify(notebook, null, 2);
}



// save the .ipynb files opened   as  markdown to new  files 
async function convertAllNoteBooksOpenedToMarkdown(filePath: any) {
	let nbs = vscode.workspace.notebookDocuments;
	console.log(`nbs: ${nbs}`);
	if (nbs.length === 0) {
		console.log('No notebook opened');
		return;
	}


	for (let i = 0; i < nbs.length; i++) {
		let nb = nbs[i];
		let nbFilePath = nb.uri.fsPath;
		console.log(`Converting ${nbFilePath}`);

		await ConvertNbFileToMdFileByJson(nbFilePath);
	}
}

// convert one notebook to markdown file at path
async function ConvertNbFileToMdFileByJson(filePath: string) {
	let mdContent = await ConvertNbFileToMarkdownByJson(filePath);
	let dirName = path.dirname(filePath);
	let fileName = path.basename(filePath);
	let newFileName = fileName.replace(nbFileExtension, mdFileExtension);
	let newFilePath = path.join(dirName, newFileName);
	await fs.writeFileSync(newFilePath, mdContent);
}


async function convertToMarkdown(filePath: any) {

	console.log(`pathFile: ${filePath} will be convert to markdown and save in new files!`);

	let dirName = path.dirname(filePath);
	let fileName = path.basename(filePath);

	// if the file is null or not a .ipynb file, return
	if (!fileName || !fileName.endsWith('.ipynb')) {
		console.log('Not a valid file');
		return;
	}

	let url = vscode.Uri.file(filePath);
	// convet the .ipynb file  to polyglot notebook data object
	// traceInfo(`Opened notebook ${url.fsPath}`);
	let docNb = await vscode.workspace.openNotebookDocument(url);

	let cellCount = docNb.cellCount;

	vscode.window.showInformationMessage(`Copy that, converting  CellCount:${cellCount} [${filePath}] ...`);

}


// convert one notebook to markdown content
async function ConvertNbToMarkdownByPolyglot(notebook: vscode.NotebookDocument): Promise<string> {
	let cells = notebook.getCells();
	let contentMd = '';
	for (let i = 0; i < cells.length; i++) {
		let cell = cells[i];
		let cellData = cell.document.getText();
		let language = cell.document.languageId;
		if (language === polyglotCodeLanguage) {
			try {
				language = cell.metadata.polyglot.language;
			} catch (error) {

			}

			if (language === polyglotCodeLanguage) {
				language = originCodeLanguage;
			}
		}

		let isCode = language !== mdLanguageName;
		if (isCode) {
			contentMd += mdCodeBlockFlag + language + newLineFlag;
		}

		contentMd += cellData;
		contentMd += `${newLineFlag}`;

		if (isCode) {
			contentMd += `${mdCodeBlockFlag}${newLineFlag}`;
		}

	}
	return contentMd;
}

async function ConvertNbFileToMarkdownByJson(filePath: string): Promise<string> {
	let nbContent = await fs.readFileSync(filePath, 'utf8');

	// convert to json object
	let nb = JSON.parse(nbContent);
	let cells = nb.cells;
	let contentMd = '';
	let language = originCodeLanguage;
	let isCode = false;
	for (let i = 0; i < cells.length; i++) {
		let cell = cells[i];
		let cellData = cell.source;
		// if it is code  cell
		isCode = cell.cell_type === cell_typeCode;
		if (isCode) {
			try {
				// if there is a vscode cell metadata, get the language
				if (cell.metadata?.vscode) {
					language = cell.metadata.vscode.languageId;
				}
				else {
					language = cell.metadata.polyglot_notebook.kernelName;
				}
			} catch (error) {
				console.log('error:', error);
			}

			if (language === polyglotCodeLanguage) {
				language = originCodeLanguage;
			}

			if (language === originCodeLanguage) {

				try {
					language = nb.metadata.kernelspec.language;
				}
				catch (error) {
				}
			}

			contentMd += mdCodeBlockFlag + language + newLineFlag;
		}

		contentMd += cellData.join('');
		contentMd += newLineFlag;

		if (isCode) {
			contentMd += mdCodeBlockFlag + newLineFlag;
		}
	}

	return contentMd;
}



// convert one notebook to markdown content by json
async function ConvertNbObjToMdContentByJson(notebook: vscode.NotebookDocument): Promise<string> {
	// get the nb filepath and read the content
	let filePath = notebook.uri.fsPath;

	let result = await ConvertNbFileToMarkdownByJson(filePath);

	return result;

}

// 读取文件为字符串，指定编码为 utf8
function ReadFileAsString(filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, 'utf8', (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}

// This method is called when your extension is deactivated
export function deactivate() { }



interface NotebookCell {
	cell_type: string;
	metadata: any;
	source: string[];
	execution_count?: number | null;
	outputs?: any[];
}

interface NotebookMetadata {
	kernelspec: {
		display_name: string;
		language: string;
		name: string;
	};
	language_info: {
		name: string;
		version: string;
	};
	polyglot_notebook: {
		kernelInfo: {
			defaultKernelName: string;
			items: {
				aliases: string[];
				name: string;
			}[];
		};
	};
}

interface Notebook {
	cells: NotebookCell[];
	metadata: NotebookMetadata;
	nbformat: number;
	nbformat_minor: number;
}



// "menus": {
//   "explorer/context": [
//     {
//       "when": "resourceExtname == .ipynb",
//       "command": "polyglot-2-markdown.ConvertToMarkdown"
//     }
//   ]
// }