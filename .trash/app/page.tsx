// "use client";
// // --- フォーマット例・記入例定義 ---
// const storylineExample =
//   '【例】\n1. [2.状況]な人たちは[課題(4.顕在課題、6.潜在課題)]を抱えている。だからこそ、[5.代替手段]の現状を手段として用いているが、[5.代替手段の不満・不足]があり、十分ではない。ゆえに[10.提案価値]には魅力がある。これは、[11.実現手段]によって実現される。\n\nこのようなストーリーラインを3つ、番号付きで記入してください。';
// const selectNumberExample =
//   '1\n2\n3\n（採用したいストーリーラインの番号を半角数字で入力してください）';
// const consistencyCheckExample =
//   '【整合性チェック例】\n- 対象像に状況や傾向が反映されているか\n- 優位性が反映された主体になっているか\n- 提案価値が自社の狙いと合致しているか\n- 提案価値が実現できそうか\n- 優位性は有効か\n- 提案価値が有効かどうか判断できる指標になっているか\n- 課題は解決状態になっているか\n- ...（他にもprocedure.mdのチェックリスト参照）';
// const interviewScriptExample =
//   '【インタビュースクリプト例】\nA.課題仮説\n・2.状況、3.傾向の人が存在することを確認する質問\n・上記人が、4.顕在課題を持っており、どんな5.代替手段で解決しているかを確認する質問\n・その人の6.潜在課題を洗い出す質問\n\nB.機能仮説\n・課題に対して、10.提案価値や11.実現手段が嬉しいか判断する質問\n・他の手段が考えられないか確認する質問\n\nC.形態仮説\n・11.実現手段において適切なインターフェースやチャネルを洗い出す質問\n・5.代替手段から適切なインターフェースを洗い出す質問';
// const interviewAnswerExample =
//   '【例】\n1. ペルソナA: ...\n2. ペルソナB: ...\n3. ペルソナC: ...\n（3パターンの仮想回答を記入してください）';
// const storyFormatExample =
//   '# 仮説展開ストーリー\n## a.仮説の前提\n・次の仮説モデルが成り立つための前提を提示する\n## b.仮説モデル\n・誰のどんな課題やニーズを充足し、どの様な価値を作り出すのか\n## c.獲得する優位性\n・仮説モデルの実現、遂行によって得られる優位性\n## d.想定事業規模\n・仮説モデルの実現、遂行によって得られる結果収益\n## e.期待する影響\n・仮説モデルの実現、遂行によって、結果として間接的に期待できる影響';
// const narrativeFormatExample =
//   '## 状況説明\n・今の状態\n## 事件や問題の発生\n・解決する問題\n## 危機\n・競争\n## クライマックスと解決\n・解決策と課題提案や競争優位\n## 落とし込み\n・感想\n## エンディング\n・目的の達成';
// const narrativeSelectExample =
//   '1: ...（理由）\n2: ...（理由）\n（どちらのナラティブを選ぶか、その理由を記入してください）';
// const integratedStoryExample =
//   '【例】\n１手目の［アウトプット］を作り出すことで、［アウトカム］の獲得が見込まれ、その先で３手目の［インパクト］が生み出される。\n（200〜400文字程度で、ビジネス向きのコピーライターとしてまとめてください）';

// import { useState, useEffect } from "react";
// import ReactMarkdown from "react-markdown";
// import rehypeSanitize from "rehype-sanitize";
// import { PROMPT_STEPS } from "../data/prompts";

// type StepStatus = "not-started" | "in-progress" | "completed" | "waiting";

// export default function HypothesisCanvasApp() {
//   // 履歴保存用キー
//   const STORAGE_KEY = "hypothesis-canvas-history-v1";

//   // 履歴型
//   type StepHistory = {
//     userInputs: string[];
//     aiOutputs: string[];
//     timestamps: string[];
//     currentStep: number;
//   };

//   // 初期値
//   const getDefaultInputs = () => Array(PROMPT_STEPS.length).fill("");
//   const getDefaultOutputs = () => Array(PROMPT_STEPS.length).fill("");
//   const getDefaultTimestamps = () => Array(PROMPT_STEPS.length).fill("");

