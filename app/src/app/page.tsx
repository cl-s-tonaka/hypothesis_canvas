
"use client";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { PROMPT_STEPS } from "../data/prompts";

type StepStatus = "not-started" | "in-progress" | "completed" | "waiting";

export default function HypothesisCanvasApp() {
  // 履歴保存用キー
  const STORAGE_KEY = "hypothesis-canvas-history-v1";

  // 履歴型
  type StepHistory = {
    userInputs: string[];
    aiOutputs: string[];
    timestamps: string[];
    currentStep: number;
  };

  // 初期値
  const defaultInputs = Array(PROMPT_STEPS.length).fill("");
  const defaultOutputs = Array(PROMPT_STEPS.length).fill("");
  const defaultTimestamps = Array(PROMPT_STEPS.length).fill("");

  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const [userInputs, setUserInputs] = useState<string[]>(defaultInputs);
  const [aiOutputs, setAiOutputs] = useState<string[]>(defaultOutputs);
  const [timestamps, setTimestamps] = useState<string[]>(defaultTimestamps);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 履歴の保存
  const saveHistory = (inputs: string[], outputs: string[], stamps: string[], step: number) => {
    if (typeof window === "undefined") return;
    const data: StepHistory = {
      userInputs: inputs,
      aiOutputs: outputs,
      timestamps: stamps,
      currentStep: step,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  // 履歴の復元
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data: StepHistory = JSON.parse(raw);
        setUserInputs(data.userInputs || defaultInputs);
        setAiOutputs(data.aiOutputs || defaultOutputs);
        setTimestamps(data.timestamps || defaultTimestamps);
        setCurrentStep(data.currentStep || 0);
      } catch {}
    }
  }, []);

  // ステップ状態判定
  const getStepStatus = (idx: number): StepStatus => {
    if (idx < currentStep) return "completed";
    if (idx === currentStep) return "in-progress";
    if (idx === currentStep + 1 && aiOutputs[currentStep]) return "waiting";
    return "not-started";
  };

  // 入力変更
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInputs = [...userInputs];
    newInputs[currentStep] = e.target.value;
    setUserInputs(newInputs);
    saveHistory(newInputs, aiOutputs, timestamps, currentStep);
  };

  // ステップ実行
  const handleRunStep = async () => {
    setLoading(true);
    setError("");
    try {
      // 過去履歴を文脈として連結
      let context = "";
      for (let i = 0; i < currentStep; i++) {
        if (userInputs[i]) {
          context += `【Step${i + 1} ユーザー入力】\n${userInputs[i]}\n`;
        }
        if (aiOutputs[i]) {
          context += `【Step${i + 1} AI出力】\n${aiOutputs[i]}\n`;
        }
      }
      // 現ステップの入力をテンプレートに差し込み
      let prompt = PROMPT_STEPS[currentStep].template;
      // 省略記号があればそこに入力を差し込む
      if (prompt.includes("...（省略）...")) {
        prompt = prompt.replace("...（省略）...", userInputs[currentStep] || "");
      } else if (prompt.includes("＠（選択）")) {
        prompt = prompt.replace("＠（選択）", userInputs[currentStep] || "");
      } else {
        prompt += `\n${userInputs[currentStep] || ""}`;
      }
      // 文脈を先頭に付与
      if (context) {
        prompt = `これまでの履歴:\n${context}\n---\n${prompt}`;
      }
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const newOutputs = [...aiOutputs];
      newOutputs[currentStep] = data.result;
      const newTimestamps = [...timestamps];
      newTimestamps[currentStep] = new Date().toISOString();
      setAiOutputs(newOutputs);
      setTimestamps(newTimestamps);
      saveHistory(userInputs, newOutputs, newTimestamps, currentStep);
    } catch (e: any) {
      setError(e.message || "AI実行エラー");
    } finally {
      setLoading(false);
    }
  };

  // 次のステップへ
  const handleNextStep = () => {
    if (aiOutputs[currentStep]) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveHistory(userInputs, aiOutputs, timestamps, nextStep);
    }
  };

  return (
    <div className="flex h-screen">
      {/* 左ペイン：ステップ一覧 */}
      <aside className="w-1/5 min-w-[240px] border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 overflow-auto">
        <h2 className="text-lg font-bold mb-4">仮説キャンバスステップ</h2>
        <ol className="list-decimal list-inside space-y-2">
          {PROMPT_STEPS.map((step, idx) => (
            <li
              key={step.id}
              className={`flex items-center gap-2 cursor-pointer ${getStepStatus(idx) === "in-progress" ? "font-bold text-blue-600" : getStepStatus(idx) === "completed" ? "text-green-600" : "text-zinc-500"} ${currentStep === idx ? "bg-blue-50 dark:bg-zinc-800" : ""}`}
              onClick={() => setCurrentStep(idx)}
              title="クリックで編集・再実行"
            >
              <span>{step.id}.</span>
              <span>{step.title}</span>
              {getStepStatus(idx) === "waiting" && <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 rounded px-1">選択待ち</span>}
            </li>
          ))}
        </ol>
      </aside>
      {/* 右ペイン：ステップ詳細 */}
      <main className="flex-1 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">
          Step {PROMPT_STEPS[currentStep].id}: {PROMPT_STEPS[currentStep].title}
        </h2>
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">{PROMPT_STEPS[currentStep].description}</p>
        {/* テンプレート表示と自動入力ボタン */}
        <div className="mb-2 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">テンプレート例</span>
            <button
              type="button"
              className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200"
              onClick={() => {
                const newInputs = [...userInputs];
                newInputs[currentStep] = PROMPT_STEPS[currentStep]?.template || "";
                setUserInputs(newInputs);
              }}
              disabled={loading}
            >
              このテンプレートで自動入力
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-xs bg-zinc-100 dark:bg-zinc-800 rounded p-2 overflow-x-auto border border-zinc-200 dark:border-zinc-700">
            {PROMPT_STEPS[currentStep]?.template}
          </pre>
        </div>
        <textarea
          className="w-full h-32 p-2 border border-zinc-300 dark:border-zinc-700 rounded mb-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          placeholder="ここに入力してください..."
          value={userInputs[currentStep]}
          onChange={handleInputChange}
          disabled={loading}
        />
        <div className="mb-4">
          <button
            className={`px-4 py-2 mr-2 rounded text-white ${loading ? "bg-zinc-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            onClick={handleRunStep}
            disabled={loading}
          >
            {loading ? "実行中..." : "ステップ実行"}
          </button>
          <button
            className={`px-4 py-2 rounded text-white ${aiOutputs[currentStep] ? "bg-green-600 hover:bg-green-700" : "bg-zinc-400 cursor-not-allowed"}`}
            onClick={handleNextStep}
            disabled={!aiOutputs[currentStep]}
          >
            次のステップへ
          </button>
        </div>
        {error && <p className="mb-4 text-red-600">エラー: {error}</p>}
        {aiOutputs[currentStep] && (
          <div className="border-t border-zinc-300 dark:border-zinc-700 pt-4">
            <h3 className="text-xl font-bold mb-2">AI出力結果:</h3>
            <div className="prose dark:prose-invert">
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                {aiOutputs[currentStep]}
              </ReactMarkdown>
            </div>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">生成日時: {new Date(timestamps[currentStep]).toLocaleString()}</p>
          </div>
        )}
      </main>
    </div>
  );
} 