import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from 'path';

export class ServerlessCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ---------------------------------------------------------
    // 1. DynamoDB table
    // ---------------------------------------------------------
    const table = new dynamodb.Table(this, "StudentItemsTable", {
      tableName: "StudentItems",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // deletes the table when we run "cdk destroy"
    });

    // ---------------------------------------------------------
    // 2. Lambda function
    // NodejsFunction compiles/bundles our TypeScript file into the
    // plain JavaScript the Lambda runtime actually needs - a plain
    // lambda.Function pointed at a .ts file would fail at runtime.
    // ---------------------------------------------------------
    const itemsFunction = new NodejsFunction(this, "ItemsFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.X86_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      entry: path.join(__dirname, "../lambda/items.ts"),
      handler: "handler", // the exported function name inside items.ts
      bundling: {
        // By default the bundler leaves @aws-sdk/* packages out, assuming
        // the Lambda runtime already provides them. That assumption is
        // what was crashing our function at startup, so we force it to
        // package the SDK into our code instead of trusting the runtime.
        externalModules: [],
      },
      environment: {
        // the Lambda code reads this with process.env.TABLE_NAME
        TABLE_NAME: table.tableName,
      },
    });

    // ---------------------------------------------------------
    // 3. Give the Lambda permission to read and write the table.
    // Without this line, the Lambda would get an "Access Denied"
    // error the moment it tries to talk to DynamoDB.
    // ---------------------------------------------------------
    table.grantReadWriteData(itemsFunction);

    // ---------------------------------------------------------
    // 4. API Gateway REST API
    // ---------------------------------------------------------
    const api = new apigateway.RestApi(this, "ItemsApi", {
      restApiName: "Student Items Service",
    });

    // this connects every route below to the same Lambda function
    const itemsIntegration = new apigateway.LambdaIntegration(itemsFunction);

    // /items  ->  GET (list all), POST (create one)
    const items = api.root.addResource("items");
    items.addMethod("GET", itemsIntegration);
    items.addMethod("POST", itemsIntegration);

    // /items/{id}  ->  GET (one item), PUT (update), DELETE (remove)
    const singleItem = items.addResource("{id}");
    singleItem.addMethod("GET", itemsIntegration);
    singleItem.addMethod("PUT", itemsIntegration);
    singleItem.addMethod("DELETE", itemsIntegration);

    // ---------------------------------------------------------
    // Print the API URL after deployment, so we don't have to
    // go hunting for it in the AWS Console.
    // ---------------------------------------------------------
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
    });
  }
}
