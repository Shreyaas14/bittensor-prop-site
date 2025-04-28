// Simple script to start all services without requiring concurrently
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Preparing to start all services...');

// Function to install dependencies in a directory
function installDependencies(dir) {
  console.log(`📦 Installing dependencies in ${dir}...`);
  try {
    execSync('npm install', {
      cwd: path.join(__dirname, dir),
      stdio: 'inherit',
      shell: true
    });
    console.log(`✅ Dependencies installed in ${dir}`);
  } catch (error) {
    console.error(`❌ Failed to install dependencies in ${dir}:`, error.message);
    process.exit(1);
  }
}

// Function to install Python dependencies from requirements.txt
function installPythonDependencies(dir) {
  const requirementsPath = path.join(__dirname, dir, 'requirements.txt');
  
  // Create and activate virtual environment
  console.log(`🐍 Setting up Python virtual environment in ${dir}...`);
  try {
    // Check if venv directory exists
    const venvPath = path.join(__dirname, dir, 'venv');
    if (!fs.existsSync(venvPath)) {
      console.log(`📦 Creating new virtual environment in ${dir}...`);
      execSync('python -m venv venv', {
        cwd: path.join(__dirname, dir),
        stdio: 'inherit',
        shell: true
      });
    } else {
      console.log(`✅ Virtual environment already exists in ${dir}`);
    }
    
    // Check if requirements.txt exists
    if (fs.existsSync(requirementsPath)) {
      console.log(`📦 Installing Python dependencies in ${dir} virtual environment...`);
      
      // Use the appropriate pip command based on the OS
      const pipCommand = process.platform === 'win32' 
        ? '.\\venv\\Scripts\\pip' 
        : './venv/bin/pip';
      
      execSync(`${pipCommand} install -r requirements.txt`, {
        cwd: path.join(__dirname, dir),
        stdio: 'inherit',
        shell: true
      });
      console.log(`✅ Python dependencies installed in ${dir} virtual environment`);
    } else {
      console.log(`⚠️ No requirements.txt found in ${dir}, skipping Python dependencies`);
    }
  } catch (error) {
    console.error(`❌ Failed to set up Python environment in ${dir}:`, error.message);
    process.exit(1);
  }
}

// Function to check and create .env file if needed
function checkEnvFile(dir) {
  const envPath = path.join(__dirname, dir, '.env');
  const templateEnvPath = path.join(__dirname, dir, '.env.example');
  
  console.log(`🔍 Checking for .env file in ${dir}...`);
  
  if (!fs.existsSync(envPath)) {
    console.log(`⚠️ No .env file found in ${dir}`);
    
    // Check if template exists
    if (fs.existsSync(templateEnvPath)) {
      console.log(`📝 Creating .env from template in ${dir}...`);
      fs.copyFileSync(templateEnvPath, envPath);
      console.log(`✅ Created .env file in ${dir}`);
    } else {
      // Create basic .env file with essential variables
      console.log(`📝 Creating basic .env file in ${dir}...`);
      const basicEnvContent = 
`MONGODB_URI=mongodb+srv://shreyaas14:Hello123@bittensor-proposal-site.znpxy.mongodb.net/?retryWrites=true&w=majority&appName=bittensor-proposal-site
PORT=5001
RPC_URL_LOCAL=http://127.0.0.1:9944
RPC_URL_TESTNET=https://evm-testnet.dev.opentensor.ai
CONTRACT_ADDRESS_LOCAL=0x987d372228f3B5C5183465fA080F04F2175672B9
PRIVATE_KEY=864a4a160083d7eb5d7060297bbfe90cf3dab1a7acdbad0325c4ae41291b9cfd
`;
      fs.writeFileSync(envPath, basicEnvContent);
      console.log(`✅ Created basic .env file in ${dir}`);
    }
  } else {
    console.log(`✅ .env file already exists in ${dir}`);
  }
}

// Install dependencies in root, backend, and frontend
installDependencies('.');
installDependencies('backend');
installDependencies('frontend');

// Check and create .env file in backend if needed
checkEnvFile('backend');

// Install Python dependencies in backend
installPythonDependencies('backend');

// Start Python wallet service
console.log('💰 Starting wallet service...');
const pythonCommand = process.platform === 'win32' 
  ? '.\\venv\\Scripts\\python' 
  : './venv/bin/python';
const walletProcess = spawn(pythonCommand, ['wallet_service.py'], {
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