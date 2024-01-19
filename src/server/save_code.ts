import fs from "fs";
import path from "path";
import savePath from "./save_path";
import { getLayerList, LayerInfo, getCode } from "./entry-server";

let pastTime = 0;

export async function saveCode(layerId: string, functionInfos: Array<FunctionInfo>) {
    const jsonPath = savePath + `${layerId}.json`;
    await fs.promises.writeFile(jsonPath, JSON.stringify(functionInfos));
    //
    const nowTime = new Date().getTime();
    if ((nowTime - pastTime) < 1000 * 60) {
        return;
    }
    pastTime = nowTime;
    console.log("コードを再生成します。");
    //
    const outDir = `C:\\Users\\kimura\\Documents\\ui_db\\src\\`;
    //
    fs.readdir(outDir, (err, files) => {
        if (err) {
            console.error('ディレクトリを読み込めませんでした。', err);
            return;
        }

        // ファイルのフィルタリングおよび削除処理
        files.forEach(async (file) => {
            if (/^\d{3}/.test(file)) {
                const filePath = path.join(outDir, file);
                await fs.promises.rm(filePath);
            }
        });
    });
    //
    const layerList: Array<LayerInfo> = await getLayerList();
    //
    // exportされている関数の一覧
    const functionPaths: { [functionNameEN: string]: string } = {
        // "関数名": "./ファイル名.js",
    };
    //
    for (let i = layerList.length - 1; i >= 0; i--) {
        const layerInfo = layerList[i];
        const functionInfos = await getCode(layerInfo["layerId"]);
        //
        const imports: { [filePath: string]: Array<string> } = {
            // "./ファイル名.js": [
            //     "関数名",
            //     "関数名",
            // ],
        };
        //
        // 依存関係を調べる
        for (const functionNameEN in functionPaths) {
            const functionPath = functionPaths[functionNameEN];
            if (!imports[functionPath]) {
                imports[functionPath] = [];
            }
            imports[functionPath].push(functionNameEN);
        }
        //
        //####################################################################
        // メインコード生成　ここから
        //
        let mainCode: string = "";
        mainCode += `// ${layerInfo.layerNameJP}\n`;
        mainCode += `//\n`;
        for (const filePath in imports) {
            const functionNames = imports[filePath];
            mainCode += `import {\n`;
            for (const functionNameEN of functionNames) {
                // 文字列の先頭の文字を大文字にする
                mainCode += `  ${functionNameEN},\n`;
            }
            mainCode += `} from "${filePath}";\n`;
        }
        //
        for (const functionInfo of functionInfos) {
            const {
                functionNameJP,   // 関数名
                functionNameEN,   // 関数名
                beforeCode,     // 関数の直前のコード
                innerCode,      // 関数の中身のコード
                afterCode,      // 関数の直後のコード
                parametersName,       // 引数の名前
            } = functionInfo;
            //
            mainCode += beforeCode;
            mainCode += `// ${functionNameJP}\n`;
            mainCode += `export async function ${functionNameEN}_core( ${parametersName.join(", ")} ){`;
            mainCode += innerCode;
            mainCode += `}`;
            mainCode += afterCode;
        }
        //
        // JavaScriptをファイルに保存する
        const mainFileName = `./${zeroPadding(i * 2 + 1, 3)}_${layerInfo.layerNameEN}.js`;
        const mainPath = path.join(outDir, mainFileName);
        await fs.promises.writeFile(mainPath, mainCode);
        //
        //
        //####################################################################
        // テストコード生成　ここから
        let testCode: string = "";
        testCode += `import {\n`;
        for (const functionInfo of functionInfos) {
            testCode += `  ${functionInfo.functionNameEN}_core,  // ${functionInfo.functionNameJP}\n`;
        }
        testCode += `} from "${mainFileName}";\n\n\n`;
        //
        for (const functionInfo of functionInfos) {
            try {
                testCode += generateTestCode(layerInfo.layerNameEN, functionInfo);
            }
            catch (err) {
                throw `${err} layerNameJP = ${layerInfo.layerNameJP}`;
            }
        }
        //
        // JavaScriptをファイルに保存する
        const testFilePath = `./${zeroPadding(i * 2, 3)}_${layerInfo.layerNameEN}_test.js`;
        const testPath = path.join(outDir, testFilePath);
        await fs.promises.writeFile(testPath, testCode);
        //
        //
        //####################################################################
        //
        // 次のループのために、自分の関数をexportする
        for (const functionInfo of functionInfos) {
            functionPaths[functionInfo.functionNameEN] = testFilePath;
        }
    }
}

// 文字列の先頭の文字を大文字にする関数
function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// NUM=値 LEN=桁数
function zeroPadding(NUM: number, LEN: number): string {
    return (Array(LEN).join('0') + NUM).slice(-LEN);
}


