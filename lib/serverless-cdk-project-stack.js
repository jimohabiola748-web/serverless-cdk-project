"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerlessCdkProjectStack = void 0;
const cdk = require("aws-cdk-lib");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const lambda = require("aws-cdk-lib/aws-lambda");
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const path = require("path");
class ServerlessCdkProjectStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // ---------------------------------------------------------
        // 1. DynamoDB table
        // ---------------------------------------------------------
        const table = new dynamodb.Table(this, "StudentItemsTable", {
            tableName: "StudentItems",
            partitionKey: {
                name: "id",
                type: dynamodb.AttributeType.STRING,
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
        const itemsFunction = new aws_lambda_nodejs_1.NodejsFunction(this, "ItemsFunction", {
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
exports.ServerlessCdkProjectStack = ServerlessCdkProjectStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVybGVzcy1jZGstcHJvamVjdC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlcnZlcmxlc3MtY2RrLXByb2plY3Qtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBRW5DLHFEQUFxRDtBQUNyRCxpREFBaUQ7QUFDakQscUVBQStEO0FBQy9ELHlEQUF5RDtBQUN6RCw2QkFBNkI7QUFFN0IsTUFBYSx5QkFBMEIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN0RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDREQUE0RDtRQUM1RCxvQkFBb0I7UUFDcEIsNERBQTREO1FBQzVELE1BQU0sS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDMUQsU0FBUyxFQUFFLGNBQWM7WUFDekIsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxJQUFJO2dCQUNWLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSw4Q0FBOEM7U0FDekYsQ0FBQyxDQUFDO1FBRUgsNERBQTREO1FBQzVELHFCQUFxQjtRQUNyQiwrREFBK0Q7UUFDL0QsK0RBQStEO1FBQy9ELCtEQUErRDtRQUMvRCw0REFBNEQ7UUFDNUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxrQ0FBYyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDOUQsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNO1lBQ3hDLFVBQVUsRUFBRSxHQUFHO1lBQ2YsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLENBQUM7WUFDakQsT0FBTyxFQUFFLFNBQVMsRUFBRSw2Q0FBNkM7WUFDakUsUUFBUSxFQUFFO2dCQUNSLGtFQUFrRTtnQkFDbEUsK0RBQStEO2dCQUMvRCwrREFBK0Q7Z0JBQy9ELGlFQUFpRTtnQkFDakUsZUFBZSxFQUFFLEVBQUU7YUFDcEI7WUFDRCxXQUFXLEVBQUU7Z0JBQ1gseURBQXlEO2dCQUN6RCxVQUFVLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDNUI7U0FDRixDQUFDLENBQUM7UUFFSCw0REFBNEQ7UUFDNUQsNkRBQTZEO1FBQzdELDZEQUE2RDtRQUM3RCxpREFBaUQ7UUFDakQsNERBQTREO1FBQzVELEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUV4Qyw0REFBNEQ7UUFDNUQsMEJBQTBCO1FBQzFCLDREQUE0RDtRQUM1RCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNuRCxXQUFXLEVBQUUsdUJBQXVCO1NBQ3JDLENBQUMsQ0FBQztRQUVILDhEQUE4RDtRQUM5RCxNQUFNLGdCQUFnQixHQUFHLElBQUksVUFBVSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRXpFLGdEQUFnRDtRQUNoRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFMUMsaUVBQWlFO1FBQ2pFLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0MsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUM5QyxVQUFVLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzlDLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFakQsNERBQTREO1FBQzVELDBEQUEwRDtRQUMxRCx3Q0FBd0M7UUFDeEMsNERBQTREO1FBQzVELElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ2hDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRztTQUNmLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQS9FRCw4REErRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSBcImF3cy1jZGstbGliL2F3cy1keW5hbW9kYlwiO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XG5pbXBvcnQgeyBOb2RlanNGdW5jdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhLW5vZGVqc1wiO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcblxuZXhwb3J0IGNsYXNzIFNlcnZlcmxlc3NDZGtQcm9qZWN0U3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyAxLiBEeW5hbW9EQiB0YWJsZVxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0IHRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsIFwiU3R1ZGVudEl0ZW1zVGFibGVcIiwge1xuICAgICAgdGFibGVOYW1lOiBcIlN0dWRlbnRJdGVtc1wiLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6IFwiaWRcIixcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksIC8vIGRlbGV0ZXMgdGhlIHRhYmxlIHdoZW4gd2UgcnVuIFwiY2RrIGRlc3Ryb3lcIlxuICAgIH0pO1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gMi4gTGFtYmRhIGZ1bmN0aW9uXG4gICAgLy8gTm9kZWpzRnVuY3Rpb24gY29tcGlsZXMvYnVuZGxlcyBvdXIgVHlwZVNjcmlwdCBmaWxlIGludG8gdGhlXG4gICAgLy8gcGxhaW4gSmF2YVNjcmlwdCB0aGUgTGFtYmRhIHJ1bnRpbWUgYWN0dWFsbHkgbmVlZHMgLSBhIHBsYWluXG4gICAgLy8gbGFtYmRhLkZ1bmN0aW9uIHBvaW50ZWQgYXQgYSAudHMgZmlsZSB3b3VsZCBmYWlsIGF0IHJ1bnRpbWUuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgY29uc3QgaXRlbXNGdW5jdGlvbiA9IG5ldyBOb2RlanNGdW5jdGlvbih0aGlzLCBcIkl0ZW1zRnVuY3Rpb25cIiwge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXG4gICAgICBhcmNoaXRlY3R1cmU6IGxhbWJkYS5BcmNoaXRlY3R1cmUuWDg2XzY0LFxuICAgICAgbWVtb3J5U2l6ZTogMjU2LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi4vbGFtYmRhL2l0ZW1zLnRzXCIpLFxuICAgICAgaGFuZGxlcjogXCJoYW5kbGVyXCIsIC8vIHRoZSBleHBvcnRlZCBmdW5jdGlvbiBuYW1lIGluc2lkZSBpdGVtcy50c1xuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgLy8gQnkgZGVmYXVsdCB0aGUgYnVuZGxlciBsZWF2ZXMgQGF3cy1zZGsvKiBwYWNrYWdlcyBvdXQsIGFzc3VtaW5nXG4gICAgICAgIC8vIHRoZSBMYW1iZGEgcnVudGltZSBhbHJlYWR5IHByb3ZpZGVzIHRoZW0uIFRoYXQgYXNzdW1wdGlvbiBpc1xuICAgICAgICAvLyB3aGF0IHdhcyBjcmFzaGluZyBvdXIgZnVuY3Rpb24gYXQgc3RhcnR1cCwgc28gd2UgZm9yY2UgaXQgdG9cbiAgICAgICAgLy8gcGFja2FnZSB0aGUgU0RLIGludG8gb3VyIGNvZGUgaW5zdGVhZCBvZiB0cnVzdGluZyB0aGUgcnVudGltZS5cbiAgICAgICAgZXh0ZXJuYWxNb2R1bGVzOiBbXSxcbiAgICAgIH0sXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAvLyB0aGUgTGFtYmRhIGNvZGUgcmVhZHMgdGhpcyB3aXRoIHByb2Nlc3MuZW52LlRBQkxFX05BTUVcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIDMuIEdpdmUgdGhlIExhbWJkYSBwZXJtaXNzaW9uIHRvIHJlYWQgYW5kIHdyaXRlIHRoZSB0YWJsZS5cbiAgICAvLyBXaXRob3V0IHRoaXMgbGluZSwgdGhlIExhbWJkYSB3b3VsZCBnZXQgYW4gXCJBY2Nlc3MgRGVuaWVkXCJcbiAgICAvLyBlcnJvciB0aGUgbW9tZW50IGl0IHRyaWVzIHRvIHRhbGsgdG8gRHluYW1vREIuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGl0ZW1zRnVuY3Rpb24pO1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gNC4gQVBJIEdhdGV3YXkgUkVTVCBBUElcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjb25zdCBhcGkgPSBuZXcgYXBpZ2F0ZXdheS5SZXN0QXBpKHRoaXMsIFwiSXRlbXNBcGlcIiwge1xuICAgICAgcmVzdEFwaU5hbWU6IFwiU3R1ZGVudCBJdGVtcyBTZXJ2aWNlXCIsXG4gICAgfSk7XG5cbiAgICAvLyB0aGlzIGNvbm5lY3RzIGV2ZXJ5IHJvdXRlIGJlbG93IHRvIHRoZSBzYW1lIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGl0ZW1zSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihpdGVtc0Z1bmN0aW9uKTtcblxuICAgIC8vIC9pdGVtcyAgLT4gIEdFVCAobGlzdCBhbGwpLCBQT1NUIChjcmVhdGUgb25lKVxuICAgIGNvbnN0IGl0ZW1zID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJpdGVtc1wiKTtcbiAgICBpdGVtcy5hZGRNZXRob2QoXCJHRVRcIiwgaXRlbXNJbnRlZ3JhdGlvbik7XG4gICAgaXRlbXMuYWRkTWV0aG9kKFwiUE9TVFwiLCBpdGVtc0ludGVncmF0aW9uKTtcblxuICAgIC8vIC9pdGVtcy97aWR9ICAtPiAgR0VUIChvbmUgaXRlbSksIFBVVCAodXBkYXRlKSwgREVMRVRFIChyZW1vdmUpXG4gICAgY29uc3Qgc2luZ2xlSXRlbSA9IGl0ZW1zLmFkZFJlc291cmNlKFwie2lkfVwiKTtcbiAgICBzaW5nbGVJdGVtLmFkZE1ldGhvZChcIkdFVFwiLCBpdGVtc0ludGVncmF0aW9uKTtcbiAgICBzaW5nbGVJdGVtLmFkZE1ldGhvZChcIlBVVFwiLCBpdGVtc0ludGVncmF0aW9uKTtcbiAgICBzaW5nbGVJdGVtLmFkZE1ldGhvZChcIkRFTEVURVwiLCBpdGVtc0ludGVncmF0aW9uKTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFByaW50IHRoZSBBUEkgVVJMIGFmdGVyIGRlcGxveW1lbnQsIHNvIHdlIGRvbid0IGhhdmUgdG9cbiAgICAvLyBnbyBodW50aW5nIGZvciBpdCBpbiB0aGUgQVdTIENvbnNvbGUuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJBcGlVcmxcIiwge1xuICAgICAgdmFsdWU6IGFwaS51cmwsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==