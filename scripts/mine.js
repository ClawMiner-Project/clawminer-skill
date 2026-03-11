/**
 * ClawMiner Skill - PoW Mining Script
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
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0xCe9eAa062Ca1F6a8817f229921Ec79ac20705c38',
    NETWORK: process.env.NETWORK || 'testnet',

    // Mining parameters
    MAX_ATTEMPTS: 500000,
    MAX_RETRY: 5,
    RETRY_DELAY_MS: 2000,
    GAS_LIMIT: 300000,
    GAS_BUFFER_PERCENT: 20,
    COOLDOWN_SECONDS: 300,  // 5 minutes
};

// ========== ABI ==========
const ABI = [
    "function currentDifficulty() view returns (uint256)",
    "function cooldownRemaining(address) view returns (uint256)",
    "function mine(bytes32,uint256,uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function getMiningInfo(address) view returns (uint256,uint256,uint256,uint256,uint256,uint256)",
    "function currentBlockReward() view returns (uint256)",
    "function totalMined() view returns (uint256)",
    "function miningProgress() view returns (uint256)",
    "function currentPhase() view returns (uint256)",
    "function remainingSupply() view returns (uint256)"
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

// ========== ClawMiner Agent ==========
class ClawMinerAgent {
    constructor() {
        if (!CONFIG.PRIVATE_KEY) {
            console.error('❌ 错误：未设置 PRIVATE_KEY！');
            console.error('   请复制 .env.example 为 .env 并填入你的私钥：');
            console.error('   cp .env.example .env');
            process.exit(1);
        }

        this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
        this.wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, this.provider);
        this.address = this.wallet.address;
        this.contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, ABI, this.wallet);
    }

    /**
     * Get full mining status
     */
    async getStatus() {
        try {
            const [info, progress, cooldown, balance] = await Promise.all([
                this.contract.getMiningInfo(this.address),
                this.contract.miningProgress(),
                this.contract.cooldownRemaining(this.address),
                this.contract.balanceOf(this.address)
            ]);

            return {
                totalMined: ethers.formatEther(info[0]),
                remaining: ethers.formatEther(info[1]),
                difficulty: Number(info[2]),
                reward: ethers.formatEther(info[3]),
                cooldownEnd: Number(info[4]),
                nextHalving: ethers.formatEther(info[5]),
                progress: (Number(progress) / 100).toFixed(2) + '%',
                cooldownRemaining: Number(cooldown),
                balance: ethers.formatEther(balance)
            };
        } catch (error) {
            throw new Error(`Failed to get status: ${error.message}`);
        }
    }

    /**
     * Display mining status
     */
    async showStatus() {
        log('📊', '正在获取挖矿状态...\n');

        const status = await this.getStatus();
        const explorerBase = CONFIG.NETWORK === 'mainnet'
            ? 'https://bscscan.com'
            : 'https://testnet.bscscan.com';

        console.log('  ┌─────────────────────────────────────────┐');
        console.log('  │         🦞 ClawMiner 挖矿状态          │');
        console.log('  ├─────────────────────────────────────────┤');
        console.log(`  │  钱包：     ${this.address.substring(0, 6)}...${this.address.substring(38)}`);
        console.log(`  │  网络：     BSC ${CONFIG.NETWORK}`);
        console.log(`  │  余额：     ${formatNumber(status.balance)} CLAWMINER`);
        console.log('  ├─────────────────────────────────────────┤');
        console.log(`  │  难度：     ${status.difficulty} 字节`);
        console.log(`  │  奖励：     ${status.reward} CLAWMINER / 次`);
        console.log(`  │  进度：     ${status.progress}`);
        console.log(`  │  剩余可挖： ${formatNumber(status.remaining)} CLAWMINER`);
        console.log('  ├─────────────────────────────────────────┤');

        if (status.cooldownRemaining > 0) {
            console.log(`  │  冷却：     ⏱️  还需 ${formatTime(status.cooldownRemaining)}`);
        } else {
            console.log(`  │  冷却：     ✅ 可以挖矿！`);
        }

        console.log('  └─────────────────────────────────────────┘');
        console.log(`\n  🔍 ${explorerBase}/address/${this.address}\n`);

        return status;
    }

    /**
     * Check if mining is possible
     */
    async canMine() {
        const cooldown = await this.contract.cooldownRemaining(this.address);
        return {
            canMine: cooldown === 0n,
            remaining: Number(cooldown)
        };
    }

    /**
     * Find a valid PoW proof
     */
    async findProof(blockNumber, timestamp, difficulty) {
        const targetHexChars = difficulty * 2;
        const startTime = Date.now();

        let nonce = 0;

        for (let i = 0; i < CONFIG.MAX_ATTEMPTS; i++) {
            const hash = ethers.solidityPackedKeccak256(
                ['uint256', 'uint256', 'address', 'uint256'],
                [blockNumber, timestamp, this.address, nonce]
            );

            const prefix = hash.substring(2, 2 + targetHexChars);
            const allZeros = prefix.split('').every(c => c === '0');

            if (allZeros) {
                return {
                    success: true,
                    proof: hash,
                    nonce: nonce,
                    attempts: i + 1,
                    elapsed: Date.now() - startTime
                };
            }

            nonce++;

            // Progress report every 100k attempts
            if (i % 100000 === 0 && i > 0) {
                log('⛏️', `正在计算 PoW... 已尝试 ${formatNumber(i)} 次（${Math.floor((Date.now() - startTime) / 1000)}秒）`);
            }
        }

        return {
            success: false,
            attempts: CONFIG.MAX_ATTEMPTS,
            elapsed: Date.now() - startTime
        };
    }

    /**
     * Execute single mine
     */
    async mine(dryRun = false) {
        log('🦞', 'ClawMiner — 开始挖矿\n');

        // 1. Check cooldown
        log('⏱️', '检查冷却状态...');
        const canMineResult = await this.canMine();

        if (!canMineResult.canMine) {
            log('⏱️', `冷却中 — 还需 ${formatTime(canMineResult.remaining)}`);
            return {
                status: 'cooling',
                remaining: canMineResult.remaining,
                message: `冷却中，还需 ${formatTime(canMineResult.remaining)}`
            };
        }

        // 2. Get current state
        const status = await this.getStatus();
        log('📊', `难度：${status.difficulty} | 奖励：${status.reward} CLAWMINER | 进度：${status.progress}`);

        // 3. Get block info
        const [blockNumber, block] = await Promise.all([
            this.provider.getBlockNumber(),
            this.provider.getBlock()
        ]);
        const timestamp = block.timestamp;
        log('🔗', `区块：${blockNumber} | 时间戳：${timestamp}`);

        // 4. Find proof
        log('⛏️', '正在计算 PoW 证明...');
        const proofResult = await this.findProof(blockNumber, Number(timestamp), status.difficulty);

        if (!proofResult.success) {
            log('❌', `尝试 ${formatNumber(proofResult.attempts)} 次后未找到有效解（${Math.floor(proofResult.elapsed / 1000)}秒）`);
            return {
                status: 'failed',
                message: `尝试 ${formatNumber(proofResult.attempts)} 次未找到有效 Proof`,
                attempts: proofResult.attempts,
                elapsed: proofResult.elapsed
            };
        }

        log('✅', `找到有效 Proof！尝试：${formatNumber(proofResult.attempts)} 次 | 耗时：${Math.floor(proofResult.elapsed / 1000)}秒`);
        log('🔑', `Hash: ${proofResult.proof.substring(0, 22)}...`);

        // Dry run stops here
        if (dryRun) {
            log('🧪', '模拟运行 — 跳过交易提交');
            return {
                status: 'dry-run',
                proof: proofResult.proof,
                nonce: proofResult.nonce,
                attempts: proofResult.attempts,
                elapsed: proofResult.elapsed,
                message: '模拟运行完成 — Proof 有效'
            };
        }

        // 5. Estimate gas
        log('📤', '准备提交交易...');
        let gasLimit = CONFIG.GAS_LIMIT;

        try {
            const estimate = await this.contract.mine.estimateGas(
                proofResult.proof, blockNumber, timestamp
            );
            gasLimit = Math.floor(Number(estimate) * (1 + CONFIG.GAS_BUFFER_PERCENT / 100));
            log('⛽', `Gas 估算：${estimate} → ${gasLimit}（含缓冲）`);
        } catch (e) {
            log('⛽', `Gas 估算失败，使用默认值：${gasLimit}`);
        }

        // 6. Submit transaction
        try {
            const tx = await this.contract.mine(
                proofResult.proof, blockNumber, timestamp,
                { gasLimit }
            );

            log('📤', `交易哈希：${tx.hash}`);
            log('⏳', '等待链上确认...');

            const receipt = await tx.wait();
            const explorerBase = CONFIG.NETWORK === 'mainnet'
                ? 'https://bscscan.com'
                : 'https://testnet.bscscan.com';

            if (receipt.status === 1) {
                const balance = await this.contract.balanceOf(this.address);

                log('🎉', `挖矿成功！获得 ${status.reward} CLAWMINER`);
                log('💰', `总余额：${ethers.formatEther(balance)} CLAWMINER`);
                log('🔍', `${explorerBase}/tx/${tx.hash}`);

                return {
                    status: 'success',
                    txHash: tx.hash,
                    gasUsed: Number(receipt.gasUsed),
                    reward: status.reward,
                    balance: ethers.formatEther(balance),
                    proof: proofResult.proof,
                    attempts: proofResult.attempts,
                    message: `挖矿成功！获得 ${status.reward} CLAWMINER`
                };
            } else {
                log('❌', `交易失败 (status=0)`);
                return { status: 'failed', txHash: tx.hash, message: '交易被回滚' };
            }
        } catch (error) {
            if (error.message.includes('Cooldown')) {
                log('⏱️', '冷却中 — 请稍后重试');
                return { status: 'cooling', message: '冷却中，请稍后重试' };
            }
            if (error.message.includes('Proof already used')) {
                log('⚠️', 'Proof 已被使用 — 将使用新的 Proof 重试');
                return { status: 'retry', message: 'Proof 已被使用' };
            }
            throw error;
        }
    }

    /**
     * Mine with retry
     */
    async mineWithRetry(dryRun = false) {
        let retryCount = 0;

        while (retryCount <= CONFIG.MAX_RETRY) {
            try {
                const result = await this.mine(dryRun);

                if (result.status === 'success' || result.status === 'cooling' || result.status === 'dry-run') {
                    return result;
                }

                retryCount++;
                if (retryCount > CONFIG.MAX_RETRY) {
                    log('❌', `已达最大重试次数 (${CONFIG.MAX_RETRY})`);
                    return { status: 'exhausted', message: `重试 ${CONFIG.MAX_RETRY} 次后仍失败` };
                }

                log('🔄', `${CONFIG.RETRY_DELAY_MS / 1000}秒后重试 (${retryCount}/${CONFIG.MAX_RETRY})...`);
                await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY_MS));

            } catch (error) {
                retryCount++;
                if (retryCount > CONFIG.MAX_RETRY) {
                    log('❌', `Error: ${error.message}`);
                    return { status: 'error', message: error.message };
                }
                log('⚠️', `错误：${error.message}`);
                log('🔄', `${CONFIG.RETRY_DELAY_MS / 1000}秒后重试 (${retryCount}/${CONFIG.MAX_RETRY})...`);
                await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY_MS));
            }
        }
    }

    /**
     * Continuous mining loop
     */
    async loop() {
        log('🔁', '启动连续挖矿循环（按 Ctrl+C 停止）\n');
        let mineCount = 0;

        while (true) {
            mineCount++;
            log('🔁', `\n${'='.repeat(50)}`);
            log('🔁', `第 ${mineCount} 轮挖矿`);
            log('🔁', `${'='.repeat(50)}\n`);

            const result = await this.mineWithRetry();

            if (result.status === 'cooling') {
                const waitTime = result.remaining || CONFIG.COOLDOWN_SECONDS;
                log('⏱️', `等待冷却 ${formatTime(waitTime)}...\n`);

                // Countdown display
                let remaining = waitTime;
                while (remaining > 0) {
                    process.stdout.write(`\r  ⏱️  冷却中：还需 ${formatTime(remaining)}...  `);
                    await new Promise(r => setTimeout(r, 10000)); // Update every 10s
                    remaining -= 10;
                }
                console.log('\n');
            } else if (result.status === 'success') {
                // Wait for cooldown after successful mine
                log('⏱️', `等待冷却 ${formatTime(CONFIG.COOLDOWN_SECONDS)}...\n`);
                let remaining = CONFIG.COOLDOWN_SECONDS;
                while (remaining > 0) {
                    process.stdout.write(`\r  ⏱️  冷却中：还需 ${formatTime(remaining)}...  `);
                    await new Promise(r => setTimeout(r, 10000));
                    remaining -= 10;
                }
                console.log('\n');
            } else {
                // On error, wait a bit before retrying
                log('⚠️', '30秒后重新尝试...');
                await new Promise(r => setTimeout(r, 30000));
            }
        }
    }
}

// ========== CLI Entry Point ==========
async function main() {
    const args = process.argv.slice(2);
    const agent = new ClawMinerAgent();

    console.log('\n  🦞 ClawMiner Skill v1.0.0');
    console.log(`  📍 网络：BSC ${CONFIG.NETWORK}`);
    console.log(`  👛 钱包：${agent.address}\n`);

    if (args.includes('--status')) {
        await agent.showStatus();
    } else if (args.includes('--loop')) {
        await agent.loop();
    } else if (args.includes('--dry-run')) {
        await agent.mineWithRetry(true);
    } else {
        const result = await agent.mineWithRetry();
        console.log('\n' + '─'.repeat(50));
        console.log(`  结果：${result.status}`);
        console.log(`  ${result.message}`);
        if (result.txHash) {
            const explorerBase = CONFIG.NETWORK === 'mainnet'
                ? 'https://bscscan.com'
                : 'https://testnet.bscscan.com';
            console.log(`  🔍 ${explorerBase}/tx/${result.txHash}`);
        }
        console.log('─'.repeat(50) + '\n');
    }
}

main().catch(error => {
    console.error('\n❌ 致命错误：', error.message);
    process.exit(1);
});
