package handlers

import (
	"log"
	"net/http"
	"personal-website/internal/models"
	"personal-website/internal/service/ai"
	"personal-website/pkg/crypto"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AIHandler AI聊天处理器
type AIHandler struct {
	db        *gorm.DB
	aiManager *ai.AIManager
	// 缓存
	characterCache     []models.AICharacter
	characterCacheTime time.Time
	modelCache         []map[string]interface{}
	modelCacheTime     time.Time
	cacheMu            sync.RWMutex
	cacheDuration      time.Duration
}

// NewAIHandler 创建AI处理器实例
func NewAIHandler(db *gorm.DB) *AIHandler {
	handler := &AIHandler{
		db:            db,
		aiManager:     ai.NewAIManager(),
		cacheDuration: 5 * time.Minute,
	}

	// 从数据库加载Provider配置
	handler.loadProvidersFromDB()

	// 如果数据库没有配置，从环境变量加载
	if len(handler.aiManager.GetAllProviders()) == 0 {
		handler.aiManager.LoadProvidersFromEnv()
	}

	return handler
}

// loadProvidersFromDB 从数据库加载AI Provider配置
func (h *AIHandler) loadProvidersFromDB() {
	var providers []models.AIProvider
	if err := h.db.Where("is_active = ?", true).Find(&providers).Error; err != nil {
		log.Printf("[AIHandler] 从数据库加载Provider失败: %v", err)
		return
	}

	for _, p := range providers {
		// 解密API密钥
		apiKey, err := crypto.Decrypt(p.APIKeyEncrypted)
		if err != nil {
			log.Printf("[AIHandler] 解密API密钥失败: %v", err)
			// 尝试直接使用（可能是未加密的）
			apiKey = p.APIKeyEncrypted
		}

		if apiKey == "" {
			log.Printf("[AIHandler] Provider %s 没有配置API密钥，跳过", p.Name)
			continue
		}

		// 根据Provider类型创建实例
		var provider ai.AIProvider
		switch p.Name {
		case "glm":
			provider = ai.NewGLMProvider(p.APIEndpoint, apiKey, p.ModelName)
		case "deepseek":
			provider = ai.NewDeepSeekProvider(p.APIEndpoint, apiKey, p.ModelName)
		case "qwen":
			provider = ai.NewQwenProvider(p.APIEndpoint, apiKey, p.ModelName)
		case "kimi":
			provider = ai.NewKimiProvider(p.APIEndpoint, apiKey, p.ModelName)
		case "openai":
			provider = ai.NewOpenAIProvider(p.APIEndpoint, apiKey, p.ModelName)
		default:
			log.Printf("[AIHandler] 未知的Provider类型: %s", p.Name)
			continue
		}

		h.aiManager.RegisterProvider(p.Name, provider)
	}

	log.Printf("[AIHandler] 从数据库加载了 %d 个Provider", len(h.aiManager.GetAllProviders()))
}

// ReloadProviders 重新加载Provider配置
func (h *AIHandler) ReloadProviders(c *gin.Context) {
	h.aiManager.ClearProviders()
	h.loadProvidersFromDB()

	if len(h.aiManager.GetAllProviders()) == 0 {
		h.aiManager.LoadProvidersFromEnv()
	}

	// 清空缓存
	h.cacheMu.Lock()
	h.modelCache = nil
	h.modelCacheTime = time.Time{}
	h.cacheMu.Unlock()

	c.JSON(http.StatusOK, gin.H{
		"message":   "Provider配置已重新加载",
		"providers": h.aiManager.GetAllProviders(),
	})
}

// ChatRequest 聊天请求
type ChatRequest struct {
	Message        string `json:"message" binding:"required"`
	CharacterID    uint   `json:"character_id"`
	Provider       string `json:"provider"`
	SessionID      string `json:"session_id"`
	ConversationID uint   `json:"conversation_id"`
}

// ChatResponse 聊天响应
type ChatResponse struct {
	Reply          string `json:"reply"`
	SessionID      string `json:"session_id"`
	ConversationID uint   `json:"conversation_id"`
	Model          string `json:"model"`
	TokenUsage     struct {
		Prompt     int `json:"prompt"`
		Completion int `json:"completion"`
		Total      int `json:"total"`
	} `json:"token_usage"`
}

// Chat 处理聊天请求
func (h *AIHandler) Chat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误: " + err.Error()})
		return
	}

	// 验证消息长度
	if len(req.Message) > 10000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "消息长度不能超过10000字符"})
		return
	}

	// 确保对话存在
	var conversation models.Conversation
	if req.ConversationID > 0 {
		if err := h.db.First(&conversation, req.ConversationID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "对话不存在"})
			return
		}
	} else {
		// 创建新对话
		title := req.Message
		if len(title) > 30 {
			title = title[:30] + "..."
		}
		conversation = models.Conversation{
			SessionID: req.SessionID,
			Title:     title,
		}
		if err := h.db.Create(&conversation).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "创建对话失败"})
			return
		}
		req.ConversationID = conversation.ID
	}

	// 获取AI角色
	var character models.AICharacter
	if req.CharacterID > 0 {
		if err := h.db.First(&character, req.CharacterID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "AI角色不存在"})
			return
		}
	} else {
		// 默认使用第一个活跃角色
		if err := h.db.Where("is_active = ?", true).First(&character).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "没有可用的AI角色，请先配置"})
			return
		}
	}

	// 检查Provider是否可用
	if !h.aiManager.HasProvider(req.Provider) && req.Provider != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "指定的AI模型不可用"})
		return
	}

	// 获取对话历史消息（限制20条）
	var chatHistory []models.ChatMessage
	h.db.Where("conversation_id = ?", req.ConversationID).
		Order("created_at ASC").
		Limit(20).
		Find(&chatHistory)

	// 构建消息列表
	messages := []ai.ChatMessage{
		{
			Role:    "system",
			Content: character.SystemPrompt,
		},
	}

	// 添加历史消息
	for _, msg := range chatHistory {
		messages = append(messages, ai.ChatMessage{
			Role:    msg.MessageType,
			Content: msg.Content,
		})
	}

	// 添加用户消息
	messages = append(messages, ai.ChatMessage{
		Role:    "user",
		Content: req.Message,
	})

	// 调用AI
	aiReq := &ai.ChatCompletionRequest{
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   2000,
	}

	resp, err := h.aiManager.ChatCompletion(c.Request.Context(), req.Provider, aiReq)
	if err != nil {
		log.Printf("[AIHandler] AI调用失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI服务暂时不可用，请稍后重试"})
		return
	}

	if len(resp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI没有返回响应"})
		return
	}

	reply := resp.Choices[0].Message.Content

	// 保存用户消息
	userMsg := &models.ChatMessage{
		ConversationID: req.ConversationID,
		SessionID:      req.SessionID,
		UserIP:         c.ClientIP(),
		CharacterID:    character.ID,
		MessageType:    "user",
		Content:        req.Message,
		TokenCount:     resp.Usage.PromptTokens,
	}
	if err := h.db.Create(userMsg).Error; err != nil {
		log.Printf("[AIHandler] 保存用户消息失败: %v", err)
	}

	// 保存AI回复
	assistantMsg := &models.ChatMessage{
		ConversationID: req.ConversationID,
		SessionID:      req.SessionID,
		UserIP:         c.ClientIP(),
		CharacterID:    character.ID,
		MessageType:    "assistant",
		Content:        reply,
		TokenCount:     resp.Usage.CompletionTokens,
	}
	if err := h.db.Create(assistantMsg).Error; err != nil {
		log.Printf("[AIHandler] 保存AI回复失败: %v", err)
	}

	// 更新对话时间
	h.db.Model(&conversation).Update("updated_at", time.Now())

	// 返回响应
	response := ChatResponse{
		Reply:          reply,
		SessionID:      req.SessionID,
		ConversationID: req.ConversationID,
		Model:          resp.Model,
	}
	response.TokenUsage.Prompt = resp.Usage.PromptTokens
	response.TokenUsage.Completion = resp.Usage.CompletionTokens
	response.TokenUsage.Total = resp.Usage.TotalTokens

	c.JSON(http.StatusOK, response)
}

