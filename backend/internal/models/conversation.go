package models

import (
	"time"

	"gorm.io/gorm"
)

// Conversation 对话模型
type Conversation struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	SessionID string         `gorm:"not null;index" json:"session_id"`
	Title     string         `gorm:"size:255;not null" json:"title"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 指定表名
func (Conversation) TableName() string {
	return "conversations"
}
