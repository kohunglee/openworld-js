/**
 * 显示热点物体的信息 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 长宽高、位置、旋转
 */

export default function(ccgxkObj) {

    var g = {
        // 在屏幕左上角显示当前热点的信息
        showScreenHotInfo: () => {
            const G = ccgxkObj.centerDot.init;
            const Curr = ccgxkObj.hotPoint;
            if (Curr === G.showScreenHotInfo_lastId) { return }
            const info = ccgxkObj.indexToArgs.get(Curr);
            const { f } = G;
            const newHtml = info
                ? `<table class="data-table">
                    <tr>
                        <td>宽: ${f(info.width)},</td>
                        <td>高: ${f(info.height)},</td>
                        <td>深: ${f(info.depth)}</td>
                    </tr>
                    <tr>
                        <td>X: ${f(info.X)},</td>
                        <td>Y: ${f(info.Y)},</td>
                        <td>Z: ${f(info.Z)}</td>
                    </tr>
                    <tr>
                        <td>rX: ${f(info.rX)},</td>
                        <td>rY: ${f(info.rY)},</td>
                        <td>rZ: ${f(info.rZ)}</td>
                    </tr>
                </table>`
                : '';
            hotPointInfo.innerHTML = newHtml;
            G.showScreenHotInfo_lastId = Curr;
        },
        showScreenHotInfo_lastId: -1,

    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}