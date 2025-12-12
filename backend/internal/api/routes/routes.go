package routes

import (
	"personal-website/internal/api/handlers"
	"personal-website/internal/api/middleware"
	
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(r *gin.Engine, db *gorm.DB) {
	// 全局中间件
	r.Use(middleware.Recovery())    // Panic恢复
	r.Use(middleware.ErrorHandler()) // 错误处理
	r.Use(middleware.CORS())        // 跨域支持
	
	// 初始化handlers
	authHandler := handlers.NewAuthHandler(db)
	articleHandler := handlers.NewArticleHandler(db)
	projectHandler := handlers.NewProjectHandler(db)
	messageHandler := handlers.NewMessageHandler(db)
	uploadHandler := handlers.NewUploadHandler()
	aiHandler := handlers.NewAIHandler(db)
	conversationHandler := handlers.NewConversationHandler(db)
	
	// API v1路由组
	v1 := r.Group("/api/v1")
	{
		// 认证相关
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			auth.GET("/profile", middleware.AuthRequired(), authHandler.GetProfile)
			auth.PUT("/profile", middleware.AuthRequired(), authHandler.UpdateProfile)
		}
		
		// 文章管理
		articles := v1.Group("/articles")
		{
			articles.GET("", articleHandler.List)
			articles.GET("/:id", articleHandler.Get)
			articles.POST("", middleware.AuthRequired(), articleHandler.Create)
			articles.PUT("/:id", middleware.AuthRequired(), articleHandler.Update)
			articles.DELETE("/:id", middleware.AuthRequired(), articleHandler.Delete)
		}
		
		// 项目管理
		projects := v1.Group("/projects")
		{
			projects.GET("", projectHandler.List)
			projects.GET("/featured", projectHandler.GetFeatured)
			projects.POST("", middleware.AuthRequired(), projectHandler.Create)
			projects.PUT("/:id", middleware.AuthRequired(), projectHandler.Update)
			projects.DELETE("/:id", middleware.AuthRequired(), projectHandler.Delete)
		}
		
		// 留言功能
		messages := v1.Group("/messages")
		{
			messages.POST("", messageHandler.Create)
			messages.GET("", middleware.AuthRequired(), messageHandler.List)
			messages.PUT("/:id/read", middleware.AuthRequired(), messageHandler.MarkAsRead)
		}
		
		// 文件上传
		v1.POST("/upload", middleware.AuthRequired(), uploadHandler.Upload)
		
		// AI聊天功能
		ai := v1.Group("/ai")
		{
			ai.GET("/models", aiHandler.GetModels)
			ai.GET("/characters", aiHandler.GetCharacters)
			ai.POST("/chat", aiHandler.Chat)
			ai.GET("/history", aiHandler.GetHistory)
			ai.DELETE("/history", aiHandler.ClearHistory)
			ai.POST("/reload", middleware.AuthRequired(), aiHandler.ReloadProviders)
		}

		// 对话管理
		conversations := v1.Group("/conversations")
		{
			conversations.GET("", conversationHandler.List)
			conversations.POST("", conversationHandler.Create)
			conversations.GET("/:id", conversationHandler.Get)
			conversations.PUT("/:id", conversationHandler.Update)
			conversations.DELETE("/:id", conversationHandler.Delete)
		}
	}
}
