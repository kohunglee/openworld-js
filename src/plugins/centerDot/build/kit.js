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

        // 保留小数使用
        f : (num, digits = 2) => {
            if (typeof num !== 'number' || num % 1 === 0) {
                return num;
            }
            num = +num.toFixed(digits);
            const shifter = Math.pow(10, digits); // 创造一个放大/缩小的工具 (100)
            return Math.trunc(num * shifter) / shifter;
        },

        // 一些在模态框显示时的禁止监听键盘事件的场景
        disListen : () => {
            if(myHUDModal.hidden === false){ return false;}
        },

        // 音效映射关系
        musicMap : {  // 映射关系
            'closeEdi' : 'coin0',
            'openEdi'  : 'coin0',
            'closePoint'   : 'wood',
            'openPoint'    : 'wood',
            'jump'         : 'sa',
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
            const G = ccgxkObj.centerDot.init;
            const EdiArgsInput = document.querySelectorAll('.EdiArgsInput');  // 那一大堆 OBJ 属性框
            EdiArgsInput.forEach(input => {
                G.stepValue = stepValue;
                input.step = stepValue;
            })
        },
        stepValue : 0.1,

        // 返回 0~360 度之内的度数
        nDeg : (degree) => {
            return ((degree % 360) + 360) % 360;
        },

        // 方便添加 class
        _applyClassToIds : (elementIds, className) => {
            elementIds.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.classList.add(className);
                }
            });
        },

        // 根据物体的朝向之象限，计算哪根轴是它的正方向（主要供绘制 CSS 上下箭头使用）
        calForwardAxis : (myAngle, boxAngle) => {
            const directions = [
                { axis: 'z', nega: true },
                { axis: 'x', nega: false },
                { axis: 'z', nega: false },
                { axis: 'x', nega: true },
            ];
            const delta = (boxAngle - myAngle + 360) % 360;
            const quadrantIndex = Math.round(delta / 90) % 4;
            return directions[quadrantIndex];
        },
    }

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
            margin-top: 6em;
            width: 370px;
            text-align: center;
            background-color: #ffffff08;
            padding: 20px;
            backdrop-filter: blur(1px);
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
            font-family: monospace;
            color: white;
        }
        #hotPointInfo td {
            min-width: 80px;
        }

        /* webgl canvas */
        /* 可提醒用户单击画面 */
        #vistaCanv, .myHUD-modal {
            cursor: pointer;
        }

        /* 高级选项展开按钮 */
        .moreopt-btn {
            cursor: pointer;
            padding-top: 9px;
            user-select: none;
        }
        /* 高级选项面板 */
        .moreopt-panel {
            background: #ffffff0d;
            padding: 10px;
            margin-top: 5px;
        }

        /* 编辑器的字上的前后标志 */
        .e-panel-T:before {
            content: '↑';
            position: absolute;
            margin-left: -7px;
            margin-top: -3px;
            color: #ffffff;
            font-size: 10px;
            background: #0000004d;
        }
        .e-panel-D:before {
            content: '↓';
            position: absolute;
            margin-left: -7px;
            margin-top: -3px;
            color: #ffffff;
            font-size: 10px;
            background: #0000004d;
        }

        /* 基点的临时的样式 */
        .editor-bass {
            position: absolute;
            left: 315px;
            top: 190px;
        }
        .editor-bass button {
            position: absolute;
            height: 20px;
            width: 20px;
        }
        button#e_bassL {
            left: -11px;
            top: 40px;
        }
        button#e_bassB {
            left: 14px;
            top: 60px;
        }
        button#e_bassR {
            left: 40px;
            top: 40px;
        }
        button#e_bassT {
            top: 19px;
            left: 14px;
        }
        span.editor-bass-info {
            position: absolute;
            width: 32px;
            top: 38px;
            left: 9px;
        }

        /* 神奇数字叠加值 */
        div#magicNumDiv {
            position: absolute;
            top: 10px;
            left: 10px;
        }
        input#magicNum {
            width: 80px;
        }
    </style>
    <div id='hotPointInfo'></div>
    <div id="myHUDModal" class="myHUD-modal" hidden>
        <div class="myHUD-modalPos" id="myHUDObjEditor">
            <div id='objEditor'>
                <div>
                    <span id="textureEditorInfo"></span>
                </div>
                index: <input type="number" id="objID" name="objID" min="0" max="99999999" step="1" readonly>
                <button class="texture-copyCubes" id="textureCopyCubes">复制(+1)</button>
                <hr>
                <span id="etext_w">宽:</span> <input type="number" class="EdiArgsInput" id="objWidth" name="objWidth" min="0.1">
                高: <input type="number" class="EdiArgsInput" id="objHeight" name="objHeight" min="0.1">
                <span id="etext_d">纵:</span> <input type="number" class="EdiArgsInput" id="objDepth" name="objDepth" min="0.1">&nbsp;<button id="e_presets">预设</button><br><br>
                <span id="etext_x">X:</span> <input type="number" class="EdiArgsInput" id="objPosX" name="objPosX">
                Y: <input type="number" class="EdiArgsInput" id="objPosY" name="objPosY">
                <span id="etext_z">Z:</span> <input type="number" class="EdiArgsInput" id="objPosZ" name="objPosZ">&nbsp;&nbsp;&nbsp;&nbsp;<button id="e_round">归整</button><br><br>
                <span id="etext_rx">rx:</span> <input type="number" class="EdiArgsInput" id="objRotX" name="objRotX">
                ry: <input type="number" class="EdiArgsInput" id="objRotY" name="objRotY">
                <span id="etext_rz">rz:</span> <input type="number" class="EdiArgsInput" id="objRotZ" name="objRotZ">&nbsp;&nbsp;<button id="e_zero">归零</button><br>
                <div class="editor-bass">
                    <span class="editor-bass-info">基点</span>
                    <button class="texture-editorBtn" id="e_bassL"></button>
                    <button class="texture-editorBtn" id="e_bassT"></button>
                    <button class="texture-editorBtn" id="e_bassR"></button>
                    <button class="texture-editorBtn" id="e_bassB"></button>
                </div>
                <div class="magicNumDiv-class" id="magicNumDiv">
                    <input type="number" class="magicNum-input" id="magicNum" name="magicNum" hidden>
                </div>
                <hr>
                <input type="checkbox" name="isRealTimeUpdata" id="isRealTimeUpdata" checked> 实时更新 
                <input type="checkbox" name="rollerPlus" id="rollerPlus" checked> 滚轮加减
                <br>
                <button class="texture-editorBtn" id="textureEditorReset">恢复</button>
                <button class="texture-editorBtn" id="textureEditorOk">确认</button>
                <button class="texture-editorBtn" id="textureEditorClose">关闭</button>
                <button class="texture-editorBtn" id="textureEditorCancel">退出</button><br>
                <details>
                    <summary class="moreopt-btn">更多选项</summary>
                    <div class="moreopt-panel">
                        <button class="texture-editorBtn" id="e_delete">删除</button>
                        &nbsp;&nbsp;
                        颜色:<input type="color" class="EdiArgsInput" id="objColor" name="objColor" value="#888888">
                        &nbsp;&nbsp;
                    </div>
                </details>
                <hr>
                <button class="texture-saveCubeData" id="textureSaveCubeData">保存数据</button>
                <button class="texture-getCubeData" id="textureGetCubeData">下载数据</button>
            </div>
        </div>
    </div>
`;