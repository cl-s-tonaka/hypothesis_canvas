
"use client";
import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { PROMPT_STEPS, ALL_STEPS, HYPOTHESIS_CANVAS_SUMMARY_STEP } from "../data/prompts";
import { generateMarkdownExport, generateCSVExport } from "../utils/exportTemplates";

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
  const defaultInputs = Array(ALL_STEPS.length).fill("");
  const defaultOutputs = Array(ALL_STEPS.length).fill("");
  const defaultTimestamps = Array(ALL_STEPS.length).fill("");

  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const [userInputs, setUserInputs] = useState<string[]>(defaultInputs);
  const [aiOutputs, setAiOutputs] = useState<string[]>(defaultOutputs);
  const [timestamps, setTimestamps] = useState<string[]>(defaultTimestamps);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- 仮説キャンバスまとめ用 state/handler 追加 ---
  const [canvasContent, setCanvasContent] = useState<string[]>(Array(14).fill(""));
  const [canvasResult, setCanvasResult] = useState<string>("");
  const [historyTab, setHistoryTab] = useState<number>(0);

  // キャンバス作成ボタン押下時のAI生成
  const handleCanvasGenerate = useCallback(async () => {
    setCanvasResult("");
    // 各ステップの出力を文脈としてまとめプロンプトを生成
    const context = PROMPT_STEPS.map((step, idx) =>
      `【Step${step.id}】${step.title}\n${aiOutputs[idx] || ""}`
    ).join("\n\n");
    const prompt = `以下は仮説キャンバス作成のための各ステップの出力です。\n${context}\n\n各ステップの内容を踏まえて仮説キャンバスを作成してください。\nMarkdownで部屋分け図の各部屋に適切な内容を穴埋めしてください。`;
    try {
      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCanvasResult(data.result);
      // 部屋ごとに内容を分割してUIにも反映（仮: 1行目ずつ）
      const lines = (data.result || "").split(/\n/).filter(Boolean);
      // 1-14項目を抽出（仮: "1."~"14."で始まる行）
      const newContent = Array(14).fill("");
      for (let i = 0; i < lines.length; ++i) {
        const m = lines[i].match(/^(\d+)\.[^:：]*[:：](.*)$/);
        if (m) {
          const idx = parseInt(m[1], 10) - 1;
          if (idx >= 0 && idx < 14) newContent[idx] = m[2].trim();
        }
      }
      setCanvasContent(newContent);
    } catch (e) {
      setCanvasResult("AI生成エラー: " + (e as any).message);
    }
  }, [aiOutputs]);
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

  // エクスポート（Markdown）
  const handleExportMarkdown = () => {
    const md = generateMarkdownExport(ALL_STEPS, userInputs, aiOutputs, timestamps);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hypothesis-canvas-history_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // エクスポート（CSV）
  const handleExportCSV = () => {
    const csv = generateCSVExport(ALL_STEPS, userInputs, aiOutputs, timestamps);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hypothesis-canvas-history_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen">
      {/* 左ペイン：ステップ一覧 */}
      <aside className="w-1/5 min-w-[240px] border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 overflow-auto">
        <h2 className="text-lg font-bold mb-4">仮説キャンバスステップ</h2>
        <ol className="list-decimal list-inside space-y-2">
          {ALL_STEPS.map((step, idx) => (
            <li
              key={step.id}
              className={`flex items-center gap-2 cursor-pointer ${currentStep === idx ? "font-bold text-blue-600 bg-blue-50 dark:bg-zinc-800" : idx < PROMPT_STEPS.length && getStepStatus(idx) === "completed" ? "text-green-600" : "text-zinc-500"}`}
              onClick={() => setCurrentStep(idx)}
              title={idx < PROMPT_STEPS.length ? "クリックで編集・再実行" : "まとめ画面へ"}
            >
              <span>{step.id}.</span>
              <span>{step.title}</span>
              {idx < PROMPT_STEPS.length && getStepStatus(idx) === "waiting" && <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 rounded px-1">選択待ち</span>}
            </li>
          ))}
        </ol>
      </aside>
      {/* メイン＋履歴を横並びで分離 */}
      <div className="flex flex-1 h-full">
        {/* 中央：ステップ詳細 or 仮説キャンバスまとめ */}
        <main className="flex-1 p-6 overflow-auto flex flex-col gap-6 items-start">
          <div className="w-full max-w-[calc(100vw-400px)] pr-[400px] flex flex-col gap-6">
          {currentStep < PROMPT_STEPS.length ? (
            <>
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
            </>
          ) : currentStep === PROMPT_STEPS.length ? (
            // まとめステップ
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
              <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">仮説キャンバスまとめ</h2>
              <p className="mb-2 text-zinc-600 dark:text-zinc-400 text-sm">全ステップの内容をもとに仮説キャンバス図を表示します。ボタン押下で内容が埋まります。</p>
              {/* 仮説キャンバス図（部屋分けUI） */}
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full max-w-2xl aspect-[2/1] relative bg-zinc-50 dark:bg-zinc-800 border rounded-lg shadow p-2 mb-2 flex flex-col">
                  {/* 上段: A.対象 */}
                  <div className="flex flex-row h-1/2">
                    <div className="flex-1 border-r border-b border-zinc-300 dark:border-zinc-700 p-2 flex flex-col">
                      <div className="font-bold text-xs mb-1 text-blue-700">A.対象</div>
                      <div className="text-xs font-semibold">1.ビジョン</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[0]}</div>
                      <div className="text-xs font-semibold mt-1">2.状況</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[1]}</div>
                      <div className="text-xs font-semibold mt-1">3.傾向</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[2]}</div>
                      <div className="text-xs font-semibold mt-1">4.顕在課題</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[3]}</div>
                      <div className="text-xs font-semibold mt-1">5.代替手段</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[4]}</div>
                      <div className="text-xs font-semibold mt-1">6.潜在課題</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[5]}</div>
                      <div className="text-xs font-semibold mt-1">7.チャネル</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[6]}</div>
                      <div className="text-xs font-semibold mt-1">8.市場規模</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[7]}</div>
                    </div>
                    {/* B.主体 */}
                    <div className="flex-1 border-b border-zinc-300 dark:border-zinc-700 p-2 flex flex-col">
                      <div className="font-bold text-xs mb-1 text-green-700">B.主体</div>
                      <div className="text-xs font-semibold">9.目的</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[8]}</div>
                      <div className="text-xs font-semibold mt-1">10.提案価値</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[9]}</div>
                      <div className="text-xs font-semibold mt-1">11.実現手段</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[10]}</div>
                      <div className="text-xs font-semibold mt-1">12.優位性</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[11]}</div>
                      <div className="text-xs font-semibold mt-1">13.評価指標</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[12]}</div>
                      <div className="text-xs font-semibold mt-1">14.ビジネスモデル</div>
                      <div className="text-xs min-h-[1.5em]">{canvasContent[13]}</div>
                    </div>
                  </div>
                </div>
                <button
                  className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
                  onClick={handleCanvasGenerate}
                >
                  キャンバス作成
                </button>
              </div>
              {/* 生成された仮説キャンバス出力 */}
              <div className="mt-4">
                <h3 className="font-bold mb-2">生成結果</h3>
                <div className="prose prose-zinc dark:prose-invert whitespace-pre-wrap min-h-[120px]">
                  {canvasResult ? (
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{canvasResult}</ReactMarkdown>
                  ) : (
                    <span className="text-zinc-400">キャンバス作成ボタンを押すとここに生成結果が表示されます</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // 15: 自由記述ステップ
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
              <h2 className="text-xl font-bold mb-2 text-blue-700 dark:text-blue-300">Step 15: 自由記述</h2>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">これまでのステップの履歴を踏まえて、自由に記述・AI生成できるステップです。</p>
              <textarea
                className="w-full h-32 p-2 border border-zinc-300 dark:border-zinc-700 rounded mb-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                placeholder="ここに自由に入力してください..."
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
                  {loading ? "実行中..." : "AIに依頼"}
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
            </div>
          )}
        </div>
        </main>
        {/* 右端サイドバー：全ステップAI出力履歴（タブ＋カード型） */}
        <aside className="w-[340px] min-w-[220px] max-w-[400px] border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 overflow-auto h-screen rounded-none shadow-none flex flex-col gap-2" style={{ position: 'fixed', right: 0, top: 0, height: '100vh', zIndex: 30 }}>
          <h3 className="text-base font-bold mb-2 text-blue-700 dark:text-blue-300">全ステップ出力履歴</h3>
          <div className="flex flex-row gap-1 mb-2 overflow-x-auto">
            {ALL_STEPS.map((step, idx) => (
              <button
                key={step.id}
                className={`px-2 py-1 rounded-t text-xs font-semibold border-b-2 ${historyTab === idx ? "border-blue-600 bg-white dark:bg-zinc-900" : "border-transparent bg-zinc-100 dark:bg-zinc-800"}`}
                onClick={() => setHistoryTab(idx)}
              >
                {step.id}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto mb-4">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-3 border border-zinc-200 dark:border-zinc-800">
              <div className="font-semibold text-xs mb-1 text-blue-700">{ALL_STEPS[historyTab].id}. {ALL_STEPS[historyTab].title}</div>
              <div className="text-xs text-zinc-500 mb-2">{ALL_STEPS[historyTab].description}</div>
              <div className="prose prose-zinc dark:prose-invert whitespace-pre-wrap text-xs">
                {aiOutputs[historyTab] ? (
                  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{aiOutputs[historyTab]}</ReactMarkdown>
                ) : (
                  <span className="text-zinc-400">未出力</span>
                )}
              </div>
            </div>
          </div>
          {/* エクスポート枠（出力形式選択） */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 mt-auto">
            <h4 className="font-bold text-sm mb-2 text-blue-700 dark:text-blue-300">出力</h4>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded bg-green-600 text-white text-sm font-semibold hover:bg-green-700 border border-green-700"
                onClick={handleExportMarkdown}
              >
                Markdown形式
              </button>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 border border-blue-700"
                onClick={handleExportCSV}
              >
                CSV形式
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">全ステップの入力・AI出力・日時を選択形式でダウンロードできます。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}