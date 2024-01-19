import * as monaco from 'monaco-editor';
import * as Popper from '@popperjs/core'
window.Popper = Popper

import 'bootstrap'
import { setupEditor2, FunctionInfo as F } from "./002_editor.ts";

export type FunctionInfo = F;

export type Savefunc = (functionInfos: Array<FunctionInfo>) => void;

export function setupEditor1(functionInfos: Array<FunctionInfo>, onSave: Savefunc) {
    const testFuncInfo = {
        functionId: "test",     // 関数のID
        functionNameJP: "テストコード",   // 関数名
        functionNameEN: "test",   // 関数名
        beforeCode: "",     // 関数の直前のコード
        innerCode: window.testFunctionCode,      // 関数の中身のコード
        afterCode: "",      // 関数の直後のコード
        parametersName: [],  // 引数の名前
        parametersDataType: [],    // 引数の型
        returnValue: "void",       // 戻り値
    };
    const editor = setupEditor2(structuredClone([testFuncInfo, ...functionInfos]), onSave);
    //
    for (const functionInfo of functionInfos) {
        setupSideMenu(functionInfo, editor);
    }
}


function setupSideMenu(functionInfo: FunctionInfo, editor: monaco.editor.IStandaloneCodeEditor) {
    const sidebarElement = document.getElementById("side_button_group");
    //
    const divElement = document.createElement("div");
    divElement.classList.add("btn-group");
    divElement.role = "group";
    sidebarElement?.appendChild(divElement);
    //
    const buttonElement3 = document.createElement("button");
    buttonElement3.innerText = functionInfo.functionNameJP;
    buttonElement3.classList.add("btn");
    buttonElement3.classList.add("btn-outline-primary");
    buttonElement3.classList.add("dropdown-toggle");
    buttonElement3.setAttribute("data-bs-toggle", "dropdown");
    buttonElement3.setAttribute("aria-expanded", "false");
    divElement?.appendChild(buttonElement3);
    //
    const ulElement = document.createElement("ul");
    ulElement.classList.add("dropdown-menu");
    divElement?.appendChild(ulElement);
    //
    const liElement1 = document.createElement("li");
    ulElement.appendChild(liElement1);
    //
    const buttonElement1 = document.createElement("button");
    buttonElement1?.addEventListener("click", () => handleClick(functionInfo, editor));
    buttonElement1.classList.add("dropdown-item");
    buttonElement1.innerText = "コード";
    liElement1?.appendChild(buttonElement1);
    //
    const liElement2 = document.createElement("li");
    ulElement.appendChild(liElement2);
    //
    const buttonElement2 = document.createElement("a");
    buttonElement2.innerText = "定義";
    buttonElement2.classList.add("dropdown-item");
    buttonElement2.href = `./?layer=${window.layerInfo?.layerId}&func=${functionInfo.functionId}`;
    liElement2?.appendChild(buttonElement2);
    //
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
        // 特定の位置にスクロール
        editor.revealLineNearTop(lineNumber, monaco.editor.ScrollType.Smooth);
        return;
    }

}
