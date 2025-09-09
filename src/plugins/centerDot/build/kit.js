/**
 * 辅助小工具、音效、变量等组件，基本不依赖其他库 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    var g = {
        // 需要建造的 html 内容
        htmlCode : htmlCode,

        // 当前的索引的固定值（防止被更改）
        indexHotCurr : -1,

        // 备份当前的编辑器内容，用于恢复
        backupEdi : null,

        // 将 HTML 绘制到页面上
        initHTML : () => {
            const G = ccgxkObj.centerDot.init;
            const template = document.createElement('template');  //+4 将 html 节点添加到文档
            template.innerHTML = G.htmlCode;
            const content = template.content.cloneNode(true);
            document.body.appendChild(content);
        },

        // 保留小数使用，智能修剪
        f : (num, digits = 2) => {
            if (typeof num !== 'number' || num % 1 === 0) {
                return num;
            }
            const shifter = Math.pow(10, digits); // 创造一个放大/缩小的工具 (100)
            return Math.trunc(num * shifter) / shifter;
        },

        // 一些禁止监听键盘事件的场景
        disListen : () => {
            if(myHUDModal.hidden === false){ return false;}
        },

        // 音效映射关系
        musicMap : {  // 映射关系
            'closeEdi' : 'coin0',
            'openEdi'  : 'coin0',
            'closeByClick' : 'coin0',
            'closePoint'   : 'wood',
            'openPoint'    : 'wood',
            'jump'         : 'nudge',
            'frozen'       : 'alien',
            'unfrozen'     : 'unfrozen',
            'addCube0'     : 'ting',
        },

        // 音乐播放器
        music : (myevent) => {
            const G = ccgxkObj.centerDot.init;
            const obj = ccgxkObj;
            const list = obj.sound;
            obj.audio(list[G.musicMap[myevent]]);
        },

        // 辅助函数，批量设置 EdiArgsInput 的 number 的 step
        setInputsStep : (stepValue) => {
            const EdiArgsInput = document.querySelectorAll('.EdiArgsInput');  // 那一大堆 OBJ 属性框
            EdiArgsInput.forEach(input => {
                input.step = stepValue;
            })
        },
    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}


// 建造师的 html 内容
const htmlCode = `
    <style>
        /* 模态框 */
        .myHUD-modal {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100vw;
            height: 100vh;
            transform: translate(-50%, -50%);
            z-index: 999;
        }
        .myHUD-modalPos {
            margin-left: calc(50% - 140px);
            margin-top: 1em;
            /* transform: translate(-50%, -50%); */
            width: 280px;
            text-align: center;
            background-color: rgba(51, 204, 111, 0.07);
            padding: 20px;
            backdrop-filter: blur(1px);
            /* background-color: aliceblue; */
        }
        .texture-editorBtn-lab {
            display: inline-block;
            background: rgb(32 32 32);
            color: rgb(255, 255, 255);
            padding: 5px 5px;
            border: none;
            cursor: pointer;
            margin: 5px;
            font-size: 14;
            color: #bbbbbb;
        }
        .EdiArgsInput, #objID {
            background-color: #fff0f066;
            width: 56px;
        }

        /* 热点的信息 */
        #hotPointInfo {
            position: fixed;
            top: 72px;
            left: 10px;
        }

        /* webgl canvas */
        /* 可提醒用户单击画面 */
        #vistaCanv, .myHUD-modal {
            cursor: pointer;
        }
    </style>
    <div id='hotPointInfo'>XYZ</div>
    <div id="myHUDModal" class="myHUD-modal" hidden>
        <div class="myHUD-modalPos">
            <div>
                <div>
                    <span id="textureEditorInfo"></span>
                </div>
                index: <input type="number" id="objID" name="objID" min="0" max="99999999" step="1" readonly>
                <button class="texture-copyCubes" id="textureCopyCubes">复制(+1)</button>
                <hr>
                宽: <input type="number" class="EdiArgsInput" id="objWidth" name="objWidth" min="0.1">
                高: <input type="number" class="EdiArgsInput" id="objHeight" name="objHeight" min="0.1">
                纵: <input type="number" class="EdiArgsInput" id="objDepth" name="objDepth" min="0.1"><br><br>
                X: <input type="number" class="EdiArgsInput" id="objPosX" name="objPosX">
                Y: <input type="number" class="EdiArgsInput" id="objPosY" name="objPosY">
                Z: <input type="number" class="EdiArgsInput" id="objPosZ" name="objPosZ"><br><br>
                rx: <input type="number" class="EdiArgsInput" id="objRotX" name="objRotX">
                ry: <input type="number" class="EdiArgsInput" id="objRotY" name="objRotY">
                rz: <input type="number" class="EdiArgsInput" id="objRotZ" name="objRotZ"><br><br>
                <hr>
                <input type="checkbox" name="isRealTimeUpdata" id="isRealTimeUpdata" checked> 实时更新 
                <input type="checkbox" name="rollerPlus" id="rollerPlus" checked> 滚轮加减
                <br><br>
                <button class="texture-editorBtn" id="textureEditorReset">恢复</button>
                <button class="texture-editorBtn" id="textureEditorOk">确认</button>
                <button class="texture-editorBtn" id="textureEditorClose">关闭</button>
                <button class="texture-editorBtn" id="textureEditorCancel">退出</button>
                <hr>
                <button class="texture-getCubeData" id="textureGetCubeData">获取数据</button>
            </div>
        </div>
    </div>
`;