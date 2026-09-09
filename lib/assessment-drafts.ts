import { db } from "@/lib/db";

export const DRAFT_STATUS = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  OUT_OF_SCOPE: "out_of_scope",
} as const;

export type DraftStatus = (typeof DRAFT_STATUS)[keyof typeof DRAFT_STATUS];

type PersonalInfoInput = {
  name: string;
  email: string;
  company: string;
  position: string;
  phone?: string;
  website?: string;
};

/** Reuse a recent in-progress draft for the same email, otherwise create one. */
export async function createOrReuseDraft(personalInfo: PersonalInfoInput) {
  const email = personalInfo.email.trim().toLowerCase();
  const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existing = await db.assessmentDraft.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      status: DRAFT_STATUS.IN_PROGRESS,
      startedAt: { gte: recentCutoff },
    },
    orderBy: { startedAt: "desc" },
  });

  if (existing) {
    return db.assessmentDraft.update({
      where: { id: existing.id },
      data: {
        name: personalInfo.name,
        email: personalInfo.email.trim(),
        company: personalInfo.company,
        position: personalInfo.position,
        phone: personalInfo.phone || null,
        website: personalInfo.website || null,
      },
    });
  }

  return db.assessmentDraft.create({
    data: {
      name: personalInfo.name,
      email: personalInfo.email.trim(),
      company: personalInfo.company,
      position: personalInfo.position,
      phone: personalInfo.phone || null,
      website: personalInfo.website || null,
      answers: {},
      currentQuestion: 0,
      status: DRAFT_STATUS.IN_PROGRESS,
    },
  });
}

export async function updateDraftProgress(
  draftId: string,
  data: {
    answers?: Record<string, string>;
    currentQuestion?: number;
    status?: DraftStatus;
  },
) {
  return db.assessmentDraft.update({
    where: { id: draftId },
    data: {
      ...(data.answers !== undefined ? { answers: data.answers } : {}),
      ...(data.currentQuestion !== undefined
        ? { currentQuestion: data.currentQuestion }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });
}

export async function markDraftCompleted(draftId?: string | null, email?: string) {
  if (draftId) {
    try {
      return await db.assessmentDraft.update({
        where: { id: draftId },
        data: { status: DRAFT_STATUS.COMPLETED },
      });
    } catch (error) {
      console.error("Failed to mark draft completed by id:", draftId, error);
    }
  }

  if (email) {
    const open = await db.assessmentDraft.findFirst({
      where: {
        email: { equals: email.trim(), mode: "insensitive" },
        status: DRAFT_STATUS.IN_PROGRESS,
      },
      orderBy: { startedAt: "desc" },
    });
    if (open) {
      return db.assessmentDraft.update({
        where: { id: open.id },
        data: { status: DRAFT_STATUS.COMPLETED },
      });
    }
  }

  return null;
}
