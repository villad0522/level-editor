import './style.css'
import { setupEditor1, FunctionInfo } from "./001_editor.ts";

declare global {
    interface Window {
        functionInfos: Array<FunctionInfo>
    }
}

function handleSave(functionInfos: Array<FunctionInfo>) {
    localStorage.setItem("test", JSON.stringify(functionInfos));
}

if (Array.isArray(window.functionInfos)) {
    setupEditor1(window.functionInfos, handleSave);
}
