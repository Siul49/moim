"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export type TermsKey =
  | "isAgeOver14"
  | "termsAgreed"
  | "privacyAgreed"
  | "marketingAgreed"
  | "eventSmsAgreed";

interface TermsModalProps {
  termsKey: TermsKey;
  onClose: () => void;
}

const TERMS_DATA: Record<TermsKey, { title: string; content: string }> = {
  isAgeOver14: {
    title: "만 14세 이상 이용 약관",
    content: `본 서비스는 정보통신망 이용촉진 및 정보보호 등에 관한 법률에 의거하여 만 14세 미만 아동의 회원가입을 제한하고 있습니다. 가입자는 자신이 만 14세 이상임을 보증하며, 이를 위반할 시 가입 및 서비스 이용이 제한될 수 있습니다.`,
  },
  termsAgreed: {
    title: "MOIM 서비스 이용약관",
    content: `제 1 조 (목적)
본 약관은 MOIM(이하 '서비스')이 제공하는 온라인 일정 조율 및 모임 개설 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.

제 2 조 (용어의 정의)
1. '회원'이라 함은 서비스에 접속하여 본 약관에 동의하고 가입 절차를 마친 이용자를 의미합니다.
2. '일정 잡기'라 함은 회원이 모임을 생성하고 다른 참여자들의 가용 시간을 입력받아 일정을 확정하는 기능입니다.

제 3 조 (약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.
2. 서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경된 약관은 적용일자 7일 전부터 게시합니다.`,
  },
  privacyAgreed: {
    title: "개인정보 수집 및 이용 동의",
    content: `MOIM 서비스는 원활한 회원 가입 및 서비스 제공을 위해 아래와 같이 최소한의 개인정보를 수집 및 이용합니다.

1. 수집하는 개인정보 항목
- 필수 항목: 이메일 주소, 닉네임, 비밀번호, 전화번호
- 소셜 로그인 시: 소셜 플랫폼 계정 식별 고유키, 이메일, 닉네임, 프로필 이미지 URL

2. 개인정보 수집 및 이용 목적
- 서비스 가입 의사 확인 및 본인 식별
- 일정 생성 및 참여 연동 (iCloud, Google 등 외부 캘린더 연동 목적)
- 불량 회원의 부정 이용 방지와 비인가 사용 방지

3. 개인정보 보유 및 이용 기간
- 회원의 개인정보는 회원 탈퇴 시 즉시 지체 없이 파기합니다.
- 단, 관련 법령의 규정에 의하여 보존할 필요가 있는 경우 해당 법령이 정한 기간 동안 보관합니다.`,
  },
  marketingAgreed: {
    title: "개인정보 마케팅 활용 동의",
    content: `본 동의는 선택 사항이며 동의하지 않으셔도 가입 및 서비스 이용이 가능합니다.

1. 수집/이용 목적
- MOIM 서비스의 신규 기능 안내, 서비스 개선을 위한 설문조사, 맞춤형 혜택 정보 제공

2. 수집하는 항목
- 이메일 주소, 전화번호, 닉네임

3. 보유 및 이용 기간
- 동의 철회(회원 탈퇴) 시 또는 동의 목적 달성 시까지 보관합니다.`,
  },
  eventSmsAgreed: {
    title: "이벤트, 쿠폰 및 SMS 수신 동의",
    content: `본 동의는 선택 사항이며 동의하지 않으셔도 가입 및 서비스 이용이 가능합니다.

1. 수집/이용 목적
- 서비스의 혜택 정보, 이벤트 소식, 할인 쿠폰 정보 등을 SMS, 알림톡, 푸시 알림 형태로 전송하기 위함입니다.

2. 보유 및 이용 기간
- 동의 철회(수신 거부 설정) 시 또는 회원 탈퇴 시까지 보관합니다.`,
  },
};

export function TermsModal({ termsKey, onClose }: TermsModalProps) {
  const data = TERMS_DATA[termsKey];

  useEffect(() => {
    // 모달 오픈 시 배경 스크롤 방지
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      {/* 아웃사이드 클릭 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-[500px] rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-[#eee8f4] pb-4">
          <h2 className="text-xl font-extrabold text-[#222026]">
            {data.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#aaa5ad] hover:bg-[#fbf7ff] hover:text-[#6252ac]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4 max-h-[300px] overflow-y-auto whitespace-pre-wrap pr-2 text-base leading-7 text-[#504b55]">
          {data.content}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-xl bg-[#8f7bd6] font-bold text-white shadow-[0_4px_12px_rgba(98,82,172,0.15)] hover:bg-[#7d68c9]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
