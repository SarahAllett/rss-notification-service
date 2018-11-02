const { assert } = require('chai'),
      ddblocal = require('local-dynamo'),
      sinon = require('sinon'),
      aws = require('../../dynamodb/dynamodb.js'),
      expected = require('../fixtures/json/dynamodb.json'),
      helper = require('../../dynamodb/helper.js'),
      mockItems = require('../fixtures/json/feeds.json');

describe('DynamoDB', () => {

  let sandbox;
  let dynamoInstance;

  before(() => {
    if(process.env.NODE_ENV !== 'test') {
      dynamoInstance = ddblocal.launch(null, 8000);
    }
  });

  after(() => {
    if(process.env.NODE_ENV !== 'test') {
      dynamoInstance.kill();
    }
  });

  beforeEach(async () => {
    await aws.setup();
    sandbox = sinon.createSandbox();
  })

  afterEach(async () => {
    await aws.deleteTable();
    sandbox = sandbox.restore();
  });

  describe('uses the correct config', () => {
    it('returns the correct API version', () => {
      return assert.equal(helper.config.apiVersion, '2012-08-10');
    });
  });

  describe('populates the DynamoDB table', () => {
    it('adds items from mock file in one call with <= 25 items', async () => {
      const result = await aws.populate(mockItems.feeds.slice(0, 25));
      return assert.deepEqual(result, expected.addItemsLessThanTwentyFive);
    });

    it('adds items from mock file in 2 call with >= 26 items', async () => {
      const result = await aws.populate(mockItems.feeds.slice(0, 26));
      return assert.deepEqual(result, expected.addItemsMoreThanTwentyFive);
    });
  });

  describe('formats sources array correctly for DynamoDB', () => {
    it('returns correct array for DynamoDB', () => {
      const result = aws.formatArray(mockItems.feeds.slice(0, 1));
      return assert.deepEqual(result, expected.formatArray);
    });
    it('returns { NULL: true } value if value is missing from key', () => {
      const result = aws.formatArray(mockItems.feedsWithNull.slice(0, 1));
      return assert.deepEqual(result[0].PutRequest.Item.description, { NULL: true });
    });
  });

  describe('retrieves all items from the database', () => {
    it('retrieves 10 items from the database when 10 have been added', async () => {
      const add = await aws.populate(mockItems.feeds.slice(0, 10));
      const result = await aws.getAllTopics();
      assert.equal(result.length, 10);
      return assert.deepEqual(result, expected.getItemsTen);
    });

    it('retrieves 100 items from the database when 100 have been added', async () => {
      const add = await aws.populate(mockItems.feeds.slice(0, 100));
      const result = await aws.getAllTopics();
      assert.equal(result.length, 100);
      return assert.deepEqual(result, expected.getItemsHundred);
    });
  });

});
