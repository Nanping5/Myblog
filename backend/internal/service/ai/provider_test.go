package ai

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Feature: ai-chat-enhancement, Property 1: AI Provider请求格式转换正确性
// Validates: Requirements 2.2
func TestGLMProvider_RequestFormat(t *testing.T) {
	// 创建mock服务器
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 验证请求头
		if r.Header.Get("Content-Type") != "application/json" {
			t.Error("Content-Type header should be application/json")
		}
		if r.Header.Get("Authorization") != "Bearer test-key" {
			t.Error("Authorization header should contain Bearer token")
		}

		// 验证请求体
		var req map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Errorf("Failed to decode request body: %v", err)
		}

		// 验证必需字段
		if _, ok := req["model"]; !ok {
			t.Error("Request should contain model field")
		}
		if _, ok := req["messages"]; !ok {
			t.Error("Request should contain messages field")
		}

		// 返回mock响应
		resp := map[string]interface{}{
			"id":    "test-id",
			"model": "glm-4",
			"choices": []map[string]interface{}{
				{
					"index": 0,
					"message": map[string]string{
						"role":    "assistant",
						"content": "Hello!",
					},
					"finish_reason": "stop",
				},
			},
			"usage": map[string]int{
				"prompt_tokens":     10,
				"completion_tokens": 5,
				"total_tokens":      15,
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	// 创建Provider
	provider := NewGLMProvider(server.URL, "test-key", "glm-4")

	// 发送请求
	req := &ChatCompletionRequest{
		Messages: []ChatMessage{
			{Role: "user", Content: "Hello"},
		},
		Temperature: 0.7,
		MaxTokens:   100,
	}

	resp, err := provider.ChatCompletion(context.Background(), req)
	if err != nil {
		t.Fatalf("ChatCompletion failed: %v", err)
	}

	// 验证响应
	if resp.ID != "test-id" {
		t.Errorf("Expected ID 'test-id', got '%s'", resp.ID)
	}
	if len(resp.Choices) != 1 {
		t.Errorf("Expected 1 choice, got %d", len(resp.Choices))
	}
	if resp.Choices[0].Message.Content != "Hello!" {
		t.Errorf("Expected content 'Hello!', got '%s'", resp.Choices[0].Message.Content)
	}
}

// Feature: ai-chat-enhancement, Property 2: AI Provider响应格式转换正确性
// Validates: Requirements 2.3
func TestDeepSeekProvider_ResponseFormat(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := map[string]interface{}{
			"id":     "chatcmpl-123",
			"object": "chat.completion",
			"model":  "deepseek-chat",
			"choices": []map[string]interface{}{
				{
					"index": 0,
					"message": map[string]string{
						"role":    "assistant",
						"content": "Test response",
					},
					"finish_reason": "stop",
				},
			},
			"usage": map[string]int{
				"prompt_tokens":     20,
				"completion_tokens": 10,
				"total_tokens":      30,
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	provider := NewDeepSeekProvider(server.URL, "test-key", "deepseek-chat")

	req := &ChatCompletionRequest{
		Messages: []ChatMessage{
			{Role: "user", Content: "Test"},
		},
	}

	resp, err := provider.ChatCompletion(context.Background(), req)
	if err != nil {
		t.Fatalf("ChatCompletion failed: %v", err)
	}

	// 验证响应格式转换
	if resp.Object != "chat.completion" {
		t.Errorf("Expected object 'chat.completion', got '%s'", resp.Object)
	}
	if resp.Usage.TotalTokens != 30 {
		t.Errorf("Expected total tokens 30, got %d", resp.Usage.TotalTokens)
	}
}

// Feature: ai-chat-enhancement, Property 3: API错误处理完整性
// Validates: Requirements 2.4
func TestProvider_ErrorHandling(t *testing.T) {
	testCases := []struct {
		name       string
		statusCode int
		response   string
		expectErr  bool
	}{
		{
			name:       "HTTP 400 Bad Request",
			statusCode: 400,
			response:   `{"error":{"message":"Invalid request"}}`,
			expectErr:  true,
		},
		{
			name:       "HTTP 401 Unauthorized",
			statusCode: 401,
			response:   `{"error":{"message":"Invalid API key"}}`,
			expectErr:  true,
		},
		{
			name:       "HTTP 500 Server Error",
			statusCode: 500,
			response:   `{"error":{"message":"Internal server error"}}`,
			expectErr:  true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.statusCode)
				w.Write([]byte(tc.response))
			}))
			defer server.Close()

			provider := NewGLMProvider(server.URL, "test-key", "glm-4")

			req := &ChatCompletionRequest{
				Messages: []ChatMessage{
					{Role: "user", Content: "Test"},
				},
			}

			_, err := provider.ChatCompletion(context.Background(), req)
			if tc.expectErr && err == nil {
				t.Error("Expected error but got nil")
			}
			if !tc.expectErr && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

// Feature: ai-chat-enhancement, Property 4: HTTP请求头正确性
// Validates: Requirements 2.5
func TestProvider_RequestHeaders(t *testing.T) {
	providers := []struct {
		name           string
		createProvider func(url, key, model string) AIProvider
		expectedHeader string
		headerValue    string
	}{
		{
			name: "GLM",
			createProvider: func(url, key, model string) AIProvider {
				return NewGLMProvider(url, key, model)
			},
			expectedHeader: "Authorization",
			headerValue:    "Bearer test-key",
		},
		{
			name: "DeepSeek",
			createProvider: func(url, key, model string) AIProvider {
				return NewDeepSeekProvider(url, key, model)
			},
			expectedHeader: "Authorization",
			headerValue:    "Bearer test-key",
		},
		{
			name: "Qwen",
			createProvider: func(url, key, model string) AIProvider {
				return NewQwenProvider(url, key, model)
			},
			expectedHeader: "Authorization",
			headerValue:    "Bearer test-key",
		},
		{
			name: "Kimi",
			createProvider: func(url, key, model string) AIProvider {
				return NewKimiProvider(url, key, model)
			},
			expectedHeader: "Authorization",
			headerValue:    "Bearer test-key",
		},
	}

	for _, p := range providers {
		t.Run(p.name, func(t *testing.T) {
			headerChecked := false
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// 验证Content-Type
				if r.Header.Get("Content-Type") != "application/json" {
					t.Errorf("%s: Content-Type should be application/json", p.name)
				}
				// 验证Authorization
				if r.Header.Get(p.expectedHeader) != p.headerValue {
					t.Errorf("%s: %s header should be '%s', got '%s'",
						p.name, p.expectedHeader, p.headerValue, r.Header.Get(p.expectedHeader))
				}
				headerChecked = true

				// 返回mock响应
				resp := map[string]interface{}{
					"id":    "test",
					"model": "test",
					"choices": []map[string]interface{}{
						{"index": 0, "message": map[string]string{"role": "assistant", "content": "ok"}, "finish_reason": "stop"},
					},
					"usage": map[string]int{"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
				}
				json.NewEncoder(w).Encode(resp)
			}))
			defer server.Close()

			provider := p.createProvider(server.URL, "test-key", "test-model")
			req := &ChatCompletionRequest{
				Messages: []ChatMessage{{Role: "user", Content: "test"}},
			}
			provider.ChatCompletion(context.Background(), req)

			if !headerChecked {
				t.Errorf("%s: Headers were not checked", p.name)
			}
		})
	}
}

