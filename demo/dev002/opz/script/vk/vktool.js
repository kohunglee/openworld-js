/**
 * 
 * 这个文件存放有关 vk 运行的辅助函数
 * 
 */


// ID 转换为 中文 名字
const id2name = n => {
    const dict = "明月星光云风雨花竹柳山海江河松林天地火雷电虹雪霜冰夜晨秋夏春冬清蓝白红紫金玉银珠珍珊彩音乐安平静远志梦心";
    let h = (n * 2654435761) >>> 0; // Knuth 哈希
    let name = "";
    for (let i = 0; i < 3; i++) {
        h ^= h >>> 13;
        h = Math.imul(h, 1274126177) >>> 0; // 保证 32 位无符号整数
        name += dict[h % dict.length];
    }
    return name;
};

// 设置 cookie
function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
}

// get cookie
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}