// GetModels 获取可用模型列表
func (h *AIHandler) GetModels(c *gin.Context) {
	// 检查缓存
	h.cacheMu.RLock()
	if h.modelCache != nil && time.Since(h.modelCacheTime) < h.cacheDuration {
		models := h.modelCache
		h.cacheMu.RUnlock()
		c.JSON(http.StatusOK, gin.H{"models": models})
		return
	}
	h.cacheMu.RUnlock()

	// 从数据库获取
	var providers []models.AIProvider
	h.db.Where("is_active = ?", true).Find(&providers)

	modelList := make([]map[string]interface{}, 0)
	for _, p := range providers {
		modelList = append(modelList, map[string]interface{}{
			"name":         p.Name,
			"model":        p.ModelName,
			"display_name": p.DisplayName,
		})
	}

	// 如果数据库没有配置，返回环境变量配置的Provider
	if len(modelList) == 0 {
		for _, name := range h.aiManager.GetAllProviders() {
			provider, _ := h.aiManager.GetProvider(name)
			if provider != nil {
				modelList = append(modelList, map[string]interface{}{
					"name":         name,
					"model":        provider.GetModelName(),
					"display_name": name + " - " + provider.GetModelName(),
				})
			}
		}
	}

	// 更新缓存
	h.cacheMu.Lock()
	h.modelCache = modelList
	h.modelCacheTime = time.Now()
	h.cacheMu.Unlock()

	c.JSON(http.StatusOK, gin.H{"models": modelList})
}

// GetCharacters 获取AI角色列表
func (h *AIHandler) GetCharacters(c *gin.Context) {
	// 检查缓存
	h.cacheMu.RLock()
	if h.characterCache != nil && time.Since(h.characterCacheTime) < h.cacheDuration {
		characters := h.characterCache
		h.cacheMu.RUnlock()
		c.JSON(http.StatusOK, gin.H{"characters": characters})
		return
	}
	h.cacheMu.RUnlock()

	// 从数据库获取
	var characters []models.AICharacter
	h.db.Where("is_active = ?", true).Find(&characters)

	// 更新缓存
	h.cacheMu.Lock()
	h.characterCache = characters
	h.characterCacheTime = time.Now()
	h.cacheMu.Unlock()

	c.JSON(http.StatusOK, gin.H{"characters": characters})
}

// GetHistory 获取聊天历史
func (h *AIHandler) GetHistory(c *gin.Context) {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少session_id参数"})
		return
	}

	var messages []models.ChatMessage
	h.db.Where("session_id = ?", sessionID).
		Order("created_at ASC").
		Find(&messages)

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// ClearHistory 清空聊天历史
func (h *AIHandler) ClearHistory(c *gin.Context) {
	sessionID := c.Query("session_id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "缺少session_id参数"})
		return
	}

	// 使用事务删除
	tx := h.db.Begin()
	if err := tx.Where("session_id = ?", sessionID).Delete(&models.ChatMessage{}).Error; err != nil {
		tx.Rollback()
		log.Printf("[AIHandler] 清空历史失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "清空历史失败"})
		return
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "聊天历史已清空"})
}
