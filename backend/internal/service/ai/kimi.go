package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

// KimiProvider Moonshot Kimi AI服务提供商
type KimiProvider struct {
	apiURL string
	apiKey string
	model  string
	client *http.Client
}

// NewKimiProvider 创建Kimi Provider实例
// apiURL: API端点，如 https://api.moonshot.cn/v1
// apiKey: API密钥
// model: 模型名称，如 moonshot-v1-8k、moonshot-v1-32k、moonshot-v1-128k
func NewKimiProvider(apiURL, apiKey, model string) *KimiProvider {
	return &KimiProvider{
		apiURL: apiURL,
		apiKey: apiKey,
		model:  model,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// kimiRequest Kimi请求格式（兼容OpenAI格式）
type kimiRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float32       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Stream      bool          `json:"stream,omitempty"`
}

// kimiResponse Kimi响应格式
type kimiResponse struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
	Model   string `json:"model"`
	Choices []struct {
		Index        int         `json:"index"`
		Message      ChatMessage `json:"message"`
		FinishReason string      `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// kimiErrorResponse Kimi错误响应格式
type kimiErrorResponse struct {
	Error struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error"`
}

// ChatCompletion 执行聊天完成请求
func (p *KimiProvider) ChatCompletion(ctx context.Context, req *ChatCompletionRequest) (*ChatCompletionResponse, error) {
	// 构建Kimi请求
	kimiReq := kimiRequest{
		Model:       p.model,
		Messages:    req.Messages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Stream:      false,
	}

	// 序列化请求
	jsonReq, err := json.Marshal(kimiReq)
	if err != nil {
		log.Printf("[Kimi] 序列化请求失败: %v", err)
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	// 创建HTTP请求
	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.apiURL+"/chat/completions", bytes.NewBuffer(jsonReq))
	if err != nil {
		log.Printf("[Kimi] 创建请求失败: %v", err)
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

	// 发送请求
	resp, err := p.client.Do(httpReq)
	if err != nil {
		log.Printf("[Kimi] 请求失败: %v", err)
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[Kimi] 读取响应失败: %v", err)
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		var errResp kimiErrorResponse
		if err := json.Unmarshal(body, &errResp); err == nil && errResp.Error.Message != "" {
			log.Printf("[Kimi] API错误: %s - %s", errResp.Error.Type, errResp.Error.Message)
			return nil, fmt.Errorf("Kimi API错误: %s", errResp.Error.Message)
		}
		log.Printf("[Kimi] HTTP错误: %d, 响应: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("Kimi API错误: HTTP %d", resp.StatusCode)
	}

	// 解析响应
	var kimiResp kimiResponse
	if err := json.Unmarshal(body, &kimiResp); err != nil {
		log.Printf("[Kimi] 解析响应失败: %v, 响应: %s", err, string(body))
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 转换为统一格式
	result := &ChatCompletionResponse{
		ID:     kimiResp.ID,
		Object: kimiResp.Object,
		Model:  kimiResp.Model,
		Usage: ChatUsage{
			PromptTokens:     kimiResp.Usage.PromptTokens,
			CompletionTokens: kimiResp.Usage.CompletionTokens,
			TotalTokens:      kimiResp.Usage.TotalTokens,
		},
	}

	// 转换choices
	for _, choice := range kimiResp.Choices {
		result.Choices = append(result.Choices, ChatChoice{
			Index:        choice.Index,
			Message:      choice.Message,
			FinishReason: choice.FinishReason,
		})
	}

	log.Printf("[Kimi] 请求成功, 模型: %s, Token使用: %d", result.Model, result.Usage.TotalTokens)
	return result, nil
}

// GetModelName 获取模型名称
func (p *KimiProvider) GetModelName() string {
	return p.model
}

// GetProviderName 获取提供商名称
func (p *KimiProvider) GetProviderName() string {
	return "kimi"
}
