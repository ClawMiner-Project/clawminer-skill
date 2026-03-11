---
name: clawminer
description: PoW mining skill for ClawMiner ($CLAWMINER) on BSC — auto PoW, auto submit, auto retry
---

# ClawMiner Mining Skill

You are operating the ClawMiner PoW mining skill. This skill allows the user to mine $CLAWMINER tokens on BNB Smart Chain (BSC) through Proof of Work computation.

## Available Commands

| Command | What it does |
|---------|-------------|
| `npx clawminer-skill init` | 初始化：安装依赖 + 交互式配置钱包 |
| `npx clawminer-skill mine` | 单次挖矿 |
| `npx clawminer-skill loop` | 连续挖矿 24/7（推荐）|
| `npx clawminer-skill status` | 查看挖矿状态 |
| `npx clawminer-skill dry-run` | 模拟挖矿（不提交交易）|

## Workflow

### Step 1: Install & Initialize

Run the init command. It will install dependencies and guide wallet configuration interactively:

```bash
npx clawminer-skill init
```

The init process will:
1. Install npm dependencies (ethers.js, dotenv)
2. Display a **security warning** about using a dedicated mining wallet
3. Ask for the user's **private key** (must be a dedicated mining wallet, NOT their main wallet)
4. Ask which network (testnet/mainnet)
5. Create `.env` configuration file

### Step 2: Start Mining

After init is complete, start mining:

```bash
# Recommended: continuous mining loop
npx clawminer-skill loop

# Or single mine attempt
npx clawminer-skill mine
```

### Step 3: Monitor

Check mining status anytime:

```bash
npx clawminer-skill status
```

## ⚠️ Critical Security Rules

When the user asks to configure or initialize this skill, you MUST:

1. **WARN** them to use a **dedicated mining wallet**, NOT their main wallet
2. **EXPLAIN** that the mining wallet only needs a small amount of BNB for gas fees (~0.001 BNB per mine)
3. **SUGGEST** creating a new account in MetaMask specifically for mining
4. **NEVER** store or log the private key anywhere other than the local `.env` file
5. **NEVER** transmit the private key over any network or API

## Mining Mechanics

- Each mine requires computing a PoW proof (hash with N leading zeros)
- Current difficulty: starts at 1 byte (2 hex chars), increases every 2,000 mines
- Reward: starts at 100 CLAWMINER per mine, halves every 2,100,000 tokens
- Cooldown: 5 minutes between mines
- Gas: ~0.001 BNB per mine transaction on BSC

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cooldown active" | Normal. Wait 5 minutes between mines. Loop mode handles this automatically. |
| "Proof already used" | The script will auto-retry with a new proof. |
| Gas estimation failed | Network congestion. The script uses a default gas limit as fallback. |
| "PRIVATE_KEY not set" | Run `npx clawminer-skill init` first. |

## Contract Info

- Token: Claw Miner ($CLAWMINER)
- Total Supply: 21,000,000
- Network: BSC Testnet (Chain ID: 97) / BSC Mainnet (Chain ID: 56)
- Testnet Contract: `0xCe9eAa062Ca1F6a8817f229921Ec79ac20705c38`
