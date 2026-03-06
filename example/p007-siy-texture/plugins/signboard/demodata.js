/**
 * 供测试使用的临时数据
 */
export default function(ccgxkObj) {
    const demo = {};

    demo.func = {

        // 东 标
        eastSign : (ctx, width, height, drawItem, _this) => {
            signboard.dirSign(ctx, width, height, '东');
        },

        // 方向标
        dirSign : (ctx, width, height, text) => {
            const wp = width / 100;
            const hp = height / 100;

            ctx.fillStyle = '#d8e1d8ff';  //+ 背景
            ctx.fillRect(0, 0, width, height);

            // 主标题
            ctx.font = `900 ${50 * hp}px "Microsoft YaHei", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = signboard.libRed;
            ctx.fillText(text, 50 * wp, 50 * hp);
        },

    };

    return demo;
}