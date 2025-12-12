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

// GLMProvider 智谱AI GLM服务提供商
type GLMProvider struct {
	apiURL  string
	apiKey  string
	model   string
	client  *http.Client
}

// NewGLMProvider 创建GLM Provider实例
// apiURL: API端点，如 https://open.bigmodel.cn/api/paas/v4
// apiKey: API密钥
// model: 模型名称，如 glm-4、glm-4-flash
func NewGLMProvider(apiURL, apiKey, model string) *GLMProvider {
	return &GLMProvider{
		apiURL: apiURL,
		apiKey: apiKey,
		model:  model,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// glmRequest 智谱AI请求格式
type glmRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	Temperature float32       `json:"temperature,omitempty"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Stream      bool          `json:"stream,omitempty"`
}

// glmResponse 智谱AI响应格式
type glmResponse struct {
	ID      string `json:"id"`
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

// glmErrorResponse 智谱AI错误响应格式
type glmErrorResponse struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// ChatCompletion 执行聊天完成请求
func (p *GLMProvider) ChatCompletion(ctx context.Context, req *ChatCompletionRequest) (*ChatCompletionResponse, error) {
	// 构建GLM请求
	glmReq := glmRequest{
		Model:       p.model,
		Messages:    req.Messages,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Stream:      false, // 暂不支持流式
	}

	// 序列化请求
	jsonReq, err := json.Marshal(glmReq)
	if err != nil {
		log.Printf("[GLM] 序列化请求失败: %v", err)
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	// 创建HTTP请求
	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.apiURL+"/chat/completions", bytes.NewBuffer(jsonReq))
	if err != nil {
		log.Printf("[GLM] 创建请求失败: %v", err)
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

	// 发送请求
	resp, err := p.client.Do(httpReq)
	if err != nil {
		log.Printf("[GLM] 请求失败: %v", err)
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[GLM] 读取响应失败: %v", err)
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		var errResp glmErrorResponse
		if err := json.Unmarshal(body, &errResp); err == nil && errResp.Error.Message != "" {
			log.Printf("[GLM] API错误: %s - %s", errResp.Error.Code, errResp.Error.Message)
			return nil, fmt.Errorf("GLM API错误: %s", errResp.Error.Message)
		}
		log.Printf("[GLM] HTTP错误: %d, 响应: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("GLM API错误: HTTP %d", resp.StatusCode)
	}

	// 解析响应
	var glmResp glmResponse
	if err := json.Unmarshal(body, &glmResp); err != nil {
		log.Printf("[GLM] 解析响应失败: %v, 响应: %s", err, string(body))
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 转换为统一格式
	result := &ChatCompletionResponse{
		ID:     glmResp.ID,
		Object: "chat.completion",
		Model:  glmResp.Model,
		Usage: ChatUsage{
			PromptTokens:     glmResp.Usage.PromptTokens,
			CompletionTokens: glmResp.Usage.CompletionTokens,
			TotalTokens:      glmResp.Usage.TotalTokens,
		},
	}

	// 转换choices
	for _, choice := range glmResp.Choices {
		result.Choices = append(result.Choices, ChatChoice{
			Index:        choice.Index,
			Message:      choice.Message,
			FinishReason: choice.FinishReason,
		})
	}

	log.Printf("[GLM] 请求成功, 模型: %s, Token使用: %d", result.Model, result.Usage.TotalTokens)
	return result, nil
}

// GetModelName 获取模型名称
func (p *GLMProvider) GetModelName() string {
	return p.model
}

// GetProviderName 获取提供商名称
func (p *GLMProvider) GetProviderName() string {
	return "glm"
}
