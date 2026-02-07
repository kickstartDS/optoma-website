import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import {
  createStoryblokClient,
  importByPrompterReplacement,
  ServiceError,
} from "@kickstartds/storyblok-services";

const cors = Cors({
  methods: ["POST"],
  origin: "*",
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
  if (req.method === "POST") {
    await runMiddleware(req, res, cors);

    try {
      const { storyUid, prompterUid, page } = JSON.parse(req.body);

      if (!storyUid)
        return res.status(400).send({ error: "storyUid is required" });
      if (!prompterUid)
        return res.status(400).send({ error: "prompterUid is required" });
      if (!page) return res.status(400).send({ error: "page is required" });

      const spaceId = process.env.NEXT_STORYBLOK_SPACE_ID;
      const oauthToken = process.env.NEXT_STORYBLOK_OAUTH_TOKEN;

      if (!spaceId || !oauthToken) {
        return res.status(500).send({
          error:
            "Missing Storyblok environment variables (NEXT_STORYBLOK_SPACE_ID, NEXT_STORYBLOK_OAUTH_TOKEN)",
        });
      }

      const client = createStoryblokClient({
        spaceId,
        apiToken: "",
        oauthToken,
      });

      const story = await importByPrompterReplacement(client, spaceId, {
        storyUid,
        prompterUid,
        sections: page.content.section,
        publish: false,
      });

      res.status(200).send({ response: { data: { story } } });
    } catch (err) {
      if (err instanceof ServiceError) {
        console.error(`ServiceError [${err.code}]: ${err.message}`);
        res.status(500).send({ error: err.message });
      } else {
        console.error(err);
        res.status(500).send({ error: "failed", err });
      }
    }
  } else {
    return res.status(405).send({ error: "method not allowed" });
  }
}
