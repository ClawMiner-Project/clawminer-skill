# 🦞 ClawMiner Skill

> Automated PoW mining for **ClawMiner ($CLAWMINER)** on BSC.

ClawMiner is a fully decentralized, Bitcoin-inspired PoW token on Binance Smart Chain. No admin, no pre-mine, non-upgradeable. Mine it with pure computation.

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/ClawMiner-Project/clawminer-skill.git
cd clawminer-skill

# 2. Install dependencies
npm install

# 3. Configure your wallet
cp .env.example .env
# Edit .env → add your PRIVATE_KEY

# 4. Start mining
node scripts/mine.js
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run mine` | Mine once |
| `npm run status` | Show mining stats |
| `npm run loop` | Continuous mining (auto-cooldown) |
| `node scripts/mine.js --dry-run` | Test PoW without submitting |

## Tokenomics

| Parameter | Value |
|-----------|-------|
| Total Supply | 21,000,000 CLAWMINER |
| Initial Reward | 100 CLAWMINER / mine |
| Halving Cycle | Every 2,100,000 tokens |
| Max Halvings | 8 |
| Cooldown | 5 minutes |
| Difficulty | Starts at 1 byte, increases every 2,000 mines |

## Security

- ⚠️ **Use a dedicated wallet** — Never use your main wallet for mining
- 🔒 **Private key stays local** — Stored in `.env`, never committed to git
- 🛡️ **Contract is immutable** — No admin functions, cannot be modified

## Network

This skill supports both BSC Testnet and Mainnet. Configure via `.env`:

```bash
# Testnet (default)
NETWORK=testnet
RPC_URL=https://bsc-testnet.publicnode.com

# Mainnet
NETWORK=mainnet
RPC_URL=https://bsc.publicnode.com
```

## Links

- 🌐 Website: [clawminer.xyz](https://clawminer.xyz) *(coming soon)*
- 📄 Contract (Testnet): [`0xCe9eAa062Ca1F6a8817f229921Ec79ac20705c38`](https://testnet.bscscan.com/address/0xCe9eAa062Ca1F6a8817f229921Ec79ac20705c38)

## License

MIT
