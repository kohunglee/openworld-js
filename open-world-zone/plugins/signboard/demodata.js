/**
 * 供测试使用的临时数据
 */
export default function(ccgxkObj) {
    console.log('临时测试');

    const data = [
        {"x":11.902,"y":10,"z":11.769,"w":10,"h":10, "dz": 1, "st": 1, "t":"eastSign"},
    ];

    ccgxkObj.dataProc.process({
        data: data,
        name: 'texture-test',
        type: 1,
        invisible: false, noIns: true,  // 纹理使用这种组合
    });
}