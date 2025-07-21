/**
 * 简易仪表盘插件
 * ========
 * 显示 FPS 、物体数量、内存占用等
 */

// 插件入口
export default function(ccgxkObj) {
    // console.log('ybp');
    // const template = document.createElement('template');  //+4 将 html 节点添加到文档
    // template.innerHTML = htmlCode;
    // const content = template.content.cloneNode(true);
    // document.body.appendChild(content);


    
}

const htmlCode = `
<style>
    .myHUD {
        position: absolute;
        bottom: 0;
        padding: 0.3em;
        color: #ffffff;
    }
</style>
<div id="myHUD" class="myHUD">
    <div id="fpsInfo"></div>
    <span id="shiftInfo"></span>
    <span id="posInfo"></span>
    <span id="metrics"></span>
    <span id="cpuInfo"></span>
    <span id="modListCount"></span>
    <span id="posIDMVP"></span>
</div>
`;