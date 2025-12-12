package models

import "time"

type Message struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Email     string    `gorm:"not null" json:"email"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `gorm:"type:text" json:"user_agent"`
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}
