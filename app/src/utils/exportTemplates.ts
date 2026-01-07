// exportTemplates.ts
// 仮説キャンバス全履歴エクスポート用テンプレート・関数
import { PromptStep } from "../types/prompt";

export function generateMarkdownExport(steps: PromptStep[], userInputs: string[], aiOutputs: string[], timestamps: string[]): string {
  let md = `# 仮説キャンバス 全ステップ履歴\n\n`;
  steps.forEach((step, idx) => {
    md += `---\n`;
    md += `## Step${step.id}: ${step.title}\n`;
    md += `> **説明:** ${step.description}\n`;
    md += `\n- **入力日時:** ${timestamps[idx] ? new Date(timestamps[idx]).toLocaleString() : "（未入力）"}`;
    md += `\n- **入力内容:**\n\n`;
    if (userInputs[idx]) {
      md += '````\n' + userInputs[idx] + '\n````\n';
    } else {
      md += '（未入力）\n';
    }
    md += `\n- **AI出力:**\n\n`;
    if (aiOutputs[idx]) {
      md += '````\n' + aiOutputs[idx] + '\n````\n';
    } else {
      md += '（未出力）\n';
    }
  });
  return md;
}

export function generateCSVExport(steps: PromptStep[], userInputs: string[], aiOutputs: string[], timestamps: string[]): string {
  const header = ['Step', 'タイトル', '説明', '入力日時', '入力', 'AI出力'];
  let csv = header.join(',') + '\n';
  steps.forEach((step, idx) => {
    const row = [
      step.id,
      `"${step.title.replace(/"/g,'""')}"`,
      `"${step.description.replace(/"/g,'""')}"`,
      `"${timestamps[idx] ? new Date(timestamps[idx]).toLocaleString() : ''}"`,
      `"${(userInputs[idx]||'').replace(/"/g,'""').replace(/\n/g,'\\n')}"`,
      `"${(aiOutputs[idx]||'').replace(/"/g,'""').replace(/\n/g,'\\n')}"`
    ];
    csv += row.join(',') + '\n';
  });
  return csv;
}
