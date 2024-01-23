import fs from "fs";
import savePath from "./save_path";
import { buildCode } from "./build_code";
import { FunctionInfo } from "./function_info";

let pastTime = 0;

export async function saveCode(layerId: string, testCode: string, functionInfos: Array<FunctionInfo>) {
    const testFuncInfo = {
        functionId: "test",     // 関数のID
        functionNameJP: "テストコード",   // 関数名
        functionNameEN: "test",   // 関数名
        beforeCode: "",     // 関数の直前のコード
        innerCode: testCode,      // 関数の中身のコード
        afterCode: "",      // 関数の直後のコード
        parametersName: [],  // 引数の名前
        parametersDataType: [],    // 引数の型
        returnValue: "void",       // 戻り値
    };
    functionInfos.unshift(testFuncInfo);
    //
    const jsonPath = savePath + `${layerId}.json`;
    await fs.promises.writeFile(jsonPath, JSON.stringify(functionInfos));
    //
    const nowTime = new Date().getTime();
    if ((nowTime - pastTime) < 1000 * 60) {
        return;
    }
    pastTime = nowTime;
    console.log("コードを再生成します。");
    await buildCode();
}