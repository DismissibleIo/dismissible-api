const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} = require('@aws-sdk/client-dynamodb');
const { WaiterClient, WaiterState } = require('@aws-sdk/util-waiter');

const TABLE_NAME = process.env.DISMISSIBLE_DYNAMODB_TABLE_NAME || 'dismissible-items';
const REGION = process.env.DISMISSIBLE_DYNAMODB_AWS_REGION || 'us-east-1';
const ENDPOINT = process.env.DISMISSIBLE_DYNAMODB_LOCALSTACK_ENDPOINT;

async function createTable() {
  const client = new DynamoDBClient({
    region: REGION,
    endpoint: ENDPOINT,
  });

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
  const waiter = new WaiterClient({ client });
  await waiter.waitForTableExists({ TableName: TABLE_NAME }, { minDelay: 5, maxDelay: 120 });
  console.log(`Table ${TABLE_NAME} created successfully`);
}

createTable().catch((error) => {
  console.error('Failed to create DynamoDB table:', error.message);
  process.exit(1);
});
