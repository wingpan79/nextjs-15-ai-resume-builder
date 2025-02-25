"use server";

//import openai from "@/lib/openai";
import { canUseAITools } from "@/lib/permissions";
import { getUserSubscriptionLevel } from "@/lib/subscription";
import model from "@/lib/gemini";
import {
  GenerateSummaryInput,
  generateSummarySchema,
  GenerateWorkExperienceInput,
  generateWorkExperienceSchema,
  generateReviewSchema,
  GenerateReviewInput,
  WorkExperience,
  GeneralInfoValues
} from "@/lib/validation";
import { auth } from "@clerk/nextjs/server";

export async function generateSummary(input: GenerateSummaryInput) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const subscriptionLevel = await getUserSubscriptionLevel(userId);

  if (!canUseAITools(subscriptionLevel)) {
    throw new Error("Upgrade your subscription to use this feature");
  }

  const { jobTitle,company,position,jobdesc, workExperiences, educations, skills } =
    generateSummarySchema.parse(input);

  const systemMessage = `
    You are a job resume generator AI. Your task is to write a professional introduction summary for a resume given the user's provided data.
    Only return the summary and do not include any other information in the response. Keep it concise and professional.
    Please generate a professional resume summary from this data:
    Current Job title: ${jobTitle || "N/A"}
    applying company: ${company || "N/A"}
    applying position: ${position || "N/A"}
    applying job requirement: ${jobdesc || "N/A"}
    Work experience:
    ${workExperiences
      ?.map(
        (exp) => `
        Position: ${exp.position || "N/A"} at ${exp.company || "N/A"} from ${exp.startDate || "N/A"} to ${exp.endDate || "Present"}

        Description:
        ${exp.description || "N/A"}
        `,
      )
      .join("\n\n")}
      Education:
    ${educations
      ?.map(
        (edu) => `
        Degree: ${edu.degree || "N/A"} at ${edu.school || "N/A"} from ${edu.startDate || "N/A"} to ${edu.endDate || "N/A"}
        `,
      )
      .join("\n\n")}
      Skills:
      ${skills}
    `;
  const completion = await model.generateContent(systemMessage);


  const aiResponse = completion.response.text();

  if (!aiResponse) {
    throw new Error("Failed to generate AI response");
  }

  return aiResponse;
}

export async function generateWorkExperience(
  //input: GenerateWorkExperienceInput,
  general_info: GeneralInfoValues,
  input: WorkExperience
) {
  
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }
  
  const subscriptionLevel = await getUserSubscriptionLevel(userId);

  if (!canUseAITools(subscriptionLevel)) {
    throw new Error("Upgrade your subscription to use this feature");
  }
  general_info.description = input.description?.trim()!="" ? input.description : "not provided";
  
  const { description,company,jobdesc,position } = generateWorkExperienceSchema.parse(general_info);
  const systemMessage = `
  You are a job resume generator AI. Your task is to generate a single work experience entry based on the user input.
  Only return the work experience and do not include any other information in the response.
  current Job title: ${input.position || "N/A"}  
  applying company: ${company || "N/A"}
  applying position: ${position || "N/A"}
  applying job requirement: ${jobdesc || "N/A"}
  Please provide a work experience entry from this description:
  ${description}
  Your response must adhere to the following structure. You can omit fields if they can't be inferred from the provided data, but don't add any new ones.
  Description: <an optimized description in bullet format, might be inferred from the job title>
  `;
  const completion = await model.generateContent(systemMessage);
  const aiResponse = completion.response.text();

  if (!aiResponse) {
    throw new Error("Failed to generate AI response");
  }
  return (aiResponse.match(/Description:([\s\S]*)/)?.[1] || "").trim();
}


export async function GenerateReview(input: GenerateReviewInput) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const subscriptionLevel = await getUserSubscriptionLevel(userId);

  if (!canUseAITools(subscriptionLevel)) {
    throw new Error("Upgrade your subscription to use this feature");
  }

  const { jobTitle,company,position,jobdesc, workExperiences, educations, skills } =
      generateReviewSchema.parse(input);

  const systemMessage = `
    You are a job resume review. Your task is to write a professional review for a resume given the user's provided data. 
    Keep it concise and professional. Please generate a professional resume review and ats score from this data:

    applying company: ${company || "N/A"}
    applying position: ${position || "N/A"}
    applying job requirement: ${jobdesc || "N/A"}
    current Job title: ${jobTitle || "N/A"}
    Work experience:
    ${workExperiences
      ?.map(
        (exp) => `
        Position: ${exp.position || "N/A"} at ${exp.company || "N/A"} from ${exp.startDate || "N/A"} to ${exp.endDate || "Present"}

        Description:
        ${exp.description || "N/A"}
        `,
      )
      .join("\n\n")}
      Education:
    ${educations
      ?.map(
        (edu) => `
        Degree: ${edu.degree || "N/A"} at ${edu.school || "N/A"} from ${edu.startDate || "N/A"} to ${edu.endDate || "N/A"}
        `,
      )
      .join("\n\n")}
      Skills:
      ${skills}
  Your response must adhere to the following structure. You can omit fields if they can't be inferred from the provided data, but don't add any new ones.
  Overall Assessment: <Overall Assessment>
  ATS Score: <a score between 0 and 100>
  Strengths: <an Strengths in bullet format>
  Areas for Improvement: <an optimized Areas for Improvement in bullet format>
  Recommendations: <an optimized Recommendations in bullet format>
  Rationale: <a rationale for the assessment>
  `;
  const completion = await model.generateContent(systemMessage);
  const aiResponse = completion.response.text();
  if (!aiResponse) {
    throw new Error("Failed to generate AI response");
  }
  return aiResponse;
}