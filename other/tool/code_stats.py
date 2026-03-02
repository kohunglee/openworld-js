#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
代码统计工具 - 统计项目代码行数和文件大小
生成友好的 HTML 报告
"""

import os
import datetime
from pathlib import Path


# 配置
PROJECT_ROOT = Path(__file__).parent.parent.parent
EXCLUDE_FOLDER = "other"
OUTPUT_HTML = Path(__file__).parent / "code_stats.html"


# 代码文件扩展名
CODE_EXTENSIONS = {
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.java', '.cpp', '.c', '.h', '.hpp',
    '.go', '.rs', '.swift', '.kt',
    '.html', '.css', '.scss', '.less', '.sass',
    '.json', '.md', '.yml', '.yaml', '.toml',
    '.sql', '.sh', '.bash',
}

# 二进制/图片等不统计行数的文件
BINARY_EXTENSIONS = {
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
    '.woff', '.woff2', '.ttf', '.eot',
    '.zip', '.tar', '.gz', '.rar',
    '.exe', '.dll', '.so', '.dylib',
    '.pdf', '.doc', '.docx',
}


def format_size(size_bytes):
    """格式化文件大小"""
    if size_bytes < 1024:
        return "%d B" % size_bytes
    elif size_bytes < 1024 * 1024:
        return "%.2f KB" % (size_bytes / 1024)
    else:
        return "%.2f MB" % (size_bytes / (1024 * 1024))


def count_lines(file_path):
    """统计文件行数"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return sum(1 for line in f)
    except UnicodeDecodeError:
        return 0
    except:
        return 0


def is_code_file(path):
    """判断是否是代码文件"""
    ext = path.suffix.lower()
    return ext in CODE_EXTENSIONS


def is_binary_file(path):
    """判断是否是二进制文件"""
    ext = path.suffix.lower()
    return ext in BINARY_EXTENSIONS


