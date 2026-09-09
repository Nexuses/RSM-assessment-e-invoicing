import Image from "next/image";

export const RSM_LOGO_URL =
  "https://cdn-nexlink.s3.us-east-2.amazonaws.com/rsm-international-vector-logo_2-removebg-preview_5f53785d-2f5c-421e-a976-6388f78a00f2.png";

type Props = {
  title: string;
  subtitle?: string;
  size?: "default" | "compact";
};

export function SubmissionsPageHeader({ title, subtitle, size = "default" }: Props) {
  const logoHeight = size === "compact" ? "h-8" : "h-9 sm:h-10";
  const titleClass =
    size === "compact" ? "text-2xl font-semibold text-[#1b3a57]" : "text-3xl font-semibold text-[#1b3a57]";

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <Image
        src={RSM_LOGO_URL}
        alt="RSM"
        width={120}
        height={40}
        className={`${logoHeight} w-auto shrink-0 object-contain`}
        priority
      />
      <div className="border-l border-slate-200 pl-3 sm:pl-4">
        <h1 className={titleClass}>{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
    </div>
  );
}
