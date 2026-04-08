/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Cpu, 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight,
  Command,
  Search,
  Server as ServerIcon,
  Wifi,
  WifiOff,
  Users,
  ExternalLink,
  Activity,
  RefreshCw
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface MCServer {
  id: string;
  ownerName: string;
  ip: string;
  port: number;
  status: 'online' | 'offline';
  lastSeen: number;
  description?: string;
}

const ServerCard = ({ server }: { server: MCServer }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className="p-6 rounded-[2rem] glass flex flex-col justify-between group cursor-pointer border border-white/10"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 rounded-2xl bg-apple-blue/10 flex items-center justify-center text-apple-blue group-hover:bg-apple-blue group-hover:text-white transition-all duration-500">
        <ServerIcon size={24} />
      </div>
      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${server.status === 'online' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        {server.status === 'online' ? '在线' : '离线'}
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-bold tracking-tight mb-1">{server.ownerName} 的服务器</h3>
      <p className="text-apple-gray text-xs font-mono mb-4">{server.ip}:{server.port}</p>
      
      <div className="flex items-center gap-4 text-xs text-apple-gray">
        <div className="flex items-center gap-1">
          <Activity size={12} />
          <span>实时活跃</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={12} />
          <span>公开连接</span>
        </div>
      </div>
    </div>

    <button className="mt-6 w-full py-3 bg-black text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/80 transition-all">
      立即加入
      <ExternalLink size={14} />
    </button>
  </motion.div>
);

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [servers, setServers] = useState<MCServer[]>([]);
  const [localServer, setLocalServer] = useState<{ detected: boolean, port: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [userName, setUserName] = useState("探险者");

  // Socket initialization
  useEffect(() => {
    // 如果在 GitHub Pages 部署，需要指向一个运行中的后端服务器地址
    // 例如: const BACKEND_URL = "https://your-backend-on-railway.app";
    const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? undefined 
      : (window.location.hostname.includes('github.io') 
          ? "https://ais-dev-xsocdzfxkufrehubopp4ym-173678842048.us-east5.run.app" 
          : undefined);

    const newSocket = io(BACKEND_URL, {
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    setSocket(newSocket);

    newSocket.on("server-list", (list: MCServer[]) => {
      setServers(list);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Minecraft Local Detection
  const scanLocalServer = useCallback(async () => {
    setIsScanning(true);
    const commonPorts = [25565, 25566, 19132, 80, 8080]; 
    let found = false;

    for (const port of commonPorts) {
      try {
        // 尝试使用图片探测法，这在某些浏览器中比 fetch 更容易穿透安全限制
        const probeResult = await new Promise((resolve) => {
          const img = new Image();
          const timer = setTimeout(() => {
            img.src = "";
            resolve(false);
          }, 1000);
          
          img.onload = () => { clearTimeout(timer); resolve(true); };
          img.onerror = () => { clearTimeout(timer); resolve(true); }; // 报错也说明端口有响应
          img.src = `http://127.0.0.1:${port}/favicon.ico?t=${Date.now()}`;
        });

        if (probeResult) {
          setLocalServer({ detected: true, port });
          found = true;
          break;
        }

        // 备用 fetch 探测
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        await fetch(`http://127.0.0.1:${port}`, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeoutId);
        setLocalServer({ detected: true, port });
        found = true;
        break;
      } catch (e: any) {
        if (e.name === 'TypeError') {
           setLocalServer({ detected: true, port });
           found = true;
           break;
        }
      }
    }

    if (!found) setLocalServer({ detected: false, port: 0 });
    setIsScanning(false);
  }, []);

  const [manualPort, setManualPort] = useState<string>("");
  const [manualIp, setManualIp] = useState<string>("127.0.0.1");

  const handleManualBroadcast = () => {
    if (socket && manualPort) {
      const portNum = parseInt(manualPort);
      // 同步更新本地状态显示
      setLocalServer({ detected: true, port: portNum });
      
      socket.emit("broadcast-server", {
        ownerName: userName,
        ip: manualIp,
        port: portNum,
        status: 'online',
        description: "手动配置的服务器"
      });

      // 滚动到列表查看
      const serverList = document.getElementById('server-list');
      serverList?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scanLocalServer();
  }, [scanLocalServer]);

  // Broadcast local server
  const broadcastServer = () => {
    if (socket && localServer?.detected) {
      socket.emit("broadcast-server", {
        ownerName: userName,
        ip: "127.0.0.1", 
        port: localServer.port,
        status: 'online',
        description: "我的世界本地服务器"
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans overflow-x-hidden bg-[#F5F5F7]">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 ${isScrolled ? "pt-4" : "pt-8"}`}>
        <div className={`max-w-5xl mx-auto rounded-full px-6 py-3 flex items-center justify-between transition-all duration-500 ${isScrolled ? "glass shadow-lg" : "bg-transparent"}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Command size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tighter">Aether Link</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-apple-gray">
            <a href="#" className="hover:text-black transition-colors">网络状态</a>
            <a href="#" className="hover:text-black transition-colors">内网穿透</a>
            <a href="#" className="hover:text-black transition-colors">玩家社区</a>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{socket?.connected ? '已连接' : '未连接'}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              我的世界 <br /> <span className="text-apple-blue">联机桥接。</span>
            </h1>
            <p className="max-w-xl text-xl text-apple-gray mb-12">
              自动探测并向全球分享您的本地 Minecraft 服务器。零配置，纯粹连接。
            </p>
          </motion.div>

          {/* Local Status Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md p-8 rounded-[2.5rem] glass border border-white/40 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wifi size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${localServer?.detected ? 'bg-green-500/10 text-green-500' : 'bg-apple-gray/10 text-apple-gray'}`}>
                  {localServer?.detected ? <Wifi size={20} /> : <WifiOff size={20} />}
                </div>
                <div>
                  <h2 className="font-bold">本地探测</h2>
                  <p className="text-xs text-apple-gray">正在扫描本地端口...</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-black/5 rounded-2xl">
                  <span className="text-sm font-medium">当前状态</span>
                  <span className={`text-sm font-bold ${localServer?.detected ? 'text-green-500' : 'text-red-500'}`}>
                    {localServer?.detected ? '已发现服务器' : '未检测到运行中的服务器'}
                  </span>
                </div>
                {localServer?.detected && (
                  <div className="flex justify-between items-center p-4 bg-black/5 rounded-2xl">
                    <span className="text-sm font-medium">运行端口</span>
                    <span className="text-sm font-mono font-bold">{localServer.port}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={scanLocalServer}
                  disabled={isScanning}
                  className="flex-1 py-4 glass rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/5 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
                  重新扫描
                </button>
                <button 
                  onClick={broadcastServer}
                  disabled={!localServer?.detected}
                  className="flex-[2] py-4 bg-black text-white rounded-2xl text-sm font-bold hover:bg-black/80 transition-all disabled:opacity-50 shadow-lg shadow-black/10"
                >
                  向全球广播
                </button>
              </div>

              {/* 手动输入折叠面板 */}
              <div className="mt-6 pt-6 border-t border-black/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-apple-gray mb-4">手动配置 (若自动探测失败)</p>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    placeholder="IP 地址" 
                    value={manualIp}
                    onChange={(e) => setManualIp(e.target.value)}
                    className="flex-[2] px-4 py-2 bg-black/5 rounded-xl text-xs outline-none focus:ring-2 ring-apple-blue/20"
                  />
                  <input 
                    type="number" 
                    placeholder="端口" 
                    value={manualPort}
                    onChange={(e) => setManualPort(e.target.value)}
                    className="flex-1 px-4 py-2 bg-black/5 rounded-xl text-xs outline-none focus:ring-2 ring-apple-blue/20"
                  />
                </div>
                <button 
                  onClick={handleManualBroadcast}
                  className="w-full py-2 text-xs font-bold text-apple-blue hover:bg-apple-blue/5 rounded-xl transition-all"
                >
                  手动广播此地址
                </button>
              </div>

              <div className="mt-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <p className="text-[10px] text-amber-600 leading-relaxed">
                  <span className="font-bold">为什么检测不到？</span><br />
                  由于您正在通过 HTTPS 访问，浏览器默认禁止网页连接您的本地电脑。
                  <br /><br />
                  <span className="font-bold">解决方法：</span><br />
                  1. 直接在上方输入您的 <span className="underline">内网穿透公网地址</span>。<br />
                  2. 或者在 Chrome 浏览器地址栏输入 <code className="bg-amber-100 px-1">chrome://flags/#block-insecure-private-network-requests</code> 并设置为 <span className="font-bold">Disabled</span>。
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-1/2 h-full -z-0 pointer-events-none opacity-50">
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-apple-blue/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]" />
        </div>
      </section>

      {/* Global Servers List */}
      <section id="server-list" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">活跃服务器</h2>
              <p className="text-apple-gray">实时同步的 Minecraft 共享世界列表。</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray" size={18} />
                <input 
                  type="text" 
                  placeholder="搜索服务器..." 
                  className="pl-12 pr-6 py-3 bg-[#F5F5F7] rounded-full text-sm outline-none focus:ring-2 ring-apple-blue/20 transition-all w-64"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {servers.length > 0 ? (
                servers.map((server) => (
                  <ServerCard key={server.id} server={server} />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center glass rounded-[3rem] border border-dashed border-apple-gray/30"
                >
                  <div className="w-16 h-16 bg-apple-gray/10 rounded-full flex items-center justify-center mx-auto mb-4 text-apple-gray">
                    <WifiOff size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">暂无活跃服务器</h3>
                  <p className="text-apple-gray">成为第一个分享世界的人吧！</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-black/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Command size={24} />
            <span className="font-bold text-xl tracking-tighter">Aether Link</span>
          </div>
          <p className="text-xs text-apple-gray font-medium uppercase tracking-widest">
            © 2026 Aether Link. 为 Minecraft 社区而建。
          </p>
          <div className="flex gap-8 text-xs text-apple-gray font-medium uppercase tracking-widest">
            <a href="#" className="hover:text-black transition-colors">运行状态</a>
            <a href="#" className="hover:text-black transition-colors">开源代码</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
