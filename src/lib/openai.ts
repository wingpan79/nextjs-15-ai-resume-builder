import OpenAI from "openai";
import { env } from "@/env";

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: env.DEEPSEEK_API_KEY
});
export default openai;
