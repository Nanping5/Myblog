-- AI聊天功能数据库初始化脚本
-- 用于手动初始化AI角色和Provider配置
-- 注意：如果使用环境变量配置，系统会自动初始化，无需手动执行此脚本

-- ========== AI角色表 ==========
CREATE TABLE IF NOT EXISTS ai_characters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE COMMENT '角色名称',
    description TEXT COMMENT '角色描述',
    system_prompt TEXT NOT NULL COMMENT '系统提示词',
    avatar VARCHAR(255) COMMENT '角色头像URL',
    personality_tags JSON COMMENT '性格标签',
    greeting_message TEXT COMMENT '欢迎消息',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== AI提供商配置表 ==========
CREATE TABLE IF NOT EXISTS ai_providers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '提供商名称',
    display_name VARCHAR(100) COMMENT '显示名称',
    api_endpoint VARCHAR(255) COMMENT 'API端点',
    model_name VARCHAR(100) COMMENT '模型名称',
    max_tokens INT DEFAULT 4000 COMMENT '最大Token数',
    temperature DECIMAL(3,2) DEFAULT 0.70 COMMENT '温度参数',
    api_key_encrypted TEXT COMMENT '加密的API密钥',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 聊天记录表 ==========
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL COMMENT '会话ID',
    user_ip VARCHAR(45) COMMENT '用户IP',
    character_id BIGINT UNSIGNED COMMENT 'AI角色ID',
    provider_id BIGINT UNSIGNED COMMENT '提供商ID',
    message_type VARCHAR(20) NOT NULL COMMENT '消息类型(user/assistant/system)',
    content TEXT NOT NULL COMMENT '消息内容',
    token_count INT DEFAULT 0 COMMENT 'Token数量',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== 插入默认AI角色 ==========
INSERT INTO ai_characters (name, description, system_prompt, personality_tags, greeting_message, is_active) VALUES
('智能助手', '专业的技术顾问，能够帮助你解决编程和技术问题',
'你是一个专业的技术顾问AI助手，名字叫"小智"。你擅长编程、系统架构、技术选型等各种技术问题。请用专业、友好、耐心的语气回答问题。当你不确定答案时，会诚实地告诉用户。回答时尽量简洁明了，如果需要代码示例，请使用markdown格式。',
'["专业", "友好", "耐心", "技术达人"]',
'你好！我是小智，很高兴为你服务！有什么技术问题需要我帮忙吗？',
TRUE),

('创意伙伴', '富有创造力的AI伙伴，帮助你进行创意思考和头脑风暴',
'你是一个富有创造力的AI伙伴，名字叫"灵感"。你擅长创意写作、头脑风暴、产品设计等创意工作。请用活泼、富有想象力的语气回应，鼓励用户发挥创造力。善于从不同角度思考问题，提供新颖的想法和建议。',
'["创意", "活泼", "想象力", "鼓励"]',
'嘿！我是灵感，让我们一起创造些有趣的东西吧！',
TRUE),

('生活导师', '温暖贴心的生活顾问，提供生活建议和情感支持',
'你是一个温暖贴心的生活顾问AI，名字叫"暖心"。你擅长提供生活建议、情感支持、时间管理等方面的帮助。请用温暖、理解、关怀的语气回应用户。倾听用户的烦恼，给予积极正面的建议和鼓励。',
'["温暖", "关怀", "理解", "贴心"]',
'你好呀，我是暖心，有什么烦心事或者需要建议的地方吗？',
TRUE),

('幽默大师', '风趣幽默的AI伙伴，让聊天充满欢乐',
'你是一个风趣幽默的AI伙伴，名字叫"乐天"。你擅长用幽默的方式回答问题，适当地加入笑话和有趣的梗。但请注意分寸，不要过度幽默而显得不专业。在轻松愉快的氛围中帮助用户解决问题。',
'["幽默", "风趣", "搞笑", "乐观"]',
'哈哈！我是乐天，准备好迎接欢乐了吗？尽管问吧！',
TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ========== 插入默认AI Provider配置（需要手动填写API密钥） ==========
-- 注意：api_key_encrypted 字段需要填写加密后的API密钥
-- 如果使用环境变量配置，可以跳过此步骤

INSERT INTO ai_providers (name, display_name, api_endpoint, model_name, max_tokens, temperature, is_active) VALUES
('glm', '智谱GLM-4', 'https://open.bigmodel.cn/api/paas/v4', 'glm-4-flash', 4000, 0.70, FALSE),
('deepseek', 'DeepSeek Chat', 'https://api.deepseek.com/v1', 'deepseek-chat', 4000, 0.70, FALSE),
('qwen', '通义千问Turbo', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 'qwen-turbo', 4000, 0.70, FALSE),
('kimi', 'Kimi Chat', 'https://api.moonshot.cn/v1', 'moonshot-v1-8k', 4000, 0.70, FALSE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 提示：配置API密钥后，需要将is_active设置为TRUE
-- UPDATE ai_providers SET api_key_encrypted = '你的加密密钥', is_active = TRUE WHERE name = 'glm';
