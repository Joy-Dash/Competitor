# 競品分析 Demo：GitHub Pages 展示包

版本：2026-11-25。純靜態 HTML／CSS／JavaScript，無安裝、編譯或後端需求。

## 上傳到新的 GitHub repository

1. 解壓縮展示包。
2. 把 index.html、兩個功能 HTML、css/、js/、.nojekyll 及本說明放在 repository 根目錄。不要只上傳 ZIP，也不要多包一層資料夾。
3. 在 repository 的 Settings → Pages，選 Deploy from a branch。
4. 選擇 main 分支與 / (root)，儲存。
5. 等 GitHub 的部署完成，從 Pages 顯示的網址開啟。

官方說明：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 如果使用既有 repository

不要覆蓋其他網站的 index.html。可以把展示包放在該網站發布來源內的 competitor-demo/ 子資料夾，分享網站網址後面的 /competitor-demo/。若發布來源是 /docs，展示包就放在 docs/competitor-demo/。

## 展示入口與建議流程

- 首頁 index.html 自動進入第一階段。
- 第一階段：market-exploration-result.html。可操作星鏈圖、複選品牌、查看雷達圖與比較表。
- 勾選 1～10 家競品後，按「品牌競爭比較（第二層）」。
- 第二階段：brand-competitive-comparison.html。確認品牌與主題，按開始模擬分析，再操作矩陣、比較表、價格分布及熱力圖。
- 直接分享第二階段網址也可開啟；沒有第一階段資料時，按「使用前三家示例」即可繼續。

## 原型範圍

- 全部使用 Mock Data，不會呼叫正式 AI、搜尋 API 或扣除點數。
- 第三階段只有交接預覽，不包含正式平台的深度分析報告。
- 選擇與保存結果只存在各訪客自己的瀏覽器，不會跟著網址分享，也不會同步給其他訪客。
- 不需要平台帳號或密碼。本包不包含原專案其他模組、文件或環境設定。

## 維護

本包是建立時的靜態副本。來源有更新時，在原專案執行 node tests/package-competitor-pages.cjs 重新整理，再上傳更新檔案。
