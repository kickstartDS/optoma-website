import { DeepPartial } from "../helpers";
import { PrompterProps } from "./PrompterProps";

const defaults: DeepPartial<PrompterProps> = {
  "includeStory": true,
  "useIdea": true,
  "relatedStories": [],
  "systemPrompt": "You are a helpful assistant that generates high-quality website content based on the provided context and user instructions. Ensure the content is engaging, relevant, and well-structured."
};

export default defaults;