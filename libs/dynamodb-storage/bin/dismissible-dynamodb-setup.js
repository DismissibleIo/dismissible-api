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
const READINESS_ATTEMPTS = 30;
const READINESS_DELAY_MS = 2000;

function maskSecret(value, visibleChars = 4) {
  if (!value || value.length <= visibleChars * 2) {
    return '*'.repeat(Math.min(value?.length || 8, 8));
  }
  return `${value.substring(0, visibleChars)}${'*'.repeat(value.length - visibleChars * 2)}${value.substring(value.length - visibleChars)}`;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForDynamoDB(client) {
  for (let attempt = 1; attempt <= READINESS_ATTEMPTS; attempt += 1) {
    try {
      await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        return false;
      }

      if (attempt === READINESS_ATTEMPTS) {
        const target = ENDPOINT || `AWS DynamoDB in ${REGION}`;
        throw new Error(
          `DynamoDB did not become ready at ${target} after ${READINESS_ATTEMPTS} attempts: ${error.message}`,
          { cause: error },
        );
      }

      console.warn(
        `DynamoDB is not ready (attempt ${attempt}/${READINESS_ATTEMPTS}): ${error.message}`,
      );
      await delay(READINESS_DELAY_MS);
    }
  }

  return false;
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

  try {
    const tableExists = await waitForDynamoDB(client);
    if (tableExists) {
      console.log(`Table ${TABLE_NAME} already exists`);
      return;
    }

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

    await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: TABLE_NAME });
    console.log(`Table ${TABLE_NAME} created successfully`);
  } finally {
    client.destroy();
  }
}

if (require.main === module) {
  createTable().catch((error) => {
    console.error('Failed to set up DynamoDB table:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { createTable, waitForDynamoDB };
