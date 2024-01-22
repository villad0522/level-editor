import * as monaco from 'monaco-editor';
import { setupEditor3, Section } from "./003_editor.ts";

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

export type Savefunc = (functionInfos: Array<FunctionInfo>) => void;

//#########################################################################################
//#########################################################################################
// 初期化処理
//#########################################################################################
//#########################################################################################

export function setupEditor2(functionInfos: Array<FunctionInfo>, onSave: Savefunc): monaco.editor.IStandaloneCodeEditor {
    const appElement = document.getElementById("app");
    appElement?.style.setProperty("display", "none");

    // エディターの初期値（文字列の配列）
    const sections: Array<Section> = [];

    for (const functionInfo of functionInfos) {
        const {
            functionId,  // 関数のID
            functionNameJP,   // 関数名
            functionNameEN,   // 関数名
            beforeCode,     // 関数の直前のコード
            innerCode,      // 関数の中身のコード
            afterCode,      // 関数の直後のコード
            parametersName,       // 引数の名前
        } = functionInfo;
        //
        sections.push({
            code: (beforeCode.length >= 1) ? beforeCode : "\n",  // 編集可能領域が空文字だとバグるため、\nを入れる
            className: null,
        });
        //
        sections.push({
            code: `// ${functionNameJP}\nasync function ${functionNameEN}( ${parametersName.join(", ")} ){`,
            className: "START_" + functionId,
        });
        //
        sections.push({
            code: (innerCode.length >= 1) ? innerCode : "\n", // 編集可能領域が空文字だとバグるため、\nを入れる
            className: null,
        });
        //
        sections.push({
            code: `}`,
            className: "END_" + functionId,
        });
        //
        sections.push({
            code: afterCode,
            className: null,
        });
    }
    return setupEditor3(sections, (sections) => handleSave(sections, functionInfos, onSave));
}


//#########################################################################################
//#########################################################################################
// 保存するときの処理
//#########################################################################################
//#########################################################################################

function handleSave(sections: Array<Section>, functionInfos: Array<FunctionInfo>, onSave: Savefunc) {
    const newInfos: Array<FunctionInfo> = [];
    //
    // 一時的な記憶に使う変数
    let functionId: string | null = null; // 現在スキャン中の関数のID
    let beforeCodes: Array<string> = [];  // 関数の直前のコード
    let innerCodes: Array<string> = [];   // 関数の中身のコード
    //
    for (const section of sections) {
        const className = section.className;
        if (!className) {
            if (!functionId) {
                // どの関数にも属していない場合
                beforeCodes.push(section.code);
                continue;
            }
            else {
                // 関数の中身
                innerCodes.push(section.code);
                continue;
            }
        }
        else if (className.startsWith("START")) {
            // 関数の開始
            functionId = className.replace("START_", "");
        }
        else if (className.startsWith("END")) {
            // 関数の終了
            if (!functionId) {
                throw "[ERROR_001] 関数の始まりが見つかりません";
            }
            newInfos.push({
                ..._getInfo(functionInfos, functionId),
                beforeCode: beforeCodes.join(),
                innerCode: innerCodes.join(),
                afterCode: "",
            });
            functionId = null;
            beforeCodes = [];
            innerCodes = [];
        }
    }
    if (newInfos.length === 0) {
        throw "[ERROR_005] 関数が１つも存在しません。最低１つ以上は必要です。";
    }
    newInfos[newInfos.length - 1].afterCode = beforeCodes.join();
    onSave(newInfos);
}

function _getInfo(functionInfos: Array<FunctionInfo>, functionId: string) {
    for (let i = 0; i < functionInfos.length; i++) {
        if (functionInfos[i].functionId !== functionId) {
            continue;
        }
        return functionInfos[i];
    }
    throw "[ERROR_002] 関数が見つかりません";
}