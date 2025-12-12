package ai

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"
)

// AIManager AI服务管理器
// 负责管理多个AI Provider，提供统一的调用接口
type AIManager struct {
	providers       map[string]AIProvider
	defaultProvider string
	mu              sync.RWMutex
}

// NewAIManager 创建AI管理器实例
func NewAIManager() *AIManager {
	return &AIManager{
		providers: make(map[string]AIProvider),
	}
}

// RegisterProvider 注册AI Provider
// name: Provider名称，如 "glm"、"deepseek"、"qwen"、"kimi"
// provider: Provider实例
func (m *AIManager) RegisterProvider(name string, provider AIProvider) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.providers[name] = provider
	if m.defaultProvider == "" {
		m.defaultProvider = name
	}
	log.Printf("[AIManager] 注册Provider: %s, 模型: %s", name, provider.GetModelName())
}

// SetDefaultProvider 设置默认Provider
func (m *AIManager) SetDefaultProvider(name string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.providers[name]; !exists {
		return fmt.Errorf("provider %s 不存在", name)
	}
	m.defaultProvider = name
	log.Printf("[AIManager] 设置默认Provider: %s", name)
	return nil
}

// GetProvider 获取指定的Provider
// 如果name为空，返回默认Provider
func (m *AIManager) GetProvider(name string) (AIProvider, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if name == "" {
		name = m.defaultProvider
	}

	if name == "" {
		return nil, fmt.Errorf("没有可用的AI Provider")
	}

	provider, exists := m.providers[name]
	if !exists {
		return nil, fmt.Errorf("provider %s 不存在", name)
	}

	return provider, nil
}

// GetAllProviders 获取所有已注册的Provider名称
func (m *AIManager) GetAllProviders() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	names := make([]string, 0, len(m.providers))
	for name := range m.providers {
		names = append(names, name)
	}
	return names
}

// HasProvider 检查是否存在指定的Provider
func (m *AIManager) HasProvider(name string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	_, exists := m.providers[name]
	return exists
}

// ChatCompletion 执行聊天完成请求
// providerName: Provider名称，为空则使用默认Provider
// req: 聊天请求
func (m *AIManager) ChatCompletion(ctx context.Context, providerName string, req *ChatCompletionRequest) (*ChatCompletionResponse, error) {
	provider, err := m.GetProvider(providerName)
	if err != nil {
		return nil, err
	}

	return provider.ChatCompletion(ctx, req)
}

// ClearProviders 清空所有Provider（用于重新加载配置）
func (m *AIManager) ClearProviders() {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.providers = make(map[string]AIProvider)
	m.defaultProvider = ""
	log.Printf("[AIManager] 清空所有Provider")
}

// LoadProvidersFromEnv 从环境变量加载Provider配置
// 这是一个fallback机制，当数据库配置不存在时使用
func (m *AIManager) LoadProvidersFromEnv() {
	// GLM
	if apiKey := os.Getenv("GLM_API_KEY"); apiKey != "" {
		apiURL := os.Getenv("GLM_API_URL")
		if apiURL == "" {
			apiURL = "https://open.bigmodel.cn/api/paas/v4"
		}
		model := os.Getenv("GLM_MODEL")
		if model == "" {
			model = "glm-4-flash"
		}
		m.RegisterProvider("glm", NewGLMProvider(apiURL, apiKey, model))
	}

	// DeepSeek
	if apiKey := os.Getenv("DEEPSEEK_API_KEY"); apiKey != "" {
		apiURL := os.Getenv("DEEPSEEK_API_URL")
		if apiURL == "" {
			apiURL = "https://api.deepseek.com/v1"
		}
		model := os.Getenv("DEEPSEEK_MODEL")
		if model == "" {
			model = "deepseek-chat"
		}
		m.RegisterProvider("deepseek", NewDeepSeekProvider(apiURL, apiKey, model))
	}

	// Qwen
	if apiKey := os.Getenv("QWEN_API_KEY"); apiKey != "" {
		apiURL := os.Getenv("QWEN_API_URL")
		if apiURL == "" {
			apiURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
		}
		model := os.Getenv("QWEN_MODEL")
		if model == "" {
			model = "qwen-turbo"
		}
		m.RegisterProvider("qwen", NewQwenProvider(apiURL, apiKey, model))
	}

	// Kimi
	if apiKey := os.Getenv("KIMI_API_KEY"); apiKey != "" {
		apiURL := os.Getenv("KIMI_API_URL")
		if apiURL == "" {
			apiURL = "https://api.moonshot.cn/v1"
		}
		model := os.Getenv("KIMI_MODEL")
		if model == "" {
			model = "moonshot-v1-8k"
		}
		m.RegisterProvider("kimi", NewKimiProvider(apiURL, apiKey, model))
	}

	// OpenAI
	if apiKey := os.Getenv("OPENAI_API_KEY"); apiKey != "" {
		apiURL := os.Getenv("OPENAI_API_URL")
		if apiURL == "" {
			apiURL = "https://api.openai.com/v1"
		}
		model := os.Getenv("OPENAI_MODEL")
		if model == "" {
			model = "gpt-3.5-turbo"
		}
		m.RegisterProvider("openai", NewOpenAIProvider(apiURL, apiKey, model))
	}

	log.Printf("[AIManager] 从环境变量加载完成，共 %d 个Provider", len(m.providers))
}
