import * as monaco from 'monaco-editor';
import constrainedEditor from 'constrained-editor-plugin';
import { setupEditor4 } from './004_editor';

// テキストエディタ「monaco」
//  https://microsoft.github.io/monaco-editor/

// 編集制限プラグイン
//  https://constrained-editor-plugin.vercel.app/

export interface Section {
    code: string,
    className: string | null,
};

type Savefunc = (sections: Array<Section>) => void;

//#########################################################################################
//#########################################################################################
// 初期化処理
//#########################################################################################
//#########################################################################################

export function setupEditor3(sections: Array<Section>, onSave: Savefunc): monaco.editor.IStandaloneCodeEditor {
    //===============================================================
    // 編集制限の情報を保存する配列
    const restrictions: Array<RangeRestrictionObject> = [];
    //
    // CSSの情報を保存する配列
    const decorations: Array<monaco.editor.IModelDeltaDecoration> = [];
    //
    let codeAll = "";
    let startLineNumber = 1;    // 「編集可能な範囲」のスタート地点
    let startColumn = 1; // 「編集可能な範囲」のスタート地点
    for (const section of sections) {
        const className = section.className;
        if (!className) {
            // 編集OKな文字列を追加
            codeAll += section.code;
            continue;
        }
        // この文字列が編集NGの場合
        if (!className.startsWith("START") && !className.startsWith("END")) {
            throw "[ERROR_003] 予期しないクラス名です";
        }
        //
        const lines1 = codeAll.split("\n");
        const text1 = lines1[lines1.length - 1];    // 最後の行
        const endLineNumber = lines1.length;       // 「編集可能な範囲」の終了地点
        const endColumn = text1.length + 1; // 「編集可能な範囲」の終了地点
        //
        // 「編集OKな範囲」を配列に登録する
        restrictions.push({
            range: [startLineNumber, startColumn, endLineNumber, endColumn],
            allowMultiline: true,
        });
        //
        // 編集NGな文字列を追加
        codeAll += section.code;
        //
        const lines2 = codeAll.split("\n");
        const text2 = lines2[lines2.length - 1]; // 最後の行
        startLineNumber = lines2.length;        // 次回の「編集可能な範囲」のスタート地点
        startColumn = text2.length + 1;  // 次回の「編集可能な範囲」のスタート地点
        //
        // 「編集NGな範囲」にCSSを登録する
        decorations.push({
            range: new monaco.Range(endLineNumber, endColumn, startLineNumber, startColumn),
            options: {
                isWholeLine: true,
                className: className,
                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
            }
        });
    }
    const lines = codeAll.split("\n");
    const text = lines[lines.length - 1];      // 最後の行
    const endLineNumber = lines.length;       // 「編集可能な範囲」の終了地点
    const endColumn = text.length + 1; // 「編集可能な範囲」の終了地点
    //
    // 「編集OKな範囲」を配列に登録する
    restrictions.push({
        range: [startLineNumber, startColumn, endLineNumber, endColumn],
        allowMultiline: true,
    });
    //
    //===============================================================
    // エディター初期化
    const editor = setupEditor4(codeAll, "javascript", () => handleSave(onSave, editor));
    //
    //===============================================================
    // 制約を適用する
    const constrainedInstance = constrainedEditor(monaco);
    constrainedInstance.initializeIn(editor);
    const model = editor.getModel();
    constrainedInstance.addRestrictionsTo(model, restrictions);
    //
    //===============================================================
    // CSSを適用する
    editor.createDecorationsCollection(decorations);
    //
    //===============================================================
    return editor;
}

interface RangeRestrictionObject {
    "range": Array<number>, // Should be a positive whole number
    "allowMultiline"?: Boolean,
    "label"?: String,
    "validate"?: Function
};


//#########################################################################################
//#########################################################################################
// 保存するときの処理
//#########################################################################################
//#########################################################################################

function handleSave(onSave: Savefunc, editor: monaco.editor.IStandaloneCodeEditor) {
    console.log("保存します");
    const codeAll = editor.getValue();
    const lines = codeAll.split('\n');
    //
    let decorations = editor.getDecorationsInRange(new monaco.Range(1, 1, Infinity, Infinity));
    if (!decorations) {
        decorations = [];
    }
    //
    // 装飾の情報を、文字列の上から下の順番になるように並び替える
    decorations = decorations.sort((a, b) => {
        const positionA = a.range.getStartPosition();
        const positionB = b.range.getStartPosition();
        if (positionA.isBefore(positionB)) {
            return -1;
        }
        else {
            return 1;
        }
    });
    //
    const sections: Array<Section> = [];
    let startLineNumber = 1;    // 「編集OKな範囲」のスタート地点
    let startColumn = 1; // 「編集OKな範囲」のスタート地点
    for (const decoration of decorations) {
        const className = decoration.options.className;
        if (!className) continue;
        if (!className.startsWith("START") && !className.startsWith("END")) {
            continue;
        }
        //
        // 「編集OKな範囲」を読み取る
        const code1 = _getText({
            lines,
            startLineNumber: startLineNumber,
            startColumn: startColumn,
            endLineNumber: decoration.range.startLineNumber,
            endColumn: decoration.range.startColumn,
        });
        sections.push({
            className: null,
            code: code1,
        });
        //
        // 「編集NGな範囲」を読み取る
        const code2 = _getText({
            lines,
            startLineNumber: decoration.range.startLineNumber,
            startColumn: decoration.range.startColumn,
            endLineNumber: decoration.range.endLineNumber,
            endColumn: decoration.range.endColumn,
        });
        sections.push({
            className: className,
            code: code2,
        });
        //
        startLineNumber = decoration.range.endLineNumber;        // 次回の「編集可能な範囲」のスタート地点
        startColumn = decoration.range.endColumn;  // 次回の「編集可能な範囲」のスタート地点
    }
    //
    // 「編集OKな範囲」を読み取る
    const text = lines[lines.length - 1];      // 最後の行
    const code1 = _getText({
        lines,
        startLineNumber: startLineNumber,
        startColumn: startColumn,
        endLineNumber: lines.length,       // 「編集可能な範囲」の終了地点
        endColumn: text.length + 1, // 「編集可能な範囲」の終了地点
    });
    sections.push({
        className: null,
        code: code1,
    });
    //
    onSave(sections);
}

interface GetTextParams {
    lines: Array<string>,
    startLineNumber: number,
    startColumn: number,
    endLineNumber: number,
    endColumn: number
};

// 文字列の特定の範囲を切り取る関数
function _getText({
    lines,
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
}: GetTextParams): string {
    if (startLineNumber === endLineNumber) {
        const targetLine = lines[startLineNumber - 1];
        return targetLine.substring(startColumn - 1, endColumn - 1);
    }
    else {
        let result: string = "";
        //
        // 最初の行
        const firstLine = lines[startLineNumber - 1];
        result += firstLine.substring(startColumn - 1);
        //
        // 途中
        for (let i = startLineNumber; i < endLineNumber - 1; i++) {
            result += "\n" + lines[i];
        }
        //
        // 最後の行
        const lastLine = lines[endLineNumber - 1];
        result += "\n" + lastLine.substring(0, endColumn - 1);
        //
        result = result.replaceAll("$&", "$$$$&");
        //
        return result;
    }
}