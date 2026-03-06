/**
 * 一些辅助库
 */
export default function(ccgxkObj) {

    // 工具函数
    const kit = {

        // 统一几个主要配色
        libRed : '#e27b7bff',  // 主题色 红色
        libWhite : '#d8e1d8ff',  // 主题色 白色

        // 方向标
        dirSign : (ctx, width, height, text) => {
            const wp = width / 100;
            const hp = height / 100;

            ctx.fillStyle = '#d8e1d8ff';  //+ 背景
            ctx.fillRect(0, 0, width, height);

            
            ctx.font = `900 ${50 * hp}px "Microsoft YaHei", sans-serif`;  //+ 主标题
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = kit.libRed;
            ctx.fillText(text, 50 * wp, 50 * hp);
        },
    };

    // 用于钩子使用的函数
    kit.signFunc = {

        // 东 标
        eastSign : (ctx, width, height, drawItem, _this) => {
            kit.dirSign(ctx, width, height, '东');
        },

    };

    return kit;
}