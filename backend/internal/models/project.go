package models

import "time"

type Project struct {
	ID           uint        `gorm:"primaryKey" json:"id"`
	Name         string      `gorm:"not null" json:"name"`
	Description  string      `gorm:"type:text" json:"description"`
	GithubURL    string      `json:"github_url"`
	DemoURL      string      `json:"demo_url"`
	Technologies StringArray `gorm:"type:json" json:"technologies"`
	CoverImage   string      `json:"cover_image"`
	Featured     bool        `gorm:"default:false" json:"featured"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}
