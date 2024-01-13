import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// テキストエディタ「monaco」
//  https://microsoft.github.io/monaco-editor/

export type Savefunc = () => void;

let timerId: NodeJS.Timeout;

export function setupEditor4(initText: string, language: string, onSave: Savefunc): monaco.editor.IStandaloneCodeEditor {
    //===============================================================
    // エディター初期化
    const editorElement = document.querySelector<HTMLDivElement>('#editor')!;
    // Hover on each property to see its docs!
    const editor = monaco.editor.create(editorElement, {
        value: initText, // 初期値（文字列）
        language: language,
        automaticLayout: true,
        fontSize: 15,
        fontFamily: "monospace",
        theme: "vs-dark",
    });
    //
    //===============================================================
    // 自動保存
    const model = editor.getModel();
    model?.onDidChangeContent((event) => {
        if (timerId) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            onSave();
        }, 2000);
    });
    //
    //===============================================================
    // 保存ボタン
    editor.addAction({
        id: "custom-fn-save",
        label: "Save",
        keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            // monaco.KeyMod.chord(
            //     monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            // ),
        ],
        precondition: undefined,
        keybindingContext: undefined,
        contextMenuGroupId: "file",
        contextMenuOrder: 1.5,
        run: onSave,
    });
    //===============================================================
    return editor;
}

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker()
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker()
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker()
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker()
        }
        return new editorWorker()
    }
}
