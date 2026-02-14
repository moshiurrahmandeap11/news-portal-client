"use client";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axiosInstance from "../../SharedItems/AxiosInstance/AxiosInstance";

const SignUp = () => {
  const router = useRouter();

  // State for form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user", // default role as user
  });

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    // Clear error when user starts typing
    setError("");
  };

  // Handle registration
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Password validation (minimum 6 characters)
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // API call - only sending required fields
      const response = await axiosInstance.post("/users/registration", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role, // "user" by default
      });

      if (response.data.success) {
        setSuccess("Registration successful! Redirecting to login...");

        // Clear form
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "user",
        });

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Registration failed");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }

      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-black flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Create Your Account
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

        <form onSubmit={handleRegistration} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              disabled={loading}
              required
            />
          </div>

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

          {/* Confirm Password */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition pr-10"
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-9 text-gray-500"
              disabled={loading}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Hidden role field - not needed in UI but we can show it's user */}
          <div className="text-xs text-gray-400">
            * You are registering as a regular user
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-2 rounded-lg font-medium transition ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/login")}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
