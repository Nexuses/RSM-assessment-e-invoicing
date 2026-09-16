import dynamic from "next/dynamic";
import Image from "next/image";

const CybersecurityAssessmentForm = dynamic(
  () =>
    import("@/components/cybersecurity-assessment-form").then(
      (mod) => mod.CybersecurityAssessmentForm,
    ),
  { ssr: false },
);

export default function Page() {
  return (
    <main className="overflow-x-hidden">
      <CybersecurityAssessmentForm />
    </main>
  );
}
