import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, FileText, ListChecks, TriangleAlert } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/States';
import { useAuth } from '@/store/auth';
import { AccessInfo, RunnerData } from './types';

const TITLES: Record<string, string> = {
  LINK_INVALID: "This link isn't valid", NOT_YOUR_EXAM: 'This exam belongs to another account', LINK_REVOKED: 'This exam was withdrawn',
  LINK_EXPIRED: 'This link has expired', EXAM_NOT_OPEN: "This exam isn't open yet", EXAM_EXPIRED: 'This exam is closed', EXAM_UNAVAILABLE: 'This exam is not available',
};

export function AccessPage() {
  const token = useParams().token as string;
  const navigate = useNavigate(); const qc = useQueryClient(); const { logout } = useAuth();
  const q = useQuery({ queryKey: ['access', token], retry: false, staleTime: 0, refetchOnWindowFocus: false, queryFn: async () => (await api.post<AccessInfo>('/exam-access/enter', { token })).data });
  const start = useMutation({
    mutationFn: async () => (await api.post<RunnerData>('/attempts/start', { token })).data,
    onSuccess: (d) => { qc.setQueryData(['attempt', d.attemptId], d); navigate(`/exam/run/${d.attemptId}`); },
  });

  if (q.isPending) return <Card className="space-y-3 p-6"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></Card>;
  if (q.isError) {
    const e = q.error instanceof ApiError ? q.error : null;
    return (
      <Card className="p-6">
        <TriangleAlert className="mb-3 size-6 text-amber-600" aria-hidden />
        <h1 className="text-lg font-semibold">{TITLES[e?.code ?? ''] ?? "We couldn't open this exam"}</h1>
        <p className="mt-1 text-sm text-neutral-600">{e?.message ?? 'Something went wrong. Check your connection and try again.'}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {e?.code === 'NOT_YOUR_EXAM' && <Button variant="primary" onClick={() => void logout()}>Sign out and use my own account</Button>}
          {!e || e.status === 0 || e.status >= 500 ? <Button variant="primary" onClick={() => void q.refetch()}>Try again</Button> : null}
          <Link to="/me" className="inline-flex h-9 items-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium hover:bg-neutral-50">Go to my exams</Link>
        </div>
      </Card>
    );
  }

  const d = q.data; const ex = d.exam;
  const startErr = start.error instanceof ApiError ? start.error.message : start.isError ? 'Something went wrong. Please try again.' : null;
  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold">{ex.title}</h1>
      {ex.description && <p className="mt-1 text-sm text-neutral-600">{ex.description}</p>}
      <dl className="mt-5 grid grid-cols-3 divide-x divide-neutral-200 rounded-md border border-neutral-200 text-center">
        {[[ListChecks, `${ex.questionCount}`, 'Questions'], [Clock, ex.durationMinutes ? `${ex.durationMinutes} min` : 'No limit', 'Time'], [FileText, `${ex.passingScore}%`, 'To pass']].map(([Icon, v, l], i) => {
          const I = Icon as typeof Clock;
          return <div key={i} className="px-2 py-3"><I className="mx-auto mb-1 size-4 text-neutral-400" aria-hidden /><dd className="tabular text-base font-semibold">{v as string}</dd><dt className="text-xs text-neutral-500">{l as string}</dt></div>;
        })}
      </dl>
      {ex.instructions && <div className="mt-5"><h2 className="text-sm font-semibold">Instructions</h2><p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{ex.instructions}</p></div>}
      <ul className="mt-5 space-y-1.5 text-[13px] text-neutral-600">
        {ex.durationMinutes && <li>The timer starts when you press the button and keeps running if you close the page.</li>}
        <li>Your answers are saved automatically as you go.</li>
        <li>Attempts used: {d.attemptsUsed} of {d.maxAttempts}.</li>
      </ul>
      {startErr && <p role="alert" className="mt-4 text-sm text-red-600">{startErr}</p>}
      <div className="mt-6">
        {d.canStart ? (
          <Button variant="primary" className="w-full sm:w-auto" loading={start.isPending} onClick={() => start.mutate()}>{d.inProgressAttemptId ? 'Continue exam' : d.attemptsUsed > 0 ? 'Start another attempt' : 'Start exam'}</Button>
        ) : (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm"><p className="font-medium">You've used all your attempts.</p>
            {d.lastAttemptId && <Link to={`/exam/result/${d.lastAttemptId}`} className="mt-1 inline-block font-medium text-brand-700 hover:underline">See your result</Link>}</div>
        )}
      </div>
    </Card>
  );
}
