"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import Link from "next/link";
import Image from "next/image";
import { User } from "@/type/user";

type DecodedToken = {
  userId: string;
  exp: number;
  iat: number;
};

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleAddChild = () => router.push("/child/add");

  useEffect(() => {
    const fetchUser = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        setError("로그인이 필요합니다");
        router.push("/login");
        return;
      }

      try {
        const decoded: DecodedToken = jwtDecode(token);
        const userId = decoded.userId;
        const res = await fetch(`/api/users/${userId}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("ユーザーデータの取得に失敗しました");
        }
        const userData: User = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("認証エラー:", err);
        setError("認証에 실패했습니다");
        router.push("/login");
      }
    };

    fetchUser();
  }, [router]);

  // 데스크톱 풀다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (err) {
      console.error("ログアウト失敗", err);
      alert("ログアウトに失敗しました");
    }
  };

  const handleMypage = () => {
    if (user) {
      router.push(`/users/${user.id}/edit`);
      setIsProfileMenuOpen(false);
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsProfileMenuOpen(false); // 모바일 메뉴 토글 시 프로필 메뉴 닫기
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    setIsMenuOpen(false); // 데스크톱 프로필 메뉴 토글 시 모바일 메뉴 닫기
  };

  if (error) {
    return <p className="p-4 text-red-500">{error}</p>;
  }

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex justify-between items-center">
        {/* 로고/앱 이름 */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-2xl font-bold tracking-tight hover:text-blue-200 transition-colors duration-300"
            aria-label="ダッシュボードへ"
            onClick={() => {
              setIsMenuOpen(false);
              setIsProfileMenuOpen(false);
            }}
          >
            FullFace
          </Link>
          {isAuthenticated && user && (
            <span className="text-sm bg-blue-700 text-white px-3 py-1 rounded-full">
              ようこそ, {user.name}先生
            </span>
          )}
        </div>

        {isAuthenticated && user && (
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
              <Link
                href="/child/add"
                className="relative text-white hover:text-blue-200 transition-colors duration-300 group"
                aria-label="新規学生登録"
              >
                新規学生登録
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              {user.role === "superAdmin" && (
                <Link
                  href="/superadmin/assign"
                  className="relative text-white hover:text-blue-200 transition-colors duration-300 group"
                  aria-label="クラス設定ページへ"
                >
                  クラス設定
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
              {user.role === "master" && (
                <Link
                  href="/master/assign-organization"
                  className="relative text-white hover:text-blue-200 transition-colors duration-300 group"
                  aria-label="団体指定ページへ"
                >
                  団体指定
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
              {user.role === "superAdmin" && (
                <Link
                  href="/superadmin/assign-group"
                  className="relative text-white hover:text-blue-200 transition-colors duration-300 group"
                  aria-label="グループ指定ページへ"
                >
                  グループ指定
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-200 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
              {/* 데스크톱 프로필 메뉴 */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="cursor-pointer bg-gradient-to-r text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300"
                  aria-label="プロフィールメニュー"
                  aria-expanded={isProfileMenuOpen}
                >
                  <Image
                    width={8}
                    height={8}
                    src={user.photoPath || "/default_user.png"}
                    alt="person"
                    className="w-8 h-8 object-cover rounded-full"
                  />
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-xl z-10 animate-slide-in">
                    <button
                      onClick={handleMypage}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-600 rounded-t-xl transition-colors duration-200"
                      aria-label="マイページへ"
                    >
                      先生情報修正
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 rounded-b-xl transition-colors duration-200"
                      aria-label="ログアウト"
                    >
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
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
      {isMenuOpen && isAuthenticated && user && (
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
            {user.role === "superAdmin" && (
              <Link
                href="/superadmin/assign"
                className="text-center text-gray-800 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
                aria-label="クラス設定ページへ"
              >
                クラス設定
              </Link>
            )}
            {user.role === "master" && (
              <Link
                href="/master/assign-organization"
                className="text-center text-gray-800 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
                aria-label="団体指定ページへ"
              >
                団体指定
              </Link>
            )}
            {user.role === "superAdmin" && (
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
              onClick={handleMypage}
              className="text-center text-gray-800 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition-colors duration-200"
              aria-label="先生情報修正"
            >
              先生情報修正
            </button>
            <button
              onClick={handleAddChild}
              className="text-center text-gray-800 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition-colors duration-200"
              aria-label="新規学生登録"
            >
              新規学生登録
            </button>
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
