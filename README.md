# Aether Link - Minecraft 联机桥接平台

Aether Link 是一个基于 Apple 视觉风格设计的 Minecraft 本地服务器实时共享平台。它能够自动探测本地运行的 Minecraft 实例，并通过全栈 Socket.io 技术将联机信息实时广播给全球玩家。

## 核心特性

- **Apple 级审美**：极致简约的毛玻璃质感与流体动效。
- **实时同步**：基于 Socket.io 的全双工通信，延迟极低。
- **自动探测**：智能扫描本地 25565 等常用 Minecraft 端口。
- **全栈架构**：集成 Express 后端，支持多用户实时在线状态同步。

## 技术栈

- **前端**: React 19, Tailwind CSS, Framer Motion, Lucide Icons
- **后端**: Node.js, Express, Socket.io
- **构建工具**: Vite, tsx

## 快速开始

### 1. 克隆仓库
```bash
git clone <your-repo-url>
cd aether-link
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

## 部署建议

由于本项目包含后端 Socket.io 服务，建议部署至以下平台：

1. **Railway** (推荐): 支持全栈应用，一键导入 GitHub 仓库即可。
2. **Render**: 选择 "Web Service" 类型进行部署。
3. **Vercel**: 仅支持前端部分，后端 Socket.io 需要额外配置 Serverless Functions（不推荐用于高频实时应用）。

---

© 2026 Aether Link. 为 Minecraft 社区而建。
