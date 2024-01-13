import * as monaco from 'monaco-editor';
import { setupEditor4 } from './004_editor';

export interface FunctionInfo {
    functionId: string,     // 関数のID
    functionNameJP: string,   // 関数名
    functionNameEN: string,   // 関数名
    beforeCode: string,     // 関数の直前のコード
    innerCode: string,      // 関数の中身のコード
    afterCode: string,      // 関数の直後のコード
    parametersName: Array<string>,  // 引数の名前
    parametersDataType: Array<any>,    // 引数の型
    returnValue: any,       // 戻り値
};

export type Savefunc = (functionInfos: Array<FunctionInfo>) => Promise<any>;

let buf: Array<FunctionInfo> | null;

export function setupEditor2B(functionInfos: Array<FunctionInfo>, onSave: Savefunc) {
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

async function handleSave(onSave: Savefunc, editor: monaco.editor.IStandaloneCodeEditor) {
    const text = editor.getValue();
    let obj: any;
    try {
        obj = JSON.parse(text);
    }
    catch (err) {
        throw "JSON形式に変換できません";
    }
    //
    if (obj.parametersDataType.length !== obj.parametersName.length) {
        throw "引数の個数が一致しません";
    }
    if (!Array.isArray(buf)) {
        throw "バッファーがNULLです";
    }
    console.log(buf);
    for (let i = 0; i < buf.length; i++) {
        if (buf[i].functionId === window.functionId) {
            const bufi = structuredClone(buf[i]);
            buf[i] = {
                ...buf[i],
                ...obj,
                functionId: window.functionId,
            };
            await onSave(buf);
            if (bufi.functionNameJP !== obj.functionNameJP) {
                location.reload();
            }
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
    await onSave(buf);
    location.reload();
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
        functionNameJP: "新しい関数",   // 関数名
        functionNameEN: "myFunc",   // 関数名
        beforeCode: "\n",     // 関数の直前のコード
        innerCode: "\n  console.log();\n",      // 関数の中身のコード
        afterCode: "\n",      // 関数の直後のコード
        parametersName: [],
        parametersDataType: [],
        returnValue: "void",       // 戻り値
    }
}