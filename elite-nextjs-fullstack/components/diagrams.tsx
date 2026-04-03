"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, BarChart2 } from 'lucide-react';
import { DIMENSION_LABELS } from '@/lib/shared/questions';

const PENTAGON_DIMENSIONS = [
  { key: 'aiLiteracy', shortLabel: 'Literacy' },
  { key: 'dataReadiness', shortLabel: 'Data' },
  { key: 'aiStrategy', shortLabel: 'Process' },
  { key: 'workflowAdoption', shortLabel: 'Leadership' },
  { key: 'ethicsCompliance', shortLabel: 'Risk' }
] as const;

const PENTAGON_SIZE = 220;
const PENTAGON_CENTER = PENTAGON_SIZE / 2;
const PENTAGON_RADIUS = 76;
const PENTAGON_MAX_SCORE = 20;
const PENTAGON_LEVELS = [0.25, 0.5, 0.75, 1];

function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function polarToCartesian(index: number, radius: number): { x: number; y: number } {
  const angle = ((-90 + index * (360 / PENTAGON_DIMENSIONS.length)) * Math.PI) / 180;

  return {
    x: PENTAGON_CENTER + radius * Math.cos(angle),
    y: PENTAGON_CENTER + radius * Math.sin(angle)
  };
}

function buildPolygonPath(points: Array<{ x: number; y: number }>): string {
  if (!points.length) {
    return '';
  }

  const [firstPoint, ...remainingPoints] = points;
  return [
    `M ${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`,
    ...remainingPoints.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
    'Z'
  ].join(' ');
}

function buildPentagonPath(values: number[]): string {
  return buildPolygonPath(
    values.map((value, index) =>
      polarToCartesian(
        index,
        (clampValue(value, 0, PENTAGON_MAX_SCORE) / PENTAGON_MAX_SCORE) * PENTAGON_RADIUS
      )
    )
  );
}

function getLabelAnchor(x: number): 'start' | 'middle' | 'end' {
  if (x < PENTAGON_CENTER - 10) {
    return 'end';
  }

  if (x > PENTAGON_CENTER + 10) {
    return 'start';
  }

  return 'middle';
}

function getLabelOffsetX(x: number): number {
  if (x < PENTAGON_CENTER - 10) {
    return -8;
  }

  if (x > PENTAGON_CENTER + 10) {
    return 8;
  }

  return 0;
}

function getLabelOffsetY(y: number): number {
  if (y < PENTAGON_CENTER - 10) {
    return -8;
  }

  if (y > PENTAGON_CENTER + 10) {
    return 13;
  }

  return 4;
}

