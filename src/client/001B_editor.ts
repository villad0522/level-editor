
import * as Popper from '@popperjs/core'
window.Popper = Popper

import 'bootstrap'
import { setupEditor2B, FunctionInfo } from "./002B_editor.ts";

export type Savefunc = (functionInfos: Array<FunctionInfo>) => Promise<any>;

export function setupEditor1B(functionInfos: Array<FunctionInfo>, onSave: Savefunc) {
    //===============================================================
    // エディター初期化
    setupEditor2B(functionInfos, onSave);
    //
    //===============================================================
    //
    for (const functionInfo of functionInfos) {
        setupSideMenu(functionInfo);
    }
}


function setupSideMenu(functionInfo: FunctionInfo) {
    const sidebarElement = document.getElementById("side_button_group");
    //
    //
    if (functionInfo.functionId == window.functionId) {
        const divElement = document.createElement("div");
        divElement.classList.add("btn-group");
        divElement.role = "group";
        sidebarElement?.appendChild(divElement);
        //
        const buttonElement3 = document.createElement("button");
        buttonElement3.innerText = functionInfo.functionNameJP;
        buttonElement3.classList.add("btn");
        buttonElement3.classList.add("btn-primary");
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
        const buttonElement1 = document.createElement("a");
        buttonElement1.href = `./?layer=${window.layerInfo.layerId}`;
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
    else {
        const buttonElement1 = document.createElement("button");
        buttonElement1.disabled = true;
        buttonElement1.innerText = functionInfo.functionNameJP;
        buttonElement1.classList.add("btn");
        buttonElement1.classList.add("btn-outline-primary");
        sidebarElement?.appendChild(buttonElement1);
    }
}
