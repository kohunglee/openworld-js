function csvread(){
    (async () => {
        k.siteFront1000 = await loadCSV('./house/data/data.csv');
        console.log('SVG 完成', k.siteFront1000.length, 'rows');
        for(let i = 0; i < k.siteFront1000.length; i++){
            // globalThis.testArr[i] = k.siteFront1000[i][2];
        }
    })();
}


// 阅读 csv 函数
async function loadCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.trim().split(/\r?\n/);
  return rows.map(line => {
    const cols = line.split(',');
    // const obj = {};
    // for (let i = 0; i < cols.length; i++) obj['col' + i] = cols[i];
    const arr = [];
    for (let i = 0; i < cols.length; i++) arr.push(cols[i]);
    return arr;
  });
}

