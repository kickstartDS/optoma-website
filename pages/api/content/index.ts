import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import { OpenAI } from "openai";

class ApplicationError extends Error {
  constructor(message: string, public data: unknown = {}) {
    super(message);
  }
}

class UserError extends ApplicationError {}

const cors = Cors({
  methods: ["POST"],
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runMiddleware(req, res, cors);

  const openAiKey = process.env.NEXT_OPENAI_API_KEY;

  try {
    // if (req.method === "OPTIONS") {
    //   return new Response("ok", { headers: corsHeaders });
    // }

    if (!openAiKey) {
      throw new ApplicationError(
        "Missing environment variable NEXT_OPEN_AI_KEY"
      );
    }

    const { system, prompt, schema } = JSON.parse(req.body);

    if (!system) throw new UserError("system is required");
    if (!prompt) throw new UserError("prompt is required");
    if (!schema) throw new UserError("schema is required");

    const client = new OpenAI({ apiKey: openAiKey });
    console.log("before result");
    const result = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: system,
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
      model: "gpt-4o-2024-08-06",
    });
    console.log("after result", JSON.stringify(result));

    res.status(200).send({ content: result.choices[0].message.content });
  } catch (err: unknown) {
    if (err instanceof UserError) {
      console.warn("UserError", err);

      res.status(500).send({
        error: err.message,
        data: err.data,
      });
    } else if (err instanceof ApplicationError) {
      console.error(`${err.message}: ${JSON.stringify(err.data)}`);
    } else {
      console.error(err);
    }

    res.status(500).send({
      error: "There was an error processing your request",
    });
  }
}
