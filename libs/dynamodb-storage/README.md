# @dismissible/nestjs-dynamodb-storage

DynamoDB storage adapter for the Dismissible system using AWS SDK v3.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides a production-ready DynamoDB storage adapter for the Dismissible system. It uses AWS SDK v3 for DynamoDB access and includes:

- Persistent storage of dismissible items using DynamoDB
- Support for LocalStack/DynamoDB Local for local development
- Automatic document serialization/deserialization
- Full TypeScript support

## Installation

```bash
npm install @dismissible/nestjs-dynamodb-storage
```

## Prerequisites

- AWS account with DynamoDB access (or LocalStack for local development)
- Node.js 18 or higher
- AWS SDK for JavaScript v3 compatible environment

## Getting Started

### 1. Create DynamoDB Table

Before using the storage module, you must create the DynamoDB table.

#### Option A: Using the CLI Tool (Recommended)

The package includes a CLI helper for table creation:

```bash
# For local development with LocalStack
DISMISSIBLE_DYNAMODB_LOCALSTACK_ENDPOINT=http://localhost:4566 npx dynamodb-setup

# For production (uses default AWS credentials)
DISMISSIBLE_DYNAMODB_AWS_REGION=us-east-1 npx dynamodb-setup
```

#### Option B: Using AWS Console or CLI

Create the table manually using AWS Console or AWS CLI:

```bash
aws dynamodb create-table \
  --table-name dismissible-items \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=id,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Module Configuration

Import and configure the module in your NestJS application:

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-dismissible';
import { DynamoDBStorageModule } from '@dismissible/nestjs-dynamodb-storage';
import { LoggerModule } from '@dismissible/nestjs-logger';

@Module({
  imports: [
    LoggerModule.forRoot({}),
    DynamoDBStorageModule.forRoot({
      tableName: 'dismissible-items',
      region: 'us-east-1',
      // Optional: endpoint for LocalStack
      endpoint: process.env.DISMISSIBLE_DYNAMODB_LOCALSTACK_ENDPOINT,
    }),
    DismissibleModule.forRoot({
      storage: DynamoDBStorageModule,
    }),
  ],
})
export class AppModule {}
```

### 3. Async Configuration

