import { motion } from 'motion/react';
import { ClipboardList, Play, CheckCircle, Flame, AlertTriangle } from 'lucide-react';
import { Task } from '../types';

interface StatsGridProps {
  tasks: Task[];
}

export default function StatsGrid({ tasks }: StatsGridProps) {
  const total = tasks.length;
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

  const now = new Date();
  const overdueCount = tasks.filter(t => {
    if (t.status === 'completed' || !t.dueDate) return false;
    return new Date(t.dueDate) < now;
  }).length;

  const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120 } }
  };

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 font-sans"
      id="stats-panel-grid"
    >
      {/* KPI Card 1: Total */}
      <motion.div
        variants={cardVariants}
        className="p-5 backdrop-blur-md bg-white/60 dark:bg-zinc-900/40 border border-white/50 dark:border-zinc-800/45 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="p-2 rounded-2xl bg-neutral-100/80 dark:bg-zinc-800/60 text-neutral-500 dark:text-zinc-400">
            <ClipboardList className="w-4 h-4 stroke-[1.5]" />
          </div>
          <span className="text-[9px] font-bold tracking-widest text-neutral-400 dark:text-zinc-500 uppercase font-sans">SUMMARY</span>
        </div>
        <p className="text-xs font-medium text-neutral-450 dark:text-zinc-450">Total Tasks</p>
        <p className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white mt-1 font-sans">{total}</p>
      </motion.div>

      {/* KPI Card 2: In Progress */}
      <motion.div
        variants={cardVariants}
        className="p-5 backdrop-blur-md bg-white/60 dark:bg-zinc-900/40 border border-white/50 dark:border-zinc-800/45 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Play className="w-4 h-4 stroke-[1.5]" />
          </div>
          <span className="text-[9px] font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase font-sans">ACTIVE</span>
        </div>
        <p className="text-xs font-medium text-neutral-455 dark:text-zinc-450">In Progress</p>
        <p className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white mt-1 font-sans">{inProgressCount}</p>
      </motion.div>

      {/* KPI Card 3: High Priority Urgent */}
      <motion.div
        variants={cardVariants}
        className="p-5 backdrop-blur-md bg-white/60 dark:bg-zinc-900/40 border border-white/50 dark:border-zinc-800/45 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Flame className="w-4 h-4 stroke-[1.5]" />
          </div>
          <span className="text-[9px] font-bold tracking-widest text-rose-600 dark:text-rose-450 uppercase font-sans">CRITICAL</span>
        </div>
        <p className="text-xs font-medium text-neutral-455 dark:text-zinc-450">High Priority</p>
        <p className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white mt-1 font-sans">{highPriorityCount}</p>
      </motion.div>

      {/* KPI Card 4: Overdue Alert */}
      <motion.div
        variants={cardVariants}
        className={`p-5 backdrop-blur-md bg-white/60 dark:bg-zinc-900/40 border rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300 ${
          overdueCount > 0 
            ? 'border-red-500/30' 
            : 'border-white/50 dark:border-zinc-800/45'
        }`}
      >
        <div className="flex items-center justify-between mb-3.5">
          <div className={`p-2 rounded-2xl ${
            overdueCount > 0 
              ? 'bg-red-500/10 text-red-500' 
              : 'bg-neutral-100/80 dark:bg-zinc-800/60 text-neutral-500'
          }`}>
            <AlertTriangle className="w-4 h-4 stroke-[1.5]" />
          </div>
          <span className={`text-[9.5px] font-bold tracking-widest uppercase font-sans ${
            overdueCount > 0 ? 'text-red-500 animate-pulse' : 'text-neutral-400'
          }`}>{overdueCount > 0 ? 'OVERDUE' : 'NOMINAL'}</span>
        </div>
        <p className="text-xs font-medium text-neutral-455 dark:text-zinc-450">Past Due Date</p>
        <p className={`text-3xl font-semibold tracking-tight mt-1 font-sans ${
          overdueCount > 0 ? 'text-red-650 dark:text-red-400' : 'text-neutral-900 dark:text-white'
        }`}>{overdueCount}</p>
      </motion.div>

      {/* KPI Card 5: Progress completion bar */}
      <motion.div
        variants={cardVariants}
        className="p-5 backdrop-blur-md bg-white/60 dark:bg-zinc-900/40 border border-white/50 dark:border-zinc-800/45 rounded-3xl col-span-2 lg:col-span-1 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4 stroke-[1.5]" />
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{completionPercentage}%</span>
        </div>
        <p className="text-xs font-medium text-neutral-455 dark:text-zinc-450">Completion Ratio</p>
        
        {/* Fine Single Line Progress Bar */}
        <div className="w-full bg-neutral-200/50 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
          />
        </div>
        <p className="text-[10px] text-neutral-400 dark:text-zinc-500 mt-2 text-right font-mono">
          {completedCount}/{total} done
        </p>
      </motion.div>
    </motion.div>
  );
}
