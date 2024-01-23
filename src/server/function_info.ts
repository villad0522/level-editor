
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