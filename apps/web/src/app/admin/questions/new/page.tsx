// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated admin question creation page:
//   - Comprehensive question creation form with multiple sections
//   - Topic and company multi-select with checkboxes
//   - Function signature definition (name, arguments, return type)
//   - Code template editor for 4 languages (Python, JavaScript, Java, C++)
//   - Constraints and hints management (add/remove dynamic fields)
//   - Time/memory limits per language
//   - Test case creation with visibility levels (sample, public, private)
//   - Form validation and error handling
//   - API integration with createQuestion
//   - Redirect to questions list on success
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced form validation with detailed error messages
//   - Added better UX for dynamic field management

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { withAdminAuth } from "@/components/withAuth";
import {
    createQuestion,
    getTopics,
    getCompanies,
    type TopicResponse,
    type CompanyResponse,
    type QuestionCreateRequest,
    type TestCaseCreate,
} from "@/lib/api/questionService";

type FunctionArgument = { name: string; type: string };
type CodeTemplate = { language: string; template: string };

function CreateQuestion() {
    const router = useRouter();
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
    const [testCases, setTestCases] = useState<Array<{ input_data: string; expected_output: string; visibility: "sample" | "public" | "private"; explanation: string }>>([
        { input_data: "", expected_output: "", visibility: "sample", explanation: "" }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [topics, companies] = await Promise.all([getTopics(), getCompanies()]);
                setAvailableTopics(topics);
                setAvailableCompanies(companies);
            } catch (err) {
                console.error("Failed to load topics/companies:", err);
                setError("Failed to load topics and companies");
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, []);

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
    const addTestCase = () => setTestCases([...testCases, { input_data: "", expected_output: "", visibility: "private", explanation: "" }]);
    const removeTestCase = (index: number) => setTestCases(testCases.filter((_, i) => i !== index));
    const updateTestCase = (index: number, field: "input_data" | "expected_output" | "visibility" | "explanation", value: string) => {
        const updated = [...testCases];
        updated[index] = { ...updated[index], [field]: value };
        setTestCases(updated);
    };

    const validateForm = (): string | null => {
        if (!title.trim()) return "Title is required";
        if (!description.trim()) return "Description is required";
        if (selectedTopicIds.length === 0) return "Please select at least one topic";
        if (!functionName.trim()) return "Function name is required";
        if (functionArgs.some((arg) => !arg.name.trim() || !arg.type.trim())) return "All function arguments must have name and type";
        if (!returnType.trim()) return "Return type is required";
        const hasTemplate = codeTemplates.some((ct) => ct.template.trim());
        if (!hasTemplate) return "Please provide at least one code template";
        if (testCases.length === 0) return "Please add at least one test case";
        const hasSample = testCases.some((tc) => tc.visibility === "sample");
        if (!hasSample) return "Please add at least one sample test case";
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            if (!tc.input_data.trim() || !tc.expected_output.trim()) return `Test case ${i + 1}: Input data and expected output are required`;
            try {
                JSON.parse(tc.input_data);
                JSON.parse(tc.expected_output);
            } catch {
                return `Test case ${i + 1}: Input data and expected output must be valid JSON`;
            }
        }
        return null;
    };

    const handleSubmit = async () => {
        setError(null);
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        setLoading(true);
        try {
            const codeTemplatesObj: Record<string, string> = {};
            codeTemplates.forEach((ct) => { if (ct.template.trim()) codeTemplatesObj[ct.language] = ct.template; });
            const testCasesArray: TestCaseCreate[] = testCases.map((tc, index) => ({
                input_data: JSON.parse(tc.input_data),
                expected_output: JSON.parse(tc.expected_output),
                visibility: tc.visibility,
                order_index: index,
                explanation: tc.explanation.trim() || undefined,
            }));
            const hintsArray = hints.filter((h) => h.trim()).map((h) => h.trim());
            const questionData: QuestionCreateRequest = {
                title: title.trim(),
                description: description.trim(),
                difficulty,
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
                test_cases: testCasesArray,
            };
            await createQuestion(questionData);
            router.push("/admin/questions");
        } catch (err) {
            console.error("Failed to create question:", err);
            setError(err instanceof Error ? err.message : "Failed to create question");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-4 font-montserrat text-gray-600">Loading...</p>
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
                    <div><Link href="/admin"><h1 className="font-mclaren text-black text-2xl md:text-3xl cursor-pointer hover:opacity-70 transition-opacity">PeerPrep Admin</h1></Link></div>
                    <nav className="flex gap-8">
                        <Link href="/admin" className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors">Dashboard</Link>
                        <Link href="/admin/questions" className="font-montserrat font-medium text-sm text-black">Questions</Link>
                        <Link href="/admin/users" className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors">Users</Link>
                        <Link href="/home" className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors">Exit Admin</Link>
                    </nav>
                </div>
            </header>
            <main className="relative z-10 pt-44 pb-20 px-6 md:px-12">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="font-montserrat text-4xl font-semibold text-black">Create New Question</h1>
                        <Link href="/admin/questions"><button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-sm rounded-full transition-colors">Cancel</button></Link>
                    </div>
                    {error && (<div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"><p className="font-montserrat text-sm text-red-600">{error}</p></div>)}
                    <div className="space-y-6">
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Question Title <span className="text-red-500">*</span></label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Two Sum" className="w-full bg-white border border-gray-300 rounded-full px-4 py-3 font-montserrat text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors" />
                            <p className="mt-2 text-xs text-gray-500 font-montserrat">A concise, descriptive title for the problem</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Difficulty <span className="text-red-500">*</span></label>
                            <div className="flex gap-3 mb-6">{(["easy", "medium", "hard"] as const).map((level) => (<button key={level} onClick={() => setDifficulty(level)} className={`px-6 py-2 font-montserrat text-sm rounded-full transition-colors capitalize ${difficulty === level ? "bg-[#DCC8FE] text-black font-medium" : "bg-white text-black hover:bg-gray-200"}`}>{level}</button>))}</div>
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Topics <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-2 mb-4">{availableTopics.map((topic) => (<button key={topic.id} onClick={() => toggleTopic(topic.id)} className={`px-4 py-2 font-montserrat text-xs rounded-full transition-colors ${selectedTopicIds.includes(topic.id) ? "bg-[#DCC8FE] text-black font-medium" : "bg-white text-gray-600 hover:bg-gray-200"}`}>{topic.name}</button>))}</div>
                            <p className="text-xs text-gray-500 font-montserrat mb-6">Select relevant algorithmic topics and techniques</p>
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Companies (Optional)</label>
                            <div className="flex flex-wrap gap-2">{availableCompanies.map((company) => (<button key={company.id} onClick={() => toggleCompany(company.id)} className={`px-4 py-2 font-montserrat text-xs rounded-full transition-colors ${selectedCompanyIds.includes(company.id) ? "bg-[#DCC8FE] text-black font-medium" : "bg-white text-gray-600 hover:bg-gray-200"}`}>{company.name}</button>))}</div>
                            <p className="mt-2 text-xs text-gray-500 font-montserrat">Companies known to ask this question</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Problem Description <span className="text-red-500">*</span></label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide a detailed description of the problem. Include examples, edge cases, and explanations. Supports Markdown formatting." rows={12} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors resize-none" />
                            <p className="mt-2 text-xs text-gray-500 font-montserrat">Write a clear problem statement with examples. Use Markdown for formatting.</p>
                        </div>

                        {/* Function Signature */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-4">
                                Function Signature <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-montserrat text-gray-600 text-xs mb-2">Function Name</label>
                                    <input type="text" value={functionName} onChange={(e) => setFunctionName(e.target.value)} placeholder="e.g., twoSum" className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-montserrat text-gray-600 text-xs">Arguments</label>
                                        <button onClick={addFunctionArg} className="px-3 py-1 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat text-xs rounded-full transition-colors">+ Add Argument</button>
                                    </div>
                                    <div className="space-y-2">
                                        {functionArgs.map((arg, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input type="text" value={arg.name} onChange={(e) => updateFunctionArg(index, "name", e.target.value)} placeholder="Parameter name" className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]" />
                                                <input type="text" value={arg.type} onChange={(e) => updateFunctionArg(index, "type", e.target.value)} placeholder="Type (e.g., int[])" className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]" />
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
                            <p className="mt-3 text-xs text-gray-500 font-montserrat">Define the function signature for code execution validation</p>
                        </div>

                        {/* Code Templates */}
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
                            <p className="mt-3 text-xs text-gray-500 font-montserrat">Provide starter code templates. At least one language is required.</p>
                        </div>

                        {/* Constraints */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">Constraints (Optional)</label>
                            <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder={"e.g.,\n* 2 <= nums.length <= 10^4\n* -10^9 <= nums[i] <= 10^9\n* Only one valid answer exists"} rows={5} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] resize-none" />
                            <p className="mt-2 text-xs text-gray-500 font-montserrat">Specify input constraints and assumptions (one per line with bullet points)</p>
                        </div>

                        {/* Hints */}
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
                            <p className="mt-3 text-xs text-gray-500 font-montserrat">Progressive hints to help users solve the problem</p>
                        </div>

                        {/* Time & Memory Limits */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-4">Execution Limits</label>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block font-montserrat text-gray-600 text-xs mb-3">Time Limits (seconds)</label>
                                    <div className="space-y-2">
                                        {Object.entries(timeLimits).map(([lang, value]) => (
                                            <div key={lang} className="flex items-center gap-3">
                                                <span className="font-mono text-sm text-gray-600 w-20 capitalize">{lang}:</span>
                                                <input type="number" value={value} onChange={(e) => setTimeLimits({...timeLimits, [lang]: parseInt(e.target.value) || 0})} min="1" className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-black focus:outline-none focus:border-[#DCC8FE]" />
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
                                                <input type="number" value={value} onChange={(e) => setMemoryLimits({...memoryLimits, [lang]: parseInt(e.target.value) || 0})} min="1000" step="1000" className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm text-black focus:outline-none focus:border-[#DCC8FE]" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-gray-500 font-montserrat">Set execution time and memory limits per language</p>
                        </div>

                        {/* Test Cases */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <label className="font-montserrat text-black text-sm font-medium">Test Cases <span className="text-red-500">*</span></label>
                                <button onClick={addTestCase} className="px-4 py-2 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat text-xs rounded-full transition-colors">+ Add Test Case</button>
                            </div>
                            <p className="mb-4 text-xs text-gray-500 font-montserrat">Define test cases in JSON format. At least one <strong>sample</strong> test case is required.<br/><span className="text-gray-600">• <strong>Sample</strong>: Shown in problem description<br/>• <strong>Public</strong>: Run when user tests their code<br/>• <strong>Private</strong>: Only run during final submission</span></p>
                            <div className="space-y-4">
                                {testCases.map((tc, index) => (
                                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-montserrat text-gray-700 text-sm font-medium">Test Case {index + 1}</span>
                                            <div className="flex items-center gap-2">
                                                <select value={tc.visibility} onChange={(e) => updateTestCase(index, "visibility", e.target.value as any)} className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-montserrat text-gray-700 focus:outline-none focus:border-[#DCC8FE]">
                                                    <option value="sample">Sample</option>
                                                    <option value="public">Public</option>
                                                    <option value="private">Private</option>
                                                </select>
                                                {testCases.length > 1 && (<button onClick={() => removeTestCase(index)} className="text-red-500 hover:text-red-600 text-xs font-montserrat">Remove</button>)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-2">
                                            <div>
                                                <label className="block font-montserrat text-gray-600 text-xs mb-1">Input Data (JSON)</label>
                                                <textarea value={tc.input_data} onChange={(e) => updateTestCase(index, "input_data", e.target.value)} placeholder='{"nums": [2, 7, 11, 15], "target": 9}' rows={3} className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 font-mono text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] resize-none" />
                                            </div>
                                            <div>
                                                <label className="block font-montserrat text-gray-600 text-xs mb-1">Expected Output (JSON)</label>
                                                <textarea value={tc.expected_output} onChange={(e) => updateTestCase(index, "expected_output", e.target.value)} placeholder="[0, 1]" rows={3} className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 font-mono text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] resize-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block font-montserrat text-gray-600 text-xs mb-1">Explanation (Optional)</label>
                                            <input type="text" value={tc.explanation} onChange={(e) => updateTestCase(index, "explanation", e.target.value)} placeholder="Why this is the expected output..." className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 font-montserrat text-xs text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4 justify-end pt-4">
                            <Link href="/admin/questions">
                                <button disabled={loading} className="px-8 py-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-montserrat text-sm rounded-full transition-colors">Cancel</button>
                            </Link>
                            <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-[#DCC8FE] hover:bg-[#d4b8f7] disabled:opacity-50 disabled:cursor-not-allowed text-black font-montserrat font-medium text-sm rounded-full transition-colors flex items-center gap-2">
                                {loading && (<div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>)}
                                {loading ? "Creating..." : "Create Question"}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAdminAuth(CreateQuestion);
