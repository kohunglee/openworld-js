/**
 * 和输入框、模型有关的函数组件 (建造师，初始化建造师（引用中心点插件）)
 * ========
 * 实验中，可以移动物体
 */

export default function(ccgxkObj) {
    
    var g = {

        /**
         * 从 backupEdi 里拿数据填充编辑区
         * @function insertEdiFromBackUp
         * @returns {void}
         */
        insertEdiFromBackUp : () => {
            const G = ccgxkObj.centerDot.init;
            const indexArgs = G.backupEdi;
            objWidth.value = indexArgs.width;
            objHeight.value = indexArgs.height;
            objDepth.value = indexArgs.depth;
            objPosX.value = indexArgs.X;
            objPosY.value = indexArgs.Y;
            objPosZ.value = indexArgs.Z;
            objRotX.value = indexArgs.rX;
            objRotY.value = indexArgs.rY;
            objRotZ.value = indexArgs.rZ;
        },

    };

    ccgxkObj.centerDot.init = {...g, ...ccgxkObj.centerDot.init};
}