def scan_directory(root_path, parent_path=None):
    """递归扫描目录"""
    if parent_path is None:
        parent_path = Path()

    result = {
        'name': root_path.name,
        'path': str(parent_path / root_path.name),
        'is_dir': True,
        'children': [],
        'lines': 0,
        'size': 0,
        'file_count': 0,
    }

    for item in sorted(root_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
        if item.name == EXCLUDE_FOLDER and parent_path == Path():
            continue
        if item.name.startswith('.'):
            continue

        if item.is_dir():
            child = scan_directory(item, parent_path / root_path.name)
            result['children'].append(child)
            result['lines'] += child['lines']
            result['size'] += child['size']
            result['file_count'] += child['file_count']
        else:
            size = item.stat().st_size
            lines = 0
            if is_code_file(item):
                lines = count_lines(item)

            child = {
                'name': item.name,
                'path': str(parent_path / root_path.name / item.name),
                'is_dir': False,
                'lines': lines,
                'size': size,
            }
            result['children'].append(child)
            result['lines'] += lines
            result['size'] += size
            result['file_count'] += 1

    # 按大小排序子节点
    result['children'].sort(key=lambda x: (-x['size'], x['name'].lower()))
    return result


def build_tree_html(node, indent=0):
    """构建树状 HTML"""
    html = ""

    if node['is_dir']:
        folder_icon = "📁"
        size_class = "folder"
        arrow = "▼" if indent == 0 else "▶"
        lines_str = "{:,}".format(node['lines'])
        html += '''
        <div class="tree-item %s" style="padding-left: %dpx;">
            <span class="arrow" onclick="toggleFolder(this)">%s</span>
            <span class="icon">%s</span>
            <span class="name">%s/</span>
            <span class="stats">
                <span class="line-count">%s 行</span>
                <span class="size">%s</span>
                <span class="file-count">%d 个文件</span>
            </span>
        </div>
        ''' % (size_class, indent * 24, arrow, folder_icon, node['name'],
               lines_str, format_size(node['size']), node['file_count'])
        if indent == 0:
            html += '<div class="folder-content" style="display:block;">'
        else:
            html += '<div class="folder-content" style="display:none;">'
        for child in node['children']:
            html += build_tree_html(child, indent + 1)
        html += '</div>'
    else:
        icon = "📄" if is_code_file(Path(node['name'])) else "📦"
        lines_str = "{:,}".format(node['lines'])
        html += '''
        <div class="tree-item file" style="padding-left: %dpx;">
            <span class="arrow"></span>
            <span class="icon">%s</span>
            <span class="name">%s</span>
            <span class="stats">
                <span class="line-count">%s 行</span>
                <span class="size">%s</span>
            </span>
        </div>
        ''' % (indent * 24, icon, node['name'], lines_str, format_size(node['size']))

    return html


def generate_html(tree_data, total_lines, total_size, total_files, gen_time):
    """生成完整 HTML"""

    html_parts = []
    html_parts.append('''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码统计报告 - ''')
    html_parts.append(gen_time)
    html_parts.append('''</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header .time {
            color: #a0aec0;
            font-size: 14px;
        }
        .summary {
            display: flex;
            justify-content: center;
            gap: 30px;
            padding: 30px;
            background: #f7fafc;
            flex-wrap: wrap;
        }
        .summary-card {
            background: white;
            padding: 24px 40px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            min-width: 180px;
        }
        .summary-card .number {
            font-size: 36px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .summary-card .label {
            color: #718096;
            margin-top: 8px;
            font-size: 14px;
        }
        .tree {
            padding: 30px;
        }
        .tree-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #2d3748;
        }
        .tree-item {
            display: flex;
            align-items: center;
            padding: 10px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .tree-item:hover {
            background: #f7fafc;
        }
        .tree-item.folder {
            font-weight: 600;
        }
        .tree-item .arrow {
            width: 20px;
            text-align: center;
            cursor: pointer;
            color: #a0aec0;
            user-select: none;
        }
        .tree-item .arrow:hover {
            color: #4a5568;
        }
        .tree-item .icon {
            margin-right: 8px;
            font-size: 18px;
        }
        .tree-item .name {
            flex: 1;
            color: #2d3748;
        }
        .tree-item .stats {
            display: flex;
            gap: 16px;
            font-size: 14px;
        }
        .tree-item .line-count {
            color: #667eea;
            font-weight: 500;
            min-width: 100px;
            text-align: right;
        }
        .tree-item .size {
            color: #764ba2;
            font-weight: 500;
            min-width: 100px;
            text-align: right;
        }
        .tree-item .file-count {
            color: #ed8936;
            font-weight: 500;
            min-width: 100px;
            text-align: right;
        }
        .folder-content {
            margin-left: 0;
        }
        .footer {
            padding: 20px;
            text-align: center;
            color: #a0aec0;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 代码统计报告</h1>
            <div class="time">生成时间：''')
    html_parts.append(gen_time)
    html_parts.append('''</div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="number">''')
    html_parts.append("{:,}".format(total_lines))
    html_parts.append('''</div>
                <div class="label">总行数</div>
            </div>
            <div class="summary-card">
                <div class="number">''')
    html_parts.append(format_size(total_size))
    html_parts.append('''</div>
                <div class="label">总大小</div>
            </div>
            <div class="summary-card">
                <div class="number">''')
    html_parts.append("{:,}".format(total_files))
    html_parts.append('''</div>
                <div class="label">总文件数</div>
            </div>
        </div>

        <div class="tree">
            <div class="tree-title">📂 项目结构</div>
''')
    html_parts.append(build_tree_html(tree_data))
    html_parts.append('''
        </div>

        <div class="footer">
            💡 提示：点击 ▶ 可以展开/折叠文件夹，按大小降序排列
        </div>
    </div>

    <script>
        function toggleFolder(arrow) {
            const folderContent = arrow.parentElement.nextElementSibling;
            if (folderContent.style.display === 'none' || !folderContent.style.display) {
                folderContent.style.display = 'block';
                arrow.textContent = '▼';
            } else {
                folderContent.style.display = 'none';
                arrow.textContent = '▶';
            }
        }
    </script>
</body>
</html>''')

    return ''.join(html_parts)


def main():
    """主函数"""
    print("开始统计代码...")
    print("项目根目录:", PROJECT_ROOT)

    # 扫描目录
    tree_data = scan_directory(PROJECT_ROOT)

    total_lines = tree_data['lines']
    total_size = tree_data['size']
    total_files = tree_data['file_count']
    gen_time = datetime.datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')

    print("统计完成!")
    print("总行数: {:,}".format(total_lines))
    print("总大小:", format_size(total_size))
    print("总文件: {:,}".format(total_files))

    # 生成 HTML
    html_content = generate_html(tree_data, total_lines, total_size, total_files, gen_time)
    OUTPUT_HTML.write_text(html_content, encoding='utf-8')

    print("\nHTML 报告已生成:", OUTPUT_HTML)


if __name__ == "__main__":
    main()
