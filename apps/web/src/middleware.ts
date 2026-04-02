import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/dashboard") || pathname.startsWith("/lessons/new")) {
        const role = request.cookies.get("user-role")?.value;
        if (role !== "teacher") {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    if (pathname.startsWith("/learn")) {
        const role = request.cookies.get("user-role")?.value;
        if (role !== "student") {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/learn/:path*", "/lessons/:path*"],
};
