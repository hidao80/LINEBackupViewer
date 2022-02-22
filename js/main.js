/**
 * グローバル変数
 */
var ownerName;
var title;

/**
 * 定数
 */

/**
 * ID を入れると DOM Element を返す
 */
var _$ = id => {
    return document.getElementById(id);
}

/**
 * ID を入れると DOM Element を返す
 */
function getOutputHTML() {
    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LINE バックアップビュアー</title>
    <style>
    html{width:100vw;font-family:sans-serif}body{max-width:800px;margin:0 auto;background:#7193c1}.balloon_l{width:100%;margin:10px 0;display:flex;justify-content:flex-start}.balloon_r{width:100%;margin:10px 0;display:flex;justify-content:flex-end}.balloon_l .says{max-width:calc(80% - 50px);position:relative;padding:17px 13px 15px 18px;border-radius:12px;background:#fff;line-height:1.5;font-size:smaller;display:inline-block}.balloon_r .says{max-width:calc(80% - 50px);position:relative;padding:17px 13px 15px 18px;border-radius:12px;background:#85e249;line-height:1.5;font-size:smaller;display:inline-block}.says p{display:inline;margin:8px 0 0!important}.says p:first-child{margin-top:0!important}.says:after{content:"";position:absolute;border:10px solid transparent;top:13px}.balloon_l .says:after{left:-26px;border-right:22px solid #fff}.balloon_r .says:after{right:-26px;border-left:22px solid #85e249}.balloon_l-before{display:inline-block;width:50px;height:50px;margin-right:25px;content:'';text-align:center;border-radius:25px}.balloon_l-before>div,.balloon_r-after>div{color:#fff;font-size:1.25rem;text-shadow:0 0 2px #000;display:inline-block;line-height:50px}.balloon_r-after{display:inline-block;width:50px;height:50px;margin-left:25px;content:'';text-align:center;vertical-align:top;border-radius:25px}div.prop{padding-left:5px;padding-right:5px;color:#fff;font-size:xx-small;align-self:flex-end;display:inline-block;vertical-align:bottom;margin-bottom:1rem}div.title{text-align:center;color:#fff;vertical-align:bottom}div.date{text-align:center;color:#d3d3d3;vertical-align:bottom;font-size:xx-small}div.date:after,div.date:before{content:' ─── '}
    .hidden{display:none}#menu_bar{width:100%;display:flex}#menu_bar>button{flex:1;margin-right:1px}
</style>
</head>
<body>
    <div id="container">
        <div id="contents" class="contents">`;
    html += _$("contents").innerHTML;
    html += `<div id="footer">
        </div>
    </div>
</body>
</html>`;

    return html;
}

/**
 * LINEログファイル（プレーンテキスト）の選択
 */
function selectLogTextFile(e) {
    // ファイルの選択をしてからアップロードする
    _$("upload_file").click();
}

/**
 * 強制的に再描画させるおまじない
 */
async function repaint() {
    for (let i = 0; i < 2; i++) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
};

/**
 * LINEログファイル（プレーンテキスト）のアップロード
 */
function uploadLogTextFile(e) {
    // ファイル要素から、選択されたファイルを取得する
    const files = _$("upload_file").files;

    // ファイルが選択されていなかったら終了
    if (files.length === 0) {
        return false;
    }

    // 1つ目のファイルを取得する
    const file = files[0];

    // ボタン内のスピナーを非表示
    _$('spinner').style.display = 'none';

    // アップロードされたファイルからテキストを抽出
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
        // ユーザ名リストを本人選択モーダルダイアログにセット
        setUserNameSelect(reader.result);

        // ダイアログを表示
        $('#usersNameModal').modal('show');
    }

    _$('modal-choice').onclick = async (e) => {
        // ボタン内のスピナーを表示
        _$('spinner').style.display = 'inline-block';

        // 強制的に再描画する
        await repaint();

        ownerName = _$('userName').value.trim();

        // 成形したHTMLをプレビュー画面に適応
        _$("contents").innerHTML = convertLogTextToHTML(reader.result);

        // ダイアログを非表示
        $('#usersNameModal').modal('hide');
    };

    // Submitイベントをキャンセルする
    return false;
}

/**
 * アップロードされたログファイルからHTMLのコンテンツ部分をHTMLに変換する
 */
function convertLogTextToHTML(text) {
    let html = "";
    let groups, res, r, msg = "", line = 1, progress = 0;
    const lines = text.split(/\r\n|\n|\r/);

    for (let item of lines) {
        if ((res = item.match(/(?<at>\d\d?:\d\d)\t(?<userName>.+)\t"?(?<msg>.+)/)) !== null) {
            // メッセージの先頭行の場合
            if (msg !== "" && groups !== undefined) {
                html += writeMsg(groups, msg);
            }
            groups = res.groups;
            msg = res.groups.msg.replace(/^"/, "");  // 複数行にまたがるときの先頭のダブルクォーテーションを除去
            line++;
        } else if ((res = item.match(/^(?<date>\d+\/\d+\/\d+\(.+\)$)/)) !== null) {
            // 日付行の場合
            if (msg !== "" && groups !== undefined) {
                html += writeMsg(groups, msg);
            }
            html += `<div class="date">${res.groups.date}</div>`;
            msg = "";
            line++;
        } else if ((res = item.match(/\[LINE\]\s(?<userName>.+)とのトーク履歴/)) !== null) {
            // ファイルヘッダ行の場合
            title = res.groups.userName;
            html += `<div class="title">${title}とのトーク履歴</div>`;
            line++;
        } else if (item.match(/^保存日時：/) !== null && line <= 2) {
            // 2行目以降の保存日時行は無視する
            line++;
        } else if (item.trim() !== "") {
            // 空行でなければ、終端のダブルクォーテーションを取り除いて改行してから表示する（複数行メッセージに対応）
            msg += "<br>" + item.replace(/"$/, "");
            line++;
        }
    };

    // 最後のメッセージを出力
    html += writeMsg(groups, msg);
    return html;
}

function nameToColorCode(name) {
    return name.split('').map(char => char.charCodeAt(0)).map(byte => byte.toString(16)).join('').slice(0, 6);
}

/**
 * メッセージを出力文字列に追加
 * @param groups string matchの結果
 * @param msg string 投稿され内容
 * @returns HTML 形式の出力文字列
 */
function writeMsg(groups, msg) {
    // すでにあるメッセージをHTMLに成形
    return ownerName == groups.userName.trim()
        ? ` <div class="balloon_r">
            <div class="prop">既読<br>${groups.at}</div>
            <p class="says">${msg.trim()}</p>
            <div class="balloon_r-after" style="background-color:#${nameToColorCode(ownerName)}">
                <div>${ownerName.slice(0, 2)}</div>
            </div>
        </div>`
        : ` <div class="balloon_l">
            <div class="balloon_l-before" style="background-color:#${nameToColorCode(groups.userName)}">
                <div>${groups.userName.slice(0, 2)}</div>
                </div>
                    <p class="says">${msg.trim()}</p>
                    <div class="prop">${groups.at}</div>
                </div>
            </div>
            </div>`;
}


function setUserNameSelect(text) {
    const lines = text.split('\n');
    const users = {};
    let res;

    for (const item of lines) {
        if ((res = item.match(/(?<at>\d\d?:\d\d)\t(?<userName>.+)\t(?<firstLine>.+)/)) !== null) {
            users[res.groups.userName] = true;
        }
    }

    _$("modal-body").innerHTML = `<select name="name" id="userName"></select>`;
    for (const name in users) {
        _$("userName").innerHTML += `<option value="${name}">${name}</option>`;
    }
}

/**
 * HTMLファイルのダウンロード
 */
function downloadHTMLFile(e) {
    // アンカータグの作成
    const downLoadLink = document.createElement("a");

    // ダウンロードするHTML文章の生成
    const outputDataString = getOutputHTML();
    const downloadFileName = "[LINE] " + title + ".html"
    downLoadLink.download = downloadFileName;
    downLoadLink.href = URL.createObjectURL(new Blob([outputDataString], { type: "text/html" }));
    downLoadLink.dataset.downloadurl = ["text/html", downloadFileName, downLoadLink.href].join(":");
    downLoadLink.click();
}

window.onload = () => {
    _$("download_button").addEventListener("click", e => downloadHTMLFile(e));
    _$("upload_button").addEventListener("click", e => selectLogTextFile(e));
    _$("upload_file").addEventListener("change", e => uploadLogTextFile(e));
    _$("upload_file").addEventListener("click", e => e.target.value = "");
}
