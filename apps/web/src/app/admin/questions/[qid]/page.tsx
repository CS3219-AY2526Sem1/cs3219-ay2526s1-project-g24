"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { withAdminAuth } from "@/components/withAuth";
import {
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getTopics,
    getCompanies,
    type TopicResponse,
    type CompanyResponse,
    type QuestionUpdateRequest,
} from "@/lib/api/questionService";

type FunctionArgument = { name: string; type: string };
type CodeTemplate = { language: string; template: string };

function EditQuestion() {
    const params = useParams();
    const router = useRouter();
    const questionId = parseInt(params.qid as string);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
    const [availableTopics, setAvailableTopics] = useState<TopicResponse[]>([]);
    const [availableCompanies, setAvailableCompanies] = useState<CompanyResponse[]>([]);
    const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
    const [functionName, setFunctionName] = useState("");
    const [functionArgs, setFunctionArgs] = useState<FunctionArgument[]>([{ name: "", type: "" }]);
    const [returnType, setReturnType] = useState("");
    const [codeTemplates, setCodeTemplates] = useState<CodeTemplate[]>([
        { language: "python", template: "" },
        { language: "javascript", template: "" },
        { language: "java", template: "" },
        { language: "cpp", template: "" },
    ]);
    const [constraints, setConstraints] = useState("");
    const [hints, setHints] = useState<string[]>([""]);
    const [timeLimits, setTimeLimits] = useState({ python: 5, javascript: 5, java: 10, cpp: 3 });
    const [memoryLimits, setMemoryLimits] = useState({ python: 64000, javascript: 64000, java: 128000, cpp: 32000 });

    // UI state
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Load question data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [question, topics, companies] = await Promise.all([
                    getQuestionById(questionId),
                    getTopics(),
                    getCompanies(),
                ]);

                setTitle(question.title);
                setDescription(question.description);
                setDifficulty(question.difficulty);
                setSelectedTopicIds(question.topics.map((t) => t.id));
                setSelectedCompanyIds(question.companies.map((c) => c.id));
                setFunctionName(question.function_signature.function_name);
                setFunctionArgs(question.function_signature.arguments.map((arg) => ({ name: arg.name, type: arg.type })));
                setReturnType(question.function_signature.return_type);
                
                const templates: CodeTemplate[] = Object.entries(question.code_templates).map(([lang, template]) => ({
                    language: lang,
                    template: template as string,
                }));
                const allLanguages = ["python", "javascript", "java", "cpp"];
                allLanguages.forEach((lang) => {
                    if (!templates.find((t) => t.language === lang)) {
                        templates.push({ language: lang, template: "" });
                    }
                });
                setCodeTemplates(templates.sort((a, b) => allLanguages.indexOf(a.language) - allLanguages.indexOf(b.language)));

                setConstraints(question.constraints || "");
                setHints(question.hints && question.hints.length > 0 ? question.hints : [""]);
                setTimeLimits(question.time_limit as any);
                setMemoryLimits(question.memory_limit as any);

                setAvailableTopics(topics);
                setAvailableCompanies(companies);
            } catch (err) {
                console.error("Failed to load question:", err);
                setError("Failed to load question");
            } finally {
                setLoadingData(false);
            }
        };

        if (questionId) {
            loadData();
        }
    }, [questionId]);

    // Helper functions
    const toggleTopic = (topicId: number) => setSelectedTopicIds((prev) => prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]);
    const toggleCompany = (companyId: number) => setSelectedCompanyIds((prev) => prev.includes(companyId) ? prev.filter((id) => id !== companyId) : [...prev, companyId]);
    const addFunctionArg = () => setFunctionArgs([...functionArgs, { name: "", type: "" }]);
    const removeFunctionArg = (index: number) => setFunctionArgs(functionArgs.filter((_, i) => i !== index));
    const updateFunctionArg = (index: number, field: keyof FunctionArgument, value: string) => {
        const updated = [...functionArgs];
        updated[index] = { ...updated[index], [field]: value };
        setFunctionArgs(updated);
    };
    const updateCodeTemplate = (language: string, template: string) => setCodeTemplates((prev) => prev.map((ct) => (ct.language === language ? { ...ct, template } : ct)));
    const addHint = () => setHints([...hints, ""]);
    const removeHint = (index: number) => setHints(hints.filter((_, i) => i !== index));
    const updateHint = (index: number, value: string) => {
        const updated = [...hints];
        updated[index] = value;
        setHints(updated);
    };

    const handleSave = async () => {
        setError(null);
        setLoading(true);

        try {
            const codeTemplatesObj: Record<string, string> = {};
            codeTemplates.forEach((ct) => {
                if (ct.template.trim()) {
                    codeTemplatesObj[ct.language] = ct.template;
                }
            });

            const hintsArray = hints.filter((h) => h.trim()).map((h) => h.trim());

            const questionData: QuestionUpdateRequest = {
                title: title.trim(),
                description: description.trim(),
                difficulty: difficulty as any,
                topic_ids: selectedTopicIds,
                company_ids: selectedCompanyIds,
                code_templates: codeTemplatesObj,
                function_signature: {
                    function_name: functionName.trim(),
                    arguments: functionArgs.filter((arg) => arg.name.trim() && arg.type.trim()),
                    return_type: returnType.trim(),
                },
                constraints: constraints.trim() || undefined,
                hints: hintsArray.length > 0 ? hintsArray : undefined,
                time_limit: timeLimits,
                memory_limit: memoryLimits,
            };

            await updateQuestion(questionId, questionData);
            router.push("/admin/questions");
        } catch (err) {
            console.error("Failed to update question:", err);
            setError(err instanceof Error ? err.message : "Failed to update question");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteQuestion(questionId);
            router.push("/admin/questions");
        } catch (err) {
            console.error("Failed to delete question:", err);
            setError("Failed to delete question");
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loadingData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-4 font-montserrat text-gray-600">Loading question...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
                <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300"></div>
                <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300"></div>
            </div>

            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-dashed border-gray-300">
                <div className="flex justify-between items-center px-6 md:px-12 py-9 max-w-[68rem] mx-auto">
                    <Link href="/admin">
                        <h1 className="font-mclaren text-black text-2xl md:text-3xl cursor-pointer hover:opacity-70 transition-opacity">
                            PeerPrep Admin
                        </h1>
                    </Link>
                    <nav className="flex gap-8">
                        <Link href="/admin" className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors">Dashboard</Link>
                        <Link href="/admin/questions" className="font-montserrat font-medium text-sm text-black">Questions</Link>
                        <Link href="/admin/users" className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors">Users</Link>
                        <Link href="/home" className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors">Exit Admin</Link>
                    </nav>
                </div>
            </header>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-2xl p-8 max-w-md mx-4">
                        <h3 className="font-montserrat text-xl font-semibold text-black mb-4">Delete Question?</h3>
                        <p className="font-montserrat text-gray-600 mb-6">
                            Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-black font-montserrat text-sm rounded-full transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-montserrat text-sm rounded-full transition-colors">
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="relative z-10 pt-44 pb-20 px-6 md:px-12">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <Link href="/admin/questions">
                                <button className="text-gray-500 hover:text-black transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            </Link>
                            <h1 className="font-montserrat text-4xl font-semibold text-black">Edit Question</h1>
                        </div>
                        <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-montserrat text-sm rounded-full transition-colors">
                            Delete
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="font-montserrat text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Question Title <span className="text-red-500">*</span></label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Two Sum" className="w-full bg-white border border-gray-300 rounded-full px-4 py-3 font-montserrat text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors" />
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Difficulty <span className="text-red-500">*</span></label>
                            <div className="flex gap-3 mb-6">
                                {(["easy", "medium", "hard"] as const).map((level) => (
                                    <button key={level} onClick={() => setDifficulty(level)} className={`px-6 py-2 font-montserrat text-sm rounded-full transition-colors capitalize ${difficulty === level ? "bg-[#DCC8FE] text-black font-medium" : "bg-white text-black hover:bg-gray-200"}`}>
                                        {level}
                                    </button>
                                ))}
                            </div>

                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Topics <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {availableTopics.map((topic) => (
                                    <button key={topic.id} onClick={() => toggleTopic(topic.id)} className={`px-4 py-2 font-montserrat text-xs rounded-full transition-colors ${selectedTopicIds.includes(topic.id) ? "bg-[#DCC8FE] text-black font-medium" : "bg-white text-gray-600 hover:bg-gray-200"}`}>
                                        {topic.name}
                                    </button>
                                ))}
                            </div>

                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Companies (Optional)</label>
                            <div className="flex flex-wrap gap-2">
                                {availableCompanies.map((company) => (
                                    <button key={company.id} onClick={() => toggleCompany(company.id)} className={`px-4 py-2 font-montserrat text-xs rounded-full transition-colors ${selectedCompanyIds.includes(company.id) ? "bg-[#DCC8FE] text-black font-medium" : "bg-white text-gray-600 hover:bg-gray-200"}`}>
                                        {company.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Problem Description <span className="text-red-500">*</span></label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide a detailed description..." rows={12} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors resize-none" />
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-4">Function Signature <span className="text-red-500">*</span></label>
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-montserrat text-gray-600 text-xs mb-2">Function Name</label>
                                    <input type="text" value={functionName} onChange={(e) => setFunctionName(e.target.value)} placeholder="e.g., twoSum" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-montserrat text-gray-600 text-xs">Arguments</label>
                                        <button onClick={addFunctionArg} className="px-3 py-1 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat text-xs rounded-full transition-colors">+ Add</button>
                                    </div>
                                    <div className="space-y-2">
                                        {functionArgs.map((arg, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input type="text" value={arg.name} onChange={(e) => updateFunctionArg(index, "name", e.target.value)} placeholder="Name" className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]" />
                                                <input type="text" value={arg.type} onChange={(e) => updateFunctionArg(index, "type", e.target.value)} placeholder="Type" className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]" />
                                                {functionArgs.length > 1 && (<button onClick={() => removeFunctionArg(index)} className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 font-montserrat text-xs rounded-lg transition-colors">Remove</button>)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-montserrat text-gray-600 text-xs mb-2">Return Type</label>
                                    <input type="text" value={returnType} onChange={(e) => setReturnType(e.target.value)} placeholder="e.g., int[]" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-4">Code Templates <span className="text-red-500">*</span></label>
                            <div className="space-y-4">
                                {codeTemplates.map((ct) => (
                                    <div key={ct.language}>
                                        <label className="block font-montserrat text-gray-600 text-xs mb-2 capitalize">{ct.language}</label>
                                        <textarea value={ct.template} onChange={(e) => updateCodeTemplate(ct.language, e.target.value)} placeholder={`Enter starter code for ${ct.language}...`} rows={6} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] resize-none" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Constraints (Optional)</label>
                            <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="e.g.,&#10;* 2 <= nums.length <= 10^4" rows={5} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] resize-none" />
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <label className="font-montserrat text-black text-sm font-medium">Hints (Optional)</label>
                                <button onClick={addHint} className="px-4 py-2 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat text-xs rounded-full transition-colors">+ Add Hint</button>
                            </div>
                            <div className="space-y-2">
                                {hints.map((hint, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input type="text" value={hint} onChange={(e) => updateHint(index, e.target.value)} placeholder={`Hint ${index + 1}`} className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]" />
                                        {hints.length > 1 && (<button onClick={() => removeHint(index)} className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 font-montserrat text-xs rounded-lg transition-colors">Remove</button>)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-4">Execution Limits</label>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block font-montserrat text-gray-600 text-xs mb-3">Time Limits (seconds)</label>
                                    <div className="space-y-2">
                                        {Object.entries(timeLimits).map(([lang, value]) => (
                                            <div key={lang} className="flex items-center gap-3">
                                                <span className="font-mono text-sm text-gray-600 w-20 capitalize">{lang}:</span>
                                                <input type="number" value={value} onChange={(e) => setTimeLimits({ ...timeLimits, [lang]: parseInt(e.target.value) || 0 })} min="1" className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-black focus:outline-none focus:border-[#DCC8FE]" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-montserrat text-gray-600 text-xs mb-3">Memory Limits (KB)</label>
                                    <div className="space-y-2">
                                        {Object.entries(memoryLimits).map(([lang, value]) => (
                                            <div key={lang} className="flex items-center gap-3">
                                                <span className="font-mono text-sm text-gray-600 w-20 capitalize">{lang}:</span>
                                                <input type="number" value={value} onChange={(e) => setMemoryLimits({ ...memoryLimits, [lang]: parseInt(e.target.value) || 0 })} min="1000" step="1000" className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-black focus:outline-none focus:border-[#DCC8FE]" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end pt-4">
                            <Link href="/admin/questions">
                                <button disabled={loading} className="px-8 py-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-montserrat text-sm rounded-full transition-colors">
                                    Cancel
                                </button>
                            </Link>
                            <button onClick={handleSave} disabled={loading} className="px-8 py-3 bg-[#DCC8FE] hover:bg-[#d4b8f7] disabled:opacity-50 disabled:cursor-not-allowed text-black font-montserrat font-medium text-sm rounded-full transition-colors flex items-center gap-2">
                                {loading && (<div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>)}
                                {loading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAdminAuth(EditQuestion);
