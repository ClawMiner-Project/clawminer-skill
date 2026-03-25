/**
 * MingXia Skill - PoW Mining Script (4-Hour Death Match Version)
 * 
 * Usage:
 *   node scripts/mine.js              # Mine once
 *   node scripts/mine.js --status     # Show status only
 *   node scripts/mine.js --loop       # Continuous mining loop
 *   node scripts/mine.js --dry-run    # PoW only, no transaction
 */

require('dotenv').config();
const { ethers } = require('ethers');

// ========== Configuration ==========
const CONFIG = {
    // From environment or defaults
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    RPC_URL: process.env.RPC_URL || 'https://bsc-testnet.publicnode.com',
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS, // Needs to be updated after deployment
    NETWORK: process.env.NETWORK || 'testnet',

    // Mining parameters
    MAX_ATTEMPTS: 1_000_000,
    MAX_RETRY: 5,
    RETRY_DELAY_MS: 3000,
    GAS_LIMIT: 300000,
    GAS_BUFFER_PERCENT: 20,
};

// ========== ABI ==========
const ABI = [
    "function mine(uint256 nonce) external",
    "function endMiningAndBurn() external",
    "function balanceOf(address) view returns (uint256)",
    "function clawToken() view returns (address)",
    "function userNonce(address) view returns (uint256)",
    "function userMinedCount(address) view returns (uint256)",
    "function timeLeft() view returns (uint256)",
    "function remainingSupply() view returns (uint256)",
    "function miningProgress() view returns (uint256)",
    "function isMiningEndedAndBurned() view returns (bool)",
    "function MAX_MINES_PER_USER() view returns (uint256)",
    "function REWARD_PER_MINE() view returns (uint256)"
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function faucet() external" // TestCLAW specific
];

// ========== Utility Functions ==========
function log(emoji, message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${emoji} ${message}`);
}

function formatTime(seconds) {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs > 0 ? secs + '秒' : ''}`;
}

function formatNumber(n) {
    return Number(n).toLocaleString();
}

