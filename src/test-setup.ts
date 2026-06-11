// test-setup.ts
// 모든 테스트 파일 실행 전에 자동으로 로드되는 전역 설정
//
// @testing-library/jest-dom은 DOM 요소에 대한 커스텀 매칭 함수를 제공한다.
// 예: expect(element).toBeInTheDocument()
//      expect(element).toHaveTextContent('hello')
//
// Python으로 비유하면 conftest.py에서 공통 fixture를 설정하는 것과 같다.
import "@testing-library/jest-dom";
