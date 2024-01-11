import './style.css'
import { setupEditor1, FunctionInfo } from "./001_editor.ts";

let functionInfos: Array<FunctionInfo> = [
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

const text = localStorage.getItem("test");
if (text) {
    functionInfos = JSON.parse(text);
    console.log(functionInfos);
}

function handleSave(functionInfos: Array<FunctionInfo>) {
    localStorage.setItem("test", JSON.stringify(functionInfos));
}

setupEditor1(functionInfos, handleSave);

