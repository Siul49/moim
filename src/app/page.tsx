import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-primary">
          MOIM
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          번거로운 일정 조율은 그만.
          <br className="sm:hidden" /> 링크 하나로 모두의 빈 시간을 찾아보세요.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
          <Link href="/schedule/create" className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-base">
              새로운 모임 만들기
            </Button>
          </Link>
          <a
            href="https://github.com/Siul49/moim"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button variant="outline" size="lg" className="w-full text-base">
              GitHub 보기
            </Button>
          </a>
        </div>
      </main>

      <footer className="absolute bottom-8 text-sm text-muted-foreground flex gap-4">
        <span>© 2026 MOIM. All rights reserved.</span>
      </footer>
    </div>
  );
}
