#!/bin/bash

# 设置版本号
VERSION="1.0.0"
BACKUP_DIR="backups/v${VERSION}"
DATE=$(date +%Y%m%d)

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 复制主要文件
cp index.html "$BACKUP_DIR/"
cp -r js/ "$BACKUP_DIR/"
cp -r styles/ "$BACKUP_DIR/"
cp -r assets/ "$BACKUP_DIR/"
cp version.json "$BACKUP_DIR/"
cp README.md "$BACKUP_DIR/"

# 创建版本信息文件
echo "Backup created on: $(date)" > "$BACKUP_DIR/backup_info.txt"
echo "Version: $VERSION" >> "$BACKUP_DIR/backup_info.txt"

# 创建压缩文件
tar -czf "$BACKUP_DIR/v${VERSION}_${DATE}.tar.gz" "$BACKUP_DIR"

echo "备份完成！文件保存在 $BACKUP_DIR"
echo "你可以通过解压 v${VERSION}_${DATE}.tar.gz 来恢复这个版本" 