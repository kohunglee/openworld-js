/**
 * 
 * 这个文件存放有关 vk 运行的辅助函数
 * 
 */


// ID 转换为 英文 名字
export const id2name = n => {
    const dict = [
        "Cloud", "Stone", "River", "Field", "Leaf",
        "Hill", "Trail", "Path", "Lake", "Wave",
        "Breeze", "Light", "Glow", "Spark", "Dawn",
        "Dusk", "Sky", "Star", "Moon", "Sun",
        "Orbit", "Comet", "Nova", "Pixel", "Echo",
        "Moss", "Pine", "Cedar", "Fern", "Reed",
        "Meadow", "Brook", "Harbor", "Island", "Valley",
        "Summit", "Bridge", "Garden", "Forest", "Shell",
        "Pebble", "Coral", "Frost", "Snow", "Rain",
        "Mist", "Drift", "Flame", "Amber", "Marble"
    ];

    const mix = x => {
        x = Math.imul(x ^ (x >>> 16), 2246822507) >>> 0;
        x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0;
        x = (x ^ (x >>> 16)) >>> 0;
        return x;
    };

    let h1 = mix((n * 2654435761) >>> 0);
    let h2 = mix((h1 ^ 0x9e3779b9) >>> 0);
    let h3 = mix((h2 ^ 0x85ebca6b) >>> 0);

    const i1 = h1 % dict.length;
    let i2 = h2 % dict.length;

    if (i2 === i1) {
        i2 = (i2 + 1) % dict.length;
    }

    const num = String(h3 % 100).padStart(2, "0");

    return `${dict[i1]}-${dict[i2]}-${num}`;
};

// 设置 cookie
export function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
}

// get cookie
export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
