// 阅读 csv 函数
async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.trim().split(/\r?\n/);
  return rows.map(line => {
    const cols = line.split(',');
    const arr = [];
    for (let i = 0; i < cols.length; i++) arr.push(cols[i]);
    return arr;
  });
}