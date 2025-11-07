"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DifficultyTag from "@/components/DifficultyTag";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { getDailyQuestion, QuestionDetail } from "@/lib/api/questionService";

function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Home");
  const UNKNOWN_USER = "Unknown User";
  const [displayName, setDisplayName] = useState(UNKNOWN_USER);
  const { user } = useAuth();
  const [dailyChallenge, setDailyChallenge] = useState<QuestionDetail | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);

  useEffect(() => {
    setDisplayName(user?.display_name || UNKNOWN_USER);
  }, [user]);

  // Fetch daily challenge
  useEffect(() => {
    const fetchDailyChallenge = async () => {
      try {
        const challenge = await getDailyQuestion();
        setDailyChallenge(challenge);
      } catch (err) {
        console.error('Failed to load daily challenge:', err);
      } finally {
        setLoadingDaily(false);
      }
    };

    fetchDailyChallenge();
  }, []);

  const tabs = [
    { name: "Home", href: "/home" },
    { name: "Match", href: "/match" },
    { name: "Questions", href: "/questions" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-[#333232] relative overflow-hidden">
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

      <main className="relative z-10 pt-44 pb-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div className="flex-1">
              <h1 className="font-montserrat text-[54px] font-semibold text-white leading-[82%] mb-2">
                Welcome back,
              </h1>
              <h2 className="font-montserrat text-[48px] font-medium text-white leading-[82%]">
                {displayName}! <span className="text-[40px]">👋🏻</span>
              </h2>
              <p className="font-montserrat text-xl text-white mt-6">
                Ready to level up your skills today?
              </p>
            </div>
            <div className="ml-8">
              <Image
                src={user?.avatar_url || "/bro_profile.png"}
                alt="Profile"
                width={240}
                height={240}
                className="w-40 h-40 rounded-full object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Daily Challenge Card */}
          {!loadingDaily && dailyChallenge && (
            <div className="mb-8 relative bg-[#2d2d2d] rounded-3xl border border-white/10 overflow-hidden">
              {/* Thin gradient mask on the left */}
              <div className="absolute top-0 left-0 bottom-0 w-3 overflow-hidden">
                <Image
                  src="/liquid_green_purple.png"
                  alt="Liquid background"
                  width={12}
                  height={400}
                  className="w-full h-full object-cover object-left"
                  unoptimized
                />
              </div>

              <div className="relative z-10 p-8 flex items-center justify-between gap-6">
                {/* Left side - Content */}
                <div className="flex-1 min-w-0 pl-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🔥</span>
                    <h2 className="font-montserrat text-2xl font-semibold text-white">Daily Challenge</h2>
                  </div>
                  <h3 className="font-montserrat text-lg font-semibold text-white mb-3 pr-4 break-words">
                    {dailyChallenge.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <DifficultyTag difficulty={dailyChallenge.difficulty} />
                    <span className="text-[#9e9e9e] text-sm font-montserrat">
                      {dailyChallenge.topics.map(t => t.name).join(' • ')}
                    </span>
                  </div>
                </div>

                {/* Right side - Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => router.push(`/practice/${dailyChallenge.id}`)}
                    className="bg-[#fb923c] hover:bg-[#f97316] text-white font-montserrat font-semibold px-8 py-3 rounded-full transition-all hover:scale-105 whitespace-nowrap"
                  >
                    Start Challenge →
                  </button>
                </div>
              </div>
            </div>
          )}

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
                  <Link href="/questions">
                    <button className="glow-button secondary-glow bg-[#1e1e1e] hover:bg-black hover:scale-105 text-white font-montserrat font-medium text-sm px-6 py-2.5 rounded-full transition-all">
                      Browse
                    </button>
                  </Link>
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
                  <Link href="/match">
                    <button className="glow-button primary-glow bg-white hover:bg-gray-100 hover:scale-105 text-[#1e1e1e] font-montserrat font-medium text-sm px-6 py-2.5 rounded-full transition-all">
                      Find Partner
                    </button>
                  </Link>
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
                  <Link href="/profile">
                    <button className="glow-button secondary-glow bg-[#1e1e1e] hover:bg-black hover:scale-105 text-white font-montserrat font-medium text-sm px-6 py-2.5 rounded-full transition-all">
                      Edit
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(Home);

