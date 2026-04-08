# 使用 Node.js 官方镜像
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有源代码
COPY . .

# 构建前端静态资源
RUN npm run build

# 暴露端口 (AI Studio 默认使用 3000)
EXPOSE 3000

# 启动服务器
CMD ["npm", "run", "start"]
