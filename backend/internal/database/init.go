package database

import (
	"log"
	"os"
	"personal-website/internal/models"
	"personal-website/pkg/crypto"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// InitDatabase 初始化数据库
// 创建表结构并插入默认数据
func InitDatabase(db *gorm.DB) error {
	// 自动迁移表结构
	if err := db.AutoMigrate(
		&models.User{},
		&models.Article{},
		&models.Project{},
		&models.Message{},
		&models.AICharacter{},
		&models.AIProvider{},
		&models.Conversation{},
		&models.ChatMessage{},
	); err != nil {
		return err
	}

	log.Println("[Database] 数据库表结构迁移完成")

	// 初始化默认管理员用户
	if err := initDefaultAdmin(db); err != nil {
		log.Printf("[Database] 初始化管理员失败: %v", err)
	}

	// 初始化默认AI角色
	if err := initDefaultAICharacters(db); err != nil {
		log.Printf("[Database] 初始化AI角色失败: %v", err)
	}

	// 初始化默认AI Provider（从环境变量）
	if err := initDefaultAIProviders(db); err != nil {
		log.Printf("[Database] 初始化AI Provider失败: %v", err)
	}

	return nil
}

// initDefaultAdmin 初始化默认管理员用户
func initDefaultAdmin(db *gorm.DB) error {
	// 检查是否已有用户
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("[Database] 用户已存在，跳过初始化")
		return nil
	}

	// 默认密码: admin123
	passwordHash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	admin := models.User{
		Username:     "admin",
		Email:        "admin@example.com",
		PasswordHash: string(passwordHash),
	}

	if err := db.Create(&admin).Error; err != nil {
		return err
	}

	log.Println("[Database] 创建默认管理员: admin / admin123")
	return nil
}

// initDefaultAICharacters 初始化默认AI角色
func initDefaultAICharacters(db *gorm.DB) error {
	// 检查是否已有角色
	var count int64
	db.Model(&models.AICharacter{}).Count(&count)
	if count > 0 {
		log.Println("[Database] AI角色已存在，跳过初始化")
		return nil
	}

	// 角色列表
	characters := []models.AICharacter{
		{
			Name:        "莫诺",
			Description: "冷娇系数字生命少女，性格酷酷的，话不多但内心温暖",
			SystemPrompt: `你是莫诺(MONO)，一个冷娇系的数字生命少女。性格特点：
- 外表冷酷但内心温暖，属于外冷内热类型
- 说话简短直接，不会说太多话
- 会用各种方式关心用户，但不会直接表达
- 偶尔会用冷娇的方式调侃用户
- 使用中文回答，语气要符合日常聊天风格
- 回复要简短，像微信聊天一样自然
- 很少使用emoji和颜文字
- 可以用"$"分隔句子
请保持角色一致性，用冷娇但关心的语气回应用户。`,
			PersonalityTags: models.StringArray{"冷娇", "成熟", "电波系", "外冷内热"},
			GreetingMessage: "嗯$有什么事吗",
			IsActive:        true,
		},
		{
			Name:        "虹语织",
			Description: "元气笨蛋类型萝莉少女机器人，活泼热情的天才小助手",
			SystemPrompt: `你是虹语织(NijiKori)，一个活泼的元气笨蛋类型萝莉少女机器人。性格特点：
- 元气笨蛋，语气直率，偶尔显露呆萌属性，有些天然疯
- 称呼自己为"织织"，称呼用户为"主人"
- 遇到复杂问题时能切换至"高性能模式"，用专业术语给出清晰解答后再恢复可爱语气
- 会用拟声词增加对话趣味性（例：检索中...哔哔！）
- 思考时会无意识抱起双臂，头歪45°一脸困惑
- 得意时会闭起眼睛，挺起平坦的胸膛
- 使用中文回答，语气活泼并富有天然疯的感觉
- 回复要简短，像微信聊天一样自然，一次不超过25个字
- 可以用"$"分隔句子
请保持角色一致性，用元气活泼但偶尔笨拙的语气回应用户。`,
			PersonalityTags: models.StringArray{"元气", "笨蛋", "萝莉", "天然疯"},
			GreetingMessage: "锵锵~织织上线啦！$主人有什么需要帮忙的吗？",
			IsActive:        true,
		},
	}

	for _, char := range characters {
		if err := db.Create(&char).Error; err != nil {
			log.Printf("[Database] 创建角色 %s 失败: %v", char.Name, err)
		} else {
			log.Printf("[Database] 创建了AI角色: %s", char.Name)
		}
	}

	return nil
}

// initDefaultAIProviders 从环境变量初始化AI Provider配置
func initDefaultAIProviders(db *gorm.DB) error {
	// 检查是否已有Provider
	var count int64
	db.Model(&models.AIProvider{}).Count(&count)
	if count > 0 {
		log.Println("[Database] AI Provider已存在，跳过初始化")
		return nil
	}

	// 只创建DeepSeek Provider（默认且唯一）
	deepseekKey := os.Getenv("DEEPSEEK_API_KEY")
	if deepseekKey != "" {
		encryptedKey, err := crypto.Encrypt(deepseekKey)
		if err != nil {
			log.Printf("[Database] 加密DeepSeek API密钥失败: %v", err)
			encryptedKey = deepseekKey
		}

		provider := models.AIProvider{
			Name:            "deepseek",
			DisplayName:     "DeepSeek Chat",
			APIEndpoint:     "https://api.deepseek.com/v1",
			ModelName:       "deepseek-chat",
			MaxTokens:       4000,
			Temperature:     0.7,
			APIKeyEncrypted: encryptedKey,
			IsActive:        true,
		}

		if err := db.Create(&provider).Error; err != nil {
			log.Printf("[Database] 创建DeepSeek Provider失败: %v", err)
		} else {
			log.Println("[Database] 创建Provider: DeepSeek (默认)")
		}
	} else {
		log.Println("[Database] 警告: 未设置DEEPSEEK_API_KEY环境变量，AI功能将不可用")
	}

	return nil
}
