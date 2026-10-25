package pkg

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var ErrS3NotConfigured = errors.New("S3 is not configured: set S3_ACCESS_KEY_ID, S3_ACCESS_KEY, S3_BUCKET_NAME and AWS_REGION")

type S3Client struct {
	client  *s3.Client
	presign *s3.PresignClient
	bucket  string
}

var (
	s3Once     sync.Once
	s3Instance *S3Client
	s3Err      error
)

// S3Configured reports whether every required S3 variable is set
func S3Configured() bool {
	for _, name := range []string{"S3_ACCESS_KEY_ID", "S3_ACCESS_KEY", "S3_BUCKET_NAME", "AWS_REGION"} {
		if strings.TrimSpace(os.Getenv(name)) == "" {
			return false
		}
	}
	return true
}

// S3 returns the process-wide S3 client, built once from the environment; S3_ENDPOINT and
// S3_USE_PATH_STYLE point it at any S3-compatible store
func S3() (*S3Client, error) {
	s3Once.Do(func() {
		if !S3Configured() {
			s3Err = ErrS3NotConfigured
			return
		}
		cfg, err := config.LoadDefaultConfig(context.Background(),
			config.WithRegion(os.Getenv("AWS_REGION")),
			config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
				os.Getenv("S3_ACCESS_KEY_ID"), os.Getenv("S3_ACCESS_KEY"), "",
			)),
		)
		if err != nil {
			s3Err = fmt.Errorf("loading S3 config: %w", err)
			return
		}
		client := s3.NewFromConfig(cfg, func(options *s3.Options) {
			if endpoint := strings.TrimSpace(os.Getenv("S3_ENDPOINT")); endpoint != "" {
				options.BaseEndpoint = aws.String(endpoint)
			}
			options.UsePathStyle = os.Getenv("S3_USE_PATH_STYLE") == "true"
		})
		s3Instance = &S3Client{client: client, presign: s3.NewPresignClient(client), bucket: os.Getenv("S3_BUCKET_NAME")}
	})
	return s3Instance, s3Err
}

// PutObject stores body at key in the private bucket
func (c *S3Client) PutObject(ctx context.Context, key string, body []byte, contentType string) error {
	_, err := c.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(c.bucket),
		Key:           aws.String(key),
		Body:          bytes.NewReader(body),
		ContentType:   aws.String(contentType),
		ContentLength: aws.Int64(int64(len(body))),
	})
	return err
}

// DeleteObject removes key; deleting a missing key is not an error
func (c *S3Client) DeleteObject(ctx context.Context, key string) error {
	_, err := c.client.DeleteObject(ctx, &s3.DeleteObjectInput{Bucket: aws.String(c.bucket), Key: aws.String(key)})
	return err
}

// PresignGet signs a GET for key locally, without a network call, and says when the link expires
func (c *S3Client) PresignGet(ctx context.Context, key string, expiry time.Duration) (string, time.Time, error) {
	signedAt := time.Now()
	request, err := c.presign.PresignGetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(c.bucket), Key: aws.String(key)},
		s3.WithPresignExpires(expiry))
	if err != nil {
		return "", time.Time{}, err
	}
	return request.URL, signedAt.Add(expiry), nil
}