export const SurfaceCodeDiagram: React.FC = () => {
  const [activeGaps, setActiveGaps] = useState<number[]>([]);

  const toggleGap = (index: number) => {
    setActiveGaps((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index].sort((left, right) => left - right)
    );
  };

  const { dimensionScores, simulatedReadiness } = useMemo(() => {
    const gapCount = activeGaps.length;
    const scores = PENTAGON_DIMENSIONS.map((_, index) => {
      const hasDirectGap = activeGaps.includes(index);
      const hasLeftSpillover = activeGaps.includes(
        (index + PENTAGON_DIMENSIONS.length - 1) % PENTAGON_DIMENSIONS.length
      );
      const hasRightSpillover = activeGaps.includes((index + 1) % PENTAGON_DIMENSIONS.length);
      const spilloverPressure = Number(hasLeftSpillover) + Number(hasRightSpillover);
      const systemicPressure = gapCount >= 4 ? 2 : gapCount >= 2 ? 1 : 0;

      return clampValue(
        18 - (hasDirectGap ? 7 : 0) - spilloverPressure - systemicPressure,
        4,
        PENTAGON_MAX_SCORE
      );
    });

    return {
      dimensionScores: scores,
      simulatedReadiness: Math.round(
        (scores.reduce((total, value) => total + value, 0) /
          (PENTAGON_DIMENSIONS.length * PENTAGON_MAX_SCORE)) *
          100
      )
    };
  }, [activeGaps]);

  const axisPoints = PENTAGON_DIMENSIONS.map((_, index) => polarToCartesian(index, PENTAGON_RADIUS));
  const labelPoints = PENTAGON_DIMENSIONS.map((_, index) => polarToCartesian(index, PENTAGON_RADIUS + 26));
  const scorePoints = dimensionScores.map((value, index) =>
    polarToCartesian(index, (value / PENTAGON_MAX_SCORE) * PENTAGON_RADIUS)
  );
  const pentagonPath = buildPentagonPath(dimensionScores);
  const activeGapSet = new Set(activeGaps);

  return (
    <div className="my-8 flex w-full flex-col items-center rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="mb-4 text-center font-serif text-xl text-stone-800">Interactive: Capability Signal Map</h3>
      <p className="mb-6 max-w-2xl text-center text-sm text-stone-500">
        Select a readiness dimension to simulate pressure. The pentagon contracts as capability weakens across <strong>literacy</strong>, <strong>data</strong>, <strong>process</strong>, <strong>leadership</strong>, and <strong>risk</strong>.
      </p>

      <div className="mt-8 w-full max-w-[38rem] rounded-[24px] border border-blue-100 bg-[#F6FAFF] p-5 shadow-[0_16px_42px_rgba(37,99,235,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Pentagon Data View
            </p>
            <h4 className="mt-1 font-serif text-lg text-stone-800">
              Simulated readiness across five dimensions
            </h4>
          </div>
          <div className="rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[11px] font-semibold text-blue-800 shadow-sm">
            Profile {simulatedReadiness}/100
          </div>
        </div>

        <p className="mt-2 text-[12px] leading-5 text-slate-500">
          Click any dimension card to simulate a gap and watch the readiness shape respond.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
          <div className="mx-auto h-[220px] w-[220px]">
            <svg width={PENTAGON_SIZE} height={PENTAGON_SIZE} viewBox={`0 0 ${PENTAGON_SIZE} ${PENTAGON_SIZE}`} className="overflow-visible">
              <defs>
                <linearGradient id="capability-pentagon-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {PENTAGON_LEVELS.map((level) => (
                <path
                  key={`level-${level}`}
                  d={buildPolygonPath(
                    PENTAGON_DIMENSIONS.map((_, index) => polarToCartesian(index, PENTAGON_RADIUS * level))
                  )}
                  fill="none"
                  stroke="#BFDBFE"
                  strokeWidth="1"
                />
              ))}

              {axisPoints.map((point, index) => (
                <g key={`axis-${index}`}>
                  <line
                    x1={PENTAGON_CENTER}
                    y1={PENTAGON_CENTER}
                    x2={point.x}
                    y2={point.y}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
                    fill={activeGapSet.has(index) ? '#1D4ED8' : '#FFFFFF'}
                    stroke={activeGapSet.has(index) ? '#1D4ED8' : '#93C5FD'}
                    strokeWidth="2"
                  />
                </g>
              ))}

              <motion.path
                d={pentagonPath}
                animate={{ d: pentagonPath }}
                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                fill="url(#capability-pentagon-fill)"
                stroke="#2563EB"
                strokeWidth="2.5"
              />

              {scorePoints.map((point, index) => (
                <circle
                  key={`point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r="4.5"
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              ))}

              {labelPoints.map((point, index) => (
                <text
                  key={`label-${PENTAGON_DIMENSIONS[index].key}`}
                  x={point.x + getLabelOffsetX(point.x)}
                  y={point.y + getLabelOffsetY(point.y)}
                  textAnchor={getLabelAnchor(point.x)}
                  fontSize="10"
                  fontWeight="700"
                  fill="#475569"
                >
                  {PENTAGON_DIMENSIONS[index].shortLabel}
                </text>
              ))}
            </svg>
          </div>

          <div className="space-y-3">
            {PENTAGON_DIMENSIONS.map((dimension, index) => {
              const score = dimensionScores[index];
              const isActive = activeGapSet.has(index);

              return (
                <button
                  key={dimension.key}
                  type="button"
                  onClick={() => toggleGap(index)}
                  className={`w-full rounded-2xl border p-3 text-left shadow-sm transition-colors ${
                    isActive
                      ? 'border-blue-300 bg-blue-50/90'
                      : 'border-white/70 bg-white/85 hover:border-blue-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold leading-5 text-slate-700">
                        {DIMENSION_LABELS[dimension.key]}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {isActive ? 'Gap simulated' : 'Click to simulate gap'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-500">
                        {score}/20
                      </span>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-sm font-semibold ${
                          isActive
                            ? 'border-blue-300 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-500'
                        }`}
                      >
                        {isActive ? '-' : '+'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-blue-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400"
                      initial={false}
                      animate={{ width: `${(score / PENTAGON_MAX_SCORE) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 h-6 text-sm font-serif italic text-stone-600">
        {activeGaps.length === 0
          ? 'No critical capability gaps selected.'
          : `The simulated pentagon has contracted across ${activeGaps.length} selected dimension${activeGaps.length === 1 ? '' : 's'}.`}
      </div>
    </div>
  );
};

export const TransformerDecoderDiagram: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center p-8 bg-[#F2F7FF] rounded-xl border border-blue-100 my-8">
      <h3 className="font-serif text-xl mb-4 text-stone-900">Assessment-to-Report Workflow</h3>
      <p className="text-sm text-stone-600 mb-6 text-center max-w-md">
        Structured responses move through backend validation, server-side scoring, organisation aggregation, and final PDF delivery for director review.
      </p>

      <div className="relative w-full max-w-lg h-56 bg-white rounded-lg shadow-inner overflow-hidden mb-6 border border-stone-200 flex items-center justify-center gap-8 p-4">
        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-colors duration-500 ${step === 0 ? 'border-nobel-gold bg-nobel-gold/10' : 'border-stone-200 bg-stone-50'}`}>
            <div className="grid grid-cols-3 gap-1">
              {[...Array(9)].map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i % 3 === 0 ? 'bg-stone-800' : 'bg-stone-300'}`}></div>)}
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Responses</span>
        </div>

        <motion.div animate={{ opacity: step >= 1 ? 1 : 0.3, x: step >= 1 ? 0 : -5 }}>→</motion.div>

        <div className="flex flex-col items-center gap-2">
          <div className={`w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-colors duration-500 relative overflow-hidden ${step === 1 || step === 2 ? 'border-blue-900 bg-blue-900 text-white' : 'border-stone-200 bg-stone-50'}`}>
            <Cpu size={24} className={step === 1 || step === 2 ? 'text-nobel-gold animate-pulse' : 'text-stone-300'} />
            {step === 1 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-nobel-gold absolute top-1/3 animate-ping"></div>
                <div className="w-full h-[1px] bg-nobel-gold absolute top-2/3 animate-ping delay-75"></div>
              </div>
            )}
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Score Engine</span>
        </div>

        <motion.div animate={{ opacity: step >= 3 ? 1 : 0.3, x: step >= 3 ? 0 : -5 }}>→</motion.div>

        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center transition-colors duration-500 ${step === 3 ? 'border-blue-500 bg-blue-50' : 'border-stone-200 bg-stone-50'}`}>
            {step === 3 ? (
              <span className="text-sm font-bold text-blue-600">PDF</span>
            ) : (
              <span className="text-2xl font-serif text-stone-300">?</span>
            )}
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Report</span>
        </div>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2, 3].map(s => (
          <div key={s} className={`h-1 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-nobel-gold' : 'w-2 bg-stone-300'}`}></div>
        ))}
      </div>
    </div>
  );
};

