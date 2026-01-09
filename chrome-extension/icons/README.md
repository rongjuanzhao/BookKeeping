# 插件图标说明

这个目录包含Chrome插件所需的图标文件。

## 需要的图标尺寸

- **icon16.png**: 16x16像素 - 工具栏小图标
- **icon48.png**: 48x48像素 - 扩展管理页面图标
- **icon128.png**: 128x128像素 - Chrome Web Store图标

## 如何生成PNG图标

1. 使用在线工具：
   - 访问 https://cloudconvert.com/svg-to-png
   - 上传 icon.svg 文件
   - 分别转换为16x16、48x48、128x128的PNG文件

2. 或使用设计工具：
   - Figma、Sketch、Adobe XD等
   - 导出时设置对应尺寸

3. 或使用命令行工具：
   ```bash
   # 安装 ImageMagick
   brew install imagemagick

   # 生成不同尺寸的PNG图标
   convert -resize 16x16 icon.svg icon16.png
   convert -resize 48x48 icon.svg icon48.png
   convert -resize 128x128 icon.svg icon128.png
   ```

## 图标设计说明

- **颜色**: 使用蓝色(#3b82f6)作为主色调
- **图案**: 钱袋+人民币符号，代表理财和记账
- **风格**: 简洁、现代、易识别

## 临时解决方案

如果暂时没有PNG图标，可以修改manifest.json文件，暂时使用SVG图标：

```json
"action": {
  "default_popup": "popup.html",
  "default_title": "打开简易记账"
}
```

注释掉图标相关配置即可。