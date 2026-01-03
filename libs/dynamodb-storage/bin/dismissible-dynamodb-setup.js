#!/usr/bin/env node
const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
  waitUntilTableExists,
} = require('@aws-sdk/client-dynamodb');

const TABLE_NAME = process.env.DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME || 'dismissible-items';
const REGION = process.env.DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION || 'us-east-1';
const ENDPOINT =
  typeof process.env.DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT !== 'undefined'
    ? process.env.DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT
    : 'http://localhost:4566';
const ACCESS_KEY_ID = process.env.DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID || 'test';
const SECRET_ACCESS_KEY = process.env.DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY || 'test';
const SESSION_TOKEN = process.env.DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN || '';

function maskSecret(value, visibleChars = 4) {
  if (!value || value.length <= visibleChars * 2) {
    return '*'.repeat(Math.min(value?.length || 8, 8));
  }
  return `${value.substring(0, visibleChars)}${'*'.repeat(value.length - visibleChars * 2)}${value.substring(value.length - visibleChars)}`;
}

async function createTable() {
  const config = {
    region: REGION,
    endpoint: ENDPOINT,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      sessionToken: SESSION_TOKEN,
    },
  };

  const client = new DynamoDBClient(config);

  console.log(`Running DynamoDB setup for table ${TABLE_NAME}...`);
  console.log(`Region: ${REGION}`);
  console.log(`Endpoint: ${ENDPOINT ? ENDPOINT : '(not set)'}`);
  console.log(`Access Key ID: ${ACCESS_KEY_ID ? maskSecret(ACCESS_KEY_ID) : '(not set)'}`);
  console.log(
    `Secret Access Key: ${SECRET_ACCESS_KEY ? maskSecret(SECRET_ACCESS_KEY) : '(not set)'}`,
  );
  console.log(`Session Token: ${SESSION_TOKEN ? maskSecret(SESSION_TOKEN) : '(not set)'}`);

  // Check if table exists
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`Table ${TABLE_NAME} already exists`);
    return;
  } catch (error) {
    if (!(error instanceof ResourceNotFoundException)) {
      throw error;
    }
  }

  // Create table
  console.log(`Creating table ${TABLE_NAME}...`);
  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'id', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'id', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }),
  );

  // Wait for table to be active
  await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: TABLE_NAME });
  console.log(`Table ${TABLE_NAME} created successfully`);
}

createTable().catch((error) => {
  console.error('Failed to create DynamoDB table:', error.message);
  process.exit(1);
});
