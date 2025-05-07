"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

// JWT 토큰 디코딩 타입
type DecodedToken = {
  userId: string;
  userName: string;
  role: "master" | "superAdmin" | "admin" | "child";
  exp: number;
  iat: number;
};

export default function Header() {
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const decoded: DecodedToken = jwtDecode(token);
      setRole(decoded.role);
      setUserName(decoded.userName); // 이름 저장
      setIsAuthenticated(true);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("ログアウト失敗", err);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-gray-600 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* 로고/앱 이름 */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold">
            FullFace
          </Link>
          {isAuthenticated && (
            <span className="text-sm text-gray-200">
              ようこそ, {userName}先生
            </span>
          )}
        </div>

        {isAuthenticated && (
          <>
            {/* 데스크톱 네비게이션 */}
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/attendance"
                className="hover:text-gray-200 transition-colors"
              >
                出席現状
              </Link>
              {role === "superAdmin" && (
                <Link
                  href="/superadmin/assign"
                  className="hover:text-blue-200 transition-colors"
                >
                  クラス設定
                </Link>
              )}
              {role === "master" && (
                <Link
                  href="/master/assign-organization"
                  className="hover:text-blue-200 transition-colors"
                >
                  団体指定
                </Link>
              )}
              {role === "superAdmin" && (
                <Link
                  href="/superadmin/assign-group"
                  className="hover:text-blue-200 transition-colors"
                >
                  グループ指定
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
              >
                ログアウト
              </button>
            </nav>

            {/* 모바일 햄버거 메뉴 아이콘 */}
            <button
              className="md:hidden text-white text-2xl focus:outline-none"
              onClick={toggleMenu}
              aria-label="메뉴 열기/닫기"
            >
              ☰
            </button>
          </>
        )}
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-700 text-white mt-10 rounded-md shadow-lg">
          <nav className="flex flex-col p-4 gap-2">
            {role === "superAdmin" && (
              <Link
                href="/superadmin/assign"
                className="hover:text-blue-200 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                クラス設定
              </Link>
            )}
            {role === "master" && (
              <Link
                href="/master/assign-organization"
                className="hover:text-blue-200 transition-colors"
              >
                団体指定
              </Link>
            )}
            {role === "superAdmin" && (
              <Link
                href="/superadmin/assign-group"
                className="hover:text-blue-200 transition-colors"
              >
                グループ指定
              </Link>
            )}
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="text-center hover:text-blue-200 transition-colors"
            >
              ログアウト
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