interface FunctionInfo {
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

function generateTestCode(layerNameEN: string, functionInfo: FunctionInfo): string {
    let code = "";
    const {
        functionNameEN,   // 関数名
        parametersName,       // 引数の名前
        parametersDataType,
        returnValue,
    } = functionInfo;
    //
    code += `//#######################################################################################\n`;
    code += `// 関数「${functionNameEN}_core」に、引数と戻り値のチェック機能を追加した関数\n`;
    code += `//\n`;
    code += `export async function ${functionNameEN}( ${parametersName.join(", ")} ){\n`;
    code += `  //--------------------------------------------------------------------------\n`;
    code += `  // 引数を検証\n`;
    for (let i = 0; i < parametersName.length; i++) {
        code += varidateVariable(
            layerNameEN,
            functionNameEN,
            parametersName[i],
            parametersName[i],
            parametersDataType[i],
            "  ",
            "i",
        );
    }
    code += `  //\n`;
    code += `  //--------------------------------------------------------------------------\n`;
    code += `  // メイン処理を実行\n`;
    code += `  let result;\n`;
    code += `  try{\n`;
    code += `    result = await ${functionNameEN}_core( ${parametersName.join(", ")} );\n`;
    code += `  }\n`;
    code += `  catch(error){\n`;
    code += `    if( typeof error === "string" ){\n`;
    code += `      throw new Error(\`\${error}\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
    code += `    }\n`;
    code += `    else{\n`;
    code += `      throw error;\n`;
    code += `    }\n`;
    code += `  }\n`;
    code += `  //\n`;
    code += `  //--------------------------------------------------------------------------\n`;
    code += `  // 戻り値を検証\n`;
    code += varidateVariable(
        layerNameEN,
        functionNameEN,
        "result",
        "result",
        returnValue,
        "  ",
        "i",
    );
    code += `  //\n`;
    code += `  //--------------------------------------------------------------------------\n`;
    code += `  return result;\n`;
    code += `}\n\n\n`;
    return code;
}

