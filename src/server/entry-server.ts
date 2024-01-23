import fs from "fs";
import { ulid } from "ulid";
import savePath from "./save_path";

type QueryParameters = { [key: string]: string } | null;

//##########################################################################

export async function render(url: string, ssrManifest: string | undefined, queryParameters: QueryParameters) {
  if (!queryParameters) {
    queryParameters = {};
  }
  const layerList: Array<LayerInfo> = await getLayerList();
  //
  let layerInfo: LayerInfo | null = null;
  let functionInfos: Array<FunctionInfo> = [];
  let testFunctionCode: string = "";
  if (queryParameters["layer"] === "new") {
    console.log("新しいレイヤーを作成します");
    const result = await _createLayer(layerList);
    layerInfo = result.layerInfo;
    layerList.unshift(result.layerInfo);
    functionInfos = result.functionInfos;
  }
  else if (!queryParameters["layer"]) {
    if (layerList.length >= 1) {
      layerInfo = layerList[0];
      const result = await getCode(layerList[0]["layerId"]);
      functionInfos = result.functionInfos;
      testFunctionCode = result.testFunctionCode;
    }
    else {
      console.log("新しいレイヤーを作成します");
      const result = await _createLayer(layerList);
      layerInfo = result.layerInfo;
      layerList.unshift(result.layerInfo);
      functionInfos = result.functionInfos;
    }
  }
  else {
    for (const info of layerList) {
      if (queryParameters["layer"] === info.layerId) {
        layerInfo = info;
        break;
      }
    }
    if (!layerInfo) {
      throw new Error(`レイヤーが存在しません。${queryParameters["layer"]}`);
    }
    const result = await getCode(queryParameters["layer"]);
    functionInfos = result.functionInfos;
    testFunctionCode = result.testFunctionCode;
  }
  //
  if (!Array.isArray(functionInfos)) {
    functionInfos = [];
  }
  const functionInfos2 = [];
  for (const functionInfo of functionInfos) {
    if (functionInfo?.functionId) {
      functionInfos2.push(functionInfo);
    }
  }

  //
  let headerHTML = "";
  for (const info of layerList) {
    if (info?.layerId === layerInfo.layerId) {
      headerHTML += `
        <li class="nav-item">
          <a class="nav-link active" href="./?layer=${encodeURIComponent(info?.layerId)}">
            ${info?.layerNameJP}
          </a>
        </li>
      `;
    }
    else {
      headerHTML += `
        <li class="nav-item">
          <a class="nav-link" href="./?layer=${encodeURIComponent(info?.layerId)}">
            ${info?.layerNameJP}
          </a>
        </li>
      `;
    }
  }
  return {
    head: `
      <script>
        window.testFunctionCode = ${JSON.stringify(testFunctionCode)};
        window.layerInfo = ${JSON.stringify(layerInfo, null, 2)};
        window.functionId = "${queryParameters["func"] ?? ""}";
        window.functionInfos = ${JSON.stringify(functionInfos2, null, 2)};
      </script>
    `,
    body: `
      <header>
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <a class="nav-link" href="./?layer=new">
              レイヤーを新規作成
            </a>
          </li>
          ${headerHTML}
        </ul>
      </header>
      <div class="tab_body">
        <div class="sidebar">
          <button class="btn btn-primary" id="build_button">
            コードを再生成
          </button>
          <br>
          <br>
          <div id="side_button_group" class="btn-group-vertical" role="group" aria-label="Vertical button group">
          </div>
          <br>
          <br>
          <a class="btn btn-primary" href="./?layer=${layerInfo.layerId}&func=${ulid()}">
            関数を新規作成
          </a>
        </div>
        <main id="editor">
        </main>
      </div>
    `,
  }
}

//##########################################################################

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

export interface LayerInfo {
  layerId: string,
  layerNameJP: string,
  layerNameEN: string
}

//##########################################################################

export async function getLayerList(): Promise<Array<LayerInfo>> {
  const path = savePath + `layer_list.json`;
  if (!fs.existsSync(path)) {
    // ファイルが存在しない場合
    await fs.promises.writeFile(path, "[]");
    return [];
  }
  const buffer = await fs.promises.readFile(path);
  let layerList: Array<LayerInfo>;
  try {
    layerList = JSON.parse(buffer.toString());
  }
  catch (err) {
    throw new Error(`ファイルの内容をJSON形式に変換できませんでした。${path}`);
  }
  if (!Array.isArray(layerList)) {
    throw new Error("layer_list.jsonの書式が間違っています");
  }
  for (const layerInfo of layerList) {
    if (!layerInfo) {
      throw new Error("layer_list.jsonの書式が間違っています");
    }
    if (!layerInfo.layerNameJP) {
      throw new Error("layer_list.jsonの書式が間違っています");
    }
    if (!layerInfo.layerNameEN) {
      throw new Error("layer_list.jsonの書式が間違っています");
    }
    if (!layerInfo.layerId) {
      throw new Error("layer_list.jsonの書式が間違っています");
    }
  }
  return layerList;
}

//##########################################################################

interface returnA {
  functionInfos: Array<FunctionInfo>,
  testFunctionCode: string,
}

export async function getCode(layerId: string): Promise<returnA> {
  const path = savePath + `${layerId}.json`;
  if (!fs.existsSync(path)) {
    throw new Error(`ファイルが存在しません。${path}`);
  }
  const buffer = await fs.promises.readFile(path);
  let functionInfos1: Array<FunctionInfo> = [];
  try {
    functionInfos1 = JSON.parse(buffer.toString());
  }
  catch (err) {
    throw new Error(`ファイルの内容をJSON形式に変換できませんでした。${path}`);
  }
  const functionInfos2: Array<FunctionInfo> = [];
  let testFunctionCode: string = "";
  //
  for (const functionInfo1 of functionInfos1) {
    if (functionInfo1.functionId === "test") {
      testFunctionCode = functionInfo1.innerCode;
    }
    else {
      functionInfos2.push(functionInfo1);
    }
  }
  return {
    functionInfos: functionInfos2,
    testFunctionCode: testFunctionCode,
  };
}

//##########################################################################

interface Code {
  layerInfo: LayerInfo,
  functionInfos: Array<FunctionInfo>,
}

async function _createLayer(layerList: Array<LayerInfo>): Promise<Code> {
  const layerId = ulid();
  const functionInfos: Array<FunctionInfo> = [];
  const path1 = savePath + `${layerId}.json`;
  await fs.promises.writeFile(path1, JSON.stringify(functionInfos));
  //
  const path2 = savePath + `layer_list.json`;
  const layerInfo: LayerInfo = {
    layerId: layerId,
    layerNameJP: "新しいレイヤー",
    layerNameEN: "layerName",
  };
  await fs.promises.writeFile(path2, JSON.stringify([
    layerInfo,
    ...layerList,
  ], null, 2));
  //
  return {
    layerInfo,
    functionInfos
  };
}

//##########################################################################
