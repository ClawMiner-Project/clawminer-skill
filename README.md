# 🦞 MingXia Skill

> Automated PoW mining for **MingXia ($MXIA)** — the 4-Hour Death Match on BSC.

MingXia is a fully decentralized, time-limited PoW token on Binance Smart Chain. No admin, no pre-mine, non-upgradeable. A 4-hour countdown starts at deployment — mine as fast as you can, or watch the remaining supply burn forever.

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
| `npx clawminer-skill loop` | 疯狂连续挖矿（推荐） |
| `npx clawminer-skill status` | 查看挖矿状态 |
| `npx clawminer-skill faucet` | [测试网] 领取免费 TestCLAW 门票 |
| `npx clawminer-skill dry-run` | 模拟挖矿（不提交交易） |

## Rules of the Game

| Parameter | Value |
|-----------|-------|
| Token | MingXia ($MXIA) |
| Total Supply | 21,000,000 MXIA |
| Reward per Mine | 500 MXIA |
| Mining Window | **4 hours** (testnet: 24h) |
| Difficulty | 2 bytes (`0x0000`) — fixed, low barrier |
| Cooldown | None — mine as fast as you can |
| Per-Address Cap | 2,000 mines max |
| Entry Ticket | Must hold >0 $CLAW |
| After Countdown | Unmined supply **burned forever** |

## How It Works

1. **Hold $CLAW** — Your wallet needs at least 1 $CLAW token as entry ticket
2. **PoW Computation** — Find a nonce where `keccak256(address, userNonce, nonce)` starts with `0x0000`
3. **Submit & Earn** — Each valid proof earns 500 MXIA
4. **Race the Clock** — When the 4-hour window closes, all remaining MXIA is burned to a dead address

## Security

- ⚠️ **Use a dedicated mining wallet** — Never use your main wallet
- 🔒 **Private key stays local** — Stored in `.env`, never committed to git
- 🛡️ **Contract is immutable** — No admin functions, cannot be modified

## Network

| Network | Status |
|---------|--------|
| BSC Testnet | ✅ Available |
| BSC Mainnet | ⏳ Coming soon |

## Contract

- Testnet MingXia: [`0x3a74292B73CBB4dCfdf9cAA85CF88c41d7992410`](https://testnet.bscscan.com/address/0x3a74292B73CBB4dCfdf9cAA85CF88c41d7992410)
- Testnet TestCLAW: [`0xEC2bbe17b94d5E37b848c796938ae99bB73f3230`](https://testnet.bscscan.com/address/0xEC2bbe17b94d5E37b848c796938ae99bB73f3230)

## License

MIT
