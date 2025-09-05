/**
 * 建造师，初始化建造师（引用中心点插件）
 * ========
 * 实验中，可以移动物体
 */

import music from './music.js';
import testMould from './testMould.js';

export default function(ccgxkObj) {
    console.log('centerDot init');

    /* -------------------------------------------------------------------- */

    music(ccgxkObj);
    testMould(ccgxkObj);
    

    k.W.cube({  //  参考位置
        g:'mainPlayer',
        n:'new_cube_pos',
        y: 0,
        x: 0,
        z: -5,
        w:1,  h:1,  d:1,
        b:'#bbbbbb46',
    });

    const G = ccgxkObj.centerDot.init;

    G.initHTML();  // 绘制 HTML
    ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){  // 热点事件
        G.hotAction();
    });

    ccgxkObj.hooks.on('draw_point_before', function(ccgxkObj, e){  // 热点事件
        G.displayHotModel();  // 显示变红方块
    });

    ccgxkObj.hooks.on('close_point', function(ccgxkObj, e){  // 右键关点事件
        G.displayHotModel(true);  // 清除所有变红方块
    });

    document.getElementById('textureEditorCancel').addEventListener('click', function(){  // 单击 CANCEL (取消)按钮后
        myHUDModal.hidden = true;  // 隐藏模态框
        ccgxkObj.drawPointPause = false;  // 恢复绘制
        G.lockPointer();  // 锁定鼠标
        ccgxkObj.centerDot.closePoint(ccgxkObj);  // 关闭小点
        G.displayHotModel(true);  // 清除所有的变红方格
        G.music('closeEdi');  // 关闭编辑器（音效）
    });

    // 所有属性编辑框的 OnChange 事件
    const EdiArgsInput = document.querySelectorAll('.EdiArgsInput');  // 那一大堆 OBJ 属性框
    EdiArgsInput.forEach(input => {
        input.addEventListener('change', ()=>{
            G.modelUpdate();
        });  // onchange 事件
        input.addEventListener('mouseover', () => {  // 鼠标悬浮属性值上，自动焦点
            if(isRealTimeUpdata.checked === false){ return 0; }
            if(rollerPlus.checked === false){ return 0; }
            input.focus();
         });  // 悬浮激活焦点
        input.addEventListener('wheel', (event) => {  // 滚轮增减数字大小
            if(isRealTimeUpdata.checked === false){ return 0; }
            if(rollerPlus.checked === false){ return 0; }
            event.preventDefault();
            var step = 0.1;
            var minValue = event.target.min;
            var currentValue = +input.value;
            if (event.deltaY < 0) {
                currentValue += step;
            } else if (event.deltaY > 0) {
                currentValue -= step;
            }
            if(!minValue || (minValue && (currentValue > minValue)) ){
                input.value = currentValue;
                G.modelUpdate();
            }
        }, { passive: false });
    });

    // 一些键盘事件
    document.addEventListener('keydown', G.keyEvent);
    document.addEventListener('keyup', function(){
        document.addEventListener('keydown', G.keyEvent);
    });

    // 单击画面，退出编辑
    document.getElementById('myHUDModal').addEventListener('click', (event)=>{
        if(event.target.id === 'myHUDModal' || event.target.id === 'textureEditorClose') {
            myHUDModal.hidden = true;  // 隐藏模态框
            G.lockPointer();  // 锁定鼠标
            ccgxkObj.drawPointPause = false;  // 恢复绘制
            G.displayHotModel(true);
            G.music('closeByClick');
        }
    });

    // 单击确认按钮（更新模型）
    textureEditorOk.addEventListener('click',  function(){
        G.modelUpdate(null, -1, true);
    } );

    // 【实时更新】勾选框 和 确认按钮 两个只显示一个
    isRealTimeUpdata.addEventListener('change', ()=>{
        textureEditorOk.hidden = isRealTimeUpdata.checked;
    });
    textureEditorOk.hidden = isRealTimeUpdata.checked;

    // 单击复制 +1 按钮
    textureCopyCubes.addEventListener('click', () => {
        G.operaCube(0);
    });

    // 单击恢复按钮
    textureEditorReset.addEventListener('click', () => {
        G.insertEdiFromBackUp();  // 填充数据
        G.modelUpdate();  // 根据数据更新模型
    });
    
    // 获取方块的数据
    textureGetCubeData.addEventListener('click', () => {
        G.getCubesData();
    });

    // 所有编辑框在按住 shift 的同时，增幅变为 1
    G.setInputsStep('0.1');
    document.addEventListener('keydown', (event) => { if (event.key === 'Shift') { G.setInputsStep('1') } });
    document.addEventListener('keyup', (event) => { if (event.key === 'Shift') { G.setInputsStep('0.1') } });
    window.addEventListener('blur', () => { G.setInputsStep('0.1') });  // 窗口失去焦点时，增幅变为 0.1
}

