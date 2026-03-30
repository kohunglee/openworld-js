import mydata from './data.js';
import signTest from './signTest.js';


const IS_FULL_STATE = 1; // 1: 完整发布状态, 0: 基础编辑状态

const COLORS = {
    FLOOR: '#ECECEA',  // A
    BASE: '#C1CBD7',   // B
    DECO: '#C5B8A5'    // C
};

const INDICES = {  // 不同物体的索引
    floor: [4, 6, 0, 2, 3, 7, 19, 17, 22, 21, 18, 20, 44, 43, 42, 45, 39, 40, 38, 37, 35, 36, 102],
    decorations: [49, 48, 47],
    signBoard: [107, 108, 109, 110, 111],
};

export default function(ccgxkObj) {
    const insts = [...mydata()];  // 导入数据

    // 处理
    if (IS_FULL_STATE) {
        ['textureGetCubeData'].forEach(id => document.getElementById(id)?.remove());  // 防止误点
        const symer = new ccgxkObj.SymOffset(insts, ccgxkObj);  // 初始化对称工具

        insts.forEach(item => { //+ 涂装颜色
            if (!item.b) item.b = COLORS.BASE;
        });
        INDICES.floor.forEach(i => insts[i] && (insts[i].b = COLORS.FLOOR));
        INDICES.decorations.forEach(i => insts[i] && (insts[i].b = COLORS.DECO));

        symer.offset([93], -0.9, 8, 'x', -0.48, 'y');  // 阵列台阶

        const arrB = [];  //+ 提取地板属性到 arrB
        INDICES.floor.forEach(i => {
            if (insts[i]) {
                arrB.push({ ...insts[i] });
                insts[i] = { "del": 1 };
            }
        });

        ccgxkObj.dataProc.process({  //+ 显示 arrB 地板
            data: arrB,
            name: 'build_lab_stage',
            type: 2,
            texture: paper02,
            mixValue: 0.8,
        });

        const arrC = [];  //+ 提取信息板属性到 arrC
        let sign_index = 1;
        INDICES.signBoard.forEach(i => {
            if (insts[i]) {
                insts[i].dz = 3;
                insts[i].t = 'testSign' + (sign_index++);
                arrC.push({ ...insts[i] });
                insts[i] = { "del": 1 };
            }
        });
        // console.log(arrC);
        signTest(arrC, ccgxkObj);
    }

    k.visCubeLen = insts.length - 1;  //+ 建造器相关
    for (let i = 0; i < 9990; i++) {
        insts.push({
            x: 1e9, y: 1e9, z: 1e9,
            w: 0.001, d: 0.001, h: 0.001,
            rx: 0, ry: 0, rz: 0,
        });
    }

    const idx = ccgxkObj.dataProc.process({  //+ 渲染 0~1w
        data: insts,
        name: 'build_lab',
        type: 1,
        texture: marble,
        mixValue: 0.8,
    });

    const rootArgs = k.indexToArgs.get(idx);  //+ 设置建造器的操纵 W ID
    if (rootArgs) {  k.wBuildInstName = `sk_${idx}_${rootArgs.dataName}`; }
}