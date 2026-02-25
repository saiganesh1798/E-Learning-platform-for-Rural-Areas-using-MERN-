import React, { useState } from 'react';
import axios from 'axios';
import { Play, Save, Code2, Terminal, Loader2 } from 'lucide-react';

const LANGUAGE_VERSIONS = {
    javascript: "18.15.0",
    python: "3.10.0"
};

const INITIAL_CODE = {
    javascript: 'console.log("Hello, World!");\n',
    python: 'print("Hello, World!")\n'
};

const CodeEditor = ({ courseId, courseTitle }) => {
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(INITIAL_CODE['javascript']);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState('');

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        setCode(INITIAL_CODE[newLang]);
        setOutput('');
    };

    const handleRunCode = async () => {
        if (!code.trim()) return;
        setIsRunning(true);
        setOutput('Running...');

        try {
            const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
                language: language,
                version: LANGUAGE_VERSIONS[language],
                files: [
                    {
                        content: code
                    }
                ]
            });

            const { run, compile } = response.data;
            if (compile && compile.stderr) {
                setOutput(`Compile Error:\n${compile.stderr}`);
            } else if (run && run.stderr) {
                setOutput(`Error:\n${run.stderr}`);
            } else {
                setOutput(run.stdout || 'Program completed with no output.');
            }
        } catch (error) {
            console.error('Execution error:', error);
            setOutput('Failed to execute code. Pleas try again later.');
        } finally {
            setIsRunning(false);
        }
    };

    const handleSaveSnippet = async () => {
        if (!title.trim()) {
            alert("Please enter a title for your snippet.");
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Please log in to save snippets.");
                return;
            }

            const config = { headers: { 'x-auth-token': token } };
            await axios.post('http://127.0.0.1:5000/api/snippets', {
                title,
                language,
                code,
                courseId
            }, config);

            alert("Snippet saved! You can view it in your dashboard.");
            setTitle(''); // Reset title
        } catch (err) {
            console.error(err);
            alert("Failed to save snippet.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 font-sans text-slate-300 shadow-xl overflow-hidden">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between bg-slate-800 p-3 border-b border-slate-700 gap-2">
                <div className="flex items-center gap-3">
                    <Code2 className="text-indigo-400 h-5 w-5" />
                    <h3 className="font-semibold text-white">Practice IDE</h3>
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="ml-2 bg-slate-700 text-sm text-white rounded px-2 py-1 outline-none border border-slate-600 focus:border-indigo-500 transition-colors"
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Snippet Title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-slate-700 text-sm text-white rounded px-3 py-1.5 w-32 md:w-48 outline-none border border-slate-600 focus:border-indigo-500 transition-colors placeholder:text-slate-400"
                    />
                    <button
                        onClick={handleSaveSnippet}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span>Save</span>
                    </button>
                </div>
            </div>

            {/* Code Input Area */}
            <div className="flex-1 relative">
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck="false"
                    className="w-full h-[300px] md:h-full bg-slate-900 text-emerald-400 p-4 font-mono text-sm resize-none outline-none leading-relaxed"
                    placeholder="Write your code here..."
                />

                {/* Floating Run Button */}
                <div className="absolute bottom-4 right-4">
                    <button
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg transition-all disabled:opacity-50 transform hover:scale-105"
                    >
                        {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                </div>
            </div>

            {/* Terminal Output Area */}
            <div className="h-1/3 bg-[#0d1117] border-t border-slate-700 flex flex-col">
                <div className="bg-slate-800/80 px-4 py-1.5 flex items-center gap-2 border-b border-slate-800">
                    <Terminal className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Output</span>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-slate-300">
                    <pre className="whitespace-pre-wrap">{output}</pre>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
