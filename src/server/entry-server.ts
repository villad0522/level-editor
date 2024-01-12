

export function render(url: string, ssrManifest: string | undefined) {
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
  const head = `
    <script>
      window.functionInfos = ${JSON.stringify(functionInfos, null, 2)}
    </script>
  `;
  const header = `
    <div>001</div>
    <div>002</div>
    <div>003</div>
    <div>004</div>
  `
  const main = `
    <div>
      <a href="https://vitejs.dev" target="_blank">
        <img src="/vite.svg" class="logo" alt="Vite logo" />
      </a>
      <h1>Hello Vite!</h1>
      <div class="card">
        <button id="counter" type="button"></button>
      </div>
      <p class="read-the-docs">
        Click on the Vite logo to learn more
      </p>
    </div>
  `
  const sidebar = `
    <div>post</div>
    <div>put</div>
    <div>delete</div>
    <div>get</div>
  `
  return { head, header, sidebar, main }
}