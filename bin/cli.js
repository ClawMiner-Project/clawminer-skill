#!/usr/bin/env node

/**
 * MingXia Skill CLI
 * 
 * Usage:
 *   npx clawminer-skill init     # 初始化 Skill（安装依赖 + 引导配置）
 *   npx clawminer-skill mine     # 单次挖矿
 *   npx clawminer-skill loop     # 连续挖矿（推荐）
 *   npx clawminer-skill status   # 查看挖矿状态
 *   npx clawminer-skill faucet   # [测试网] 领取免费 TestCLAW 门票
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SKILL_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(SKILL_DIR, '.env');
const ENV_EXAMPLE = path.join(SKILL_DIR, '.env.example');

// ========== Helpers ==========
function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

function log(emoji, msg) {
    console.log(`${emoji} ${msg}`);
}

// ========== Commands ==========

/**
 * init — 初始化 Skill，引导用户配置钱包
 */
async function init() {
    console.log('\n🦞 MingXia Skill 初始化\n');

    // 1. Check if already initialized
    if (fs.existsSync(ENV_FILE)) {
        log('✅', '.env 文件已存在，Skill 已配置。');
        log('💡', '如需重新配置，请删除 .env 文件后重试。');
        console.log('');
        return;
    }

    // 2. Install dependencies if needed
    const nodeModules = path.join(SKILL_DIR, 'node_modules');
    if (!fs.existsSync(nodeModules)) {
        log('📦', '正在安装依赖...');
        execSync('npm install', { cwd: SKILL_DIR, stdio: 'inherit' });
        console.log('');
    }

    // 3. Wallet security warning
    console.log('  ┌─────────────────────────────────────────────────┐');
    console.log('  │  ⚠️  安全提醒                                   │');
    console.log('  │                                                   │');
    console.log('  │  请使用【专用挖矿钱包】，不要使用你的主钱包！    │');
    console.log('  │                                                   │');
    console.log('  │  挖矿钱包只需存放少量 BNB 作为 Gas 费。         │');
    console.log('  │  如果还没有挖矿钱包，请在 MetaMask 中新建一个。 │');
    console.log('  │                                                   │');
    console.log('  │  ❌ 主钱包（存有大额资产）                       │');
    console.log('  │  ✅ 专用挖矿钱包（仅存少量 BNB）               │');
    console.log('  └─────────────────────────────────────────────────┘\n');

    // 4. Get private key
    const privateKey = await ask('  🔑 请输入你的【挖矿钱包】私钥（0x 开头）：\n  > ');

    if (!privateKey || !privateKey.startsWith('0x')) {
        log('❌', '私钥格式不正确，请确保以 0x 开头。');
        return;
    }

    // 5. Ask for network
    const network = await ask('\n  🌐 选择网络 [testnet/mainnet]（默认 testnet）：\n  > ');
    const selectedNetwork = (network === 'mainnet') ? 'mainnet' : 'testnet';

    // 6. Set RPC and contract based on network
    let rpcUrl, contractAddress;
    if (selectedNetwork === 'mainnet') {
        rpcUrl = 'https://bsc.publicnode.com';
        contractAddress = await ask('\n  📄 请输入主网合约地址：\n  > ');
    } else {
        rpcUrl = 'https://bsc-testnet.publicnode.com';
        contractAddress = '0x3a74292B73CBB4dCfdf9cAA85CF88c41d7992410';
    }

    // 7. Write .env
    const envContent = `# MingXia Skill Configuration
# ⚠️ 此文件包含私钥，请勿分享或上传！

PRIVATE_KEY=${privateKey}
RPC_URL=${rpcUrl}
CONTRACT_ADDRESS=${contractAddress}
NETWORK=${selectedNetwork}
`;

    fs.writeFileSync(ENV_FILE, envContent);
    log('✅', '配置完成！.env 文件已创建。\n');

    // 8. Show next steps
    console.log('  📋 接下来你可以：');
    console.log('  ├─ npx clawminer-skill mine     单次挖矿');
    console.log('  ├─ npx clawminer-skill loop     连续挖矿（推荐）');
    console.log('  └─ npx clawminer-skill status   查看状态\n');
}

/**
 * Run mining script with given args
 */
function runMine(args) {
    const mineScript = path.join(SKILL_DIR, 'scripts', 'mine.js');
    
    if (!fs.existsSync(ENV_FILE)) {
        log('❌', '尚未配置！请先运行：npx clawminer-skill init');
        process.exit(1);
    }

    const child = spawn('node', [mineScript, ...args], {
        cwd: SKILL_DIR,
        stdio: 'inherit',
        env: { ...process.env }
    });

    child.on('close', code => process.exit(code));
}

// ========== CLI Router ==========
const command = process.argv[2];

switch (command) {
    case 'init':
        init().catch(err => {
            console.error('❌ 初始化错误：', err.message);
            process.exit(1);
        });
        break;
    case 'mine':
        runMine([]);
        break;
    case 'loop':
        runMine(['--loop']);
        break;
    case 'status':
        runMine(['--status']);
        break;
    case 'faucet':
        runMine(['--faucet']);
        break;
    case 'dry-run':
        runMine(['--dry-run']);
        break;
    default:
        console.log(`
  🦞 MingXia Skill v1.1.0

  命令：
    npx clawminer-skill init       初始化配置（首次使用）
    npx clawminer-skill mine       单次挖矿
    npx clawminer-skill loop       连续挖矿（推荐）
    npx clawminer-skill status     查看挖矿状态
    npx clawminer-skill faucet     [测试网] 领取免费 TestCLAW 门票
    npx clawminer-skill dry-run    模拟挖矿（不提交交易）

  GitHub: https://github.com/ClawMiner-Project/clawminer-skill
`);
        break;
}
