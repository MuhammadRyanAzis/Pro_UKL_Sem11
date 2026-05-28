const { spawn, exec } = require('child_process');
const os = require('os');
const http = require('http');

// Prevent macOS log pollution from MallocStackLogging in spawned processes
delete process.env.MallocStackLogging;
delete process.env.MallocStackLoggingNoCompat;

// Get local IP address for mobile testing
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const localIp = getLocalIp();
const FRONTEND_PORT = 3000;
const BACKEND_PORT = 8000;

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '   🚀 DevAcademy E-Learning Platform Launcher   ');
console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[90m%s\x1b[0m', 'Memulai backend (NestJS) dan frontend (Next.js) dengan akselerasi Rust...');

// Spawn backend
const backend = spawn('npm', ['run', 'start:dev', '--prefix', 'backend'], {
  stdio: 'inherit',
  shell: true
});

// Spawn frontend
const frontend = spawn('npm', ['run', 'dev', '--prefix', 'frontend'], {
  stdio: 'inherit',
  shell: true
});

// Clean up processes on exit to prevent rogue node processes
const cleanExit = () => {
  console.log('\n\x1b[33m%s\x1b[0m', 'Stopping backend and frontend services...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

const net = require('net');

// Check if Next.js is ready (via raw TCP socket check)
let opened = false;
const checkInterval = setInterval(() => {
  const socket = new net.Socket();
  socket.setTimeout(500);
  
  socket.on('connect', () => {
    socket.destroy();
    if (!opened) {
      opened = true;
      clearInterval(checkInterval);
      
      console.log('\n\x1b[32m%s\x1b[0m', '==================================================');
      console.log('\x1b[32m%s\x1b[0m', '   🎉 SEMUA LAYANAN SIAP & BERJALAN!              ');
      console.log('\x1b[32m%s\x1b[0m', '==================================================');
      console.log(`💻 \x1b[1mFrontend (Local):\x1b[0m   \x1b[36mhttp://localhost:${FRONTEND_PORT}\x1b[0m`);
      if (localIp) {
        console.log(`📱 \x1b[1mFrontend (Mobile):\x1b[0m  \x1b[36mhttp://${localIp}:${FRONTEND_PORT}\x1b[0m`);
      }
      console.log(`🔌 \x1b[1mBackend API:\x1b[0m       \x1b[36mhttp://localhost:${BACKEND_PORT}/api\x1b[0m`);
      console.log(`📄 \x1b[1mSwagger Docs:\x1b[0m      \x1b[36mhttp://localhost:${BACKEND_PORT}/api/docs\x1b[0m`);
      console.log('\x1b[32m%s\x1b[0m', '==================================================');
      console.log('\x1b[90m%s\x1b[0m', 'Membuka browser Anda secara otomatis...\n');

      // Open default browser on macOS
      exec(`open http://localhost:${FRONTEND_PORT}`);
    }
  });
  
  socket.on('error', () => {
    socket.destroy();
  });
  
  socket.on('timeout', () => {
    socket.destroy();
  });
  
  socket.connect(FRONTEND_PORT, '127.0.0.1');
}, 1000);

