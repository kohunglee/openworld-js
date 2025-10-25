/**
 * 
 * 这个文件存放有关 vk 运行的辅助函数
 * 
 */


// ID 转换为 中文 名字
const id2name = n => {
    const dict = "青玄影白寒月江晴语润晓远比尔盖茨马斯克安倍晋三苍井空户晨风蔡徐坤特朗普溥仪张学良爱新觉罗康熙乾隆雍正蒋介石";
    let h = (n * 2654435761) >>> 0; // Knuth 哈希
    let name = "";
    for (let i = 0; i < 3; i++) {
        h ^= h >>> 13;
        h = Math.imul(h, 1274126177) >>> 0; // 保证 32 位无符号整数
        name += dict[h % dict.length];
    }
    return name;
};