// ========== MingXia Agent ==========
class MingXiaAgent {
    constructor() {
        if (!CONFIG.PRIVATE_KEY) {
            console.error('❌ 错误：未设置 PRIVATE_KEY！');
            console.error('   请复制 .env.example 为 .env 并填入你的私钥。');
            process.exit(1);
        }

        if (!CONFIG.CONTRACT_ADDRESS) {
            console.error('❌ 错误：未设置 CONTRACT_ADDRESS！');
            console.error('   请在 .env 中设置 MingXia 的合约地址。');
            process.exit(1);
        }

        this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
        this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
        this.address = this.wallet.address;
        this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, ABI, this.wallet);
    }

    async getStatus() {
        try {
            const [
                timeLeft, 
                remainingSupply, 
                progress, 
                userMinesCount, 
                maxMines, 
                reward,
                isBurned,
                clawTokenAddr,
                balance
            ] = await Promise.all([
                this.contract.timeLeft(),
                this.contract.remainingSupply(),
                this.contract.miningProgress(),
                this.contract.userMinedCount(this.address),
                this.contract.MAX_MINES_PER_USER(),
                this.contract.REWARD_PER_MINE(),
                this.contract.isMiningEndedAndBurned(),
                this.contract.clawToken(),
                this.contract.balanceOf(this.address)
            ]);

            const clawToken = new ethers.Contract(clawTokenAddr, ERC20_ABI, this.provider);
            const clawBalance = await clawToken.balanceOf(this.address);

            return {
                timeLeft: Number(timeLeft),
                remainingSupply: ethers.formatEther(remainingSupply),
                progress: (Number(progress) / 100).toFixed(2) + '%',
                userMinesCount: Number(userMinesCount),
                maxMines: Number(maxMines),
                reward: ethers.formatEther(reward),
                isBurned: isBurned,
                clawBalance: ethers.formatEther(clawBalance),
                clawTokenAddr: clawTokenAddr,
                balance: ethers.formatEther(balance)
            };
        } catch (error) {
            throw new Error(`Failed to get status: ${error.message}`);
        }
    }

    async showStatus() {
        log('📊', '正在获取挖矿状态...\n');

        const status = await this.getStatus();
        const explorerBase = CONFIG.NETWORK === 'mainnet'
            ? 'https://bscscan.com'
            : 'https://testnet.bscscan.com';

        console.log('  ┌─────────────────────────────────────────┐');
        console.log('  │         🦞 MingXia 挖矿状态           │');
        console.log('  ├─────────────────────────────────────────┤');
        console.log(`  │  钱包：     ${this.address.substring(0, 6)}...${this.address.substring(38)}`);
        console.log(`  │  网络：     BSC ${CONFIG.NETWORK}`);
        console.log(`  │  MXIA余额： ${formatNumber(status.balance)} MXIA`);
        console.log(`  │  CLAW余额： ${formatNumber(status.clawBalance)} CLAW`);
        console.log('  ├─────────────────────────────────────────┤');
        console.log(`  │  全网进度： ${status.progress}`);
        console.log(`  │  剩余可挖： ${formatNumber(status.remainingSupply)} MXIA`);
        console.log(`  │  您的参与： ${status.userMinesCount} / ${status.maxMines} 次 (上限)`);
        console.log('  ├─────────────────────────────────────────┤');
        
        if (status.isBurned) {
             console.log(`  │  倒计时：   🔥 挖矿已结束，剩余代币已销毁！`);
        } else if (status.timeLeft > 0) {
             console.log(`  │  倒计时：   ⏱️ 还剩 ${formatTime(status.timeLeft)}`);
        } else {
             console.log(`  │  倒计时：   ⚠️ 窗口已关闭（等待销毁）`);
        }
        console.log('  └─────────────────────────────────────────┘');
        console.log(`\n  🔍 ${explorerBase}/address/${this.address}\n`);

        return status;
    }

    async findProof(userNonce) {
        const startTime = Date.now();
        let nonce = 0;

        for (let i = 0; i < CONFIG.MAX_ATTEMPTS; i++) {
            const hash = ethers.solidityPackedKeccak256(
                ['address', 'uint256', 'uint256'],
                [this.address, userNonce, nonce]
            );

            // Difficulty: 2 bytes (4 hex chars)
            const prefix = hash.substring(2, 6);
            
            if (prefix === '0000') {
                return {
                    success: true,
                    proof: hash,
                    nonce: nonce,
                    attempts: i + 1,
                    elapsed: Date.now() - startTime
                };
            }

            nonce++;
            // Scrolling logs removed completely to prevent LLM token waste
        }

        return {
            success: false,
            attempts: CONFIG.MAX_ATTEMPTS,
            elapsed: Date.now() - startTime
        };
    }

    async checkCLAW(status, force = false) {
        if (Number(status.clawBalance) === 0) {
            log('⚠️', '未持有 $CLAW 门票！');
            if (force) {
                log('🚨', '警告：你开启了 --force 强制模式，将无视前端检查直接向合约发起硬刚挑战！');
                return true;
            }
            if (CONFIG.NETWORK === 'testnet') {
                log('🛑', '由于你没有 $CLAW，前端已拦截挖矿。');
                log('💡', '测试网用户：请运行 `npx clawminer-skill faucet` 或 `node scripts/mine.js --faucet` 领取测试门票后再挖。');
            } else {
                log('🛑', '主网用户：请先在去中心化交易所购买真实的 $CLAW 代币放入钱包后重试。');
            }
            return false;
        }
        return true;
    }

    async runFaucet() {
        const status = await this.getStatus();
        if (CONFIG.NETWORK !== 'testnet') {
            log('❌', '只有测试网才可以免费领水！');
            return;
        }
        if (Number(status.clawBalance) > 0) {
             log('✅', `你已经有 ${formatNumber(status.clawBalance)} TestCLAW 了，不需要再领跑啦，快去挖矿吧！`);
             return;
        }
        
        log('🛠️', '正在为你向测试网合约申请免费 TestCLAW 门票...');
        const clawToken = new ethers.Contract(status.clawTokenAddr, ERC20_ABI, this.wallet);
        try {
            const tx = await clawToken.faucet();
            log('⏳', `等待领水交易上链确认... (${tx.hash})`);
            await tx.wait();
            log('🌟', 'TestCLAW 领取成功！你现在可以运行 `npx clawminer-skill loop` 疯狂挖矿了！');
        } catch (e) {
            log('❌', `领水失败: ${e.message}`);
        }
    }

    async mine(dryRun = false) {
        log('🦞', 'MingXia — 准备挖矿\n');

        const status = await this.getStatus();
        
        if (status.isBurned || status.timeLeft === 0) {
             return { status: 'ended', message: '⚠️ 挖矿时间窗口已结束！' };
        }

        if (status.userMinesCount >= status.maxMines) {
             return { status: 'exhausted', message: `✅ 恭喜！您已达到单人最大挖矿上限（${status.maxMines}次）。` };
        }

        if (Number(status.remainingSupply) <= 0) {
             return { status: 'ended', message: '⚠️ 2100万 MXIA 已全网挖完！' };
        }

        // Check CLAW holding requirement
        const forceMode = process.argv.includes('--force');
        const hasClaw = await this.checkCLAW(status, forceMode);
        if (!hasClaw) {
            return { status: 'failed', message: '无 $CLAW 在钱包内，挖矿被拦截。' };
        }

        const userNonce = await this.contract.userNonce(this.address);
        log('⛏️', '开始为您自动计算 PoW 证明 (这可能需要几秒钟)...');
        
        const proofResult = await this.findProof(userNonce);

        if (!proofResult.success) {
            return {
                status: 'failed',
                message: `尝试 ${formatNumber(proofResult.attempts)} 次未找到有效 Proof`
            };
        }

        log('✅', `计算完成！尝试：${formatNumber(proofResult.attempts)} 次 | 耗时：${Math.floor(proofResult.elapsed)}ms  (Nonce: ${proofResult.nonce})`);

        if (dryRun) {
            return { status: 'dry-run', message: '模拟运行完成 — Proof 有效' };
        }

        log('📤', '提交交易...');
        let gasLimit = CONFIG.GAS_LIMIT;

        try {
            const estimate = await this.contract.mine.estimateGas(proofResult.nonce);
            gasLimit = Math.floor(Number(estimate) * (1 + CONFIG.GAS_BUFFER_PERCENT / 100));
        } catch (e) {
            log('⛽', `Gas 估算失败，使用默认值：${gasLimit}`);
        }

        try {
            const tx = await this.contract.mine(proofResult.nonce, { gasLimit });
            log('📤', `交易哈希：${tx.hash}`);
            const receipt = await tx.wait();

            if (receipt.status === 1) {
                log('🎉', `挖矿成功！获得 ${status.reward} MXIA (进度: ${status.userMinesCount + 1}/${status.maxMines})`);
                return { status: 'success', txHash: tx.hash, message: '挖矿成功！' };
            } else {
                return { status: 'failed', txHash: tx.hash, message: '交易被回滚' };
            }
        } catch (error) {
            if (error.message.includes("difficulty too low")) {
                return { status: 'retry', message: 'Proof无效或被抢跑，正在重试' };
            }
            if (error.message.includes("Must hold CLAW")) {
                return { status: 'failed', message: '🛑 智能合约直接拒绝：Must hold CLAW to mine (必须持有CLAW)' };
            }
            throw error;
        }
    }

    async mineWithRetry(dryRun = false) {
        let retryCount = 0;

        while (retryCount <= CONFIG.MAX_RETRY) {
            try {
                const result = await this.mine(dryRun);

                if (['success', 'dry-run', 'ended', 'exhausted'].includes(result.status)) {
                    return result;
                }

                retryCount++;
                if (retryCount > CONFIG.MAX_RETRY) {
                    return { status: 'error', message: `重试 ${CONFIG.MAX_RETRY} 次后仍失败` };
                }

                log('🔄', `${CONFIG.RETRY_DELAY_MS / 1000}秒后重试...`);
                await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY_MS));

            } catch (error) {
                retryCount++;
                log('⚠️', `错误：${error.message}`);
                await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY_MS));
            }
        }
    }

    async loop() {
        log('🔁', '启动疯狂连续挖矿模式（按 Ctrl+C 停止）\n');

        while (true) {
            const status = await this.getStatus();
            if (status.timeLeft < 600 && status.timeLeft > 0) { // Last 10 minutes
                CONFIG.RETRY_DELAY_MS = 500; // Speed up
                log('🔥', '倒计时不足 10 分钟，进入加速抢矿状态！');
            }

            const result = await this.mineWithRetry();

            if (result.status === 'ended' || result.status === 'exhausted') {
                log('🛑', result.message);
                break;
            }

            if (result.status === 'success') {
                log('⚡', `🦞 正在为您持续挂机挖矿中... 准备抢占下一个区块！\n`);
            } else {
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const agent = new MingXiaAgent();

    console.log('\n  🦞 MingXia Skill v1.1.0');
    console.log(`  📍 网络：BSC ${CONFIG.NETWORK}`);
    console.log(`  👛 钱包：${agent.address}\n`);

    if (args.includes('--status')) {
        await agent.showStatus();
    } else if (args.includes('--faucet')) {
        await agent.runFaucet();
    } else if (args.includes('--loop')) {
        await agent.loop();
    } else if (args.includes('--dry-run')) {
        await agent.mineWithRetry(true);
    } else {
        const result = await agent.mineWithRetry();
        console.log('\n' + '─'.repeat(50));
        console.log(`  结果：${result.status}`);
        console.log(`  ${result.message}`);
        console.log('─'.repeat(50) + '\n');
    }
}

main().catch(error => {
    console.error('\n❌ 致命错误：', error.message);
    process.exit(1);
});
