// Simple script to start all services without requiring concurrently
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting all services...');

// Start Python wallet service
console.log('💰 Starting wallet service...');
const walletProcess = spawn('python', ['wallet_service.py'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Start Node backend
console.log('🔄 Starting Node.js backend...');
const serverProcess = spawn('ts-node', ['server.ts'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Start frontend
console.log('🌐 Starting frontend...');
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down all services...');
  walletProcess.kill();
  serverProcess.kill();
  frontendProcess.kill();
  process.exit(0);
}); 