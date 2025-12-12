package handlers

import (
	"net/http"
	
	"personal-website/internal/models"
	
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MessageHandler struct {
	db *gorm.DB
}

func NewMessageHandler(db *gorm.DB) *MessageHandler {
	return &MessageHandler{db: db}
}

// Create 创建留言
func (h *MessageHandler) Create(c *gin.Context) {
	var message models.Message
	if err := c.ShouldBindJSON(&message); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	// 记录IP和User-Agent
	message.IPAddress = c.ClientIP()
	message.UserAgent = c.Request.UserAgent()

	if err := h.db.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建失败"})
		return
	}

	c.JSON(http.StatusCreated, message)
}

// List 获取留言列表
func (h *MessageHandler) List(c *gin.Context) {
	var messages []models.Message
	
	if err := h.db.Order("created_at DESC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// MarkAsRead 标记为已读
func (h *MessageHandler) MarkAsRead(c *gin.Context) {
	id := c.Param("id")
	
	if err := h.db.Model(&models.Message{}).Where("id = ?", id).Update("is_read", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "标记成功"})
}
