---
name: clawminer
description: PoW mining skill for ClawMiner ($CLAWMINER) on BSC — auto PoW, auto submit, auto retry
---

# ClawMiner Mining Skill

Automated PoW mining for **ClawMiner ($CLAWMINER)** token on BSC.

## What This Skill Does

1. Checks if the miner is in cooldown
2. Reads on-chain difficulty and reward
3. Computes a valid PoW proof (brute-force hash matching)
4. Submits the `mine()` transaction on-chain
5. Waits for confirmation → shows result
6. Retries on failure (up to 5 times)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your **private key**:

```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

> ⚠️ Use a **dedicated mining wallet** with a small amount of BNB for gas. Never use your main wallet.

### 3. Run mining

```bash
# Single mine attempt
node scripts/mine.js

# Check status only
node scripts/mine.js --status

# Continuous loop (mine → wait cooldown → mine again)
node scripts/mine.js --loop
```

## Commands

| Command | Description |
|---------|-------------|
| `node scripts/mine.js` | Mine once |
| `node scripts/mine.js --status` | Show mining stats without mining |
| `node scripts/mine.js --loop` | Continuous mining loop |
| `node scripts/mine.js --dry-run` | PoW calculation only, no transaction |

## Contract Info

| Parameter | Value |
|-----------|-------|
| Token | Claw Miner ($CLAWMINER) |
| Total Supply | 21,000,000 |
| Initial Reward | 100 CLAWMINER / mine |
| Halving | Every 2,100,000 tokens |
| Cooldown | 5 minutes between mines |
| Network | BSC (Testnet / Mainnet) |

## Network Configuration

**Testnet** (default):
```
RPC_URL=https://bsc-testnet.publicnode.com
CONTRACT_ADDRESS=0xCe9eAa062Ca1F6a8817f229921Ec79ac20705c38
```

**Mainnet** (when ready):
```
RPC_URL=https://bsc.publicnode.com
CONTRACT_ADDRESS=<mainnet_contract_address>
```

## Important Notes

- Mining requires **BNB** in your wallet for gas fees (~0.001 BNB per mine on testnet)
- Each mine has a **5-minute cooldown** — the loop mode handles this automatically
- Difficulty increases every 2,000 mines — PoW computation will take longer over time
- The contract is **fully decentralized** — no admin, no pre-mine, non-upgradeable
