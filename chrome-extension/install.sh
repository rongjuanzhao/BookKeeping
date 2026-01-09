#!/bin/bash

# Chrome插件快速安装脚本

echo "🚀 简易记账 Chrome插件安装助手"
echo "=================================="

# 检查ImageMagick是否安装
if command -v convert &> /dev/null; then
    echo "📦 正在生成插件图标..."

    # 生成不同尺寸的PNG图标
    convert -background none -resize 16x16 icons/icon.svg icons/icon16.png
    convert -background none -resize 48x48 icons/icon.svg icons/icon48.png
    convert -background none -resize 128x128 icons/icon.svg icons/icon128.png

    echo "✅ 图标生成完成！"
else
    echo "⚠️  未安装ImageMagick，无法自动生成PNG图标"
    echo "📖 请手动生成图标，或临时修改manifest.json移除图标配置"
    echo ""
    echo "安装ImageMagick: brew install imagemagick"
fi

echo ""
echo "📝 安装步骤："
echo "1. 打开Chrome浏览器"
echo "2. 访问 chrome://extensions/"
echo "3. 启用右上角的"开发者模式""
echo "4. 点击"加载已解压的扩展程序""
echo "5. 选择当前文件夹: $(pwd)"
echo ""
echo "🎉 安装完成后，点击浏览器工具栏中的插件图标即可使用！"