package models

import (
	"time"
)

// AICharacter AI角色模型
// 注意：StringArray类型定义在article.go中
type AICharacter struct {
	ID              uint        `gorm:"primaryKey" json:"id"`
	Name            string      `gorm:"unique;not null" json:"name"`
	Description     string      `gorm:"type:text" json:"description"`
	SystemPrompt    string      `gorm:"type:text;not null" json:"system_prompt"`
	Avatar          string      `json:"avatar"`
	PersonalityTags StringArray `gorm:"type:json" json:"personality_tags"`
	GreetingMessage string      `gorm:"type:text" json:"greeting_message"`
	IsActive        bool        `gorm:"default:true" json:"is_active"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

// AIProvider AI提供商配置
type AIProvider struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"unique;not null" json:"name"`
	DisplayName     string    `json:"display_name"`
	APIEndpoint     string    `json:"api_endpoint"`
	ModelName       string    `json:"model_name"`
	MaxTokens       int       `gorm:"default:4000" json:"max_tokens"`
	Temperature     float32   `gorm:"default:0.7" json:"temperature"`
	APIKeyEncrypted string    `gorm:"type:text" json:"-"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// ChatMessage 聊天记录
type ChatMessage struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	ConversationID uint      `gorm:"not null;index" json:"conversation_id"`
	SessionID      string    `gorm:"not null;index" json:"session_id"`
	UserIP         string    `json:"user_ip"`
	CharacterID    uint      `json:"character_id"`
	ProviderID     uint      `json:"provider_id"`
	MessageType    string    `gorm:"not null" json:"message_type"` // user/assistant/system
	Content        string    `gorm:"type:text;not null" json:"content"`
	TokenCount     int       `gorm:"default:0" json:"token_count"`
	CreatedAt      time.Time `gorm:"index" json:"created_at"`
}
