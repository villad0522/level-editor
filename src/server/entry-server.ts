import fs from "fs";
import { ulid } from "ulid";

type QueryParameters = { [key: string]: string } | null;

//##########################################################################

export async function render(url: string, ssrManifest: string | undefined, queryParameters: QueryParameters) {
  if (!queryParameters) {
    queryParameters = {};
  }
  const layerList = await _getLayerList();
  //
  let layerInfo: LayerInfo | null = null;
  let functionInfos: Array<FunctionInfo>;
  if (queryParameters["layer"] === "new") {
    console.log("新しいレイヤーを作成します");
    const result = await _createLayer(layerList, "新しいレイヤー");
    layerInfo = result.layerInfo;
    layerList.push(result.layerInfo);
    functionInfos = result.functionInfos;
  }
  else if (!queryParameters["layer"]) {
    if (layerList.length >= 1) {
      layerInfo = layerList[0];
      functionInfos = await _getCode(layerList[0]["layerId"]);
    }
    else {
      console.log("新しいレイヤーを作成します");
      const result = await _createLayer(layerList, "新しいレイヤー");
      layerInfo = result.layerInfo;
      layerList.push(result.layerInfo);
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
    functionInfos = await _getCode(queryParameters["layer"]);
  }

  //
  let headerHTML = "";
  for (const layerInfo of layerList) {
    headerHTML += `
      <a href="./?layer=${encodeURIComponent(layerInfo?.layerId)}">
        ${layerInfo?.layerName}
      </a>
    `;
  }
  return {
    head: `
      <script>
        window.layerInfo = ${JSON.stringify(layerInfo, null, 2)};
        window.functionId = "${queryParameters["functionId"] ?? ""}";
        window.functionInfos = ${JSON.stringify(functionInfos, null, 2)};
      </script>
    `,
    body: `
      <header>
        ${headerHTML}
        <a href="./?layer=new">
          レイヤーを新規作成
        </a>
      </header>
      <div class="tab_body">
        <div class="sidebar">
          <a href="./?layer=${layerInfo.layerId}&func=${ulid()}">
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
  functionName: string,   // 関数名
  beforeCode: string,     // 関数の直前のコード
  innerCode: string,      // 関数の中身のコード
  afterCode: string,      // 関数の直後のコード
  parametersName: Array<string>,  // 引数の名前
  parametersDataType: Array<any>,    // 引数の型
  returnValue: any,       // 戻り値
};

interface LayerInfo {
  layerId: string,
  layerName: string
}

//##########################################################################

async function _getLayerList(): Promise<Array<LayerInfo>> {
  const path = `C:\\Users\\kimura\\Documents\\level-editor\\savedata\\layer_list.json`;
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
    if (!layerInfo.layerName) {
      throw new Error("layer_list.jsonの書式が間違っています");
    }
    if (!layerInfo.layerId) {
      throw new Error("layer_list.jsonの書式が間違っています");
    }
  }
  return layerList;
}

//##########################################################################

async function _getCode(layerId: string): Promise<Array<FunctionInfo>> {
  const path = `C:\\Users\\kimura\\Documents\\level-editor\\savedata\\${layerId}.json`;
  if (!fs.existsSync(path)) {
    throw new Error(`ファイルが存在しません。${path}`);
  }
  const buffer = await fs.promises.readFile(path);
  try {
    return JSON.parse(buffer.toString());
  }
  catch (err) {
    throw new Error(`ファイルの内容をJSON形式に変換できませんでした。${path}`);
  }
}

//##########################################################################

interface Code {
  layerInfo: LayerInfo,
  functionInfos: Array<FunctionInfo>,
}

async function _createLayer(layerList: Array<LayerInfo>, layerName: string): Promise<Code> {
  const layerId = ulid();
  const functionInfos: Array<FunctionInfo> = [];
  const path1 = `C:\\Users\\kimura\\Documents\\level-editor\\savedata\\${layerId}.json`;
  await fs.promises.writeFile(path1, JSON.stringify(functionInfos));
  //
  const path2 = `C:\\Users\\kimura\\Documents\\level-editor\\savedata\\layer_list.json`;
  const layerInfo: LayerInfo = {
    layerId: layerId,
    layerName: layerName,
  };
  await fs.promises.writeFile(path2, JSON.stringify([
    ...layerList,
    layerInfo,
  ]));
  //
  return {
    layerInfo,
    functionInfos
  };
}

//##########################################################################

export async function saveCode(layerId: string, functionInfos: Array<FunctionInfo>) {
  console.log(functionInfos);
  const path = `C:\\Users\\kimura\\Documents\\level-editor\\savedata\\${layerId}.json`;
  await fs.promises.writeFile(path, JSON.stringify(functionInfos));
}

//##########################################################################

const functionInfos = [
  {
    functionId: "01HKTVXEEE0Z7FAQWBK2365SBY",  // 関数のID
    functionName: "myFunc1",   // 関数名
    beforeCode: "\n",     // 関数の直前のコード
    innerCode: "\n  console.log();\n",      // 関数の中身のコード
    afterCode: "\n",      // 関数の直後のコード
    parametersName: [       // 引数の名前
      "param1",
      "param2",
    ],
    parametersDataType: [       // 引数の型
      "string",
      {
        "param3": "number",
        "param4": ["string"],
      },
    ],
    returnValue: {      // 戻り値
      "param5": "number",
      "param6": ["string"],
    },
  },
  {
    functionId: "01HKVVB83071NVCSSWDT7256F8",  // 関数のID
    functionName: "myFunc2",   // 関数名
    beforeCode: "\n",     // 関数の直前のコード
    innerCode: "\n  console.log();\n",      // 関数の中身のコード
    afterCode: "\n",      // 関数の直後のコード
    parametersName: [],
    parametersDataType: [],
    returnValue: "string",       // 戻り値
  }
];