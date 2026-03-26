/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, BarChart2 } from 'lucide-react';

export const SurfaceCodeDiagram: React.FC = () => {
  const [errors, setErrors] = useState<number[]>([]);

  const adjacency: Record<number, number[]> = {
    0: [0, 1],
    1: [0, 2],
    2: [1, 3],
    3: [2, 3],
    4: [0, 1, 2, 3],
  };

  const toggleError = (id: number) => {
    setErrors(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const activeStabilizers = [0, 1, 2, 3].filter(stabId => {
    let errorCount = 0;
    Object.entries(adjacency).forEach(([dataId, stabs]) => {
      if (errors.includes(parseInt(dataId)) && stabs.includes(stabId)) {
        errorCount++;
      }
    });
    return errorCount % 2 !== 0;
  });

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-stone-200 my-8">
      <h3 className="font-serif text-xl mb-4 text-stone-800">Interactive: Capability Signal Map</h3>
      <p className="text-sm text-stone-500 mb-6 text-center max-w-md">
        Click the grey capability nodes to simulate gaps. The surrounding indicators light up as the platform surfaces pressure across <strong>leadership</strong>, <strong>data</strong>, <strong>workflow</strong>, and <strong>risk</strong>.
      </p>

      <div className="relative w-64 h-64 bg-[#F2F7FF] rounded-lg border border-blue-100 p-4 flex flex-wrap justify-between content-between relative">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
          <div className="w-2/3 h-2/3 border border-stone-400"></div>
          <div className="absolute w-full h-[1px] bg-stone-400"></div>
          <div className="absolute h-full w-[1px] bg-stone-400"></div>
        </div>

        {[
          {id: 0, x: '50%', y: '20%', type: 'L', color: 'bg-blue-500'},
          {id: 1, x: '20%', y: '50%', type: 'D', color: 'bg-sky-500'},
          {id: 2, x: '80%', y: '50%', type: 'W', color: 'bg-sky-500'},
          {id: 3, x: '50%', y: '80%', type: 'R', color: 'bg-blue-500'},
        ].map(signal => (
          <motion.div
            key={`signal-${signal.id}`}
            className={`absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center text-white text-xs font-bold rounded-sm shadow-sm transition-all duration-300 ${activeStabilizers.includes(signal.id) ? signal.color + ' opacity-100 scale-110 ring-4 ring-offset-2 ring-stone-200' : 'bg-stone-300 opacity-40'}`}
            style={{ left: signal.x, top: signal.y }}
          >
            {signal.type}
          </motion.div>
        ))}

        {[
          {id: 0, x: '20%', y: '20%'}, {id: 1, x: '80%', y: '20%'},
          {id: 4, x: '50%', y: '50%'},
          {id: 2, x: '20%', y: '80%'}, {id: 3, x: '80%', y: '80%'},
        ].map(node => (
          <button
            key={`node-${node.id}`}
            onClick={() => toggleError(node.id)}
            className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 z-10 ${errors.includes(node.id) ? 'bg-blue-900 border-blue-950 text-blue-100' : 'bg-white border-stone-300 hover:border-blue-400'}`}
            style={{ left: node.x, top: node.y }}
          >
            {errors.includes(node.id) && <Activity size={14} />}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4 text-xs font-mono text-stone-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-900"></div> Gap</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-500"></div> Leadership / Risk</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-sky-500"></div> Data / Workflow</div>
      </div>

      <div className="mt-4 h-6 text-sm font-serif italic text-stone-600">
        {errors.length === 0 ? "No critical capability gaps selected." : `The platform has surfaced ${activeStabilizers.length} connected risk signals.`}
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
