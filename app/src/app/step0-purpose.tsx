"use client";
import React from "react";

export default function CanvasPurposeStep() {
  return (
    <div className="w-full flex justify-center py-10 px-6">
      <div className="w-full max-w-[calc(100vw-400px)] bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-blue-900 rounded-xl shadow-lg p-8 border border-blue-200 dark:border-blue-700 flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
          <span>ステップ0：仮説キャンバス作成の狙い</span>
          <span className="text-4xl">🎯</span>
        </h1>
        <ul className="space-y-8">
          <li>
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-200 mb-2">1. 仮説を明文化し、認識ズレを防ぐ</h2>
            <p className="text-zinc-700 dark:text-zinc-300">課題・顧客・価値・解決策について <span className="font-bold text-blue-700 dark:text-blue-200">「何を仮説として置いているのか」</span> を言語化することで、メンバー間の前提の違い・暗黙知・思い込みを早期に表に出せます。<br />👉 <span className="font-bold text-green-700 dark:text-green-300">「それ、前提として本当に合意してた？」</span> を防ぐため。</p>
          </li>
          <li>
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-200 mb-2">2. 検証すべき“不確実性”を特定する</h2>
            <p className="text-zinc-700 dark:text-zinc-300">すべてを一気に検証することはできません。成功/失敗を左右する致命的な仮説、間違っていたら方向転換が必要な仮説を明確にするのが重要です。<br />仮説キャンバスがあると <span className="font-bold text-green-700 dark:text-green-300">どこが一番リスクが高いか・何から検証すべきか</span> が一目で分かります。</p>
          </li>
          <li>
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-200 mb-2">3. 「作る前」に失敗できるようにする</h2>
            <p className="text-zinc-700 dark:text-zinc-300">仮説キャンバスの価値は、実装や投資をする前に間違いに気づけることです。<br />いきなり本開発せず、PoC/MVPの前段で検証する。机上で壊せる仮説は壊す。<br />👉 <span className="font-bold text-green-700 dark:text-green-300">失敗コストを最小化するための装置</span>です。</p>
          </li>
          <li>
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-200 mb-2">4. 検証計画（何をどう確かめるか）に落とし込む</h2>
            <p className="text-zinc-700 dark:text-zinc-300">良い仮説キャンバスは、そのままユーザーインタビュー・プロトタイプ検証・PoC設計・KPI設計に接続できます。<br /><span className="italic text-blue-700 dark:text-blue-200">例：仮説「現場はこの情報を探すのに困っている」<br />検証方法「◯◯部門5名に検索行動をヒアリング」<br />判断基準「3人以上が同じ課題を語る」</span></p>
          </li>
          <li>
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-200 mb-2">5. 意思決定のスピードを上げる</h2>
            <p className="text-zinc-700 dark:text-zinc-300">続ける / 変える / やめる、仮説を強化する / 捨てるといった判断を、感覚ではなく合意済みの仮説と検証結果で行えるようになります。</p>
          </li>
        </ul>
      </div>
    </div>
  );
}
