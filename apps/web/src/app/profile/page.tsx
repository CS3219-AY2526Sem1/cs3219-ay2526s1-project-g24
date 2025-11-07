"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getUser, updateUser } from "@/lib/api/userService";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { User, ProficiencyLevel, ProgrammingLanguage } from "@/lib/types";

type EditableUserFields = {
  username: string;
  display_name: string;
  description: string;
  programming_proficiency: ProficiencyLevel;
  preferred_language: ProgrammingLanguage;
};

function Profile() {
  const { logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Profile");
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<EditableUserFields>({
    username: "",
    display_name: "",
    description: "",
    programming_proficiency: ProficiencyLevel.BEGINNER,
    preferred_language: ProgrammingLanguage.CPP,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser();
        setUser(userData);
        const name = userData.display_name || userData.username || userData.email?.split('@')[0] || "";
        setFormData({
          username: name,
          display_name: userData.display_name ?? "",
          description: userData.description ?? "",
          programming_proficiency: userData.programming_proficiency ?? ProficiencyLevel.BEGINNER,
          preferred_language: userData.preferred_language ?? ProgrammingLanguage.CPP,
        });
      } catch (error) {
        console.error("Failed to fetch user", error);
        // Handle error, e.g., redirect to login
      }
    };

    fetchUser();
  }, []);

  const tabs = [
    { name: "Home", href: "/home" },
    { name: "Match", href: "/match" },
    { name: "Questions", href: "/questions" },
    { name: "Profile", href: "/profile" },
  ];

  const avatarSrc = user?.avatar_url ?? "/bro_profile.png";

  const handleEditToggle = async () => {
    if (isEditing) {
      try {
        const updatedUser = await updateUser({
          // username is not editable - it's pulled from Google account
          display_name: formData.display_name,
          description: formData.description,
          programming_proficiency: formData.programming_proficiency,
          preferred_language: formData.preferred_language,
        });
        setUser(updatedUser);
        // Use display_name, username, or derive from email for the name field
        const name = updatedUser.display_name || updatedUser.username || updatedUser.email?.split('@')[0] || "";
        setFormData({
          username: name,
          display_name: updatedUser.display_name ?? "",
          description: updatedUser.description ?? "",
          programming_proficiency: updatedUser.programming_proficiency ?? ProficiencyLevel.BEGINNER,
          preferred_language: updatedUser.preferred_language ?? ProgrammingLanguage.CPP,
        });
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update user", error);
        alert(`Failed to save profile changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCancelEdit = () => {
    // Reset form data to original user data
    if (user) {
      // Use display_name, username, or derive from email for the name field
      const name = user.display_name || user.username || user.email?.split('@')[0] || "";
      setFormData({
        username: name,
        display_name: user.display_name ?? "",
        description: user.description ?? "",
        programming_proficiency: user.programming_proficiency ?? ProficiencyLevel.BEGINNER,
        preferred_language: user.preferred_language ?? ProgrammingLanguage.CPP,
      });
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
          {/* Profile Avatar and Name */}
          <div className="flex flex-col items-center mb-12">
            <div className="mb-8">
              <div className="w-44 h-44 rounded-full bg-profile-avatar flex items-center justify-center overflow-hidden border-4 border-profile-avatar">
                <Image
                  src={avatarSrc}
                  alt="Profile"
                  width={176}
                  height={176}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            </div>
            <h2 className="font-montserrat text-5xl md:text-6xl font-semibold text-white text-center">
              {formData.display_name || formData.username || "PeerPrep User"}
            </h2>
            <button
              onClick={() => router.push('/profile/stats')}
              className="mt-6 glow-button primary-glow bg-white text-[#1e1e1e] px-10 py-3 rounded-full font-montserrat font-medium transition-all hover:scale-105"
            >
              View My Stats
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Name (Username - Read-only, pulled from Google account) */}
            <div>
              <label className="block text-white font-semibold text-sm mb-3">
                Name
              </label>
              <input
                type="text"
                value={formData.username || "Loading..."}
                disabled // Name is always read-only (from Google account)
                className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3.5 font-montserrat font-medium text-sm text-white focus:outline-none focus:border-white/40 transition-colors cursor-not-allowed"
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
            <div className="flex flex-wrap justify-center gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="glow-button primary-glow bg-white text-[#1e1e1e] px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-all hover:scale-105"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="glow-button secondary-glow border border-white/30 text-white px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-all hover:bg-white/10 hover:scale-105"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="glow-button primary-glow bg-white text-[#1e1e1e] px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-all hover:scale-105"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="glow-button secondary-glow border border-white/30 text-white px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-all hover:bg-white/10 hover:scale-105"
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
