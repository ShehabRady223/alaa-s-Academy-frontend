import { Check, Copy, Printer } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, buttonClass } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/States';
import { AccessRow, qrUrl, useQrLink } from './api';

export function QrDialog({ row, onClose }: { row: AccessRow | null; onClose: () => void }) {
  return <Modal open={!!row} onClose={onClose} title="Exam QR code" size="sm">{row && <Body row={row} />}</Modal>;
}

function Body({ row }: { row: AccessRow }) {
  const navigate = useNavigate();
  const link = useQrLink(row.id, true);
  const [copied, setCopied] = useState(false);
  const bust = link.data?.slice(-8) ?? ''; // new token => new image, never a stale cached QR
  return (
    <div className="space-y-4">
      <div><p className="text-sm font-medium">{row.student.name}</p><p className="text-[13px] text-neutral-500">{row.exam.title}</p></div>
      <div className="flex justify-center rounded-md border border-neutral-200 bg-white p-3">
        {link.data ? <img src={qrUrl(row.id, 'svg', false, bust)} alt={`QR code for ${row.student.name}, ${row.exam.title}`} className="size-56" /> : <Skeleton className="size-56" />}
      </div>
      <div className="flex gap-2">
        <Input readOnly value={link.data ?? ''} aria-label="Exam link" onFocus={(e) => e.currentTarget.select()} />
        <Button aria-label="Copy link" disabled={!link.data} onClick={async () => { try { await navigator.clipboard.writeText(link.data!); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* select-and-copy still works */ } }}>
          {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a className={buttonClass('secondary', 'sm')} href={qrUrl(row.id, 'png', true)} download>Download PNG</a>
        <a className={buttonClass('secondary', 'sm')} href={qrUrl(row.id, 'svg', true)} download>Download SVG</a>
        <Button size="sm" variant="primary" onClick={() => navigate(`/admin/exam-access/print?ids=${row.id}`)}><Printer className="size-3.5" aria-hidden />Print</Button>
      </div>
      <p className="text-xs text-neutral-500">The QR code only works when {row.student.name.split(' ')[0]} is signed in to their own account, so a photo of it is no use to anyone else.</p>
    </div>
  );
}
