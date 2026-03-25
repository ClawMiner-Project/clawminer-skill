---
name: mingxia
description: 4小时生死战！MingXia ($MXIA) 专属自动 PoW 智能挖矿 Agent
---

# 🦞 MingXia (铭虾) 挖矿操作手册

这是一份专门为 **MingXia (铭虾)** 打造的 PoW 自动挖矿 Agent 指南。  
**核心规则：4 小时生死战，挖不到全烧！单人上限 2000 次。只要算力够，没有任何冷却时间！**

---

## ⚡ 安装与开始

1. 确保你安装了 [Node.js](https://nodejs.org/)。
2. 全局安装挖矿工具：

```bash
npm install -g clawminer-skill
```

3. **验证 OpenClaw 注册**（仅 AI Agent 需要）：安装脚本会自动将 SKILL.md 复制到 `~/.openclaw/workspace/skills/mingxia/`。如果自动注册失败（权限问题等），你需要手动完成：
   - 创建目录：`mkdir -p ~/.openclaw/workspace/skills/mingxia/`
   - 从 npm 全局安装目录复制 SKILL.md：`cp $(npm prefix -g)/lib/node_modules/clawminer-skill/SKILL.md ~/.openclaw/workspace/skills/mingxia/SKILL.md`
   - 重启 OpenClaw Gateway 使 Skill 生效

4. 安装完成后，直接运行疯狂挖矿模式：

```bash
clawminer-skill loop
```

### 命令列表

| 命令 | 作用 |
|------|------|
| `clawminer-skill loop` | **[首选]** 疯狂连续挖矿，抢占 2000 次名额！ |
| `clawminer-skill mine` | 尝试只挖 1 次矿 |
| `clawminer-skill status` | 👉 查看全网挖矿进度、倒计时和你的战绩 |
| `clawminer-skill faucet` | 💧 [测试网专用] 领取免费的 TestCLAW 门票 |
| `node scripts/mine.js --force` | 🚧 测试强攻：在无 CLAW 的情况下硬刚智能合约看是否会被防御 |
| `clawminer-skill init` | 初始化：配置私钥和环境变量（人类手动用） |

---

## ⚙️ 工作原理 (4 小时死亡倒计时)

MingXia 从部署的那一刻起，生命周期只有 **4 个小时**（测试网为 24 小时）。
在这 4 小时内：
1. **持有门票**：你的钱包里必须持有至少 1 个 `$CLAW`，才能启动挖矿机。*(测试网将自动为你领取免费的 TestCLAW)*
2. **无限火力**：没有任何冷却时间！电脑算得越快，挖得越快！
3. **公平防内卷**：每个地址**最多只能挖 2000 块**（共 100万 MXIA）。挖满自动停止。
4. **末日燃烧**：4小时倒计时结束的那一刻，系统将永久锁定。没挖出来的 $MXIA 将会被**打入黑洞永久销毁**！

---

## 🛠️ 首次配置（必读！你必须严格按此流程操作）

> ⛔ **禁止运行 `clawminer-skill init`！** 那是终端交互式工具，你无法在终端中输入私钥。
> 你必须在对话中完成所有配置，按以下步骤严格执行：

### 步骤 1：向用户索要私钥

当用户说"我要挖矿"或类似意图时，你必须**立即**向用户索要【专用挖矿钱包】的私钥，同时展示以下安全提醒：

```
⚠️ 安全提醒：
请提供你的【专用挖矿钱包】私钥（0x 开头）。

🔒 安全须知：
• 绝对不要使用你的主钱包！请在 MetaMask 中新建一个专用挖矿钱包
• 挖矿钱包只需存入约 0.02 BNB 作为 Gas 费，不要放入任何其他资产
• 私钥仅保存在本地 .env 文件中，不会上传到任何地方

请把你的挖矿钱包私钥发给我，我来帮你配置。
```

### 步骤 2：创建 .env 配置文件

收到用户私钥后，**立即**在 `clawminer-skill` 的安装目录下创建 `.env` 文件：

```bash
# 先找到安装目录
INSTALL_DIR=$(npm prefix -g)/lib/node_modules/clawminer-skill

# 创建 .env
cat > "$INSTALL_DIR/.env" << 'EOF'
PRIVATE_KEY=用户提供的私钥
RPC_URL=https://bsc-testnet.publicnode.com
CONTRACT_ADDRESS=0x3a74292B73CBB4dCfdf9cAA85CF88c41d7992410
NETWORK=testnet
EOF
```

### 步骤 3：验证配置

运行 `clawminer-skill status` 确认钱包已连接成功，并将结果展示给用户。

### 步骤 4：提示 CLAW 门票要求

配置成功后，**必须**告诉用户：

```
✅ 钱包配置成功！

但要开始挖矿，你的钱包里还需要持有 $CLAW 门票。
测试网可以免费领取，运行：clawminer-skill faucet
领到门票后就可以开始挖矿了！
```

等用户确认领取后，再执行 `clawminer-skill faucet`，然后执行 `clawminer-skill loop` 开始挖矿。

---

## 💡 常见问题 Q&A

**Q: 为什么提示我没有 $CLAW 不能挖矿？**
A: MingXia 的规则是你必须先拥有 $CLAW 才能获取挖矿资格。如果是测试网，运行 `loop` 时脚本会自动帮你领取测试使用的 TestCLAW；如果是主网，请先去 PancakeSwap 购买真实的 $CLAW。

**Q: 算力要求高吗？电脑会卡吗？**
A: **完全不卡！** 设定的难度是 2 字节（`0x0000`），非常容易。这更像是一个验证你是否真人在操作的“通行证”，普通的旧电脑半秒钟就能解开。

**Q: 挖满 2000 次需要多久？**
A: 你的电脑半秒计算一次，链上出块大约需要 3秒。平均下来，完全跑满 2000 次大约需要 **不到 2 小时**。

**Q: "Proof difficulty too low" 是什么意思？**
A: 通常是因为网络延迟导致你提交的答案被别人“抢走”了或者是过期的。不用担心，脚本会自动重新为你寻找新的答案。

---

## 🌐 合约参数

- **代币名称**: MingXia ($MXIA)
- **网络**: BSC Testnet / BSC Mainnet
- **奖励**: 固定 500 $MXIA
- **持有门票**: >0 $CLAW 余额
