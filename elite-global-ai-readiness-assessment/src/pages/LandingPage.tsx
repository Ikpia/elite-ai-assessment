import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe,
  LayoutDashboard,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";

import { MARKETING_SITE_URL } from "../lib/app/constants";

export function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <nav className="sticky top-0 z-50 glass border-b border-slate-200/50">
        <div className="section-container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-900 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              E
            </div>
            <span className="font-display font-extrabold text-xl tracking-tighter text-slate-900">
              ELITE GLOBAL AI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-500">
            <a href="#about" className="hover:text-brand-600 transition-colors">
              About
            </a>
            <a
              href="#dimensions"
              className="hover:text-brand-600 transition-colors"
            >
              Dimensions
            </a>
            <a
              href="#process"
              className="hover:text-brand-600 transition-colors"
            >
              Process
            </a>
            <Link
              to="/start"
              className="bg-brand-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-20 pb-32 md:pt-32 md:pb-48">
        <div className="section-container grid lg:grid-cols-12 gap-16 items-center">
          <motion.div
            className="lg:col-span-7 space-y-10"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-brand-600 text-xs font-bold uppercase tracking-widest"
            >
              <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
              2026 Global AI Benchmark
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-7xl md:text-8xl font-extrabold text-slate-900 leading-[0.95] tracking-tight"
            >
              Master the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-400">
                AI Frontier
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-500 leading-relaxed max-w-xl font-medium"
            >
              The definitive AI readiness diagnostic for high-performance teams.
              Benchmark your capabilities across 5 critical dimensions and
              receive a data-driven executive roadmap.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-5 pt-4"
            >
              <Link
                to="/start"
                className="btn-primary flex items-center justify-center gap-3 text-lg group"
              >
                Start Assessment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#about"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm"
              >
                View Methodology
              </a>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-10 pt-8 border-t border-slate-200"
            >
              <div>
                <div className="text-3xl font-extrabold text-slate-900">
                  500+
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Orgs Assessed
                </div>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <div className="text-3xl font-extrabold text-slate-900">
                  2026
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Benchmark Year
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <div className="relative z-10 glass p-8 rounded-[48px] border-white/40 shadow-2xl shadow-blue-900/10">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                    <div className="w-3 h-3 rounded-full bg-slate-200" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Diagnostic Dashboard
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Overall Readiness
                        </div>
                        <div className="text-4xl font-extrabold text-slate-900 tracking-tighter">
                          64.8
                          <span className="text-xl text-slate-400">/100</span>
                        </div>
                      </div>
                      <div className="text-green-500 font-bold text-sm flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" /> +12.4%
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-600"
                        initial={{ width: 0 }}
                        animate={{ width: "64.8%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        AI Literacy
                      </div>
                      <div className="text-2xl font-extrabold text-brand-600">
                        82%
                      </div>
                    </div>
                    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Data Quality
                      </div>
                      <div className="text-2xl font-extrabold text-slate-900">
                        41%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </section>

      <section id="about" className="py-32 bg-brand-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px"
            }}
          />
        </div>

        <div className="section-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
                The Cost of <br />
                <span className="text-blue-400">AI Inertia</span>
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed font-medium">
                Organisations failing to benchmark and upskill their teams face
                a widening productivity gap. Our data shows AI-proficient teams
                outperform peers by 5.3x in complex analysis tasks.
              </p>
              <div className="grid sm:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold">5.3x</div>
                  <div className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                    Productivity Gain
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold">18k</div>
                  <div className="text-sm text-slate-500 font-bold uppercase tracking-widest">
                    Hours Saved / Yr
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-10 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-sm">
                <div className="text-5xl font-extrabold text-blue-400 mb-2">
                  31
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Avg. Nigeria Score
                </div>
              </div>
              <div className="p-10 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-sm">
                <div className="text-5xl font-extrabold text-white mb-2">
                  68
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                  Avg. UK Score
                </div>
              </div>
              <div className="sm:col-span-2 p-10 bg-brand-600 rounded-[40px] shadow-2xl shadow-brand-600/20">
                <div className="text-5xl font-extrabold text-white mb-2">
                  37 Points
                </div>
                <div className="text-lg font-bold text-blue-100">
                  The current competitive gap in financial services
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="dimensions" className="py-40 bg-white">
        <div className="section-container">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-6">
            <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
              5 Pillars of Readiness
            </h2>
            <p className="text-xl text-slate-500 font-medium">
              We evaluate your organisation across the critical dimensions
              required for sustainable AI transformation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[
              {
                title: "AI Literacy",
                icon: <FileText className="w-6 h-6" />,
                desc: "Team understanding of AI concepts and capabilities."
              },
              {
                title: "Data Infrastructure",
                icon: <LayoutDashboard className="w-6 h-6" />,
                desc: "Quality, accessibility, and governance of your data."
              },
              {
                title: "AI Strategy",
                icon: <Target className="w-6 h-6" />,
                desc: "Leadership mandate and defined high-impact use cases."
              },
              {
                title: "Workflow Integration",
                icon: <Zap className="w-6 h-6" />,
                desc: "Adoption of AI tools into daily operational tasks."
              },
              {
                title: "Ethics & Compliance",
                icon: <ShieldCheck className="w-6 h-6" />,
                desc: "Responsible AI frameworks and risk mitigation."
              }
            ].map((dimension, index) => (
              <motion.div
                key={index}
                className="group p-10 rounded-[40px] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                whileHover={{ y: -10 }}
              >
                <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-brand-600 mb-8 group-hover:bg-brand-600 group-hover:text-white transition-all duration-500 shadow-sm">
                  {dimension.icon}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-4">
                  {dimension.title}
                </h3>
                <p className="text-slate-500 leading-relaxed font-medium text-sm">
                  {dimension.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="py-40 bg-slate-50">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-16">
              <div className="space-y-4">
                <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                  The Diagnostic Journey
                </h2>
                <p className="text-xl text-slate-500 font-medium">
                  A streamlined process designed for busy executives.
                </p>
              </div>

              <div className="space-y-12">
                {[
                  {
                    step: "01",
                    title: "Team Assessment",
                    desc: "Share your unique link with 5-20 key stakeholders. Each assessment takes ~8 minutes."
                  },
                  {
                    step: "02",
                    title: "Intelligent Synthesis",
                    desc: "Our engine anonymises data and benchmarks your results against industry leaders."
                  },
                  {
                    step: "03",
                    title: "Executive Diagnostic",
                    desc: "Receive a comprehensive PDF report with scores, gaps, and a strategic roadmap."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-10">
                    <div className="text-6xl font-extrabold text-slate-200 tracking-tighter">
                      {item.step}
                    </div>
                    <div className="space-y-2 pt-2">
                      <h3 className="text-2xl font-extrabold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-slate-500 leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-brand-600 rounded-[64px] rotate-3 opacity-5" />
              <div className="relative bg-white p-16 rounded-[64px] shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-10">
                <h3 className="text-3xl font-extrabold text-slate-900">
                  Ready to benchmark?
                </h3>
                <div className="space-y-6">
                  {[
                    "No login required for team members",
                    "100% Anonymised response data",
                    "Industry-specific benchmarks",
                    "Executive-ready PDF report"
                  ].map((text, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 text-slate-600 font-bold"
                    >
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      {text}
                    </div>
                  ))}
                  <div className="pt-6">
                    <Link
                      to="/start"
                      className="w-full btn-primary flex items-center justify-center gap-3 text-xl"
                    >
                      Start Assessment <ArrowRight className="w-6 h-6" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white py-24 border-t border-slate-100">
        <div className="section-container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-900 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                E
              </div>
              <span className="font-display font-extrabold text-xl tracking-tighter text-slate-900">
                ELITE GLOBAL AI
              </span>
            </div>
            <div className="flex gap-12 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <a
                href={MARKETING_SITE_URL}
                className="hover:text-brand-600 transition-colors"
              >
                Privacy
              </a>
              <a
                href={MARKETING_SITE_URL}
                className="hover:text-brand-600 transition-colors"
              >
                Terms
              </a>
              <a
                href="mailto:contact@eliteglobalai.com"
                className="hover:text-brand-600 transition-colors"
              >
                Contact
              </a>
            </div>
            <div className="text-sm font-bold text-slate-400">
              © 2026 Elite Global AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
