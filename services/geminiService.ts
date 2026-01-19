
import { GoogleGenAI } from "@google/genai";
import { GradeStats, Thresholds } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIAnalysis = async (stats: GradeStats, thresholds: Thresholds) => {
  const prompt = `
    作为一名资深教育专家，请分析以下班级考试成绩数据：
    - 学生总数: ${stats.count}
    - 平均分: ${stats.mean.toFixed(2)}
    - 标准差: ${stats.stdDev.toFixed(2)}
    - 及格率: ${stats.passRate.toFixed(2)}%
    - 优秀率: ${stats.excellenceRate.toFixed(2)}%
    - 不及格率: ${stats.failureRate.toFixed(2)}%
    - 设定标准: 及格 >= ${thresholds.passing}, 优秀 >= ${thresholds.excellent}
    
    分数段分布: ${JSON.stringify(stats.distribution)}

    请提供专业且简洁的分析报告。内容应包括：
    1. 整体表现评估。
    2. 基于分数分布识别出的潜在学习薄弱环节。
    3. 三条可落地的教学改进建议。
    语气应专业、鼓励，并使用 Markdown 格式。请务必使用中文回复。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "暂时无法生成 AI 分析报告，请检查网络连接或稍后再试。";
  }
};
