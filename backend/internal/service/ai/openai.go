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

// OpenAIProvider OpenAI服务提供商
type OpenAIProvider struct {
	apiURL string
	apiKey string
	model  string
	client *http.Client
}

// NewOpenAIProvider 创建OpenAI Provider实例
// apiURL: API端点，如 https://api.openai.com/v1
// apiKey: API密钥
// model: 模型名称，如 gpt-3.5-turbo、gpt-4
func NewOpenAIProvider(apiURL, apiKey, model string) *OpenAIProvider {
	return &OpenAIProvider{
		apiURL: apiURL,
		apiKey: apiKey,
		model:  model,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// openaiErrorResponse OpenAI错误响应格式
type openaiErrorResponse struct {
	Error struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error"`
}

// ChatCompletion 执行聊天完成请求
func (p *OpenAIProvider) ChatCompletion(ctx context.Context, req *ChatCompletionRequest) (*ChatCompletionResponse, error) {
	// 设置模型
	req.Model = p.model

	// 序列化请求
	jsonReq, err := json.Marshal(req)
	if err != nil {
		log.Printf("[OpenAI] 序列化请求失败: %v", err)
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	// 创建HTTP请求
	httpReq, err := http.NewRequestWithContext(ctx, "POST", p.apiURL+"/chat/completions", bytes.NewBuffer(jsonReq))
	if err != nil {
		log.Printf("[OpenAI] 创建请求失败: %v", err)
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 设置请求头
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.apiKey)

	// 发送请求
	resp, err := p.client.Do(httpReq)
	if err != nil {
		log.Printf("[OpenAI] 请求失败: %v", err)
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应体
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[OpenAI] 读取响应失败: %v", err)
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		var errResp openaiErrorResponse
		if err := json.Unmarshal(body, &errResp); err == nil && errResp.Error.Message != "" {
			log.Printf("[OpenAI] API错误: %s - %s", errResp.Error.Type, errResp.Error.Message)
			return nil, fmt.Errorf("OpenAI API错误: %s", errResp.Error.Message)
		}
		log.Printf("[OpenAI] HTTP错误: %d, 响应: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("OpenAI API错误: HTTP %d", resp.StatusCode)
	}

	// 解析响应
	var result ChatCompletionResponse
	if err := json.Unmarshal(body, &result); err != nil {
		log.Printf("[OpenAI] 解析响应失败: %v, 响应: %s", err, string(body))
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	log.Printf("[OpenAI] 请求成功, 模型: %s, Token使用: %d", result.Model, result.Usage.TotalTokens)
	return &result, nil
}

func (p *OpenAIProvider) GetModelName() string {
	return p.model
}

func (p *OpenAIProvider) GetProviderName() string {
	return "openai"
}
