const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.alignTailComments', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;

        // 从 VS Code 设置中获取 maxColumn 值
        const config = vscode.workspace.getConfiguration('editor', document.uri);
        const maxColumn = config.get('rulers', [100])[0] || 100;									// 默认值为100

        // 根据文件类型设置注释符号
        const languageId = document.languageId;
        let commentSymbol = '//';																	// 默认

        switch (languageId) {
            case 'javascript':
            case 'javascriptreact':
            case 'typescript':
            case 'typescriptreact':
            case 'java':
            case 'c':
            case 'cpp':
            case 'rust':
            case 'csharp':
            case 'go':
                commentSymbol = '//';
			break;
			case 'python':
			case 'ruby':
			case 'shellscript':
			case 'shell':
			case 'conf':
                commentSymbol = '#';
			break;
            case 'html':
            case 'xml':
                commentSymbol = '<!--';
            break;
            case 'lua':
                commentSymbol = '--';
            break;
			case 'css':
			case 'sass':
				commentSymbol = '/*';
			break;
            // 可以根据需要添加更多语言
            default:
                vscode.window.showInformationMessage(`Unsupported language: ${languageId}`);
			return;
        }

        editor.edit(editBuilder => {
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const text = line.text;

                // 检查字符串并忽略其中的注释符号
                let inString = false;
                let stringChar = '';
                let commentIndex = -1;

                for (let j = 0; j < text.length; j++) {
                    const char = text[j];

                    if (inString) {
                        if (char === stringChar && text[j - 1] !== '\\') {
                            inString = false;
                        }
                    } else {
                        if (char === '"' || char === '\'') {
                            inString = true;
                            stringChar = char;
                        } else if (text.substr(j).startsWith(commentSymbol)) {
                            commentIndex = j;
                            break;
                        }
                    }
                }

                if (commentIndex > 0) {
                    const codePart = text.substring(0, commentIndex).trimEnd();
                    
                    if (codePart.length > 0) {
                        const commentPart = text.substring(commentIndex);
                        const spacesNeeded = maxColumn - codePart.length;

                        if (spacesNeeded > 0) {
                            const newText = codePart + ' '.repeat(spacesNeeded) + commentPart;
                            editBuilder.replace(line.range, newText);
                        }
                    }
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
