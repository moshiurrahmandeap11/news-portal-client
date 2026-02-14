"use client";
import {
  BarChart3,
  BookOpen,
  Camera,
  ChevronDown,
  Globe,
  Heart,
  Home,
  LogOut,
  Menu,
  Newspaper,
  Search,
  Shield,
  TrendingUp,
  User,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance from "../AxiosInstance/AxiosInstance";

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface BasicSettings {
  site_name: string;
  logo_url: string;
  favicon_url: string;
  tagline?: string;
}

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [basicSettings, setBasicSettings] = useState<BasicSettings | null>(
    null,
  );

  // Fetch basic settings
  useEffect(() => {
    const fetchBasicSettings = async () => {
      try {
        const res = await axiosInstance.get("/basic-settings/public/info");
        if (res.data.success) {
          setBasicSettings(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching basic settings:", error);
      }
    };
    fetchBasicSettings();
  }, []);

  const router = useRouter();

  // Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setIsLoggedIn(true);
      setUser(parsedUser);
    }
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setShowUserMenu(false);
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Latest", href: "/latest", icon: Newspaper },
    { name: "World", href: "/world", icon: Globe },
    { name: "Trending", href: "/trending", icon: TrendingUp },
    { name: "Video", href: "/video", icon: Video },
    { name: "Photos", href: "/photos", icon: Camera },
  ];

  const categories = [
    "Politics",
    "Technology",
    "Business",
    "Sports",
    "Entertainment",
    "Health",
    "Science",
    "Education",
  ];

  // Admin menu items - simplified, only dashboard
  const adminMenuItems = [
    { name: "Dashboard", href: "/admin", icon: BarChart3 },
  ];

  // Regular user menu items - shown to all logged in users
  const userMenuItems = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Saved News", href: "/saved", icon: Heart },
    { name: "Reading List", href: "/reading-list", icon: BookOpen },
  ];

  // Get site name from basic settings or use default
  const siteName = basicSettings?.site_name || "NewsPortal";
  const logoUrl = basicSettings?.logo_url || "/news-logo.png";

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white shadow-lg py-2"
          : "bg-gradient-to-r from-blue-900 to-blue-800 py-4"
      }`}
    >
      {/* Top Bar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-white hover:text-blue-200 transition"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <Image
                  src={logoUrl}
                  alt={siteName}
                  fill
                  className="object-contain"
                />
              </div>
              <span
                className={`text-2xl font-bold ${
                  isScrolled ? "text-blue-900" : "text-white"
                }`}
              >
                {siteName.split(" ")[0]}
                <span className="text-orange-500">
                  {siteName.includes(" ") ? siteName.split(" ")[1] : "Portal"}
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1 text-sm font-medium transition ${
                    isScrolled
                      ? "text-gray-700 hover:text-blue-600"
                      : "text-white hover:text-blue-200"
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Side - Search, User, etc. */}
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-full transition ${
                isScrolled
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-white hover:bg-blue-700"
              }`}
            >
              <Search size={20} />
            </button>

            {/* User Menu */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                    isScrolled
                      ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      : "bg-blue-700 text-white hover:bg-blue-600"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 border">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      {user?.role === "admin" && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                          <Shield size={10} />
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Regular User Menu Items - Always shown when logged in */}
                    <div className="py-1">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-blue-50 transition"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Icon size={16} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Admin Menu Items - Only Dashboard shown in header */}
                    {user?.role === "admin" && (
                      <>
                        <div className="border-t my-1"></div>
                        <div className="py-1">
                          {adminMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-purple-50 transition"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <Icon size={16} />
                                <span>{item.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Logout Button - Always shown */}
                    <div className="border-t my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition w-full text-left"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    isScrolled
                      ? "text-blue-600 hover:bg-blue-50"
                      : "text-white hover:bg-blue-700"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/auth/registration"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    isScrolled
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="hidden lg:block mt-3 pb-1 overflow-x-auto">
          <div className="flex items-center gap-4">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/category/${category.toLowerCase()}`}
                className={`text-sm whitespace-nowrap transition ${
                  isScrolled
                    ? "text-gray-600 hover:text-blue-600"
                    : "text-blue-100 hover:text-white"
                }`}
              >
                {category}
              </Link>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-4 animate-fadeIn">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for news, topics, or keywords..."
                className="w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search size={18} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 top-[73px] bg-white z-40 animate-slideDown">
          <div className="h-full overflow-y-auto pb-20">
            {/* User Info for Mobile - Only when logged in */}
            {isLoggedIn && user && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        <Shield size={10} />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Navigation */}
            <nav className="p-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              <hr className="my-4" />

              {/* Mobile Categories */}
              <h3 className="px-4 mb-2 text-sm font-semibold text-gray-500 uppercase">
                Categories
              </h3>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/category/${category.toLowerCase()}`}
                  className="block px-4 py-2 text-gray-600 hover:bg-blue-50 rounded-lg transition"
                  onClick={() => setIsOpen(false)}
                >
                  {category}
                </Link>
              ))}

              {/* Mobile Menu - User/Admin Items */}
              {isLoggedIn && (
                <>
                  <hr className="my-4" />
                  <h3 className="px-4 mb-2 text-sm font-semibold text-gray-500 uppercase">
                    My Account
                  </h3>

                  {/* Regular User Items */}
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition"
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon size={20} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}

                  {/* Admin Items - Only Dashboard for admin */}
                  {user?.role === "admin" && (
                    <>
                      <h3 className="px-4 mt-4 mb-2 text-sm font-semibold text-purple-600 uppercase">
                        Admin
                      </h3>
                      {adminMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-purple-50 rounded-lg transition"
                            onClick={() => setIsOpen(false)}
                          >
                            <Icon size={20} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </>
                  )}

                  {/* Logout Button in Mobile */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
