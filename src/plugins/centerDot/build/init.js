/**
 * 建造师，初始化建造师（引用中心点插件）
 * ========
 * 实验中，可以移动物体
 */

import kit from './kit.js';
import data from './data.js';
import inputPanel from './inputPanel.js';
import event from './event.js';
import model from './model.js';
import cubeReferPosJS from './cubeReferPos.JS';

export default function(ccgxkObj) {


    kit(ccgxkObj);
    data(ccgxkObj);
    inputPanel(ccgxkObj);
    event(ccgxkObj);
    model(ccgxkObj);
    cubeReferPosJS(ccgxkObj);

    const G = ccgxkObj.centerDot.init;

    G.initHTML();  // 绘制 HTML

    /* ----------------------------------------------------------- */


    ccgxkObj.hooks.on('hot_action', function(ccgxkObj, e){  // 热点事件
        G.hotAction();
    });

    ccgxkObj.hooks.on('jump', function(ccgxkObj, e){  // 热点事件
        G.music('jump');
    });

    ccgxkObj.hooks.on('draw_point_before', function(ccgxkObj){  // 在显示器左上显示当前的热点信息
        G.showScreenHotInfo();
    });

    ccgxkObj.hooks.on('draw_point_before', function(ccgxkObj, e){  // 热点事件
        G.displayHotModel();  // 显示变红方块
    });

    ccgxkObj.hooks.on('close_point', function(ccgxkObj, e){  // 右键关点事件
        G.displayHotModel(true);  // 清除所有变红方块
        hotPointInfo.innerHTML = '';
    });

    document.getElementById('textureEditorCancel').addEventListener('click', function(){  // 单击 CANCEL (取消)按钮后
        G.cancelAction();
    });

    // 所有属性编辑框的 OnChange 事件
    const EdiArgsInput = document.querySelectorAll('.EdiArgsInput');  // 那一大堆 OBJ 属性框
    EdiArgsInput.forEach(input => {
        G.onchangeForeach(input);
    });

    // 一些键盘事件
    document.addEventListener('keydown', G.keyEvent);
    document.addEventListener('keyup', function(){
        document.addEventListener('keydown', G.keyEvent);
    });

    // 单击画面，退出编辑
    document.getElementById('myHUDModal').addEventListener('click', (event)=>{
        G.onclickView(event);
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

    // 单击形状【预设】按钮
    e_presets.addEventListener('click', G.e_presets );

    // 单击位置【归整】（四舍五入）
    e_round.addEventListener('click', G.e_round );

    // 单击旋转【归零】按钮
    e_zero.addEventListener('click', G.e_zero);

    // 单击【删除】按钮
    e_delete.addEventListener('click', G.e_delete);

    // 基点 左上右下
    e_bassL.addEventListener('click', (e)=>{G.bassSet(e, 0)});
    e_bassT.addEventListener('click', (e)=>{G.bassSet(e, 1)});
    e_bassR.addEventListener('click', (e)=>{G.bassSet(e, 2)});
    e_bassB.addEventListener('click', (e)=>{G.bassSet(e, 3)});
}

