import fs from "fs";

const enc = new TextEncoder();

function writeString(bufs, text) {
  const bytes = enc.encode(text ?? "");
  if (bytes.length > 255) throw new Error("字符串过长！");
  bufs.push(Uint8Array.of(bytes.length));
  bufs.push(bytes);
}

function csvToCompactBin(input, output) {
  const text = fs.readFileSync(input, "utf8").trim();
  const lines = text.split(/\r?\n/);
  const hasHeader = !/^\d+[,]/.test(lines[0]);
  if (hasHeader) lines.shift();

  const chunks = [];

  for (const line of lines) {
    const [id, domain, zh, en, desc, cat] = parseCSVLine(line);
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, +id || 0, true);
    chunks.push(new Uint8Array(view.buffer));
    writeString(chunks, domain);
    writeString(chunks, zh);
    writeString(chunks, en);
    writeString(chunks, desc);
    writeString(chunks, cat);
  }

  const result = Buffer.concat(chunks);
  fs.writeFileSync(output, result);
  console.log(`✅ 写出 ${lines.length} 条记录 → ${output} (${result.length} bytes)`);
}

function parseCSVLine(line) {
  const result = [];
  let current = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'; i++;
      } else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

const [,, input, output] = process.argv;
if (!input || !output) {
  console.log("用法: node build-bin.js data.csv data.bin");
  process.exit(1);
}
csvToCompactBin(input, output);
