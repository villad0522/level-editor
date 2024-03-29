
import './style.scss';
import { setupEditor1, FunctionInfo } from "./001_editor.ts";
import { setupEditor1B } from "./001B_editor.ts";

//#####################################################################
// ページを遷移した後も、スクロール位置を保持する
const topBarElement = document.querySelector("header");
if (!topBarElement) {
    throw "headerが見つかりません";
}
const scrollXText = sessionStorage.getItem("scrollX");
if (scrollXText) {
    const scrollX = Number(scrollXText);
    if (!isNaN(scrollX)) {
        console.log(scrollX);
        topBarElement.scrollLeft = scrollX;
    }
}
let pastScrollTime = 0;
let eventId: number | null = null;
topBarElement.addEventListener("scroll", () => {
    const nowTime = new Date().getTime();
    if (nowTime - pastScrollTime < 200) return;
    if (eventId) {
        window.clearTimeout(eventId);
        eventId = null;
    }
    eventId = window.setTimeout(() => {
        const scrollXText = String(topBarElement.scrollLeft);
        sessionStorage.setItem("scrollX", scrollXText);
    }, 300);
});

//#####################################################################


if (!window.layerInfo?.layerId) {
    throw "window.layerInfo?.layerIdが空欄です。";
}

if (!Array.isArray(window.functionInfos)) {
    throw "window.functionInfosが配列ではありません。";
}

history.pushState('', '', './');

if (window.functionId) {
    // パラメーター編集モード
    setupEditor1B(window.functionInfos, handleSave);
}
else {
    // コード編集モード
    setupEditor1(window.functionInfos, handleSave);
}

async function handleSave(functionInfos: Array<FunctionInfo>) {
    const functionInfos2 = [];
    let testCode: string = "";
    for (const functionInfo of functionInfos) {
        if (functionInfo.functionId === "test") {
            testCode = functionInfo.innerCode;
        }
        else {
            functionInfos2.push(functionInfo);
        }
    }
    if (!testCode) {
        testCode = window.testFunctionCode;
    }
    if (!window.layerInfo?.layerId) {
        throw "window.layerInfo?.layerIdが空欄です。";
    }
    const bodyText = JSON.stringify({
        layerId: window.layerInfo.layerId,
        testCode: testCode,
        functionInfos: functionInfos2,
    });
    const res = await window.fetch(
        "/save",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: bodyText,
        }
    );
    console.log(await res.text());
}

interface LayerInfo {
    layerId: string,
    layerNameJP: string,
    layerNameEN: string
}

declare global {
    interface Window {
        layerInfo: LayerInfo,
        functionId: string,
        functionInfos: Array<FunctionInfo>
        Popper: any,
        testFunctionCode: string,
    }
}


const buildButtonElement = document.getElementById("build_button");
buildButtonElement?.addEventListener("click", handleBuild);

async function handleBuild() {
    const res = await window.fetch(
        "/build",
        {
            method: "POST",
        }
    );
    console.log(await res.text());
}