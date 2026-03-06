import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { usePills } from '../../hooks/usePills';
import { useAuth } from '../../context/AuthContext';
import { takePill, untakePill, deletePill } from '../../services/pills.service';
import { getApiError } from '../../utils/helpers';

import PillCard from './components/PillCard';
import PillDetailModal from './components/PillDetailModal';
import AddPillModal from '../pills/AddPillModal';

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="glass-card p-5 animate-pulse"
          style={{ minHeight: '180px' }}
        >
          <div className="h-5 bg-gray-200 dark:bg-slate-700/60 rounded-lg w-2/3 mb-3" />
          <div className="flex gap-2 mb-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-700/60 rounded-full w-16" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700/60 rounded-full w-16" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700/60 rounded-lg w-1/2 mb-6" />
          <div className="h-9 bg-gray-200 dark:bg-slate-700/60 rounded-xl w-full" />
        </div>
      ))}
    </div>
  );
}

function formatTodayDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

export default function DashboardPage() {
  const { pills, loading, refetch } = usePills();
  const { user } = useAuth();

  const [selectedPill, setSelectedPill] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleTake = async (pill) => {
    try {
      await takePill(pill._id);
      await refetch();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleUntake = async (pill) => {
    try {
      await untakePill(pill._id);
      await refetch();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleDelete = async (pill) => {
    try {
      await deletePill(pill._id);
      await refetch();
      setSelectedPill(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* No Resend API key warning */}
        {user && !user.hasResendKey && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            <span>⚠️ No Resend API key set — email reminders won't work.</span>
            <Link
              to="/settings"
              className="ml-auto shrink-0 font-semibold underline hover:text-amber-200 transition-colors"
            >
              Go to Settings →
            </Link>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">My Pills</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Today, {formatTodayDate()}</p>
          </div>
          <button
            className="btn-primary shrink-0"
            onClick={() => setShowAddModal(true)}
          >
            + Add Pill
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : pills.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="glass-card p-10 flex flex-col items-center gap-4 text-center max-w-sm w-full">
              <span className="text-5xl select-none" aria-hidden="true">💊</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-slate-200">No pills yet</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Start tracking your medication by adding your first pill.
              </p>
              <button
                className="btn-primary mt-2"
                onClick={() => setShowAddModal(true)}
              >
                Add your first pill
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pills.map((pill) => (
              <PillCard
                key={pill._id}
                pill={pill}
                onTake={handleTake}
                onUntake={handleUntake}
                onClick={() => setSelectedPill(pill)}
                onUpdate={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <PillDetailModal
        pill={selectedPill}
        isOpen={!!selectedPill}
        onClose={() => setSelectedPill(null)}
        onDelete={handleDelete}
      />

      <AddPillModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={refetch}
      />
    </div>
  );
}
