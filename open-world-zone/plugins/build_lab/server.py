#!/usr/bin/env python3
"""
build_lab 本地开发服务器
用法: python3 server.py
然后访问: http://localhost:8899/admin.html
"""

import http.server
import json
import os
import re
import urllib.parse
from pathlib import Path

PORT = 8899
BASE_DIR = Path(__file__).parent
SIGNS_FILE = BASE_DIR / "signsData.js"
CANVAS_LIB_FILE = BASE_DIR / "CustomCanvasLib.js"


class BuildLabHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_GET(self):
        if self.path == "/api/signs":
            self.handle_get_signs()
        elif self.path == "/api/canvas-lib":
            self.handle_get_canvas_lib()
        else:
            super().do_GET()

    def do_POST(self):
        # 注意：更具体的路径要先匹配
        if self.path == "/api/signs":
            self.handle_save_signs()
        elif self.path == "/api/canvas-lib/add":
            self.handle_add_canvas_func()
        elif self.path == "/api/canvas-lib":
            self.handle_save_canvas_lib()
        else:
            self.send_error(404)

    def do_DELETE(self):
        if self.path.startswith("/api/canvas-lib/"):
            func_name = self.path[len("/api/canvas-lib/"):]
            self.handle_delete_canvas_func(func_name)
        else:
            self.send_error(404)

    def handle_get_signs(self):
        """读取 signsData.js 并返回 JSON"""
        try:
            content = SIGNS_FILE.read_text(encoding="utf-8")
            # 提取 export default { ... } 中的内容
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

    def handle_get_canvas_lib(self):
        """读取 CustomCanvasLib.js 并返回函数列表"""
        try:
            content = CANVAS_LIB_FILE.read_text(encoding="utf-8")
            # 提取 export default { ... } 中的内容
            match = re.search(r"export\s+default\s*(\{[\s\S]*\});?\s*$", content.strip())
            if not match:
                self.send_error(500, "无法解析 CustomCanvasLib.js")
                return

            obj_str = match.group(1)
            # 解析函数名和函数体
            funcs = {}
            # 匹配 函数名: (ctx, w, h) => { ... } 或 函数名: function(ctx, w, h) { ... }
            pattern = r'(\w+)\s*:\s*(?:function\s*)?\([^)]*\)\s*=>?\s*\{'
            pos = 0
            while True:
                m = re.search(pattern, obj_str[pos:])
                if not m:
                    break
                func_name = m.group(1)
                start = pos + m.end()
                # 找到匹配的 }
                brace_count = 1
                i = start
                while i < len(obj_str) and brace_count > 0:
                    if obj_str[i] == '{':
                        brace_count += 1
                    elif obj_str[i] == '}':
                        brace_count -= 1
                    i += 1
                func_body = obj_str[start:i-1].strip()
                funcs[func_name] = func_body
                pos = i

            self.send_json({"success": True, "functions": funcs})
        except Exception as e:
            print(f"❌ 解析 canvas-lib 错误: {e}")
            self.send_error(500, f"解析错误: {e}")

    def handle_save_canvas_lib(self):
        """保存单个函数到 CustomCanvasLib.js"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)
            func_name = data.get("name")
            func_body = data.get("body")

            if not func_name or func_body is None:
                self.send_error(400, "缺少 name 或 body")
                return

            # 读取现有内容
            content = CANVAS_LIB_FILE.read_text(encoding="utf-8")

            # 检查函数是否存在
            pattern = rf'{func_name}\s*:\s*(?:function\s*)?\([^)]*\)\s*=>?\s*\{{'
            match = re.search(pattern, content)
            if not match:
                self.send_error(404, f"函数 {func_name} 不存在")
                return

            # 找到函数体结束位置
            func_start = match.start()
            brace_start = match.end() - 1
            brace_count = 1
            i = match.end()
            while i < len(content) and brace_count > 0:
                if content[i] == '{':
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                i += 1
            func_end = i

            # 检查函数后面是否有逗号
            after_func = content[func_end:].lstrip()
            has_comma = after_func.startswith(',')

            # 构建新函数（始终加逗号）
            new_func = f"  {func_name}: (ctx, w, h) => {{\n{func_body}\n  }},"

            # 替换
            content = content[:func_start] + new_func + content[func_end + (1 if has_comma else 0):]

            CANVAS_LIB_FILE.write_text(content, encoding="utf-8")
            print(f"✅ 已更新函数 {func_name}")
            self.send_json({"success": True, "message": f"函数 {func_name} 已更新"})
        except Exception as e:
            self.send_error(500, str(e))

    def handle_add_canvas_func(self):
        """新增一个绘制函数"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)
            func_name = data.get("name")

            if not func_name:
                self.send_error(400, "缺少函数名")
                return

            # 验证函数名（只允许字母数字下划线）
            if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', func_name):
                self.send_error(400, "函数名只能包含字母、数字和下划线，且不能以数字开头")
                return

            # 读取现有内容
            content = CANVAS_LIB_FILE.read_text(encoding="utf-8")

            # 检查函数是否已存在
            pattern = rf'{func_name}\s*:'
            if re.search(pattern, content):
                self.send_error(400, f"函数 {func_name} 已存在")
                return

            # 在 export default { 后插入新函数
            new_func = f"  {func_name}: (ctx, w, h) => {{\n    // TODO: 实现绘制逻辑\n  }}"

            # 找到最后一个函数后面的位置
            match = re.search(r'export\s+default\s*\{', content)
            if match:
                insert_pos = match.end()
                # 找到对象末尾的 }
                brace_count = 1
                i = insert_pos
                while i < len(content) and brace_count > 0:
                    if content[i] == '{':
                        brace_count += 1
                    elif content[i] == '}':
                        brace_count -= 1
                    i += 1
                end_brace = i - 1
                # 在 } 前插入，确保前一个属性也有逗号
                prefix = content[:end_brace].rstrip()
                if not prefix.endswith(','):
                    prefix += ','
                content = prefix + '\n' + new_func + ",\n" + content[end_brace:]

            CANVAS_LIB_FILE.write_text(content, encoding="utf-8")
            print(f"✅ 已新增函数 {func_name}")
            self.send_json({"success": True, "message": f"函数 {func_name} 已创建"})
        except Exception as e:
            self.send_error(500, str(e))

    def handle_delete_canvas_func(self, func_name):
        """删除一个绘制函数"""
        try:
            if not func_name:
                self.send_error(400, "缺少函数名")
                return

            content = CANVAS_LIB_FILE.read_text(encoding="utf-8")

            # 找到函数并删除（处理嵌套大括号）
            pattern = rf'{func_name}\s*:\s*(?:function\s*)?\([^)]*\)\s*=>?\s*\{{'
            match = re.search(pattern, content)
            if not match:
                self.send_error(404, f"函数 {func_name} 不存在")
                return

            # 找到函数体结束位置
            start = match.start()
            brace_start = match.end() - 1  # 第一个 { 的位置
            brace_count = 1
            i = match.end()
            while i < len(content) and brace_count > 0:
                if content[i] == '{':
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                i += 1
            func_end = i

            # 删除整个函数（包括前面的逗号或后面的逗号）
            before = content[:start]
            after = content[func_end:]

            # 处理逗号
            if before.rstrip().endswith(','):
                before = before.rstrip()[:-1]
            elif after.lstrip().startswith(','):
                after = after.lstrip()[1:]

            new_content = before + after
            CANVAS_LIB_FILE.write_text(new_content, encoding="utf-8")
            print(f"✅ 已删除函数 {func_name}")
            self.send_json({"success": True, "message": f"函数 {func_name} 已删除"})
        except Exception as e:
            self.send_error(500, str(e))


if __name__ == "__main__":
    print(f"""
╔════════════════════════════════════════════╗
║   build_lab 本地开发服务器                 ║
╠════════════════════════════════════════════╣
║   管理页面: http://localhost:{PORT}/admin.html     ║
║   API:                                    ║
║     GET/POST  /api/signs                  ║
║     GET/POST  /api/canvas-lib             ║
║     POST      /api/canvas-lib/add         ║
║     DELETE    /api/canvas-lib/<name>      ║
║   按 Ctrl+C 停止服务器                      ║
╚════════════════════════════════════════════╝
""")
    server = http.server.HTTPServer(("", PORT), BuildLabHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