export const PerformanceMetricDiagram: React.FC = () => {
  const [scenario, setScenario] = useState<'gap' | 'moderate' | 'leading'>('gap');

  const data = {
    gap: { current: 31, benchmark: 68, currentLabel: 'Regional Avg', benchmarkLabel: 'UK Benchmark' },
    moderate: { current: 50, benchmark: 51, currentLabel: 'AI Exploring Ceiling', benchmarkLabel: 'AI Developing Floor' },
    leading: { current: 75, benchmark: 76, currentLabel: 'AI Developing Ceiling', benchmarkLabel: 'AI Proficient Floor' }
  };

  const currentData = data[scenario];
  const maxVal = Math.max(currentData.current, currentData.benchmark) * 1.2;

  const formatValue = (val: number) => `${val.toFixed(0)}/100`;

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center p-8 bg-blue-950 text-blue-50 rounded-xl my-8 border border-blue-900 shadow-lg">
      <div className="flex-1 min-w-[240px]">
        <h3 className="font-serif text-xl mb-2 text-nobel-gold">Readiness Benchmark Framing</h3>
        <p className="text-blue-100/70 text-sm mb-4 leading-relaxed">
          The final executive report uses benchmark context to show where an organisation sits today, where AI developing begins, and what AI proficient capability demands.
        </p>
        <div className="flex gap-2 mt-6">
          {[
            { key: 'gap', label: 'Current Gap' },
            { key: 'moderate', label: 'AI Developing Threshold' },
            { key: 'leading', label: 'AI Proficient Threshold' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setScenario(item.key as 'gap' | 'moderate' | 'leading')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 border ${scenario === item.key ? 'bg-nobel-gold text-white border-nobel-gold' : 'bg-transparent text-blue-100/70 border-blue-900 hover:border-blue-500 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-6 font-mono text-xs text-blue-100/70 flex items-center gap-2">
          <BarChart2 size={14} className="text-nobel-gold" />
          <span>READINESS SCORE (HIGHER IS BETTER)</span>
        </div>
      </div>

      <div className="relative w-64 h-72 bg-blue-900/40 rounded-xl border border-blue-800/60 p-6 flex justify-around items-end">
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none opacity-10">
          <div className="w-full h-[1px] bg-stone-400"></div>
          <div className="w-full h-[1px] bg-stone-400"></div>
          <div className="w-full h-[1px] bg-stone-400"></div>
          <div className="w-full h-[1px] bg-stone-400"></div>
        </div>

        <div className="w-20 flex flex-col justify-end items-center h-full z-10">
          <div className="flex-1 w-full flex items-end justify-center relative mb-3">
            <div className="absolute -top-5 w-full text-center text-sm font-mono text-blue-100 font-bold bg-blue-950/90 py-1 px-2 rounded backdrop-blur-sm border border-blue-800/60 shadow-sm">{formatValue(currentData.current)}</div>
            <motion.div
              className="w-full bg-blue-700 rounded-t-md border-t border-x border-blue-500/30"
              initial={{ height: 0 }}
              animate={{ height: `${(currentData.current / maxVal) * 100}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
            />
          </div>
          <div className="h-6 flex items-center text-[10px] font-bold text-blue-100/70 uppercase tracking-wider text-center">{currentData.currentLabel}</div>
        </div>

        <div className="w-20 flex flex-col justify-end items-center h-full z-10">
          <div className="flex-1 w-full flex items-end justify-center relative mb-3">
            <div className="absolute -top-5 w-full text-center text-sm font-mono text-nobel-gold font-bold bg-blue-950/90 py-1 px-2 rounded backdrop-blur-sm border border-nobel-gold/30 shadow-sm">{formatValue(currentData.benchmark)}</div>
            <motion.div
              className="w-full bg-nobel-gold rounded-t-md shadow-[0_0_20px_rgba(37,99,235,0.28)] relative overflow-hidden"
              initial={{ height: 0 }}
              animate={{ height: Math.max(1, (currentData.benchmark / maxVal) * 100) + '%' }}
              transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div>
            </motion.div>
          </div>
          <div className="h-6 flex items-center text-[10px] font-bold text-nobel-gold uppercase tracking-wider text-center">{currentData.benchmarkLabel}</div>
        </div>
      </div>
    </div>
  );
};
