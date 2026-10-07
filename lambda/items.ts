import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

// One Lambda function handles all 5 routes. We figure out which
// operation to run by looking at the HTTP method and whether an
// "id" was given in the URL.
export const handler = async (event: any) => {
  try {
    const method = event.httpMethod;
    const id = event.pathParameters ? event.pathParameters.id : null;

    // ---------------------------------------------------------
    // CREATE - POST /items
    // ---------------------------------------------------------
    if (method === "POST") {
      const body = JSON.parse(event.body || "{}");

      if (!body.id || !body.name) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "id and name are required" }),
        };
      }

      const item = {
        id: body.id,
        name: body.name,
        description: body.description || "",
        category: body.category || "",
      };

      await dynamodb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        })
      );

      return {
        statusCode: 201,
        body: JSON.stringify({ message: "Item created successfully", item }),
      };
    }

    // ---------------------------------------------------------
    // LIST ALL - GET /items   (no id in the URL)
    // ---------------------------------------------------------
    if (method === "GET" && !id) {
      const result = await dynamodb.send(
        new ScanCommand({ TableName: TABLE_NAME })
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.Items),
      };
    }

    // ---------------------------------------------------------
    // GET ONE - GET /items/{id}
    // ---------------------------------------------------------
    if (method === "GET" && id) {
      const result = await dynamodb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { id },
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Item not found" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
    }

    // ---------------------------------------------------------
    // UPDATE - PUT /items/{id}
    // ---------------------------------------------------------
    if (method === "PUT" && id) {
      const body = JSON.parse(event.body || "{}");

      // "name" is a reserved word in DynamoDB, so we alias it as #n
      await dynamodb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { id },
          UpdateExpression:
            "SET #n = :name, description = :description, category = :category",
          ExpressionAttributeNames: {
            "#n": "name",
          },
          ExpressionAttributeValues: {
            ":name": body.name || "",
            ":description": body.description || "",
            ":category": body.category || "",
          },
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Item updated successfully" }),
      };
    }

    // ---------------------------------------------------------
    // DELETE - DELETE /items/{id}
    // ---------------------------------------------------------
    if (method === "DELETE" && id) {
      await dynamodb.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { id },
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Item deleted successfully" }),
      };
    }

    // If none of the routes above matched, say so instead of crashing.
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Unsupported route or method" }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
