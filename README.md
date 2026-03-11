# 🦞 ClawMiner Skill

> Automated PoW mining for **ClawMiner ($CLAWMINER)** on BSC.

ClawMiner is a fully decentralized, Bitcoin-inspired PoW token on Binance Smart Chain. No admin, no pre-mine, non-upgradeable. Mine it with pure computation.

## Quick Start

```bash
# Initialize (install + configure wallet)
npx clawminer-skill init

# Start continuous mining
npx clawminer-skill loop
```

## Commands

| Command | Description |
|---------|-------------|
| `npx clawminer-skill init` | 初始化（安装依赖 + 配置钱包） |
| `npx clawminer-skill mine` | 单次挖矿 |
| `npx clawminer-skill loop` | 连续挖矿 24/7（推荐） |
| `npx clawminer-skill status` | 查看挖矿状态 |
| `npx clawminer-skill dry-run` | 模拟挖矿（不提交交易） |

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

- ⚠️ **Use a dedicated mining wallet** — Never use your main wallet
- 🔒 **Private key stays local** — Stored in `.env`, never committed to git
- 🛡️ **Contract is immutable** — No admin functions, cannot be modified

## Network

Configure via `npx clawminer-skill init`:

| Network | Status |
|---------|--------|
| BSC Testnet | ✅ Available |
| BSC Mainnet | ⏳ Coming soon |

## Links

- 🌐 Website: [clawminer.xyz](https://clawminer.xyz) *(coming soon)*
- 📄 Contract (Testnet): [`0xCe9eAa062Ca1F6a8817f229921Ec79ac20705c38`](https://testnet.bscscan.com/address/0xCe9eAa062Ca1F6a8817f229921Ec79ac20705c38)

## License

MIT
