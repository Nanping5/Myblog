-- 重置AI角色和Provider数据
-- 运行此脚本后重启后端服务，将自动创建新的默认数据
-- 包含两个角色：莫诺、虹语织
-- 包含一个Provider：DeepSeek

-- 清空AI角色表
DELETE FROM ai_characters;

-- 清空AI Provider表  
DELETE FROM ai_providers;

-- 清空聊天消息（可选，如果需要保留历史可以注释掉）
-- DELETE FROM chat_messages;

-- 清空对话表（可选）
-- DELETE FROM conversations;

-- 重置自增ID（MySQL）
ALTER TABLE ai_characters AUTO_INCREMENT = 1;
ALTER TABLE ai_providers AUTO_INCREMENT = 1;
