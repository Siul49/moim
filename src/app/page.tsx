import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center gap-8">
        <section className="flex flex-col gap-5">
          <p className="text-sm font-medium text-muted-foreground">MOIM</p>
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
              링크 하나로 가능한 시간을 모으세요
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              로그인이나 캘린더 연동 없이도 모임을 만들고, 참여자 가능 시간을
              받아, 호스트가 겹치는 시간을 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/schedule/create" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                새 모임 만들기
              </Button>
            </Link>
            <a
              href="https://github.com/Siul49/moim"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full">
                GitHub 보기
              </Button>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