You can also configure the module asynchronously:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDBStorageModule } from '@dismissible/nestjs-dynamodb-storage';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DynamoDBStorageModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        tableName: config.get<string>('DISMISSIBLE_DYNAMODB_TABLE_NAME')!,
        region: config.get<string>('DISMISSIBLE_DYNAMODB_AWS_REGION'),
        endpoint: config.get<string>('DISMISSIBLE_DYNAMODB_LOCALSTACK_ENDPOINT'),
        accessKeyId: config.get<string>('DISMISSIBLE_DYNAMODB_AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get<string>('DISMISSIBLE_DYNAMODB_AWS_SECRET_ACCESS_KEY'),
        sessionToken: config.get<string>('DISMISSIBLE_DYNAMODB_AWS_SESSION_TOKEN'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

## DynamoDB Table Schema

The library expects a DynamoDB table with the following schema:

| Attribute   | Type   | Key Type      | Description                   |
| ----------- | ------ | ------------- | ----------------------------- |
| userId      | String | Partition Key | User identifier               |
| id          | String | Sort Key      | Item identifier               |
| createdAt   | String | -             | ISO 8601 timestamp            |
| dismissedAt | String | -             | ISO 8601 timestamp (nullable) |

**Billing Mode:** PAY_PER_REQUEST (on-demand capacity)

## API Reference

### DynamoDBStorageModule

#### `DynamoDBStorageModule.forRoot(options)`

Configures the DynamoDB storage module synchronously.

**Options:**

- `tableName: string` - DynamoDB table name (required)
- `region?: string` - AWS region (default: us-east-1)
- `endpoint?: string` - DynamoDB endpoint URL (for LocalStack/DynamoDB Local)
- `accessKeyId?: string` - AWS access key ID
- `secretAccessKey?: string` - AWS secret access key
- `sessionToken?: string` - AWS session token (optional)

**Returns:** `DynamicModule`

#### `DynamoDBStorageModule.forRootAsync(options)`

Configures the DynamoDB storage module asynchronously.

**Options:**

- `imports?: any[]` - Modules to import
- `useFactory: (deps) => DynamoDBStorageModuleOptions` - Factory function
- `inject?: any[]` - Dependencies to inject into the factory

**Returns:** `DynamicModule`

### DynamoDBStorageAdapter

The adapter implements `IDismissibleStorage` and provides:

- `get(userId, itemId)` - Retrieve an item
- `create(item)` - Create a new item
- `update(item)` - Update an existing item

### DynamoDBClientService

The service manages the DynamoDB client lifecycle:

- Initializes DynamoDBClient with configured credentials
- Creates DynamoDBDocumentClient for automatic serialization
- Handles connection lifecycle (no explicit cleanup required)

## CLI Tool

The package includes a CLI tool for DynamoDB table setup:

```bash
# Create table with default settings
npx dynamodb-setup

# With custom table name
DISMISSIBLE_DYNAMODB_TABLE_NAME=my-table npx dynamodb-setup

# For LocalStack
DISMISSIBLE_DYNAMODB_LOCALSTACK_ENDPOINT=http://localhost:4566 DISMISSIBLE_DYNAMODB_AWS_REGION=us-east-1 npx dynamodb-setup

# For AWS
DISMISSIBLE_DYNAMODB_AWS_REGION=us-west-2 DISMISSIBLE_DYNAMODB_AWS_ACCESS_KEY_ID=xxx DISMISSIBLE_DYNAMODB_AWS_SECRET_ACCESS_KEY=yyy npx dynamodb-setup
```

## Environment Variables

| Variable                                     | Description             | Default           |
| -------------------------------------------- | ----------------------- | ----------------- |
| `DISMISSIBLE_DYNAMODB_TABLE_NAME`            | DynamoDB table name     | dismissible-items |
| `DISMISSIBLE_DYNAMODB_AWS_REGION`            | AWS region              | us-east-1         |
| `DISMISSIBLE_DYNAMODB_AWS_ACCESS_KEY_ID`     | AWS access key ID       | -                 |
| `DISMISSIBLE_DYNAMODB_AWS_SECRET_ACCESS_KEY` | AWS secret access key   | -                 |
| `DISMISSIBLE_DYNAMODB_AWS_SESSION_TOKEN`     | AWS session token       | -                 |
| `DISMISSIBLE_DYNAMODB_LOCALSTACK_ENDPOINT`   | LocalStack endpoint URL | -                 |

## Local Development with LocalStack

LocalStack provides a local AWS cloud stack for development. To use it with this library:

1. Start LocalStack:

```bash
docker run -d --name localstack -p 4566:4566 localstack/localstack
```

2. Create the table:

```bash
DISMISSIBLE_DYNAMODB_LOCALSTACK_ENDPOINT=http://localhost:4566 DISMISSIBLE_DYNAMODB_AWS_REGION=us-east-1 npx dynamodb-setup
```

3. Configure your application:

```typescript
DynamoDBStorageModule.forRoot({
  tableName: 'dismissible-items',
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  accessKeyId: 'test',
  secretAccessKey: 'test',
}),
```

## Production Considerations

1. **IAM Permissions**: Ensure your application has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/dismissible-items"
    }
  ]
}
```

2. **Table Creation**: Create the table before deploying your application. Use the CLI tool or CloudFormation/Terraform.

3. **Monitoring**: Enable CloudWatch metrics for DynamoDB to monitor throughput and latency.

4. **Backups**: Consider enabling point-in-time recovery for disaster recovery.

## Related Packages

- `@dismissible/nestjs-dismissible` - Main dismissible service
- `@dismissible/nestjs-storage` - Storage interface
- `@dismissible/nestjs-dismissible-item` - Data models
- `@dismissible/nestjs-logger` - Logging

## License

MIT
