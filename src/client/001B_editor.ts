import * as monaco from 'monaco-editor';
import { setupEditor4 } from './004_editor';

export interface FunctionInfo {
    functionId: string,     // 関数のID
    functionName: string,   // 関数名
    beforeCode: string,     // 関数の直前のコード
    innerCode: string,      // 関数の中身のコード
    afterCode: string,      // 関数の直後のコード
    parametersName: Array<string>,  // 引数の名前
    parametersDataType: Array<any>,    // 引数の型
    returnValue: any,       // 戻り値
};

export type Savefunc = (functionInfos: Array<FunctionInfo>, isReload: boolean) => void;

let buf: Array<FunctionInfo> | null;

export function setupEditor1B(functionInfos: Array<FunctionInfo>, onSave: Savefunc) {
    buf = structuredClone(functionInfos);
    const obj: any = _getFunctionInfo(buf);
    delete obj.functionId;
    delete obj.beforeCode;
    delete obj.innerCode;
    delete obj.afterCode;
    const text = JSON.stringify(obj, null, 2);
    //===============================================================
    // エディター初期化
    const editor = setupEditor4(text, "json", () => handleSave(onSave, editor));
    //
    //===============================================================
}

function handleSave(onSave: Savefunc, editor: monaco.editor.IStandaloneCodeEditor) {
    const text = editor.getValue();
    let obj: any;
    try {
        obj = JSON.parse(text);
    }
    catch (err) {
        alert("JSON形式に変換できません");
        return;
    }
    if (!buf) {
        throw "バッファーがNULLです";
    }
    for (let i = 0; i < buf.length; i++) {
        if (buf[i].functionId === window.functionId) {
            buf[i] = {
                ...buf[i],
                ...obj,
            };
            onSave(buf, false);
            return;
        }
    }
    // 編集対象の関数が見つからない場合、新規作成する
    buf.push({
        ...obj,
        functionId: window.functionId,
        beforeCode: "\n",     // 関数の直前のコード
        innerCode: "\n  console.log();\n",      // 関数の中身のコード
        afterCode: "\n",      // 関数の直後のコード
    });
    onSave(buf, true);
    return;
}

function _getFunctionInfo(functionInfos: Array<FunctionInfo>): FunctionInfo {
    for (const info of functionInfos) {
        if (info.functionId === window.functionId) {
            return structuredClone(info);
        }
    }
    // 編集対象の関数が見つからない場合、新規作成する
    return {
        functionId: window.functionId,  // 関数のID
        functionName: "myFunc",   // 関数名
        beforeCode: "\n",     // 関数の直前のコード
        innerCode: "\n  console.log();\n",      // 関数の中身のコード
        afterCode: "\n",      // 関数の直後のコード
        parametersName: [],
        parametersDataType: [],
        returnValue: "void",       // 戻り値
    }
}