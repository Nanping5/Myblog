package main

import (
	"log"
	"personal-website/internal/api/routes"
	"personal-website/internal/config"
	"personal-website/internal/database"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 连接数据库
	db, err := gorm.Open(mysql.Open(cfg.DatabaseDSN), &gorm.Config{})
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}

	// 初始化数据库（自动迁移+默认数据）
	if err := database.InitDatabase(db); err != nil {
		log.Fatal("数据库初始化失败:", err)
	}

	// 初始化Gin
	r := gin.Default()

	// 设置路由
	routes.Setup(r, db)

	// 启动服务器
	log.Printf("服务器启动在端口 %s", cfg.ServerPort)
	if err := r.Run(cfg.ServerPort); err != nil {
		log.Fatal("服务器启动失败:", err)
	}
}