//   const [currentStep, setCurrentStep] = useState(() => 0); // 0-indexed
//   const [userInputs, setUserInputs] = useState<string[]>(getDefaultInputs);
//   const [aiOutputs, setAiOutputs] = useState<string[]>(getDefaultOutputs);
//   const [timestamps, setTimestamps] = useState<string[]>(getDefaultTimestamps);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // 履歴の保存
//   const saveHistory = (inputs: string[], outputs: string[], stamps: string[], step: number) => {
//     if (typeof window === "undefined") return;
//     const data: StepHistory = {
//       userInputs: inputs,
//       aiOutputs: outputs,
//       timestamps: stamps,
//       currentStep: step,
//     };
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
//   };

//   // 履歴の復元
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (raw) {
//       try {
//         const data: StepHistory = JSON.parse(raw);
//         setUserInputs(data.userInputs || getDefaultInputs);
//         setAiOutputs(data.aiOutputs || getDefaultInputs);
//         setTimestamps(data.timestamps || getDefaultInputs);
//         setCurrentStep(data.currentStep || 0);
//       } catch {}
//     }
//   }, []);

//   // ステップ状態判定
//   const getStepStatus = (idx: number): StepStatus => {
//     if (idx < currentStep) return "completed";
//     if (idx === currentStep) return "in-progress";
//     if (idx === currentStep + 1 && aiOutputs[currentStep]) return "waiting";
//     return "not-started";
//   };

//   // 入力変更
//   const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//   const handleRunStep = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       // 過去履歴を文脈として連結
//       let context = "";
//       for (let i = 0; i < currentStep; i++) {
//         if (userInputs[i]) {
//           context += `【Step${i + 1} ユーザー入力】\n${userInputs[i]}\n`;
//         }
//         if (aiOutputs[i]) {
//           context += `【Step${i + 1} AI出力】\n${aiOutputs[i]}\n`;
//         }
//       }
// // 現ステップの入力をテンプレートに差し込み
// let prompt = PROMPT_STEPS[currentStep].template;
// // ステップごとにフォーマット例や選択肢例を表示（UI部分で処理）
// if (prompt.includes("＠（選択）")) {
//   prompt = prompt.replace("＠（選択）", userInputs[currentStep] || "");
// } else {
//   prompt += `\n${userInputs[currentStep] || ""}`;
// }
// // 文脈を先頭に付与
// if (context) {
//   prompt = `これまでの履歴:\n${context}\n---\n${prompt}`;
// }
// const res = await fetch("/api/openai", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ prompt }),
// });
// const data = await res.json();
// if (data.error) throw new Error(data.error);
// const newOutputs = [...aiOutputs];
//       newOutputs[currentStep] = data.result;
//       const newTimestamps = [...timestamps];
//       newTimestamps[currentStep] = new Date().toISOString();
//         {currentStep === 1 && (
//           <details className="mb-2">
//             <summary className="cursor-pointer text-sm text-blue-700 underline">ストーリーライン入力例を表示</summary>
//             <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
//               <pre className="whitespace-pre-wrap">{storylineExample}</pre>
//             </div>
//           </details>
//         )}
//       setAiOutputs(newOutputs);
//       setTimestamps(newTimestamps);
//       saveHistory(userInputs, newOutputs, newTimestamps, currentStep);
//         {currentStep === 2 && (
//           <details className="mb-2">
//             <summary className="cursor-pointer text-sm text-blue-700 underline">選択番号入力例を表示</summary>
//             <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
//               <pre className="whitespace-pre-wrap">{selectNumberExample}</pre>
//             </div>
//           </details>
//         )}
//         {currentStep === 5 && (
//           <details className="mb-2">
//             <summary className="cursor-pointer text-sm text-blue-700 underline">整合性チェック項目を表示</summary>
//             <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
//               <pre className="whitespace-pre-wrap">{consistencyCheckExample}</pre>
//             </div>
//           </details>
//         )}
//         {currentStep === 6 && (
//           <details className="mb-2">
//             <summary className="cursor-pointer text-sm text-blue-700 underline">インタビュースクリプト例を表示</summary>
//             <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
//               <pre className="whitespace-pre-wrap">{interviewScriptExample}</pre>
//             </div>
//           </details>
//         )}
//         {currentStep === 7 && (
//           <details className="mb-2">
//             <summary className="cursor-pointer text-sm text-blue-700 underline">インタビュー回答例を表示</summary>
//             <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
//               <pre className="whitespace-pre-wrap">{interviewAnswerExample}</pre>
//             </div>
//           </details>
//         )}
//         {currentStep === 9 && (
//           <details className="mb-2">
//             <summary className="cursor-pointer text-sm text-blue-700 underline">仮説展開ストーリーフォーマット例を表示</summary>
//             <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
//               <pre className="whitespace-pre-wrap">{storyFormatExample}</pre>
//             </div>
//           </details>
//         )}
//         {currentStep === 10 && (
//           <details className="mb-2">
//             <summary className="cursor-pointer text-sm text-blue-700 underline">ナラティブストーリーフォーマット例を表示</summary>
//             <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
//               <pre className="whitespace-pre-wrap">{narrativeFormatExample}</pre>
//             </div>
//           </details>
//         )}
//         {currentStep === 11 && (
//           <details className="mb-2">
//             <summary className="cursor-pointer text-sm text-blue-700 underline">ナラティブ選択・理由入力例を表示</summary>
//             <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
//               <pre className="whitespace-pre-wrap">{narrativeSelectExample}</pre>
//             </div>
//           </details>
//         )}
//         {currentStep === 12 && (
//           <details className="mb-2">
//             <summary className="cursor-pointer text-sm text-blue-700 underline">統合ストーリー出力例を表示</summary>
//             <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-xs overflow-x-auto">
//               <pre className="whitespace-pre-wrap">{integratedStoryExample}</pre>
//             </div>
//           </details>
//         )}
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.message || "不明なエラーが発生しました");
//       setLoading(false);
//     }
//   };

