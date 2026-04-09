import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // 요청 헤더에서 인증 정보 확인
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // 💡 [수정하는 곳] 아래 'myteam'과 'gantt1234!' 부분을 원하는 아이디/비밀번호로 바꾸세요.
    if (user === 'astronergy' && pwd === 'teamwork!!') {
      return NextResponse.next(); // 인증 성공 시 통과
    }
  }

  // 인증 정보가 없거나 틀리면 브라우저 기본 로그인 창을 띄움
  return new NextResponse('허용된 사용자만 접속할 수 있습니다.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// 이 보안 설정을 적용할 경로 (모든 페이지에 적용)
export const config = {
  matcher: '/:path*',
};