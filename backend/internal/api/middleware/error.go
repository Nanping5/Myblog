package middleware

import (
	"log"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// 注意：CORS中间件定义在cors.go中

// ErrorResponse 统一错误响应格式
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
	Details string `json:"details,omitempty"`
}

// Recovery Panic恢复中间件
// 捕获所有panic，记录日志并返回500错误
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				// 记录错误日志
				log.Printf("[Recovery] Panic recovered: %v\n%s", err, debug.Stack())

				// 返回500错误
				c.AbortWithStatusJSON(http.StatusInternalServerError, ErrorResponse{
					Error: "服务器内部错误",
					Code:  "INTERNAL_ERROR",
				})
			}
		}()
		c.Next()
	}
}

// ErrorHandler 错误处理中间件
// 统一处理请求过程中的错误
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// 检查是否有错误
		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			log.Printf("[ErrorHandler] 请求错误: %v", err)

			// 如果还没有写入响应
			if !c.Writer.Written() {
				c.JSON(http.StatusInternalServerError, ErrorResponse{
					Error: err.Error(),
					Code:  "REQUEST_ERROR",
				})
			}
		}
	}
}

// RequestLogger 请求日志中间件
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 请求开始
		log.Printf("[Request] %s %s", c.Request.Method, c.Request.URL.Path)

		c.Next()

		// 请求结束
		log.Printf("[Response] %s %s - %d", c.Request.Method, c.Request.URL.Path, c.Writer.Status())
	}
}
