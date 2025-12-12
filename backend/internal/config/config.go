package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort  string
	DatabaseDSN string
	JWTSecret   string
	UploadPath  string
}

// Load 加载配置
// 优先从.env文件加载，然后从环境变量读取
func Load() *Config {
	// 尝试加载.env文件（如果存在）
	if err := godotenv.Load(); err != nil {
		log.Println("[Config] 未找到.env文件，使用环境变量或默认值")
	} else {
		log.Println("[Config] 已加载.env文件")
	}

	return &Config{
		ServerPort:  getEnv("SERVER_PORT", ":8080"),
		DatabaseDSN: getEnv("DATABASE_DSN", "root:060311@tcp(127.0.0.1:3306)/personal_website?charset=utf8mb4&parseTime=True&loc=Local"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-this"),
		UploadPath:  getEnv("UPLOAD_PATH", "./uploads"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
