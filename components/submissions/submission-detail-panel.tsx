"use client";

type FormattedAnswer = {
  questionId: string;
  question: string;
  subject: string;
  answer: string;
};

type Props = {
  formattedAnswers: FormattedAnswer[];
  urgencyScore: number;
  urgencyCategory: string;
  complexityScore: number;
  complexityCategory: string;
  phone: string | null;
  website: string | null;
};

export function SubmissionDetailPanel({
  formattedAnswers,
  urgencyScore,
  urgencyCategory,
  complexityScore,
  complexityCategory,
  phone,
  website,
}: Props) {
  return (
    <div className="border-t bg-slate-50 px-6 py-5">
      <div className="mb-4 flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Axis A (Urgency)</p>
          <p className="font-medium text-[#1b3a57]">
            {urgencyScore} — {urgencyCategory}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Axis B (Complexity)</p>
          <p className="font-medium text-[#1b3a57]">
            {complexityScore} — {complexityCategory}
          </p>
        </div>
        {phone ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Phone</p>
            <p className="font-medium text-[#1b3a57]">{phone}</p>
          </div>
        ) : null}
        {website ? (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Website</p>
            <p className="font-medium text-[#1b3a57]">{website}</p>
          </div>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {formattedAnswers.map((answer) => (
          <div key={answer.questionId} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#009CD9]">
              {answer.subject}
            </p>
            <p className="mt-2 font-medium text-[#1b3a57]">{answer.question}</p>
            <p className="mt-2 text-sm text-slate-600">{answer.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
