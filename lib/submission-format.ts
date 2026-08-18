import { questionsData } from "@/lib/questions";

export type SubmissionAnswer = {
  questionId: string;
  question: string;
  subject: string;
  answer: string;
};

export function formatAnswerValue(questionId: string, answerValue?: string): string {
  const question = questionsData.find((item) => item.id === questionId);

  if (!question) {
    return answerValue || "Not answered";
  }

  if (question.responseType === "yesno" || question.responseType === "select") {
    const answer = question.options?.find((option) => option.value === answerValue);
    return answer?.label || answerValue || "Not answered";
  }

  if (question.responseType === "ynlist") {
    try {
      const ynAnswers = JSON.parse(answerValue || "{}") as Record<string, string>;
      const formatted = Object.entries(ynAnswers)
        .map(([key, value]) => {
          const option = question.options?.find((item) => item.value === key);
          return `${option?.label || key}: ${value}`;
        })
        .join("; ");

      return formatted || "Not answered";
    } catch {
      return answerValue || "Not answered";
    }
  }

  if (question.responseType === "multiselect") {
    const selectedValues = (answerValue || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const formatted = selectedValues
      .map((value) => question.options?.find((item) => item.value === value)?.label || value)
      .join(", ");

    return formatted || "Not answered";
  }

  return answerValue || "Not answered";
}

export function formatSubmissionAnswers(
  answers: Record<string, string | null | undefined>,
): SubmissionAnswer[] {
  return questionsData.map((question) => ({
    questionId: question.id,
    question: question.text,
    subject: question.subject,
    answer: formatAnswerValue(question.id, answers[question.id] || undefined),
  }));
}