// Feature: ai-chat-enhancement, Property 16: Provider配置加载
// Validates: Requirements 7.1
func TestAIManager_RegisterProvider(t *testing.T) {
	manager := NewAIManager()

	// 注册多个Provider
	manager.RegisterProvider("glm", NewGLMProvider("http://test", "key", "model"))
	manager.RegisterProvider("deepseek", NewDeepSeekProvider("http://test", "key", "model"))

	// 验证Provider数量
	providers := manager.GetAllProviders()
	if len(providers) != 2 {
		t.Errorf("Expected 2 providers, got %d", len(providers))
	}

	// 验证默认Provider
	provider, err := manager.GetProvider("")
	if err != nil {
		t.Errorf("Failed to get default provider: %v", err)
	}
	if provider == nil {
		t.Error("Default provider should not be nil")
	}

	// 验证获取指定Provider
	provider, err = manager.GetProvider("deepseek")
	if err != nil {
		t.Errorf("Failed to get deepseek provider: %v", err)
	}
	if provider.GetProviderName() != "deepseek" {
		t.Errorf("Expected provider name 'deepseek', got '%s'", provider.GetProviderName())
	}

	// 验证获取不存在的Provider
	_, err = manager.GetProvider("nonexistent")
	if err == nil {
		t.Error("Expected error for nonexistent provider")
	}
}

// Feature: ai-chat-enhancement, Property 25: 数据库迁移幂等性
// Validates: Requirements 10.4
func TestAIManager_ClearAndReload(t *testing.T) {
	manager := NewAIManager()

	// 注册Provider
	manager.RegisterProvider("test", NewGLMProvider("http://test", "key", "model"))

	// 清空
	manager.ClearProviders()

	// 验证清空后没有Provider
	providers := manager.GetAllProviders()
	if len(providers) != 0 {
		t.Errorf("Expected 0 providers after clear, got %d", len(providers))
	}

	// 重新注册
	manager.RegisterProvider("test", NewGLMProvider("http://test", "key", "model"))

	// 验证重新注册成功
	providers = manager.GetAllProviders()
	if len(providers) != 1 {
		t.Errorf("Expected 1 provider after re-register, got %d", len(providers))
	}
}
