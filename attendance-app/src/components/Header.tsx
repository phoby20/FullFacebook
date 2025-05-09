"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";

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
      setUserName(decoded.userName);
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
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
        {/* 로고/앱 이름 */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-2xl font-bold tracking-tight hover:text-blue-200 transition-colors duration-300"
            aria-label="ダッシュボードへ"
            onClick={() => setIsMenuOpen(false)}
          >
            FullFace
          </Link>
          {isAuthenticated && (
            <span className="text-sm bg-blue-700 text-white px-3 py-1 rounded-full">
              ようこそ, {userName}先生
            </span>
          )}
        </div>

        {isAuthenticated && (
          <>
            {/* 데스크톱 네비게이션 */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/attendance"
                className="relative text-white hover:text-blue-200 transition-colors duration-300 group"
                aria-label="出席状況ページへ"
              >
                出席現状
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              {role === "superAdmin" && (
                <Link
                  href="/superadmin/assign"
                  className="relative text-white hover:text-blue-200 transition-colors duration-300 group"
                  aria-label="クラス設定ページへ"
                >
                  クラス設定
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
              {role === "master" && (
                <Link
                  href="/master/assign-organization"
                  className="relative text-white hover:text-blue-200 transition-colors duration-300 group"
                  aria-label="団体指定ページへ"
                >
                  団体指定
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
              {role === "superAdmin" && (
                <Link
                  href="/superadmin/assign-group"
                  className="relative text-white hover:text-blue-200 transition-colors duration-300 group"
                  aria-label="グループ指定ページへ"
                >
                  グループ指定
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r text-white px-4 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300"
                aria-label="ログアウト"
              >
                ログアウト
              </button>
            </nav>

            {/* 모바일 햄버거 메뉴 아이콘 */}
            <button
              className="md:hidden text-white text-4xl focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-md p-2"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? "✕" : "☰"}
            </button>
          </>
        )}
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {isMenuOpen && (
        <div className="md:hidden bg-white text-gray-800 mt-4 mx-4 rounded-xl shadow-xl animate-slide-in">
          <nav className="flex flex-col p-4 gap-4">
            <Link
              href="/attendance"
              className="text-center text-gray-800 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
              aria-label="出席状況ページへ"
            >
              出席現状
            </Link>
            {role === "superAdmin" && (
              <Link
                href="/superadmin/assign"
                className="text-center text-gray-800 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
                aria-label="クラス設定ページへ"
              >
                クラス設定
              </Link>
            )}
            {role === "master" && (
              <Link
                href="/master/assign-organization"
                className="text-center text-gray-800 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
                aria-label="団体指定ページへ"
              >
                団体指定
              </Link>
            )}
            {role === "superAdmin" && (
              <Link
                href="/superadmin/assign-group"
                className="text-center text-gray-800 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
                aria-label="グループ指定ページへ"
              >
                グループ指定
              </Link>
            )}
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="text-center text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors duration-200"
              aria-label="ログアウト"
            >
              ログアウト
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
