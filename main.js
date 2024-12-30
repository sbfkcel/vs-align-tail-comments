const vscode = require('vscode');

function getLanguageForLine(lineText, documentLanguageId, isInScriptTag, isInStyleTag) {
    if(isInScriptTag){
        return 'javascript';
    };
    if(isInStyleTag){
        return 'css';
    };
    return documentLanguageId;
};
function getcommentSymbols(languageId){
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
        case 'sass':
        case 'scss':
            return ['//', '/*'];
        break;
        case 'python':
        case 'ruby':
        case 'shellscript':
        case 'shell':
        case 'conf':
            return ['#'];
        break;
        case 'vue':
        case 'html':
        case 'xml':
            return ['<!--'];
        break;
        case 'lua':
            return ['--'];
        break;
        case 'css':
            return ['/*'];
        break;
        default:
            vscode.window.showInformationMessage(`Unsupported language: ${languageId}`);
        break;
    };
    return ['//','/*'];
};

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.alignTailComments', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        const document = editor.document;
        
        // 从 VS Code 设置中获取 maxColumn 值
        const config = vscode.workspace.getConfiguration('editor', document.uri);
        const cfg = vscode.workspace.getConfiguration('alignTailComments');
        const defaultRuler = cfg.get('defaultRuler', 100);
        const maxColumn = config.get('rulers', [100])[0] || defaultRuler;				            // 默认值为100
        
        let isInScriptTag = false;
        let isInStyleTag = false;
        editor.edit(editBuilder => {
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                const text = line.text;

                // 检测<script>和<style>标签
                if (text.match(/<script\b[^>]*>/i)) {
                    isInScriptTag = true;
                }
                if (text.match(/<style\b[^>]*>/i)) {
                    isInStyleTag = true;
                }
                if (text.match(/<\/script>/i)) {
                    isInScriptTag = false;
                }
                if (text.match(/<\/style>/i)) {
                    isInStyleTag = false;
                }

                const languageId = getLanguageForLine(text,document.languageId,isInScriptTag,isInStyleTag);
                const commentSymbols = getcommentSymbols(languageId);

                // 检查字符串并忽略其中的注释符号
                let stringChar = '';
                let commentIndex = -1;

                for (const symbol of commentSymbols) {
                    const index = text.indexOf(symbol);
                    if (index !== -1 && (commentIndex === -1 || index < commentIndex)) {
                        commentIndex = index;
                        stringChar = symbol;
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
