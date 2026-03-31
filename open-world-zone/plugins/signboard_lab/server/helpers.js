export function sendJson(res, data, status = 200) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(data));
}

export function readBody(req, callback) {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => callback(Buffer.concat(chunks).toString('utf-8')));
}