//   // 次ステップへ
//   const handleNextStep = () => {
//     if (currentStep < PROMPT_STEPS.length - 1) {
//       setCurrentStep(currentStep + 1);
//       saveHistory(userInputs, aiOutputs, timestamps, currentStep + 1);
//     }
//   };

//   return (
//     <div className="flex h-screen">
//       {/* 左ペイン：操作部分 */}
//       <main className="w-3/5 min-w-[400px] p-6 overflow-auto">
//         <h1 className="text-2xl font-bold mb-2">{PROMPT_STEPS[currentStep]?.title}</h1>
//         <p className="mb-4 text-zinc-600 dark:text-zinc-300">{PROMPT_STEPS[currentStep]?.description}</p>
//         <textarea
//           className="w-full min-h-[120px] border rounded p-2 mb-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
//           value={userInputs[currentStep]}
//           onChange={handleInputChange}
//           placeholder="ここに入力..."
//           disabled={loading}
//         />
//         <div className="flex gap-4">
//           <button
//             className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-blue-200"
//             onClick={handleRunStep}
//             disabled={loading || !userInputs[currentStep]}
//           >
//             {loading ? "AI実行中..." : "AIに送信"}
//           </button>
//           <button
//             className="px-4 py-2 rounded bg-green-600 text-white disabled:bg-green-200"
//             onClick={handleNextStep}
//             disabled={!aiOutputs[currentStep] || currentStep >= PROMPT_STEPS.length - 1}
//           >
//             次のステップへ
//           </button>
//         </div>
//         {error && <div className="text-red-600 mt-2">{error}</div>}
//       </main>

//       {/* 右ペイン：AI出力 */}
//       <aside className="w-2/5 min-w-[320px] border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 overflow-auto">
//         <h2 className="text-lg font-bold mb-4">AI出力</h2>
//         <div className="prose prose-zinc dark:prose-invert whitespace-pre-wrap">
//           {aiOutputs[currentStep] ? (
//             <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{aiOutputs[currentStep]}</ReactMarkdown>
//           ) : (
//             <span className="text-zinc-400">AI出力がここに表示されます</span>
//           )}
//         </div>
//       </aside>
//     </div>
//   );
// }}