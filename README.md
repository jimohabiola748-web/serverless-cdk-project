# Serverless REST API — AWS CDK Project

A serverless REST API built with AWS CDK (TypeScript). It lets you
create, read, update, delete, and list "items" through API Gateway,
backed by a Lambda function and a DynamoDB table.

```
Client  ->  API Gateway  ->  Lambda (items.ts)  ->  DynamoDB (StudentItems)
```

## What's in this project

- `bin/serverless-cdk-project.ts` - the CDK app entry point.
- `lib/serverless-cdk-project-stack.ts` - defines all the AWS resources:
  the DynamoDB table, the Lambda function, the IAM permission grant,
  and the API Gateway routes.
- `lambda/items.ts` - the Lambda function code. One function handles
  all 5 operations, based on the HTTP method and whether an `id` was
  given in the URL.

## The routes

| Method | Path          | What it does            |
|--------|---------------|--------------------------|
| GET    | /items        | List all items           |
| POST   | /items        | Create a new item         |
| GET    | /items/{id}   | Get one item by id       |
| PUT    | /items/{id}   | Update one item by id    |
| DELETE | /items/{id}   | Delete one item by id    |

## How to run it

1. Install the dependencies:
   ```
   npm install
   ```

2. Make sure your AWS CLI is configured (same as before):
   ```
   aws sts get-caller-identity
   ```
   If that doesn't show your account info, run `aws configure` first.

3. Bootstrap your AWS account for CDK (only needed once per account/region):
   ```
   npx cdk bootstrap
   ```

4. Check the stack builds correctly (this just generates the CloudFormation
   template locally, it doesn't deploy anything yet):
   ```
   npx cdk synth
   ```

5. Deploy it for real:
   ```
   npx cdk deploy
   ```
   This will ask you to confirm the IAM changes it's about to make — type
   `y` and press Enter.

6. When it finishes, it prints an output called `ApiUrl`, something like:
   ```
   ServerlessCdkProjectStack.ApiUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/
   ```
   That's your live API base URL.

## Testing the API

You can test it with `curl` or Postman. Replace `<API_URL>` with the
URL from step 6.

**Create an item:**
```
curl -X POST <API_URL>items -H "Content-Type: application/json" -d "{\"id\": \"1001\", \"name\": \"AWS CDK\", \"description\": \"Infrastructure as Code\", \"category\": \"Cloud\"}"
```

**List all items:**
```
curl <API_URL>items
```

**Get one item:**
```
curl <API_URL>items/1001
```

**Update an item:**
```
curl -X PUT <API_URL>items/1001 -H "Content-Type: application/json" -d "{\"name\": \"AWS CDK Updated\", \"description\": \"Still IaC\", \"category\": \"Cloud\"}"
```

**Delete an item:**
```
curl -X DELETE <API_URL>items/1001
```

## Tearing it down

When you're done and don't need the resources anymore (so you don't
get charged for them):
```
npx cdk destroy
```
Because the table was created with `RemovalPolicy: DESTROY`, this
removes the DynamoDB table too, not just the API and Lambda.
