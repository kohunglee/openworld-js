/**
 * 
 */

export const COLORS = {
    FLOOR: '#ECECEA',  // A
    BASE: '#C1CBD7',   // B
    DECO: '#C5B8A5'    // C
};

export const D = {  // 不同物体的索引
    test: expandIndices([ [266, 284] ]),

    // 一楼
    floor1h: expandIndices([[0,53]]),  // 1 楼的地板
    col1h: expandIndices([[54,70]]),  // 1 楼的柱子
    exwall: expandIndices([[71,86],[238,240]]),  // 一楼外墙
    stage1h: [262],
    stage1hrail: [287,288],  // 一楼二楼楼梯护栏

    // 二楼
    floor2h: expandIndices([[95,142],[87,94]]),  // 二楼的地板
    exwall2h: expandIndices([[143,158],[250,252]]),  // 二楼的外墙
    stage2h: [263,264],  // 二楼的台阶
    rail2h: expandIndices([[227,237],[259,261]]),  // 二楼的栏杆
    bookcase2h: [247,248,249],

    // 三楼
    floor3h: expandIndices([[159,207],[244,246]]),  // 三楼的地板
    rail3h: expandIndices([[255,258], 265, 285, 286 ]),
    inwall3h: expandIndices([ [266, 284] ]),  // 三楼的内墙
    inXWall3h: [269,270],  // 两个小墙块儿
    inXWall3h002: [19],  // 第一个屋子的缺口

    // 画板
    board1h: expandIndices([[289, 326],[377,405]]), // 一楼画板
    house1H3: expandIndices([[327, 376]]), // 三楼第一个屋的画板
    floorSign: [406,407],  // 楼层标识

};

/**
 * 展开索引数组，支持用 [start, end] 表示连续范围
 * 例如: [45, 39, [5, 18], 40] => [45, 39, 5, 6, 7, ..., 18, 40]
 */
function expandIndices(arr) {
    return arr.flatMap(item =>
        Array.isArray(item)
            ? Array.from({ length: item[1] - item[0] + 1 }, (_, i) => item[0] + i)
            : item
    );
}