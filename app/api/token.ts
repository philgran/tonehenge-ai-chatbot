"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function getSessionToken() {
  const secret = await openai.realtime.clientSecrets.create({
    session: {
      type: "realtime",
      model: "gpt-realtime",   // or a dated variant
    },
  });
  // console.log("secret", secret);
  return secret.value;
}
