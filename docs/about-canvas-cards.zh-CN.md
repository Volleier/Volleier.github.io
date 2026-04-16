# 关于画布卡片规范

本文档定义了 `/intro/about` 如何由 Markdown 卡片驱动。

## 内容位置

- `src/content/about/*.md`

## Frontmatter 模式

```md
---
order: 1
tag: "01_PROFILE"
heading: " / PROFILE"
accent: "cyan" # magenta | cyan | gold | white | transparent
x: 240
y: 180
w: 14
className: "profile-card" # optional
---

Markdown body...
```

## 字段说明

- `order`：渲染顺序（升序）。
- `x`, `y`：卡片在画布坐标中的初始位置（像素）。
- `w`：以网格单位计的宽度（`cardWidth = w * gridSize`，当前 `gridSize = 24`）。
- `accent`：左侧强调色样式。
- `className`：可选，用于特殊卡片视觉的样式钩子。

## 交互规则

- 左键：短按（约 160ms）以启用卡片拖动（轻微边框发光提示），然后移动以拖动。
- 右键：平移无限画布（视口内会屏蔽默认上下文菜单和侧键手势）。
- 滚轮：以光标为中心缩放，灵敏度减小。
- 边缘滚动：当指针靠近视口边界时，画布会自动平移。

## 吸附行为

- 拖动时卡片位置会对齐到网格。
- 拖动结束时最终位置始终将进行网格吸附。
- 卡片尺寸以网格为单位测量并四舍五入到网格倍数。
