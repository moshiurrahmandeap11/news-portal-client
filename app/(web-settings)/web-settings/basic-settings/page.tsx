"use client";

import axiosInstance from "@/app/components/SharedItems/AxiosInstance/AxiosInstance";
import RichTextEditor from "@/app/components/SharedItems/RichTextEditor/RichTextEditor";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copyright,
  Eye,
  EyeOff,
  Facebook,
  FileJson,
  FileText,
  Globe,
  Hash,
  Image as ImageIcon,
  Instagram,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Palette,
  PenTool,
  Phone,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Twitter,
  Upload,
  User,
} from "lucide-react";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useState } from "react";

// ==================== Types ====================
interface BasicSettingsData {
  id?: number;
  site_name: string;
  tagline: string;
  logo_url: string;
  favicon_url: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  facebook_url: string;
  x_url: string;
  instagram_url: string;
  meta_description: string;
  meta_keywords: string;
  meta_author: string;
  google_analytics_id: string;
  copyright_text: string;
  maintenance_mode: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

type SectionKeys = "general" | "contact" | "social" | "seo" | "advanced";
type UploadType = "logo" | "favicon";

interface SectionProps {
  settings: BasicSettingsData;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleRichTextChange?: (content: string) => void;
  onFileUpload?: (file: File, type: UploadType) => Promise<void>;
  uploading?: { logo: boolean; favicon: boolean };
}

// ==================== Utility Functions ====================
const isErrorResponse = (error: unknown): error is ErrorResponse => {
  return typeof error === "object" && error !== null && "response" in error;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// ==================== Main Component ====================
const BasicSettings = () => {
  const [settings, setSettings] = useState<BasicSettingsData>({
    site_name: "",
    tagline: "",
    logo_url: "",
    favicon_url: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    facebook_url: "",
    x_url: "",
    instagram_url: "",
    meta_description: "",
    meta_keywords: "",
    meta_author: "",
    google_analytics_id: "",
    copyright_text: "",
    maintenance_mode: false,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [activeTab, setActiveTab] = useState<SectionKeys>("general");
  const [uploading, setUploading] = useState({ logo: false, favicon: false });
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<SectionKeys, boolean>
  >({
    general: true,
    contact: false,
    social: false,
    seo: false,
    advanced: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async (): Promise<void> => {
    try {
      setLoading(true);
      const response =
        await axiosInstance.get<ApiResponse<BasicSettingsData>>(
          "/basic-settings",
        );

      if (response.data.success && response.data.data) {
        setSettings(response.data.data);
      }
    } catch (err: unknown) {
      console.error("Error fetching settings:", err);

      if (isErrorResponse(err)) {
        setError(err.response?.data?.message || "Failed to load settings");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleRichTextChange = (content: string): void => {
    setSettings((prev) => ({
      ...prev,
      meta_description: content,
    }));
  };

  const handleFileUpload = async (
    file: File,
    type: UploadType,
  ): Promise<void> => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/x-icon",
    ];

    if (!validTypes.includes(file.type)) {
      setError(
        `Invalid file type. Please upload: ${validTypes.map((t) => t.split("/")[1]).join(", ")}`,
      );
      return;
    }

    const maxSize = type === "logo" ? 2 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(
        `File size too large. Maximum ${type === "logo" ? "2MB" : "1MB"} allowed.`,
      );
      return;
    }

    const formData = new FormData();
    formData.append(type, file);

    try {
      setUploading((prev) => ({ ...prev, [type]: true }));
      setError("");

      const response = await axiosInstance.post(
        `/basic-settings/${type}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        setSettings((prev) => ({
          ...prev,
          [`${type}_url`]: response.data.data[`${type}_url`],
        }));
        setSuccess(
          `${type === "logo" ? "Logo" : "Favicon"} uploaded successfully!`,
        );
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: unknown) {
      console.error(`${type} upload error:`, err);
      if (isErrorResponse(err)) {
        setError(err.response?.data?.message || `Failed to upload ${type}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`Failed to upload ${type}`);
      }
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleRemoveFile = (type: UploadType): void => {
    setSettings((prev) => ({
      ...prev,
      [`${type}_url`]: "",
    }));
  };

  const toggleSection = (section: SectionKeys): void => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = settings.id
        ? await axiosInstance.put<ApiResponse<BasicSettingsData>>(
            `/basic-settings/${settings.id}`,
            settings,
          )
        : await axiosInstance.post<ApiResponse<BasicSettingsData>>(
            "/basic-settings",
            settings,
          );

      if (response.data.success) {
        setSuccess("Settings saved successfully!");
        if (!settings.id && response.data.data) {
          setSettings(response.data.data);
        }
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: unknown) {
      console.error("Error saving settings:", err);

      if (isErrorResponse(err)) {
        setError(err.response?.data?.message || "Failed to save settings");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  const tabs: Array<{
    id: SectionKeys;
    name: string;
    icon: React.ElementType;
    color: string;
  }> = [
    { id: "general", name: "General", icon: Globe, color: "blue" },
    { id: "contact", name: "Contact", icon: Mail, color: "green" },
    { id: "social", name: "Social Media", icon: Facebook, color: "indigo" },
    { id: "seo", name: "SEO", icon: FileText, color: "purple" },
    { id: "advanced", name: "Advanced", icon: Settings, color: "orange" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black mt-22 bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        {/* Header with Glassmorphism */}
        <div className="mb-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Basic Settings
              </h1>
              <p className="mt-2 text-gray-600">
                Configure your website&apos;s basic information and preferences
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-2"
            >
              {previewMode ? <EyeOff size={18} /> : <Eye size={18} />}
              {previewMode ? "Edit Mode" : "Preview Mode"}
            </button>
          </div>
        </div>

        {/* Alert Messages with Animation */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-md flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl shadow-md flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit}>
          {/* Modern Tabs */}
          <div className="hidden sm:block mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 border border-white/20">
              <nav className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        isActive
                          ? `bg-${tab.color}-50 text-${tab.color}-600 shadow-sm`
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={18} />
                      {tab.name}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`w-1.5 h-1.5 rounded-full bg-${tab.color}-500`}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Mobile Accordion */}
          <div className="sm:hidden space-y-3 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isExpanded = expandedSections[tab.id];

              return (
                <motion.div
                  key={tab.id}
                  initial={false}
                  animate={{
                    backgroundColor: isExpanded ? "#ffffff" : "#f9fafb",
                  }}
                  className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(tab.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-${tab.color}-50`}>
                        <Icon size={18} className={`text-${tab.color}-600`} />
                      </div>
                      <span className="font-medium text-gray-900">
                        {tab.name}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-4 border-t border-gray-100"
                      >
                        {tab.id === "general" && (
                          <GeneralSection
                            settings={settings}
                            handleChange={handleChange}
                            onFileUpload={handleFileUpload}
                            uploading={uploading}
                          />
                        )}
                        {tab.id === "contact" && (
                          <ContactSection
                            settings={settings}
                            handleChange={handleChange}
                          />
                        )}
                        {tab.id === "social" && (
                          <SocialSection
                            settings={settings}
                            handleChange={handleChange}
                          />
                        )}
                        {tab.id === "seo" && (
                          <SEOSection
                            settings={settings}
                            handleChange={handleChange}
                            handleRichTextChange={handleRichTextChange}
                          />
                        )}
                        {tab.id === "advanced" && (
                          <AdvancedSection
                            settings={settings}
                            handleChange={handleChange}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop Tab Content */}
          <div className="hidden sm:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "general" && (
                  <GeneralSection
                    settings={settings}
                    handleChange={handleChange}
                    onFileUpload={handleFileUpload}
                    uploading={uploading}
                  />
                )}
                {activeTab === "contact" && (
                  <ContactSection
                    settings={settings}
                    handleChange={handleChange}
                  />
                )}
                {activeTab === "social" && (
                  <SocialSection
                    settings={settings}
                    handleChange={handleChange}
                  />
                )}
                {activeTab === "seo" && (
                  <SEOSection
                    settings={settings}
                    handleChange={handleChange}
                    handleRichTextChange={handleRichTextChange}
                  />
                )}
                {activeTab === "advanced" && (
                  <AdvancedSection
                    settings={settings}
                    handleChange={handleChange}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Save Button with Animation */}
          <motion.div
            className="mt-8 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              type="submit"
              disabled={saving}
              className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>Save Settings</span>
                  <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

// ==================== File Upload Component ====================
const FileUploadArea = ({
  type,
  currentUrl,
  onFileUpload,
  uploading,
  onRemove,
}: {
  type: UploadType;
  currentUrl: string;
  onFileUpload: (file: File, type: UploadType) => Promise<void>;
  uploading: boolean;
  onRemove?: () => void;
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);

  const handleDrag = (e: React.DragEvent, isDragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(isDragging);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      await onFileUpload(file, type);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      await onFileUpload(file, type);
    }
  };

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <ImageIcon size={16} className="text-blue-500" />
          {type === "logo" ? "Logo" : "Favicon"}
        </label>
        {currentUrl && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition"
          >
            <Trash2 size={14} />
            Remove
          </button>
        )}
      </div>

      {/* Preview with Animation */}
      <AnimatePresence>
        {(preview || currentUrl) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-32 h-32 rounded-xl border-2 border-gray-200 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-md"
          >
            <Image
              src={preview || currentUrl}
              alt={type}
              fill
              className="object-contain p-2"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Area */}
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
          dragActive
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
        onDragEnter={(e) => handleDrag(e, true)}
        onDragLeave={(e) => handleDrag(e, false)}
        onDragOver={(e) => handleDrag(e, true)}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <input
          type="file"
          id={`${type}-upload`}
          className="hidden"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml,image/x-icon"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        <label
          htmlFor={`${type}-upload`}
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <motion.div
            animate={dragActive ? { y: [0, -5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Upload
              className={`w-8 h-8 mb-2 ${dragActive ? "text-blue-500" : "text-gray-400"}`}
            />
          </motion.div>
          <span className="text-sm text-gray-600 text-center">
            <span className="font-semibold text-blue-600">Click to upload</span>{" "}
            or drag and drop
          </span>
          <span className="text-xs text-gray-500 mt-1">
            {type === "logo"
              ? "PNG, JPG, GIF, SVG up to 2MB"
              : "ICO, PNG, JPG, SVG up to 1MB"}
          </span>
        </label>

        {uploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}
      </motion.div>

      {/* URL Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Link2
            size={16}
            className="text-gray-400 group-hover:text-blue-500 transition"
          />
        </div>
        <input
          type="url"
          name={`${type}_url`}
          value={currentUrl}
          readOnly
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 group-hover:bg-white transition"
          placeholder={`Or enter ${type} URL`}
        />
      </div>
    </motion.div>
  );
};

// ==================== General Section ====================
const GeneralSection = ({
  settings,
  handleChange,
  onFileUpload,
  uploading,
}: SectionProps & {
  onFileUpload: (file: File, type: UploadType) => Promise<void>;
  uploading: { logo: boolean; favicon: boolean };
}) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
      <Palette size={20} className="text-blue-500" />
      General Information
    </h2>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Text Inputs */}
      <div className="space-y-4">
        <div className="group">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Globe size={16} className="text-blue-500" />
            Site Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="site_name"
            value={settings.site_name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition group-hover:border-gray-400"
            placeholder="My News Portal"
          />
        </div>

        <div className="group">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-500" />
            Tagline
          </label>
          <input
            type="text"
            name="tagline"
            value={settings.tagline}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition group-hover:border-gray-400"
            placeholder="Your Trusted News Source"
          />
        </div>
      </div>

      {/* Logo Upload */}
      <div>
        <FileUploadArea
          type="logo"
          currentUrl={settings.logo_url}
          onFileUpload={onFileUpload}
          uploading={uploading.logo}
          onRemove={() => {
            // Handle remove
          }}
        />
      </div>

      {/* Favicon Upload - Full Width */}
      <div className="lg:col-span-2">
        <FileUploadArea
          type="favicon"
          currentUrl={settings.favicon_url}
          onFileUpload={onFileUpload}
          uploading={uploading.favicon}
          onRemove={() => {
            // Handle remove
          }}
        />
      </div>
    </div>
  </motion.div>
);

// ==================== Contact Section ====================
const ContactSection = ({ settings, handleChange }: SectionProps) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
      <Mail size={20} className="text-green-500" />
      Contact Information
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Mail size={16} className="text-green-500" />
          Contact Email
        </label>
        <input
          type="email"
          name="contact_email"
          value={settings.contact_email}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition group-hover:border-gray-400"
          placeholder="info@newsportal.com"
        />
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Phone size={16} className="text-green-500" />
          Contact Phone
        </label>
        <input
          type="tel"
          name="contact_phone"
          value={settings.contact_phone}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition group-hover:border-gray-400"
          placeholder="+1 234 567 890"
        />
      </div>

      <div className="md:col-span-2 group">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-green-500" />
          Contact Address
        </label>
        <textarea
          name="contact_address"
          value={settings.contact_address}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition group-hover:border-gray-400"
          placeholder="123 News Street, Media City, NY 10001"
        />
      </div>
    </div>
  </motion.div>
);

// ==================== Social Section ====================
const SocialSection = ({ settings, handleChange }: SectionProps) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
      <Facebook size={20} className="text-indigo-500" />
      Social Media Links
    </h2>

    <div className="space-y-4">
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Facebook size={16} className="text-blue-600" />
            Facebook URL
          </div>
        </label>
        <input
          type="url"
          name="facebook_url"
          value={settings.facebook_url}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition group-hover:border-gray-400"
          placeholder="https://facebook.com/newsportal"
        />
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Twitter size={16} className="text-black" />X (Twitter) URL
          </div>
        </label>
        <input
          type="url"
          name="x_url"
          value={settings.x_url}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition group-hover:border-gray-400"
          placeholder="https://twitter.com/newsportal"
        />
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Instagram size={16} className="text-pink-600" />
            Instagram URL
          </div>
        </label>
        <input
          type="url"
          name="instagram_url"
          value={settings.instagram_url}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition group-hover:border-gray-400"
          placeholder="https://instagram.com/newsportal"
        />
      </div>
    </div>
  </motion.div>
);

// ==================== SEO Section with Rich Text Editor ====================
const SEOSection = ({
  settings,
  handleChange,
  handleRichTextChange,
}: SectionProps & { handleRichTextChange?: (content: string) => void }) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
      <FileText size={20} className="text-purple-500" />
      SEO Settings
    </h2>

    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <PenTool size={16} className="text-purple-500" />
          Meta Description (Rich Text)
        </label>
        <RichTextEditor
          value={settings.meta_description}
          onChange={handleRichTextChange || (() => {})}
          placeholder="Enter meta description with rich formatting..."
        />
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <FileJson size={12} />
          Recommended: 150-160 characters
        </p>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Hash size={16} className="text-purple-500" />
          Meta Keywords
        </label>
        <input
          type="text"
          name="meta_keywords"
          value={settings.meta_keywords}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition group-hover:border-gray-400"
          placeholder="news, politics, technology, sports"
        />
        <p className="mt-1 text-xs text-gray-500">Comma-separated keywords</p>
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <User size={16} className="text-purple-500" />
          Meta Author
        </label>
        <input
          type="text"
          name="meta_author"
          value={settings.meta_author}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition group-hover:border-gray-400"
          placeholder="News Portal Team"
        />
      </div>
    </div>
  </motion.div>
);

// ==================== Advanced Section ====================
const AdvancedSection = ({ settings, handleChange }: SectionProps) => (
  <motion.div
    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6 flex items-center gap-2">
      <Settings size={20} className="text-orange-500" />
      Advanced Settings
    </h2>

    <div className="space-y-4">
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Activity size={16} className="text-orange-500" />
          Google Analytics ID
        </label>
        <input
          type="text"
          name="google_analytics_id"
          value={settings.google_analytics_id}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition group-hover:border-gray-400"
          placeholder="G-XXXXXXXXXX"
        />
      </div>

      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Copyright size={16} className="text-orange-500" />
          Copyright Text
        </label>
        <input
          type="text"
          name="copyright_text"
          value={settings.copyright_text}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition group-hover:border-gray-400"
          placeholder="© 2024 News Portal. All rights reserved."
        />
      </div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
        <input
          type="checkbox"
          name="maintenance_mode"
          id="maintenance_mode"
          checked={settings.maintenance_mode}
          onChange={handleChange}
          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
        />
        <label
          htmlFor="maintenance_mode"
          className="text-sm font-medium text-gray-700"
        >
          Enable Maintenance Mode
        </label>
      </div>
      <p className="text-xs text-gray-500 ml-7">
        When enabled, only administrators can access the website
      </p>
    </div>
  </motion.div>
);

// ==================== Animation Components ====================
const motion = {
  div: (props: any) => <div {...props} />,
};

const AnimatePresence = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export default BasicSettings;
