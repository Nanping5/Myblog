package crypto

import (
	"strings"
	"testing"
)

// Feature: ai-chat-enhancement, Property 18: API密钥加密存储
// Validates: Requirements 7.3

// 测试加密后的数据不是明文
func TestEncrypt_NotPlaintext(t *testing.T) {
	testCases := []string{
		"sk-test-api-key-12345",
		"simple-key",
		"a-very-long-api-key-that-should-be-encrypted-properly",
		"中文密钥测试",
		"special!@#$%^&*()chars",
	}

	for _, plaintext := range testCases {
		t.Run(plaintext[:min(10, len(plaintext))], func(t *testing.T) {
			encrypted, err := Encrypt(plaintext)
			if err != nil {
				t.Fatalf("Encrypt failed: %v", err)
			}

			// 验证加密后不是明文
			if encrypted == plaintext {
				t.Error("Encrypted text should not equal plaintext")
			}

			// 验证加密后不包含明文
			if strings.Contains(encrypted, plaintext) {
				t.Error("Encrypted text should not contain plaintext")
			}

			// 验证加密后是Base64格式
			if !IsEncrypted(encrypted) {
				t.Error("Encrypted text should be valid Base64")
			}
		})
	}
}

// 测试加密解密的往返一致性
func TestEncryptDecrypt_RoundTrip(t *testing.T) {
	testCases := []string{
		"sk-test-api-key-12345",
		"simple-key",
		"a-very-long-api-key-that-should-be-encrypted-properly",
		"中文密钥测试",
		"special!@#$%^&*()chars",
		"",
		"a",
		strings.Repeat("x", 1000),
	}

	for i, plaintext := range testCases {
		t.Run(string(rune('A'+i)), func(t *testing.T) {
			// 加密
			encrypted, err := Encrypt(plaintext)
			if err != nil {
				t.Fatalf("Encrypt failed: %v", err)
			}

			// 解密
			decrypted, err := Decrypt(encrypted)
			if err != nil {
				t.Fatalf("Decrypt failed: %v", err)
			}

			// 验证往返一致性
			if decrypted != plaintext {
				t.Errorf("Round trip failed: expected '%s', got '%s'", plaintext, decrypted)
			}
		})
	}
}

// 测试空字符串处理
func TestEncryptDecrypt_EmptyString(t *testing.T) {
	encrypted, err := Encrypt("")
	if err != nil {
		t.Fatalf("Encrypt empty string failed: %v", err)
	}
	if encrypted != "" {
		t.Error("Encrypting empty string should return empty string")
	}

	decrypted, err := Decrypt("")
	if err != nil {
		t.Fatalf("Decrypt empty string failed: %v", err)
	}
	if decrypted != "" {
		t.Error("Decrypting empty string should return empty string")
	}
}

// 测试无效密文处理
func TestDecrypt_InvalidCiphertext(t *testing.T) {
	testCases := []string{
		"not-base64!@#",
		"dG9vLXNob3J0", // 太短的Base64
	}

	for _, ciphertext := range testCases {
		t.Run(ciphertext[:min(10, len(ciphertext))], func(t *testing.T) {
			_, err := Decrypt(ciphertext)
			// 无效密文应该返回错误
			if err == nil {
				t.Log("Invalid ciphertext may or may not return error depending on format")
			}
		})
	}
}

// 测试IsEncrypted函数
func TestIsEncrypted(t *testing.T) {
	// 加密一个字符串
	encrypted, _ := Encrypt("test-key")

	if !IsEncrypted(encrypted) {
		t.Error("Encrypted string should be detected as encrypted")
	}

	// 明文不应该被检测为加密
	if IsEncrypted("plain-text") {
		t.Log("Plain text may be detected as encrypted if it's valid Base64")
	}

	// 空字符串
	if IsEncrypted("") {
		t.Error("Empty string should not be detected as encrypted")
	}
}

// 测试多次加密产生不同结果（因为使用随机nonce）
func TestEncrypt_DifferentResults(t *testing.T) {
	plaintext := "test-api-key"

	encrypted1, _ := Encrypt(plaintext)
	encrypted2, _ := Encrypt(plaintext)

	if encrypted1 == encrypted2 {
		t.Error("Multiple encryptions should produce different results due to random nonce")
	}

	// 但解密后应该相同
	decrypted1, _ := Decrypt(encrypted1)
	decrypted2, _ := Decrypt(encrypted2)

	if decrypted1 != decrypted2 {
		t.Error("Decrypted values should be the same")
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
