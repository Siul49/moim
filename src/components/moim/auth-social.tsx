export type AuthProviderType = "google" | "apple" | "kakao" | "naver";

const PROVIDER_LABEL: Record<AuthProviderType, string> = {
  google: "G",
  apple: "A",
  kakao: "talk",
  naver: "N",
};

const PROVIDER_CLASS: Record<AuthProviderType, string> = {
  google: "bg-white text-[#4285f4] border-[#ece6ef]",
  apple: "bg-white text-black border-[#ece6ef]",
  kakao: "bg-[#fee500] text-[#191919] border-[#fee500]",
  naver: "bg-[#03c75a] text-white border-[#03c75a]",
};

export function AuthProviderGlyph({ type }: { type: AuthProviderType }) {
  return (
    <span
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg font-extrabold ${PROVIDER_CLASS[type]}`}
    >
      {PROVIDER_LABEL[type]}
    </span>
  );
}
