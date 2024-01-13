import * as monaco from 'monaco-editor';
import { setupEditor2, FunctionInfo as F } from "./002_editor.ts";

export type FunctionInfo = F;

export type Savefunc = (functionInfos: Array<FunctionInfo>, isReload: boolean) => void;

export function setupEditor1(functionInfos: Array<FunctionInfo>, onSave: Savefunc) {
    const editor = setupEditor2(functionInfos, (functionInfos) => onSave(functionInfos, false));
    //
    for (const functionInfo of functionInfos) {
        setupSideMenu(functionInfo, editor);
    }
}


function setupSideMenu(functionInfo: FunctionInfo, editor: monaco.editor.IStandaloneCodeEditor) {
    const sidebarElement = document.querySelector(".sidebar");
    //
    const labelElement = document.createElement("h4");
    labelElement.innerText = functionInfo.functionName;
    sidebarElement?.appendChild(labelElement);
    //
    const buttonElement1 = document.createElement("button");
    buttonElement1.innerText = "コード";
    sidebarElement?.appendChild(buttonElement1);
    buttonElement1?.addEventListener("click", () => handleClick(functionInfo, editor));
    //
    if (functionInfo.functionId == window.functionId) {
        //
        const buttonElement2 = document.createElement("a");
        buttonElement2.innerText = "定義";
        buttonElement2.href = `./?layer=${window.layerInfo?.layerId}&func=${functionInfo.functionId}`;
        sidebarElement?.appendChild(buttonElement2);
        //
    }
}




function handleClick(functionInfo: FunctionInfo, editor: monaco.editor.IStandaloneCodeEditor) {
    const model = editor.getModel();
    if (!model) return;

    const allRange = new monaco.Range(1, 1, Infinity, Infinity);

    // レンジ内のデコレーションを取得
    const decorations = model.getDecorationsInRange(allRange);

    for (const decoration of decorations) {
        if (decoration.options.className !== "START_" + functionInfo.functionId) {
            continue;
        }
        const lineNumber = decoration.range.startLineNumber;
        console.log(lineNumber);
        // 特定の位置にスクロール
        editor.revealLineNearTop(lineNumber, monaco.editor.ScrollType.Smooth);
        return;
    }

}
