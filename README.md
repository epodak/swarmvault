# SwarmVault (epodak fork)

基于 [swarmclawai/swarmvault](https://github.com/swarmclawai/swarmvault) 的硬分叉，新增 **prompt 可插接接口** 和 **分析质量约束**。

---

## 全寿命周期

### 1. 安装

```bash
# 前置：Node.js >= 22, pnpm >= 10
npm install -g pnpm

# 克隆并构建
git clone https://github.com/epodak/swarmvault.git
cd swarmvault
pnpm install
pnpm build

# 全局链接（之后任意目录可用 swarmvault 命令）
cd packages/cli
pnpm link --global

# 验证
swarmvault --version
```

### 2. 配置 Provider

SwarmVault 需要 LLM provider 来执行分析。在目标目录下创建或编辑 `swarmvault.config.json`：

```jsonc
{
  "provider": {
    "type": "openai-compatible",
    "model": "deepseek-chat",
    "baseUrl": "https://api.deepseek.com",
    "apiKey": "sk-xxx"
  }
}
```

支持的 provider 类型：
- `openai-compatible` — DeepSeek、OpenRouter、本地 Ollama 等
- `anthropic` — Claude 系列
- `heuristic` — 无需 API key，纯规则分析（质量较低）

### 3. 初始化 Vault

```bash
# 进入你的资料目录
cd /path/to/your/documents

# 初始化（生成 raw/ wiki/ state/ 目录和配置文件）
swarmvault init

# 或者一步到位：初始化 + 导入 + 编译 + 启动图查看器
swarmvault scan .
```

### 4. 导入资料

```bash
# 导入单个文件
swarmvault ingest article.md

# 导入整个目录
swarmvault ingest ./papers/

# 导入 URL
swarmvault add https://example.com/article

# 导入 Git 仓库
swarmvault source add --repo https://github.com/user/repo.git
```

### 5. 编译

```bash
# 编译所有已导入的资料
swarmvault compile

# 编译并自动提交
swarmvault compile --commit

# 审批候选页面
swarmvault compile --approve
```

编译流程：`raw/ → 分析 → wiki/ 页面 + graph JSON + 搜索索引`

### 6. 查看结果

```bash
# 查询知识库
swarmvault query "咖啡工业化对原产地农户有什么影响？"

# 查看候选概念/实体
swarmvault candidate list

# 提升候选页面到正式目录
swarmvault candidate promote <target>

# 自动提升（需配置 candidate.autoPromote.enabled）
swarmvault candidate auto-promote

# 查看编译变更
swarmvault diff

# 健康检查
swarmvault doctor
```

### 7. 自定义 Prompt 规则（本 fork 新增）

在 `swarmvault.config.json` 中添加 `prompts` 字段：

```jsonc
{
  "prompts": {
    "compile": {
      "conceptRules": [
        "概念名必须是2-60字符的名词或名词短语",
        "排除纯数字、日期、LaTeX符号、单字母",
        "优先使用具体领域术语而非通用词"
      ],
      "entityRules": [
        "实体名必须是2-80字符的专有名词",
        "排除通用标题、代词、不完整片段",
        "每个实体描述至少10个字符"
      ],
      "claimRules": [
        "每个claim必须是200字符以内的完整句子",
        "claim必须包含实质性信息",
        "排除仅重复标题或章节名的claim"
      ],
      "systemExtra": [
        "本知识库关注咖啡产业链，重点关注：产地治理、工业标准化、供应链金融",
        "中文内容请用中文输出概念名和描述"
      ]
    },
    "customModule": "预留：未来支持完整 prompt 模板替换"
  }
}
```

**内置默认规则**：即使不配置 `prompts`，以下 Zod 约束已自动生效：

| 字段 | 约束 |
|------|------|
| concept.name | 2-60 字符 |
| concept.description | 10-500 字符 |
| entity.name | 2-80 字符 |
| entity.description | 10-500 字符 |
| claim.text | 10-200 字符 |

### 8. 日常维护

```bash
# 监控目录变化并自动重新编译
swarmvault watch

# 查看监控状态
swarmvault watch-status

# 合并工作层到长期记忆层
swarmvault consolidate

# 修复检索索引
swarmvault retrieval repair

# 迁移 vault 格式
swarmvault migrate
```

### 9. 更新 Fork

```bash
cd swarmvault   # clone 的本地目录
git pull origin main
pnpm install
pnpm build
cd packages/cli && pnpm link --global
```

### 10. 卸载

```bash
# 取消全局链接
pnpm unlink --global @swarmvaultai/cli

# 删除本地仓库
rm -rf swarmvault/
```

---

## 与上游的区别

| 特性 | 上游 | 本 fork |
|------|------|---------|
| 概念名约束 | `min(1)` | `min(2).max(60)` |
| 描述约束 | `default("")` | `min(10).max(500)` |
| Prompt 自定义 | 不支持 | `prompts.compile.*` |
| 领域规则注入 | 不支持 | `conceptRules` / `entityRules` / `claimRules` |
| 额外系统提示 | 不支持 | `systemExtra` |
| Source Claims 过滤 | 无限制 | 名称≥3字符 + 每源5条 + 150字符截断 |

---

## 目录结构

```
your-vault/
├── raw/                    # 原始导入文件
├── wiki/
│   ├── index.md            # 首页
│   ├── concepts/           # 正式概念页
│   ├── entities/           # 正式实体页
│   ├── candidates/         # 候选页面（待提升）
│   ├── sources/            # 源文件分析页
│   └── outputs/            # 查询输出
├── state/                  # 内部状态
├── swarmvault.config.json  # 配置文件
└── swarmvault.schema.md    # vault schema
```

---

## 常见问题

**Q: 编译后 wiki/concepts/ 是空的？**
A: 新概念先出现在 `wiki/candidates/`，需要被 3 个以上源引用才自动提升。手动提升：`swarmvault candidate promote <name>`

**Q: heuristic 模式下概念名是乱码？**
A: heuristic 模式质量较低。配置 `openai-compatible` provider 并使用 DeepSeek 等模型可大幅提升质量。

**Q: npm install -g 从 GitHub 安装后报错？**
A: SwarmVault 是 monorepo，不支持 `npm install -g`。请使用 clone + build + link 方式安装。

**Q: 中文路径导致 ingest 失败？**
A: 将资料目录放在纯英文路径下，或使用 `swarmvault source add` 间接导入。
