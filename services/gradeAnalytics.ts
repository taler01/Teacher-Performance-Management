
import { GradeStats, Thresholds } from '../types';

export const calculateStats = (scores: number[], thresholds: Thresholds): GradeStats => {
  if (scores.length === 0) {
    return {
      mean: 0, variance: 0, stdDev: 0, max: 0, min: 0, count: 0,
      passRate: 0, excellenceRate: 0, failureRate: 0,
      distribution: []
    };
  }

  const count = scores.length;
  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  
  const squareDiffs = scores.map(s => Math.pow(s - mean, 2));
  const variance = squareDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(variance);
  
  const max = Math.max(...scores);
  const min = Math.min(...scores);

  const passingCount = scores.filter(s => s >= thresholds.passing).length;
  const excellentCount = scores.filter(s => s >= thresholds.excellent).length;
  const failureCount = scores.filter(s => s < thresholds.passing).length;

  // 用户要求的分段：100, 99~90, 89~80... 9~0
  // 添加“分”字后缀防止 Excel 误识别为日期
  const distribution = [
    { range: '100分', count: scores.filter(s => s === 100).length },
    { range: '90~99分', count: scores.filter(s => s >= 90 && s < 100).length },
    { range: '80~89分', count: scores.filter(s => s >= 80 && s < 90).length },
    { range: '70~79分', count: scores.filter(s => s >= 70 && s < 80).length },
    { range: '60~69分', count: scores.filter(s => s >= 60 && s < 70).length },
    { range: '50~59分', count: scores.filter(s => s >= 50 && s < 60).length },
    { range: '40~49分', count: scores.filter(s => s >= 40 && s < 50).length },
    { range: '30~39分', count: scores.filter(s => s >= 30 && s < 40).length },
    { range: '20~29分', count: scores.filter(s => s >= 20 && s < 30).length },
    { range: '10~19分', count: scores.filter(s => s >= 10 && s < 20).length },
    { range: '0~9分', count: scores.filter(s => s >= 0 && s < 10).length },
  ];

  return {
    mean,
    variance,
    stdDev,
    max,
    min,
    count,
    passRate: (passingCount / count) * 100,
    excellenceRate: (excellentCount / count) * 100,
    failureRate: (failureCount / count) * 100,
    distribution
  };
};

export const exportToCSV = (stats: GradeStats, thresholds: Thresholds) => {
  const rows = [
    ['项目', '数值'],
    ['录入学生总数', stats.count + " 人"],
    ['平均分', stats.mean.toFixed(2)],
    ['方差 (波动率)', stats.variance.toFixed(2)],
    ['及格率 (%)', stats.passRate.toFixed(2)],
    ['优秀率 (%)', stats.excellenceRate.toFixed(2)],
    ['不及格率 (%)', stats.failureRate.toFixed(2)],
    ['及格线设定', thresholds.passing + " 分"],
    ['优秀线设定', thresholds.excellent + " 分"],
    [],
    ['分数段分布情况', '人数 (位)'],
    ...stats.distribution.map(d => [d.range, d.count])
  ];

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + rows.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `班级成绩分析报告_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
