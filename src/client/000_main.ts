import { setupEditor1, FunctionInfo } from "./001_editor.ts";
import { setupEditor1B } from "./001B_editor.ts";

const searchParams = new URLSearchParams(location.search);
const isSetting = searchParams.has("func")
history.pushState(null, "", location.pathname);
if (isSetting) {
    // パラメーター編集モード
    setupEditor1B(window.functionInfos, handleSave);
}
else {
    // コード編集モード
    if (!Array.isArray(window.functionInfos)) {
        throw "window.functionInfosが配列ではありません。";
    }
    setupEditor1(window.functionInfos, handleSave);
}

async function handleSave(functionInfos: Array<FunctionInfo>, isReload: boolean) {
    const bodyText = JSON.stringify({
        layerId: window.layerInfo.layerId,
        functionInfos: functionInfos,
    });
    console.log(bodyText);
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
    if (isReload) {
        location.reload();
    }
}

interface LayerInfo {
    layerId: string,
    layerName: string
}

declare global {
    interface Window {
        layerInfo: LayerInfo,
        functionId: string,
        functionInfos: Array<FunctionInfo>
    }
}