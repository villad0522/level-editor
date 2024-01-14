
import './style.scss';
import { setupEditor1, FunctionInfo } from "./001_editor.ts";
import { setupEditor1B } from "./001B_editor.ts";

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
    if (!window.layerInfo?.layerId) {
        throw "window.layerInfo?.layerIdが空欄です。";
    }
    const bodyText = JSON.stringify({
        layerId: window.layerInfo.layerId,
        functionInfos: functionInfos,
    });
    const res = await window.fetch(
        "/code",
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
    }
}