"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import {
  ProficiencyLevel,
  ProgrammingLanguage,
  updateUser,
} from "@/lib/api/user.service";

function Onboarding() {
  const router = useRouter();
  const { user, checkSession } = useAuth();
  const [activeTab, setActiveTab] = useState("Home");

  const [username, setUsername] = useState("");
  const [codingLanguage, setCodingLanguage] = useState<
    ProgrammingLanguage | ""
  >("");
  const [proficiency, setProficiency] = useState<ProficiencyLevel | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setProficiency(
        user.programming_proficiency
          ? ((user.programming_proficiency.charAt(0).toUpperCase() +
              user.programming_proficiency.slice(1)) as ProficiencyLevel)
          : ""
      );
    }
  }, [user]);

  const languages = ["CPP", "Java", "Python", "JavaScript"];
  const proficiencyLevels = ["Beginner", "Intermediate", "Advanced"];

  const tabs = [
    { name: "Home", href: "/home" },
    { name: "Match", href: "/match" },
    { name: "Questions", href: "/questions" },
    { name: "Profile", href: "/profile" },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !proficiency) {
      setError("Please fill out all required fields.");
      return;
    }
    try {
      await updateUser({
        username: username,
        preferred_language: codingLanguage.toLowerCase() as ProgrammingLanguage,
        programming_proficiency: proficiency.toLowerCase() as ProficiencyLevel,
      });
      await checkSession();
      router.push("/home");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      console.error("Failed to update profile:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#333232] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
          <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
          <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
        </div>

        <header className="fixed top-0 left-0 right-0 z-10 bg-[#333232] border-b-2 border-dashed border-white/20">
          <div className="flex justify-between items-center px-6 md:px-12 py-9 max-w-[68rem] mx-auto">
            <div>
              <h1 className="font-mclaren text-white text-2xl md:text-3xl">
                PeerPrep
              </h1>
            </div>
            <nav className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  className={`font-montserrat font-medium text-sm transition-colors ${
                    activeTab === tab.name ? "text-white" : "text-[#9e9e9e]"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="relative z-10 pt-44 pb-20 px-6 md:px-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <div className="flex-1">
                <h1 className="font-montserrat text-[54px] font-semibold text-white leading-[82%] mb-2">
                  Welcome back,
                </h1>
                <h2 className="font-montserrat text-[48px] font-medium text-white leading-[82%]">
                  {user?.display_name || "Unknown User"}{" "}
                  <span className="text-[40px]">👋🏻</span>
                </h2>
                <p className="font-montserrat text-xl text-white mt-6">
                  Ready to level up your skills today?
                </p>
              </div>
              <div className="ml-8">
                <Image
                  src="/bro_profile.png"
                  alt="Profile"
                  width={240}
                  height={240}
                  className="w-40 h-40 rounded-full object-cover"
                  unoptimized
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative bg-[#2d2d2d] rounded-3xl border border-white/10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
                  <Image
                    src="/liquid_green_purple.png"
                    alt="Liquid background"
                    width={400}
                    height={128}
                    className="w-full h-full object-cover object-left-top scale-150"
                    unoptimized
                  />
                </div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                  <Image
                    src="/bw_books.png"
                    alt="Books"
                    width={160}
                    height={160}
                    className="w-36 h-auto"
                    unoptimized
                  />
                </div>
                <div className="relative z-10 p-8 min-h-[320px] flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center pt-20">
                    <h3 className="font-montserrat text-2xl font-semibold text-white text-center mb-3 mt-12">
                      Browse
                      <br />
                      Questions
                    </h3>
                    <p className="font-montserrat text-sm text-[#9e9e9e] text-center mb-6">
                      Explore our
                      <br />
                      collection of
                      <br />
                      interview questions
                    </p>
                    <button className="glow-button secondary-glow bg-[#1e1e1e] text-white font-montserrat font-medium text-sm px-6 py-2.5 rounded-full">
                      Browse
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative bg-[#2d2d2d] rounded-3xl border border-white/10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
                  <Image
                    src="/liquid_green_purple.png"
                    alt="Liquid background"
                    width={400}
                    height={128}
                    className="w-full h-full object-cover object-center scale-125"
                    unoptimized
                  />
                </div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                  <Image
                    src="/bw_rocket.png"
                    alt="Rocket"
                    width={160}
                    height={160}
                    className="w-36 h-auto"
                    unoptimized
                  />
                </div>
                <div className="relative z-10 p-8 min-h-[320px] flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center pt-20">
                    <h3 className="font-montserrat text-2xl font-semibold text-white text-center mb-3 mt-12">
                      Start Practice
                      <br />
                      Session
                    </h3>
                    <p className="font-montserrat text-sm text-[#9e9e9e] text-center mb-6">
                      Get matched with
                      <br />a peer and solve
                      <br />
                      problems together
                    </p>
                    <button className="glow-button primary-glow bg-white text-[#1e1e1e] font-montserrat font-medium text-sm px-6 py-2.5 rounded-full">
                      Find Partner
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative bg-[#2d2d2d] rounded-3xl border border-white/10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
                  <Image
                    src="/liquid_green_purple.png"
                    alt="Liquid background"
                    width={400}
                    height={128}
                    className="w-full h-full object-cover object-right-top scale-110"
                    unoptimized
                  />
                </div>
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-20">
                  <Image
                    src="/bw_gear.png"
                    alt="Gear"
                    width={160}
                    height={160}
                    className="w-36 h-auto"
                    unoptimized
                  />
                </div>
                <div className="relative z-10 p-8 min-h-[320px] flex flex-col">
                  <div className="flex-1 flex flex-col items-center justify-center pt-20">
                    <h3 className="font-montserrat text-2xl font-semibold text-white text-center mb-3 mt-12">
                      Update
                      <br />
                      Your Info
                    </h3>
                    <p className="font-montserrat text-sm text-[#9e9e9e] text-center mb-6">
                      Configure your
                      <br />
                      personal profile
                      <br />
                      and preference
                    </p>
                    <button className="glow-button secondary-glow bg-[#1e1e1e] text-white font-montserrat font-medium text-sm px-6 py-2.5 rounded-full">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>

        <div className="relative bg-[#3d3d3d] rounded-[32px] w-full max-w-[900px] p-12 shadow-2xl">
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <Link href="/landing">
              <h1 className="font-mclaren text-[#9e9e9e] text-2xl cursor-pointer hover:text-white transition-colors">
                PeerPrep
              </h1>
            </Link>
          </div>

          <div className="text-center mt-8 mb-12">
            <h1 className="font-montserrat text-4xl font-semibold text-white mb-3">
              Thanks for joining us!
            </h1>
            <p className="font-montserrat text-base text-white">
              Tell us more about yourself
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="font-montserrat font-semibold text-white text-sm block mb-3">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3.5 font-montserrat font-medium text-sm text-white placeholder:text-[#585858] focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>

              <div>
                <label className="font-montserrat font-semibold text-white text-sm block mb-3">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || "Unknown Email"}
                    disabled
                    className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3.5 font-montserrat font-medium text-sm text-white cursor-not-allowed opacity-70"
                  />
                  <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                    <div className="w-5 h-5 bg-[#8a9ef4] rounded-full flex items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-montserrat font-semibold text-white text-sm block mb-3">
                  Prefer Coding Language
                </label>
                <div className="relative">
                  <select
                    value={codingLanguage}
                    onChange={(e) =>
                      setCodingLanguage(
                        e.target.value as ProgrammingLanguage | ""
                      )
                    }
                    required
                    className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3.5 font-montserrat font-medium text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors"
                    style={{
                      color: codingLanguage ? "white" : "#585858",
                    }}
                  >
                    <option value="" disabled>
                      Choose your favorite language
                    </option>
                    {languages.map((lang) => (
                      <option
                        key={lang}
                        value={lang}
                        className="bg-[#3d3d3d] text-white"
                      >
                        {lang}
                      </option>
                    ))}
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

              <div>
                <label className="font-montserrat font-semibold text-white text-sm block mb-3">
                  Proficiency
                </label>
                <div className="relative">
                  <select
                    value={proficiency}
                    onChange={(e) =>
                      setProficiency(e.target.value as ProficiencyLevel | "")
                    }
                    required
                    className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3.5 font-montserrat font-medium text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors"
                    style={{
                      color: proficiency ? "white" : "#585858",
                    }}
                  >
                    <option value="" disabled>
                      Choose your level of experience
                    </option>
                    {proficiencyLevels.map((level) => (
                      <option
                        key={level}
                        value={level}
                        className="bg-[#3d3d3d] text-white"
                      >
                        {level}
                      </option>
                    ))}
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

            {error && (
              <div className="text-red-400 text-center font-montserrat text-sm mb-4">
                {error}
              </div>
            )}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                className="bg-white hover:bg-gray-100 text-[#1e1e1e] font-montserrat font-medium text-sm px-10 py-3.5 rounded-full transition-all"
              >
                Get Started
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Onboarding);
