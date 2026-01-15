import { NextApiRequest, NextApiResponse } from "next";
import StoryblokClient from "storyblok-js-client";
import Cors from "cors";

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

      const Storyblok = new StoryblokClient({
        oauthToken: process.env.NEXT_STORYBLOK_OAUTH_TOKEN,
      });

      const storyResponse = await Storyblok.get(
        `spaces/${process.env.NEXT_STORYBLOK_SPACE_ID}/stories/${storyUid}`
      );
      const story = storyResponse.data.story;

      const prompterIndex = story.content.section.findIndex(
        (section: any) => section._uid === prompterUid
      );
      story.content.section.splice(prompterIndex, 1, ...page.content.section);

      const response = await Storyblok.put(
        `spaces/${process.env.NEXT_STORYBLOK_SPACE_ID}/stories/${storyUid}`,
        {
          story,
          publish: 0, // TODO TBD
        }
      );

      res.status(200).send({ response });
    } catch (err) {
      res.status(500).send({ error: "failed", err });
    }
  } else {
    return res.status(405).send({ error: "method not allowed" });
  }
}
