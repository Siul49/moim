/**
 * 인증 레이아웃 — 로그인/회원가입 전용
 *
 * (auth) 괄호 그룹은 Next.js App Router에서 URL에 영향을 주지 않고
 * 레이아웃만 분리하는 기법이다.
 *
 * 예: /login 페이지는 GNB(상단 메뉴)가 필요 없으므로,
 * 루트 layout.tsx의 GNB를 상속받지 않고 이 레이아웃을 사용한다.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {children}
    </div>
  );
}
