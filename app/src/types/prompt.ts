// 仮説キャンバスプロンプトの型定義
export type PromptStep = {
  id: number;
  title: string;
  description: string;
  template: string;
};

export type HistoryItem = {
  step: number;
  userInput: string;
  aiOutput: string;
  timestamp: string;
};
