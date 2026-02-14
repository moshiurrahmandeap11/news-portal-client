"use client";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { useRouter } from "next/navigation";
import axiosInstance from "../../SharedItems/AxiosInstance/AxiosInstance";

interface ErrorResponse {
  success: boolean;
  message: string;
}

const SignIn = () => {
  const router = useRouter();

  // State for form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // State for loading and error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  // Type guard for error response
  const isErrorResponse = (error: unknown): error is ErrorResponse => {
    return (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    );
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.post("/users/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        setSuccess("Login successful! Redirecting...");

        // Save token and user data to localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Update axios default headers
        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${response.data.token}`;

        // Clear form
        setFormData({
          email: "",
          password: "",
        });

        // Redirect to dashboard or home page after 1.5 seconds
        setTimeout(() => {
          router.push("/"); // or "/"
        }, 1500);
      }
    } catch (err: unknown) {
      // Handle unknown error type properly
      if (err && typeof err === "object" && "response" in err) {
        const error = err as { response?: { data?: unknown } };

        if (
          error.response &&
          error.response.data &&
          isErrorResponse(error.response.data)
        ) {
          setError(error.response.data.message);
        } else {
          setError("Login failed. Please try again.");
        }
      } else if (err && typeof err === "object" && "request" in err) {
        setError("No response from server. Please check your connection.");
      } else {
        setError("An unexpected error occurred.");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-black flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Welcome Back
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              disabled={loading}
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-2 rounded-lg font-medium transition ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <span
              onClick={() => router.push("/signup")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Sign Up
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