function varidateVariable(
    layerNameEN: string,
    functionNameEN: string,
    variableName: string,
    displayName: string,
    dataType: any,
    indent: string,
    indexName: string,
): string {
    let code = "";
    if (String(dataType).startsWith("string")) {
        // 文字列の場合
        if (String(dataType).endsWith("_nullable")) {
            // 空欄OK
            code += indent + `if( (${variableName}===null) || (${variableName}===undefined) ){\n`;
            code += indent + `  // ${variableName}は空欄OK。\n`;
            code += indent + `}\n`;
            code += indent + `else if( typeof ${variableName} !== "string" ){\n`;
            code += indent + `  throw new Error(\`${displayName}が文字列ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `}\n`;
            return code;
        }
        else {
            // 空欄NG
            code += indent + `if( typeof ${variableName} !== "string" ){\n`;
            code += indent + `  if( !${variableName} ){\n`;
            code += indent + `    throw new Error(\`${displayName}がNULLです。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `  }\n`;
            code += indent + `  else{\n`;
            code += indent + `    throw new Error(\`${displayName}が文字列ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `  }\n`;
            code += indent + `}\n`;
            return code;
        }
    }
    else if (String(dataType).startsWith("number")) {
        // 数値の場合
        if (String(dataType).endsWith("_nullable")) {
            // 空欄OK
            code += indent + `if( (${variableName}===null) || (${variableName}===undefined) ){\n`;
            code += indent + `  // ${variableName}は空欄OK。\n`;
            code += indent + `}\n`;
            code += indent + `else if( typeof ${variableName} !== "number" ){\n`;
            code += indent + `  throw new Error(\`${displayName}が数値ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `}\n`;
            code += indent + `else if( isNaN(${variableName}) ){\n`;
            code += indent + `  throw new Error(\`${displayName}が数値ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `}\n`;
            return code;
        }
        else {
            // 空欄NG
            code += indent + `if( typeof ${variableName} !== "number" ){\n`;
            code += indent + `  if( !${variableName} ){\n`;
            code += indent + `    throw new Error(\`${displayName}がNULLです。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `  }\n`;
            code += indent + `  else{\n`;
            code += indent + `    throw new Error(\`${displayName}が数値ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `  }\n`;
            code += indent + `}\n`;
            code += indent + `else if( isNaN(${variableName}) ){\n`;
            code += indent + `  throw new Error(\`${displayName}が数値ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `}\n`;
            return code;
        }
    }
    else if (String(dataType).startsWith("boolean")) {
        // booleanの場合
        if (String(dataType).endsWith("_nullable")) {
            // 空欄OK
            code += indent + `if( (${variableName}===null) || (${variableName}===undefined) ){\n`;
            code += indent + `  // ${variableName}は空欄OK。\n`;
            code += indent + `}\n`;
            code += indent + `else if( typeof ${variableName} !== "boolean" ){\n`;
            code += indent + `  throw new Error(\`${displayName}がブール値ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `}\n`;
            code += indent + `else if( isNaN(${variableName}) ){\n`;
            code += indent + `  throw new Error(\`${displayName}がブール値ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `}\n`;
            return code;
        }
        else {
            // 空欄NG
            code += indent + `if( typeof ${variableName} !== "boolean" ){\n`;
            code += indent + `  if( !${variableName} ){\n`;
            code += indent + `    throw new Error(\`${displayName}がNULLです。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `  }\n`;
            code += indent + `  else{\n`;
            code += indent + `    throw new Error(\`${displayName}がブール値ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `  }\n`;
            code += indent + `}\n`;
            code += indent + `else if( isNaN(${variableName}) ){\n`;
            code += indent + `  throw new Error(\`${displayName}がブール値ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `}\n`;
            return code;
        }
    }
    else if (Array.isArray(dataType)) {
        // 配列の場合
        if (dataType.length === 0) {
            console.error("型定義が不十分です layerNameEN:" + layerNameEN);
            return "";
        }
        code += indent + `if( !Array.isArray(${variableName}) ){\n`;
        code += indent + `  if( !${variableName} ){\n`;
        code += indent + `    throw new Error(\`${displayName}がNULLです。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
        code += indent + `  }\n`;
        code += indent + `  else{\n`;
        code += indent + `    throw new Error(\`${displayName}が配列ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
        code += indent + `  }\n`;
        code += indent + `}\n`;
        code += indent + `for( let ${indexName}=0; i<${variableName}.length; i++ ){\n`;
        code += varidateVariable(
            layerNameEN,
            functionNameEN,
            `${variableName}[${indexName}]`,
            `${displayName}[\${${indexName}}]`,
            dataType[0],
            indent + "  ",
            String.fromCharCode(indexName.charCodeAt(0) + 1),
        );
        code += indent + `}\n`;
        return code;
    }
    else if (typeof dataType === "object" && (dataType["string"] || dataType["number"])) {
        // 反復可能オブジェクトの場合
        code += indent + `if( typeof ${variableName} !== "object" ){\n`;
        code += indent + `  if( !${variableName} ){\n`;
        code += indent + `    throw new Error(\`${displayName}がNULLです。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
        code += indent + `  }\n`;
        code += indent + `  else{\n`;
        code += indent + `    throw new Error(\`${displayName}がオブジェクトではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
        code += indent + `  }\n`;
        code += indent + `}\n`;
        code += indent + `else if( typeof ${variableName}[Symbol.iterator] !== "function" ){\n`;
        code += indent + `  throw new Error(\`${displayName}が反復可能オブジェクトではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
        code += indent + `}\n`;
        code += indent + `for( const ${indexName} in ${variableName} ){\n`;
        if (dataType["string"]) {
            code += indent + `  if( typeof ${indexName} !== "string" ){\n`;
            code += indent + `    throw new Error(\`${displayName}のキーが文字列ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `  }\n`;
            code += varidateVariable(
                layerNameEN,
                functionNameEN,
                `${variableName}[${indexName}]`,
                `${displayName}["\${${indexName}}"]`,
                dataType["string"],
                indent + "  ",
                String.fromCharCode(indexName.charCodeAt(0) + 1),
            );
        }
        else if (dataType["number"]) {
            code += indent + `  if( typeof ${indexName} !== "number" ){\n`;
            code += indent + `    throw new Error(\`${displayName}のキーが数値ではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
            code += indent + `  }\n`;
            code += varidateVariable(
                layerNameEN,
                functionNameEN,
                `${variableName}[${indexName}]`,
                `${displayName}["\${${indexName}}"]`,
                dataType["number"],
                indent + "  ",
                String.fromCharCode(indexName.charCodeAt(0) + 1),
            );
        }
        code += indent + `}\n`;
        return code;
    }
    else if (typeof dataType === "object") {
        // オブジェクトの場合
        code += indent + `if( typeof ${variableName} !== "object" ){\n`;
        code += indent + `  if( !${variableName} ){\n`;
        code += indent + `    throw new Error(\`${displayName}がNULLです。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
        code += indent + `  }\n`;
        code += indent + `  else{\n`;
        code += indent + `    throw new Error(\`${displayName}がオブジェクトではありません。\\nレイヤー : ${layerNameEN}\\n関数 : ${functionNameEN}\`);\n`;
        code += indent + `  }\n`;
        code += indent + `}\n`;
        for (const key in dataType) {
            code += varidateVariable(
                layerNameEN,
                functionNameEN,
                `${variableName}.${key}`,
                `${displayName}.${key}`,
                dataType[key],
                indent,
                indexName,
            );
        }
        return code;
    }
    return code;
}