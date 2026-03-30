#!/usr/bin/env python3
"""
build_lab 本地开发服务器
用法: python3 server.py
然后访问: http://localhost:8899/admin.html
"""

import http.server
import json
import os
import urllib.parse
from pathlib import Path

PORT = 8899
BASE_DIR = Path(__file__).parent
SIGNS_FILE = BASE_DIR / "signsData.js"


class BuildLabHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_GET(self):
        if self.path == "/api/signs":
            self.handle_get_signs()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/signs":
            self.handle_save_signs()
        else:
            self.send_error(404)

    def handle_get_signs(self):
        """读取 signsData.js 并返回 JSON"""
        try:
            content = SIGNS_FILE.read_text(encoding="utf-8")
            # 提取 export default { ... } 中的内容
            import re
            match = re.search(r"export\s+default\s*(\{[\s\S]*\});?\s*$", content.strip())
            if not match:
                self.send_error(500, "无法解析 signsData.js: 找不到 export default")
                return

            obj_str = match.group(1)
            # 用正则将 JS 对象转成合法 JSON
            # 1. 只给行首的未加引号的 key 加引号（避免影响字符串值内的 URL）
            obj_str = re.sub(r'^(\s*)(\w+)\s*:', r'\1"\2":', obj_str, flags=re.MULTILINE)
            # 2. 移除尾随逗号 (,] 或 ,})
            obj_str = re.sub(r',\s*([}\]])', r'\1', obj_str)

            data = json.loads(obj_str)
            self.send_json(data)
        except Exception as e:
            print(f"❌ 解析错误: {e}")
            self.send_error(500, f"解析错误: {e}")

    def handle_save_signs(self):
        """保存 JSON 到 signsData.js"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)

            # 生成 JS 文件内容
            js_content = """/**
 * 信息板数据配置
 * 由 admin.html 自动生成
 */
export default """
            js_content += json.dumps(data, ensure_ascii=False, indent=2)
            js_content += ";\n"

            SIGNS_FILE.write_text(js_content, encoding="utf-8")
            print(f"✅ 已保存到 {SIGNS_FILE}")

            self.send_json({"success": True, "message": "保存成功"})
        except Exception as e:
            self.send_error(500, str(e))

    def send_json(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        # 简化日志
        try:
            msg = format % args if args else format
            if "/api/" in msg:
                print(f"📡 {msg}")
        except:
            pass  # 忽略格式化错误


if __name__ == "__main__":
    print(f"""
╔════════════════════════════════════════════╗
║   build_lab 本地开发服务器                 ║
╠════════════════════════════════════════════╣
║   管理页面: http://localhost:{PORT}/admin.html     ║
║   API:       GET/POST /api/signs           ║
║   按 Ctrl+C 停止服务器                      ║
╚════════════════════════════════════════════╝
""")
    server = http.server.HTTPServer(("", PORT), BuildLabHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
