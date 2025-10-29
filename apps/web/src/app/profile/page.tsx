"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getUser,
  updateUser,
} from "@/lib/api/userService";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { User, ProficiencyLevel, ProgrammingLanguage } from "@/lib/types";

function Profile() {
  const { logout, user: authUser, loading: userLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("Profile");
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState("/bro_profile.png");
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    username: "",
    display_name: "",
    description: "",
    programming_proficiency: ProficiencyLevel.BEGINNER,
    preferred_language: ProgrammingLanguage.CPP,
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (userLoading) return;

      try {
        const userData = await getUser();
        setUser(userData);
        setFormData({
          username: userData.username,
          display_name: userData.display_name,
          description: userData.description,
          programming_proficiency: userData.programming_proficiency,
          preferred_language: userData.preferred_language,
        });
        setProfileImage(userData.avatar_url || "/bro_profile.png");
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, [userLoading]);

  const tabs = [
    { name: "Home", href: "/home" },
    { name: "Match", href: "/match" },
    { name: "Questions", href: "/questions" },
    { name: "Profile", href: "/profile" },
  ];

  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        const updatePayload: Partial<User> = {};
        if (formData.username) updatePayload.username = formData.username;
        if (formData.display_name) updatePayload.display_name = formData.display_name;
        if (formData.description !== undefined) updatePayload.description = formData.description;
        if (formData.programming_proficiency) updatePayload.programming_proficiency = formData.programming_proficiency;
        if (formData.preferred_language) updatePayload.preferred_language = formData.preferred_language;
        if (formData.avatar_url) updatePayload.avatar_url = formData.avatar_url;

        const updatedUser = await updateUser(updatePayload);
        console.log('User updated successfully:', updatedUser);
        setUser(updatedUser);
        // Update profile image from the saved user data
        setProfileImage(updatedUser.avatar_url || "/bro_profile.png");
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update user", error);
        alert(`Failed to save profile changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = document.createElement('img');
        img.onload = () => {
          // Create canvas to resize image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set max dimensions
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression (0.8 quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

          console.log('Original size:', file.size, 'bytes');
          console.log('Compressed size:', Math.round(compressedBase64.length * 0.75), 'bytes');

          setProfileImage(compressedBase64);
          // Update the avatar_url in the form data
          setFormData((prev) => ({
            ...prev,
            avatar_url: compressedBase64,
          }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCancelEdit = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        username: user.username,
        display_name: user.display_name,
        description: user.description,
        programming_proficiency: user.programming_proficiency,
        preferred_language: user.preferred_language,
      });
      setProfileImage(user.avatar_url || "/bro_profile.png");
    }
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#333232] relative overflow-hidden font-montserrat">
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
        <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-[#333232] border-b-2 border-dashed border-white/20">
        <div className="flex justify-between items-center px-6 md:px-12 py-9 max-w-[68rem] mx-auto">
          <div>
            <Link href="/home">
              <h1 className="font-mclaren text-white text-2xl md:text-3xl cursor-pointer hover:opacity-80 transition-opacity">
                PeerPrep
              </h1>
            </Link>
          </div>
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`font-montserrat font-medium text-sm transition-colors ${activeTab === tab.name
                  ? "text-white"
                  : "text-[#9e9e9e] hover:text-white"
                  }`}
                onClick={() => setActiveTab(tab.name)}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-12">
            {userLoading || !user ? (
              <>
                <div className="w-44 h-44 rounded-full bg-white/10 animate-pulse mb-8"></div>
                <div className="w-64 h-16 bg-white/10 rounded-full animate-pulse"></div>
              </>
            ) : (
              <>
                <div className="relative mb-8">
                  <div className={`w-44 h-44 rounded-full bg-profile-avatar flex items-center justify-center overflow-hidden border-4 ${isEditing ? 'border-blue-500' : 'border-profile-avatar'}`}>
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={176}
                      height={176}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  {isEditing && (
                    <button
                      onClick={handleImageClick}
                      className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors cursor-pointer"
                      title="Change profile picture"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {isEditing && (
                  <p className="text-sm text-blue-400 mb-4 text-center">
                    Click the edit icon to change your profile picture
                  </p>
                )}
                <h2 className="font-montserrat text-6xl font-semibold text-white text-center">
                  {formData.display_name}
                </h2>
              </>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Username */}
            <div>
              <label className="block text-white font-semibold text-sm mb-3">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                disabled={!isEditing}
                className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3.5 font-montserrat font-medium text-sm text-white focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email this is not editable */}
            <div>
              <label className="block text-white font-semibold text-sm mb-3">
                Email
              </label>
              <input
                type="email"
                // we can't edit email
                value={user?.email || ""}
                disabled // Email is not editable
                className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3.5 font-montserrat font-medium text-sm text-white focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-white font-semibold text-sm mb-3">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={!isEditing}
                className="w-full bg-transparent border-2 border-white/20 rounded-2xl px-6 py-3.5 font-montserrat font-medium text-sm text-white focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                rows={4}
              />
            </div>

            {/* Proficiency */}
            <div>
              <label className="block text-white font-semibold text-sm mb-3">
                Proficiency
              </label>
              <div className="relative">
                <select
                  value={formData.programming_proficiency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      programming_proficiency: e.target
                        .value as ProficiencyLevel,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full bg-transparent border-2 border-white/20 rounded-full pl-6 pr-12 py-3.5 font-montserrat font-medium text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="beginner" className="bg-[#333232] text-white">
                    Beginner
                  </option>
                  <option
                    value="intermediate"
                    className="bg-[#333232] text-white"
                  >
                    Intermediate
                  </option>
                  <option value="advanced" className="bg-[#333232] text-white">
                    Advanced
                  </option>
                </select>
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path
                      d="M1 1L6 6L11 1"
                      stroke="#585858"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Programming Language */}
            <div>
              <label className="block text-white font-semibold text-sm mb-3">
                Preferred Language
              </label>
              <div className="relative">
                <select
                  value={formData.preferred_language}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_language: e.target.value as ProgrammingLanguage,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full bg-transparent border-2 border-white/20 rounded-full pl-6 pr-12 py-3.5 font-montserrat font-medium text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option
                    value={ProgrammingLanguage.CPP}
                    className="bg-[#333232] text-white"
                  >
                    Cpp
                  </option>
                  <option
                    value={ProgrammingLanguage.JAVA}
                    className="bg-[#333232] text-white"
                  >
                    Java
                  </option>
                  <option
                    value={ProgrammingLanguage.JAVASCRIPT}
                    className="bg-[#333232] text-white"
                  >
                    JavaScript
                  </option>
                  <option
                    value={ProgrammingLanguage.PYTHON}
                    className="bg-[#333232] text-white"
                  >
                    Python
                  </option>
                </select>
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path
                      d="M1 1L6 6L11 1"
                      stroke="#585858"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => router.push('/profile/stats')}
              className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-white hover:from-[#22c55e] hover:to-[#16a34a] px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-all hover:scale-105"
            >
              View My Stats
            </button>

            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="bg-green-500 text-white hover:bg-green-600 px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-600 text-white hover:bg-gray-700 px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="bg-white text-[#1e1e1e] hover:bg-gray-100 px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="border-2 border-white/40 text-white hover:bg-white/10 px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(Profile);
