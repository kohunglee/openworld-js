/**
 * 作废！
 * 视角的控制 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 第一视角、第三视角这种视角的控制
 */

export default function(ccgxkObj) {
    var g = {
        // // 获取（和下载）当前的所有方块数据
        // setCamView : (viewType) => {
        //     const G = ccgxkObj.centerDot.init;
        //     if(viewType === 'first'){
        //         ccgxkObj.mainCamera.pos = G.camViewData[G.firstCamViewType];
        //         return 0;
        //     }
        //     if(viewType === 'third'){
        //         ccgxkObj.mainCamera.pos = G.camViewData[G.thirdCamViewType];
        //         return 0;
        //     }
        //     const totalType  = Object.keys(G.camViewData).length;
        //     G.currentCamType = (G.currentCamType + 1) % totalType;
        //     if(G.currentCamType){
        //         G.thirdCamViewType = G.currentCamType;
        //     }
        //     ccgxkObj.mainCamera.pos = G.camViewData[G.currentCamType];
        // },
        // currentCamType : 1,
        // firstCamViewType : 0,
        // thirdCamViewType : 1,

        // // 不同模式的视角数据
        // camViewData : {
        //     0 : {x: 0, y: 0.6, z: -0.5},  // 第一视角
        //     1 : {x: 0, y: 2, z: 4},  // 第三视角（较远）
        //     2 : {x: 0, y: 1.3, z: 2},  // 第三视角（较近）
        //     3 : {x: 0, y: 1.2, z: 1},  // 第三视角（很近）
        // },
    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}