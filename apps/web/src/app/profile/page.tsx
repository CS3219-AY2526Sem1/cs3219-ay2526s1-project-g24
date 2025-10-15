"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Profile() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState("Profile");
    const [isEditing, setIsEditing] = useState(false);
    const [profileImage, setProfileImage] = useState("/bro_profile.png");
    const [formData, setFormData] = useState({
        fullName: 'Cliff Hänger',
        email: 'cliffhanger9696@gmail.com',
        language: 'Python',
        proficiency: 'Intermediate Level'
    });

    const tabs = [
        { name: "Home", href: "/home" },
        { name: "Match", href: "/match" },
        { name: "Questions", href: "/questions" },
        { name: "Profile", href: "/profile" },
    ];

    const handleEditToggle = () => {
        if (isEditing) {
            console.log('Saving profile data:', formData);
        }
        setIsEditing(!isEditing);
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            console.log('Image file selected:', file.name);
        }
    };

    const handleLogout = () => {
        console.log('Logging out...');
        router.push('/landing');
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
                        <div className="relative mb-8">
                            <div className="w-44 h-44 rounded-full bg-[#F1FCAC] flex items-center justify-center overflow-hidden border-4 border-[#F1FCAC]">
                                <Image
                                    src={profileImage}
                                    alt="Profile"
                                    width={176}
                                    height={176}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            </div>
                            <button
                                onClick={handleImageClick}
                                className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>
                        <h2 className="font-montserrat text-6xl font-semibold text-white text-center">
                            {formData.fullName}
                        </h2>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {/* Full Name */}
                        <div>
                            <label className="block text-white font-semibold text-sm mb-3">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                disabled={!isEditing}
                                className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3.5 font-montserrat font-medium text-sm text-white focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-white font-semibold text-sm mb-3">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing}
                                className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3.5 font-montserrat font-medium text-sm text-white focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Prefer Coding Language */}
                        <div>
                            <label className="block text-white font-semibold text-sm mb-3">
                                Prefer Coding Language
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full bg-transparent border-2 border-white/20 rounded-full pl-6 pr-12 py-3.5 font-montserrat font-medium text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="Python" className="bg-[#333232] text-white">Python</option>
                                    <option value="JavaScript" className="bg-[#333232] text-white">JavaScript</option>
                                    <option value="Java" className="bg-[#333232] text-white">Java</option>
                                    <option value="C++" className="bg-[#333232] text-white">C++</option>
                                </select>
                                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                        <path d="M1 1L6 6L11 1" stroke="#585858" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Proficiency */}
                        <div>
                            <label className="block text-white font-semibold text-sm mb-3">
                                Proficiency
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.proficiency}
                                    onChange={(e) => setFormData({ ...formData, proficiency: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full bg-transparent border-2 border-white/20 rounded-full pl-6 pr-12 py-3.5 font-montserrat font-medium text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="Beginner" className="bg-[#333232] text-white">Beginner</option>
                                    <option value="Intermediate Level" className="bg-[#333232] text-white">Intermediate Level</option>
                                    <option value="Expert" className="bg-[#333232] text-white">Expert</option>
                                </select>
                                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                        <path d="M1 1L6 6L11 1" stroke="#585858" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={handleEditToggle}
                            className="bg-white text-[#1e1e1e] hover:bg-gray-100 px-12 py-3.5 text-base rounded-full font-montserrat font-medium transition-colors"
                        >
                            {isEditing ? 'Save' : 'Edit'}
                        </button>

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
