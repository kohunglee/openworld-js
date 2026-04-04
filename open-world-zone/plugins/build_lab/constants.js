/**
 * 
 */

// export const IS_FULL_STATE = +new URLSearchParams(location.search).get('isBuild'); // 1: 完整发布状态, 0: 基础编辑状态

export const COLORS = {
    FLOOR: '#ECECEA',  // A
    BASE: '#C1CBD7',   // B
    DECO: '#C5B8A5'    // C
};

export const INDICES = {  // 不同物体的索引
    floor: [4, 6, 0, 2, 3, 7, 19, 17, 22, 21, 18, 20, 44, 43, 42, 45, 39, 40, 38, 37, 35, 36, 102],
    decorations: [49, 48, 47],
    signBoard: [107,108,109,110,111,112,113,114,
                115,116,117,118,119,120,121,122,123,124,
                125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,
                146,147
            ],
};
