package handlers

import (
	"net/http"
	"personal-website/internal/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ConversationHandler 对话管理处理器
type ConversationHandler struct {
	db *gorm.DB
}

// NewConversationHandler 创建对话处理器
func NewConversationHandler(db *gorm.DB) *ConversationHandler {
	return &ConversationHandler{db: db}
}

// List 获取对话列表
func (h *ConversationHandler) List(c *gin.Context) {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少session_id参数"})
		return
	}

	var conversations []models.Conversation
	if err := h.db.Where("session_id = ?", sessionID).
		Order("updated_at DESC").
		Find(&conversations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取对话列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"conversations": conversations})
}

// Create 创建新对话
func (h *ConversationHandler) Create(c *gin.Context) {
	var req struct {
		SessionID string `json:"session_id" binding:"required"`
		Title     string `json:"title"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if req.Title == "" {
		req.Title = "新对话"
	}

	conversation := models.Conversation{
		SessionID: req.SessionID,
		Title:     req.Title,
	}

	if err := h.db.Create(&conversation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建对话失败"})
		return
	}

	c.JSON(http.StatusOK, conversation)
}


// Get 获取单个对话详情（包含消息）
func (h *ConversationHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的对话ID"})
		return
	}

	var conversation models.Conversation
	if err := h.db.First(&conversation, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "对话不存在"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "获取对话失败"})
		}
		return
	}

	// 获取对话消息
	var messages []models.ChatMessage
	h.db.Where("conversation_id = ?", id).Order("created_at ASC").Find(&messages)

	c.JSON(http.StatusOK, gin.H{
		"conversation": conversation,
		"messages":     messages,
	})
}

// Update 更新对话标题
func (h *ConversationHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的对话ID"})
		return
	}

	var req struct {
		Title string `json:"title" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	if err := h.db.Model(&models.Conversation{}).Where("id = ?", id).Updates(map[string]interface{}{
		"title":      req.Title,
		"updated_at": time.Now(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新对话失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "更新成功"})
}

// Delete 删除对话
func (h *ConversationHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的对话ID"})
		return
	}

	tx := h.db.Begin()

	// 删除对话消息
	if err := tx.Where("conversation_id = ?", id).Delete(&models.ChatMessage{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除消息失败"})
		return
	}

	// 删除对话
	if err := tx.Delete(&models.Conversation{}, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除对话失败"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}
