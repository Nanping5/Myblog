package models

import (
	"time"
	"database/sql/driver"
	"encoding/json"
)

// StringArray 字符串数组类型，用于在MySQL中存储JSON数组
type StringArray []string

// Value 实现driver.Valuer接口，将数组转换为JSON存储到数据库
func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	return json.Marshal(s)
}

// Scan 实现sql.Scanner接口，从数据库读取JSON数组
func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = []string{}
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		*s = []string{}
		return nil
	}

	if len(bytes) == 0 {
		*s = []string{}
		return nil
	}

	return json.Unmarshal(bytes, s)
}

type Article struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	Title       string      `gorm:"not null" json:"title"`
	Content     string      `gorm:"type:text" json:"content"`
	Summary     string      `json:"summary"`
	CoverImage  string      `json:"cover_image"`
	Tags        StringArray `gorm:"type:json" json:"tags"`
	IsPublished bool        `gorm:"default:false" json:"is_published"`
	ViewCount   int         `gorm:"default:0" json:"view_count"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}
