"use server";

import { canCreateResume, canUseCustomizations } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import { getUserSubscriptionLevel } from "@/lib/subscription";
import { resumeSchema, ResumeValues } from "@/lib/validation";
import { auth } from "@clerk/nextjs/server";
import { del, put } from "@vercel/blob";
import path from "path";

export async function saveResume(values: ResumeValues) {
  const { id } = values;

  console.log("received values", values);

  const { photo, workExperiences, educations, resumeReview, ...resumeValues } =
    resumeSchema.parse(values);

  
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscriptionLevel = await getUserSubscriptionLevel(userId);

  if (!id) {
    const resumeCount = await prisma.resume.count({ where: { userId } });

    if (!canCreateResume(subscriptionLevel, resumeCount)) {
      throw new Error(
        "Maximum resume count reached for this subscription level",
      );
    }
  }

  const existingResume = id
    ? await prisma.resume.findUnique({ where: { id, userId } })
    : null;

  if (id && !existingResume) {
    throw new Error("Resume not found");
  }

  const hasCustomizations =
    (resumeValues.borderStyle &&
      resumeValues.borderStyle !== existingResume?.borderStyle) ||
    (resumeValues.colorHex &&
      resumeValues.colorHex !== existingResume?.colorHex);

  if (hasCustomizations && !canUseCustomizations(subscriptionLevel)) {
    throw new Error("Customizations not allowed for this subscription level");
  }

  let newPhotoUrl: string | undefined | null = undefined;

  if (photo instanceof File) {
    if (existingResume?.photoUrl) {
      await del(existingResume.photoUrl);
    }

    const blob = await put(`resume_photos/${path.extname(photo.name)}`, photo, {
      access: "public",
    });

    newPhotoUrl = blob.url;
  } else if (photo === null) {
    if (existingResume?.photoUrl) {
      await del(existingResume.photoUrl);
    }
    newPhotoUrl = null;
  }
 
  if (id) {
    return prisma.resume.update({
      where: { id: id },
      data: {
        ...resumeValues,
        photoUrl: newPhotoUrl,
        workExperiences: {
          deleteMany: {},
          create: workExperiences?.map((exp) => ({
            ...exp,
            startDate: exp.startDate ? new Date(exp.startDate) : undefined,
            endDate: exp.endDate ? new Date(exp.endDate) : undefined,
          })),
        },
        educations: {
          deleteMany: {},
          create: educations?.map((edu) => ({
            ...edu,
            startDate: edu.startDate ? new Date(edu.startDate) : undefined,
            endDate: edu.endDate ? new Date(edu.endDate) : undefined,
          })),
        },
        resumeReview: {
          upsert: {
            // Used when no record exists - creates new record
            create: {
              atsScore: resumeReview?.atsScore ?? 0,
              overallAssessment: resumeReview?.overallAssessment,
              strengths: resumeReview?.strengths,
              areasForImprovement: resumeReview?.areasForImprovement,
              recommendations: resumeReview?.recommendations,
              rationale: resumeReview?.rationale,
            },
            // Used when record exists - updates existing record
            update: {
              atsScore: resumeReview?.atsScore ?? 0,
              overallAssessment: resumeReview?.overallAssessment,
              strengths: resumeReview?.strengths,
              areasForImprovement: resumeReview?.areasForImprovement,
              recommendations: resumeReview?.recommendations,
              rationale: resumeReview?.rationale,
            }
          },
        },
        updatedAt: new Date(),
      },
    });
  } else {
    return prisma.resume.create({
      data: {
        ...resumeValues,
        userId,
        photoUrl: newPhotoUrl,
        workExperiences: {
          create: workExperiences?.map((exp) => ({
            ...exp,
            startDate: exp.startDate ? new Date(exp.startDate) : undefined,
            endDate: exp.endDate ? new Date(exp.endDate) : undefined,
          })),
        },
        educations: {
          create: educations?.map((edu) => ({
            ...edu,
            startDate: edu.startDate ? new Date(edu.startDate) : undefined,
            endDate: edu.endDate ? new Date(edu.endDate) : undefined,
          })),
        },
        resumeReview: {
          create: resumeReview ? {
            atsScore: resumeReview?.atsScore ?? 0,
            overallAssessment: resumeReview?.overallAssessment || undefined,
            strengths: resumeReview?.strengths || undefined,
            areasForImprovement: resumeReview?.areasForImprovement || undefined,
            recommendations: resumeReview?.recommendations || undefined,
            rationale: resumeReview?.rationale || undefined
          } : undefined,
        },
      },
    });
  }
}
