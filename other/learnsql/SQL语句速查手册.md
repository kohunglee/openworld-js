# SQL 语句速查手册

> **适用说明**：本文档以 SQL Server 语法为主，MySQL 差异会在注释中说明。
>
> - ✅ = 标准 SQL，通用
> - 🅼 = MySQL 语法不同
> - 🆈 = 仅 SQL Server

---

## 目录

- [一、基础操作](#一基础操作)
- [二、提升技巧](#二提升技巧)
- [三、高级技巧](#三高级技巧)
- [四、数据开发经典](#四数据开发经典)

---

## 一、基础操作

### 1.1 数据库操作

#### 创建数据库 ✅
```sql
-- 语法
CREATE DATABASE database_name;

-- 示例：创建一个名为 myshop 的数据库
CREATE DATABASE myshop;
```

#### 删除数据库 ✅
```sql
-- ⚠️ 危险操作！删除后数据无法恢复
DROP DATABASE database_name;

-- 示例
DROP DATABASE myshop;
```

#### 修改数据库名 🆈
```sql
-- SQL Server 专用
EXEC sp_renamedb 'old_name', 'new_name';

-- MySQL 用法
ALTER DATABASE old_name RENAME TO new_name;  -- MySQL 5.1+
-- 或
RENAME DATABASE old_name TO new_name;  -- 部分版本支持
```

---

### 1.2 表操作

#### 创建表 ✅
```sql
-- 基本语法
CREATE TABLE table_name (
    column1 datatype [constraint],
    column2 datatype [constraint],
    ...
);

-- 示例：创建用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,  -- MySQL 自增写法
    -- id INT IDENTITY(1,1) PRIMARY KEY,  -- SQL Server 自增写法
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at DATETIME DEFAULT GETDATE()  -- SQL Server
    -- created_at DATETIME DEFAULT NOW()   -- MySQL
);

-- 从现有表创建新表（只复制结构）
-- MySQL
CREATE TABLE new_table LIKE old_table;

-- SQL Server
SELECT * INTO new_table FROM old_table WHERE 1=0;
```

#### 删除表 ✅
```sql
DROP TABLE table_name;

-- 安全删除（如果存在才删除）
DROP TABLE IF EXISTS table_name;  -- MySQL
-- IF OBJECT_ID('table_name', 'U') IS NOT NULL DROP TABLE table_name;  -- SQL Server
```

#### 清空表数据（保留结构）✅
```sql
-- TRUNCATE 比 DELETE 更快，但无法回滚
TRUNCATE TABLE table_name;

-- 等效的 DELETE（可回滚，但更慢）
DELETE FROM table_name;
```

#### 修改表结构 ✅
```sql
-- 添加列
ALTER TABLE table_name ADD column_name datatype;

-- 删除列
ALTER TABLE table_name DROP COLUMN column_name;

-- 修改列类型
-- MySQL
ALTER TABLE table_name MODIFY COLUMN column_name new_datatype;
-- SQL Server
ALTER TABLE table_name ALTER COLUMN column_name new_datatype;

-- 重命名列
-- MySQL
ALTER TABLE table_name CHANGE old_name new_name datatype;
-- SQL Server
EXEC sp_rename 'table_name.old_name', 'new_name', 'COLUMN';
```

---

### 1.3 主键与约束 ✅

```sql
-- 添加主键
ALTER TABLE table_name ADD PRIMARY KEY (column_name);

-- 添加复合主键
ALTER TABLE table_name ADD PRIMARY KEY (col1, col2);

-- 删除主键
-- MySQL
ALTER TABLE table_name DROP PRIMARY KEY;
-- SQL Server
ALTER TABLE table_name DROP CONSTRAINT PK_table_name;

-- 添加外键约束
ALTER TABLE orders
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id) REFERENCES users(id);
```

---

### 1.4 索引操作 ✅

```sql
-- 创建索引
CREATE INDEX idx_name ON table_name (column_name);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_email ON users (email);

-- 创建复合索引
CREATE INDEX idx_name_age ON users (name, age);

-- 删除索引
-- MySQL
DROP INDEX idx_name ON table_name;
-- SQL Server
DROP INDEX table_name.idx_name;

-- 查看表的索引
-- MySQL
SHOW INDEX FROM table_name;
-- SQL Server
EXEC sp_helpindex 'table_name';
```

> **💡 索引使用建议**
> - 经常用于 WHERE、JOIN、ORDER BY 的列适合建索引
> - 小表（<1000行）通常不需要索引
> - 频繁更新的列不宜建太多索引
> - 组合索引注意列顺序（最左前缀原则）

---

### 1.5 视图操作 ✅

```sql
-- 创建视图
CREATE VIEW view_name AS
SELECT column1, column2
FROM table_name
WHERE condition;

-- 示例：创建用户订单视图
CREATE VIEW user_orders AS
SELECT u.username, o.order_id, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;

-- 使用视图（像表一样查询）
SELECT * FROM user_orders WHERE total > 100;

-- 删除视图
DROP VIEW view_name;
-- DROP VIEW IF EXISTS view_name;  -- 安全删除
```

---

### 1.6 基本 CRUD 操作 ✅

```sql
-- ========== 查询 SELECT ==========

-- 基本查询
SELECT * FROM users;

-- 条件查询
SELECT * FROM users WHERE age > 18;

-- 指定字段
SELECT name, email FROM users;

-- 别名
SELECT name AS 姓名, email AS 邮箱 FROM users;

-- 去重
SELECT DISTINCT category FROM products;

-- 排序（ASC 升序，DESC 降序）
SELECT * FROM users ORDER BY age DESC, name ASC;

-- 限制返回行数
-- MySQL
SELECT * FROM users LIMIT 10;
-- SQL Server
SELECT TOP 10 * FROM users;

-- 分页查询
-- MySQL（推荐）
SELECT * FROM users LIMIT 10 OFFSET 20;  -- 跳过20条，取10条（第3页）
-- SQL Server 2012+
SELECT * FROM users ORDER BY id OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;

-- ========== 插入 INSERT ==========

-- 插入单条
INSERT INTO users (name, email) VALUES ('张三', 'zhangsan@example.com');

-- 插入多条
INSERT INTO users (name, email) VALUES
    ('张三', 'zhang@example.com'),
    ('李四', 'li@example.com'),
    ('王五', 'wang@example.com');

-- 从其他表复制数据
INSERT INTO users_backup (name, email)
SELECT name, email FROM users WHERE active = 1;

-- ========== 更新 UPDATE ==========

-- ⚠️ 务必加 WHERE，否则更新全表！
UPDATE users SET email = 'new@example.com' WHERE id = 1;

-- 更新多个字段
UPDATE users SET name = '新名字', age = 25 WHERE id = 1;

-- ========== 删除 DELETE ==========

-- ⚠️ 务必加 WHERE，否则删除全表！
DELETE FROM users WHERE id = 1;

-- 删除符合条件的多条
DELETE FROM users WHERE last_login < '2020-01-01';
```

---

### 1.7 聚合函数 ✅

```sql
-- 统计总数
SELECT COUNT(*) AS total FROM users;
SELECT COUNT(DISTINCT category) FROM products;  -- 去重统计

-- 求和
SELECT SUM(amount) AS total_sales FROM orders;

-- 平均值
SELECT AVG(age) AS avg_age FROM users;

-- 最大/最小值
SELECT MAX(price) AS max_price, MIN(price) AS min_price FROM products;

-- 分组统计
SELECT category, COUNT(*) AS count, SUM(price) AS total
FROM products
GROUP BY category
HAVING COUNT(*) > 5   -- HAVING 用于过滤分组后的结果
ORDER BY total DESC;
```

---

## 二、提升技巧

### 2.1 复制表

```sql
-- ========== 只复制表结构 ==========

-- MySQL
CREATE TABLE new_table LIKE old_table;

-- SQL Server / 通用（用条件过滤掉数据）
SELECT * INTO new_table FROM old_table WHERE 1=0;

-- ========== 复制表结构和数据 ==========

-- MySQL
CREATE TABLE new_table AS SELECT * FROM old_table;

-- SQL Server
SELECT * INTO new_table FROM old_table;

-- ========== 只复制部分数据 ==========

INSERT INTO target_table (col1, col2)
SELECT col1, col2 FROM source_table WHERE condition;

-- ========== 跨数据库复制 ==========

-- MySQL
INSERT INTO db2.table_name SELECT * FROM db1.table_name;

-- SQL Server（需要先创建链接服务器）
-- 见本文档"跨服务器操作"章节
```

---

### 2.2 子查询 ✅

```sql
-- ========== WHERE 中的子查询 ==========

-- IN 子查询
SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE vip = 1);

-- EXISTS 子查询（性能通常优于 IN）
SELECT * FROM orders o
WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id AND u.vip = 1);

-- 比较子查询
SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);

-- ========== FROM 中的子查询（派生表） ==========

SELECT * FROM (
    SELECT category, COUNT(*) AS cnt
    FROM products
    GROUP BY category
) AS t WHERE cnt > 10;

-- ========== SELECT 中的子查询 ==========

SELECT
    name,
    (SELECT COUNT(*) FROM orders WHERE user_id = users.id) AS order_count
FROM users;
```

---

### 2.3 连接查询（JOIN）✅

```sql
-- 准备示例数据
-- users: id, name
-- orders: id, user_id, amount

-- ========== 内连接 INNER JOIN ==========
-- 只返回两表都有匹配的记录

SELECT u.name, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- ========== 左连接 LEFT JOIN ==========
-- 返回左表所有记录，右表无匹配则为 NULL

SELECT u.name, o.amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- 找出没有订单的用户
SELECT u.name
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;

-- ========== 右连接 RIGHT JOIN ==========
-- 返回右表所有记录，左表无匹配则为 NULL

SELECT u.name, o.amount
FROM users u
RIGHT JOIN orders o ON u.id = o.user_id;

-- ========== 全连接 FULL JOIN ==========
-- 返回两表所有记录

-- MySQL 不支持 FULL JOIN，用 UNION 模拟
SELECT u.name, o.amount FROM users u LEFT JOIN orders o ON u.id = o.user_id
UNION
SELECT u.name, o.amount FROM users u RIGHT JOIN orders o ON u.id = o.user_id;

-- SQL Server
SELECT u.name, o.amount
FROM users u
FULL OUTER JOIN orders o ON u.id = o.user_id;

-- ========== 自连接 ==========
-- 员工表中有 manager_id 指向上级

SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- ========== 多表连接 ==========

SELECT *
FROM orders o
INNER JOIN users u ON o.user_id = u.id
INNER JOIN products p ON o.product_id = p.id
WHERE u.vip = 1;
```

---

### 2.4 UNION 操作 ✅

```sql
-- UNION：合并结果集，自动去重
SELECT name FROM users
UNION
SELECT name FROM customers;

-- UNION ALL：合并结果集，保留重复（性能更好）
SELECT name FROM users
UNION ALL
SELECT name FROM customers;

-- INTERSECT：取交集（MySQL 不支持，用 INNER JOIN 替代）
-- SQL Server / Oracle
SELECT name FROM users
INTERSECT
SELECT name FROM customers;

-- EXCEPT / MINUS：取差集（MySQL 用 LEFT JOIN 替代）
-- SQL Server
SELECT name FROM users
EXCEPT
SELECT name FROM customers;
```

---

### 2.5 分页查询

```sql
-- ========== MySQL（推荐方式） ==========

-- 基本分页：每页10条，第3页（OFFSET = (页码-1) * 每页条数）
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;

-- 简写（LIMIT offset, count）— 旧语法，不推荐
SELECT * FROM users ORDER BY id LIMIT 20, 10;

-- ========== SQL Server ==========

-- SQL Server 2012+（推荐）
SELECT * FROM users
ORDER BY id
OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;

-- 老版本（使用 ROW_NUMBER）
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (ORDER BY id) AS row_num
    FROM users
) AS t WHERE row_num BETWEEN 21 AND 30;

-- ========== 高性能分页（大数据量推荐） ==========

-- 基于 id 的方式（要求 id 连续或有索引）
SELECT * FROM users
WHERE id > 1000  -- 上一页最后一条记录的 id
ORDER BY id
LIMIT 10;
```

---

### 2.6 随机记录 🅼

```sql
-- ========== MySQL 随机取 N 条 ==========

SELECT * FROM users ORDER BY RAND() LIMIT 10;

-- ⚠️ 性能警告：大数据表 RAND() 很慢！
-- 优化方案：先随机生成 id 范围

SELECT * FROM users
WHERE id >= (SELECT FLOOR(RAND() * (SELECT MAX(id) FROM users)))
ORDER BY id LIMIT 10;

-- ========== SQL Server 随机取 N 条 ==========

SELECT TOP 10 * FROM users ORDER BY NEWID();

-- ========== PostgreSQL ==========

SELECT * FROM users ORDER BY RANDOM() LIMIT 10;
```

---

### 2.7 删除重复记录 ✅

```sql
-- ========== 方法1：使用临时表 ==========

-- 创建临时表存放去重数据
CREATE TABLE temp AS SELECT DISTINCT * FROM users;

-- 删除原表
DROP TABLE users;

-- 重命名临时表
ALTER TABLE temp RENAME TO users;

-- ========== 方法2：添加自增列后删除 ==========

-- MySQL
ALTER TABLE users ADD COLUMN temp_id INT AUTO_INCREMENT PRIMARY KEY;

DELETE t1 FROM users t1
INNER JOIN users t2
WHERE t1.temp_id > t2.temp_id AND t1.email = t2.email;

ALTER TABLE users DROP COLUMN temp_id;

-- ========== 方法3：使用 ROW_NUMBER（推荐） ==========

-- MySQL 8.0+ / SQL Server
DELETE FROM users WHERE id NOT IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS row_num
        FROM users
    ) AS t WHERE row_num = 1
);
```

---

## 三、高级技巧

### 3.1 条件组合技巧 ✅

```sql
-- ========== 1=1 技巧 ==========
-- 在动态 SQL 拼接时很有用，避免判断 WHERE 还是 AND

-- 不优雅的写法
-- IF @name IS NOT NULL THEN sql = sql + ' WHERE name = @name'
-- IF @age IS NOT NULL THEN sql = sql + ' AND age = @age'  -- 需要判断前面有没有 WHERE

-- 优雅的写法
SELECT * FROM users WHERE 1=1
    AND (@name IS NULL OR name = @name)
    AND (@age IS NULL OR age = @age);

-- 1=2 则用于只获取表结构
SELECT * FROM users WHERE 1=2;  -- 返回空结果，但有列信息
```

---

### 3.2 数据库维护命令 🆈

> **注意**：以下多为 SQL Server 特有命令，MySQL 请使用相应工具

```sql
-- ========== SQL Server 数据库收缩 ==========

-- 收缩整个数据库
DBCC SHRINKDATABASE (database_name, target_percent);

-- 收缩指定数据文件
DBCC SHRINKFILE (file_name, target_size_MB);

-- 示例：收缩到原大小的 80%
DBCC SHRINKDATABASE (mydb, 20);

-- ========== 重建索引（解决索引碎片） ==========

-- 重建单个索引
ALTER INDEX idx_name ON table_name REBUILD;

-- 重建表所有索引
ALTER INDEX ALL ON table_name REBUILD;

-- 重组索引（轻量级，不锁表）
ALTER INDEX idx_name ON table_name REORGANIZE;

-- ========== 检查数据库完整性 ==========

DBCC CHECKDB (database_name);

-- 带修复选项
DBCC CHECKDB (database_name, REPAIR_REBUILD);  -- 尝试修复
```

---

### 3.3 日志清理 🆈

```sql
-- ========== SQL Server 日志清理 ==========

-- ⚠️ 生产环境慎用！会断开日志链，影响恢复

-- 步骤1：切换到简单恢复模式
ALTER DATABASE mydb SET RECOVERY SIMPLE;

-- 步骤2：收缩日志文件
DBCC SHRINKFILE (mydb_log, 1);  -- 收缩到 1MB

-- 步骤3：恢复完整恢复模式
ALTER DATABASE mydb SET RECOVERY FULL;

-- ========== MySQL 日志管理 ==========

-- 查看二进制日志
SHOW BINARY LOGS;

-- 清理旧日志（保留最新的 N 个）
PURGE BINARY LOGS BEFORE DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 或在 my.cnf 配置自动过期
-- expire_logs_days = 7
```

---

### 3.4 循环与批处理 ✅

```sql
-- ========== MySQL 存储过程：批量插入测试数据 ==========

DELIMITER //
CREATE PROCEDURE insert_test_data(IN num_rows INT)
BEGIN
    DECLARE i INT DEFAULT 1;
    WHILE i <= num_rows DO
        INSERT INTO users (name, email) VALUES
            (CONCAT('user', i), CONCAT('user', i, '@test.com'));
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- 调用
CALL insert_test_data(1000);

-- ========== SQL Server 循环 ==========

DECLARE @i INT = 1;
WHILE @i <= 1000
BEGIN
    INSERT INTO users (name, email) VALUES
        ('user' + CAST(@i AS VARCHAR), 'user' + CAST(@i AS VARCHAR) + '@test.com');
    SET @i = @i + 1;
END;

-- ========== 批量更新示例 ==========

-- 将所有不及格成绩循环提升直到及格
WHILE (SELECT MIN(score) FROM exam_results) < 60
BEGIN
    UPDATE exam_results
    SET score = score * 1.01
    WHERE score < 60;

    -- 防止无限循环
    IF (SELECT MIN(score) FROM exam_results) >= 60 BREAK;
END
```

---

### 3.5 实用查询技巧 ✅

```sql
-- ========== CASE WHEN 条件统计 ==========

SELECT
    category,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_count,
    SUM(amount) AS total_amount
FROM orders
GROUP BY category;

-- ========== 查看表结构 ==========

-- MySQL
DESCRIBE table_name;
-- 或
SHOW COLUMNS FROM table_name;

-- SQL Server
EXEC sp_help 'table_name';

-- ========== 查看数据库所有表 ==========

-- MySQL
SHOW TABLES;

-- SQL Server
SELECT name FROM sysobjects WHERE xtype = 'U';

-- ========== 查看表的字段和类型 ==========

-- MySQL
SHOW COLUMNS FROM table_name;

-- 通用
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'your_table';
```

---

## 四、数据开发经典

### 4.1 数据排序技巧 ✅

```sql
-- ========== 按中文姓氏笔画排序 ==========

-- SQL Server
SELECT * FROM users
ORDER BY name COLLATE Chinese_PRC_Stroke_ci_as;  -- 笔画从少到多

-- MySQL
SELECT * FROM users ORDER BY name;  -- 默认按拼音排序
-- 若需笔画排序，需要额外处理或自定义排序规则

-- ========== 按拼音排序 ==========

-- SQL Server
SELECT * FROM users ORDER BY name COLLATE Chinese_PRC_CI_AS;

-- MySQL 默认就是拼音排序
```

---

### 4.2 密码加密 🅼

```sql
-- ========== MySQL 密码处理 ==========

-- MD5 哈希（不推荐用于密码，仅用于校验）
INSERT INTO users (password) VALUES (MD5('mypassword'));

-- 推荐使用 bcrypt（在应用层处理更好）
-- 或 MySQL 8.0+ 的加密函数

-- SHA256
INSERT INTO users (password)
VALUES (SHA2('mypassword', 256));

-- ========== SQL Server 密码处理 ==========

-- 哈希（注意：这些函数已过时）
SELECT PWDENCRYPT('mypassword');  -- 加密
SELECT PWDCOMPARE('mypassword', hashed_value);  -- 比对，返回 1=匹配

-- 现代做法：使用 HASHBYTES
SELECT HASHBYTES('SHA2_256', 'mypassword');
```

> **⚠️ 安全提示**：密码加密建议在应用层使用 bcrypt、Argon2 等专用库，而非数据库函数。

---

### 4.3 记录搜索（分区间查询）✅

```sql
-- ========== 获取第 M 到第 N 条记录 ==========

-- 假设每页 10 条，获取第 3 页（记录 21-30）

-- ========== MySQL（推荐）==========
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;

-- ========== SQL Server 2012+ ==========
SELECT * FROM users
ORDER BY id
OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY;

-- ========== 通用方案（需有主键索引）==========

-- 获取第 21-30 条
SELECT * FROM users WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS row_num
        FROM users
    ) AS t
    WHERE row_num BETWEEN 21 AND 30
);

-- ========== 获取最后一条记录 ==========

SELECT * FROM users ORDER BY id DESC LIMIT 1;  -- MySQL
SELECT TOP 1 * FROM users ORDER BY id DESC;    -- SQL Server

-- 不知道总数时获取第 N 条
SET @n = 5;
-- MySQL
SELECT * FROM users LIMIT 1 OFFSET @n;

-- ========== 每组取前 N 条 ==========

-- 每个分类取最新的 3 条记录
SELECT * FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY category ORDER BY created_at DESC) AS rn
    FROM products
) AS t WHERE rn <= 3;
```

---

### 4.4 跨服务器/跨数据库操作

> **注意**：跨服务器操作通常需要 DBA 权限配置

#### 4.4.1 SQL Server 链接服务器 🆈

```sql
-- ========== 创建链接服务器 ==========

EXEC sp_addlinkedserver
    @server = 'RemoteServer',      -- 链接名称
    @srvproduct = '',
    @provider = 'SQLOLEDB',
    @datasrc = '192.168.1.100';    -- 远程服务器IP

-- 添加登录凭据
EXEC sp_addlinkedsrvlogin
    @rmtsrvname = 'RemoteServer',
    @useself = 'false',
    @locallogin = NULL,
    @rmtuser = 'username',
    @rmtpassword = 'password';

-- ========== 使用链接服务器 ==========

-- 查询远程表
SELECT * FROM RemoteServer.database_name.dbo.table_name;

-- 导入远程数据到本地
SELECT * INTO local_table
FROM RemoteServer.database_name.dbo.remote_table;

-- 本地数据导出到远程
INSERT INTO RemoteServer.database_name.dbo.remote_table
SELECT * FROM local_table;

-- ========== 删除链接服务器 ==========

EXEC sp_dropserver 'RemoteServer', 'droplogins';
```

#### 4.4.2 OPENROWSET 即席查询 🆈

```sql
-- 无需预先创建链接，适合一次性操作

SELECT * FROM OPENROWSET(
    'SQLOLEDB',
    '192.168.1.100';    -- 服务器
    'username';         -- 用户名
    'password',         -- 密码
    database_name.dbo.table_name
);

-- 导入数据
INSERT INTO local_table
SELECT * FROM OPENROWSET(
    'SQLOLEDB',
    '192.168.1.100';'username';'password',
    database_name.dbo.table_name
);
```

#### 4.4.3 MySQL 跨库操作

```sql
-- ========== 同一服务器不同数据库 ==========

SELECT * FROM database1.users u
JOIN database2.orders o ON u.id = o.user_id;

-- ========== 跨服务器（需要 FEDERATED 引擎）==========

-- 1. 创建远程服务器连接（在 my.cnf 配置）
-- 2. 创建 FEDERATED 表

CREATE TABLE remote_users (
    id INT,
    name VARCHAR(100)
) ENGINE=FEDERATED
CONNECTION='mysql://user:pass@remote-host:3306/dbname/users';

-- 然后就可以像本地表一样查询
SELECT * FROM remote_users;
```

---

### 4.5 数据库同步思路

> 以下提供基础同步思路，生产环境建议使用专业工具

#### 4.5.1 定时同步存储过程示例 ✅

```sql
-- 同步思路：更新修改的、插入新增的、删除不存在（可选）

-- ========== MySQL 同步示例 ==========

DELIMITER //
CREATE PROCEDURE sync_users()
BEGIN
    -- 更新已修改的记录
    UPDATE remote_users r
    JOIN local_users l ON r.id = l.id
    SET r.name = l.name, r.email = l.email
    WHERE r.name != l.name OR r.email != l.email;

    -- 插入新增的记录
    INSERT INTO remote_users (id, name, email)
    SELECT id, name, email FROM local_users l
    WHERE NOT EXISTS (SELECT 1 FROM remote_users r WHERE r.id = l.id);

    -- 可选：删除远程已不存在的记录
    -- DELETE FROM remote_users
    -- WHERE id NOT IN (SELECT id FROM local_users);
END //
DELIMITER ;
```

#### 4.5.2 SQL Server 使用作业定时执行 🆈

```sql
-- 1. 创建同步存储过程
CREATE PROCEDURE sync_data
AS
BEGIN
    UPDATE RemoteServer.mydb.dbo.users
    SET name = local.name, email = local.email
    FROM RemoteServer.mydb.dbo.users remote
    JOIN local_users local ON remote.id = local.id
    WHERE remote.name != local.name OR remote.email != local.email;

    -- 其他同步逻辑...
END;

-- 2. 创建 SQL Server Agent 作业定时执行
-- 通过 SSMS 或以下命令
-- （需要 SQL Server Agent 服务运行中）
```

---

## 附录：MySQL vs SQL Server 速查

| 功能 | MySQL | SQL Server |
|------|-------|------------|
| 字符串连接 | `CONCAT(a, b)` | `a + b` |
| 日期函数 | `NOW()`, `DATE_FORMAT()` | `GETDATE()`, `FORMAT()` |
| 分页 | `LIMIT 10 OFFSET 5` | `OFFSET 5 ROWS FETCH NEXT 10 ROWS` |
| 自增列 | `AUTO_INCREMENT` | `IDENTITY(1,1)` |
| 条件判断 | `IF()`, `CASE` | `IIF()`, `CASE` |
| 随机数 | `RAND()` | `NEWID()` |
| 字符串转日期 | `STR_TO_DATE()` | `CONVERT()` |
| 空值处理 | `IFNULL(a, b)` | `ISNULL(a, b)` |
| 布尔类型 | `TINYINT(1)` / `BOOLEAN` | `BIT` |

---

## 参考资料

- [MySQL 官方文档](https://dev.mysql.com/doc/)
- [SQL Server 官方文档](https://docs.microsoft.com/en-us/sql/)
- [SQL 语法速查](https://www.w3schools.com/sql/)

---

> **文档版本**：v1.0
> **更新日期**：2026-04-01
> **适用**：MySQL 8.0+ / SQL Server 2012+
