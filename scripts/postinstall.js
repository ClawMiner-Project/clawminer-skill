#!/usr/bin/env node

/**
 * postinstall.js — 安装后自动将 SKILL.md 复制到 OpenClaw workspace
 * 
 * 检测 ~/.openclaw/workspace/skills/ 是否存在，
 * 如果存在，自动创建 mingxia 目录并复制 SKILL.md。
 * 如果不存在（用户没有 OpenClaw），静默跳过。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_NAME = 'mingxia';
const SOURCE = path.join(__dirname, '..', 'SKILL.md');

// OpenClaw workspace skills 目录
const OPENCLAW_SKILLS = path.join(os.homedir(), '.openclaw', 'workspace', 'skills');
const DEST_DIR = path.join(OPENCLAW_SKILLS, SKILL_NAME);
const DEST_FILE = path.join(DEST_DIR, 'SKILL.md');

try {
    // 只在 OpenClaw 已安装时执行
    if (!fs.existsSync(OPENCLAW_SKILLS)) {
        // OpenClaw 不存在，静默退出
        process.exit(0);
    }

    // 创建 skill 目录
    fs.mkdirSync(DEST_DIR, { recursive: true });

    // 复制 SKILL.md
    fs.copyFileSync(SOURCE, DEST_FILE);

    console.log(`🦞 MingXia Skill 已自动注册到 OpenClaw: ${DEST_DIR}`);
} catch (e) {
    // 权限问题等，静默失败不影响安装
    // 用户可以手动复制
}
