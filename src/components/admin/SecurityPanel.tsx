import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/site/InquiryForm';

export function SecurityPanel() {
  const [current, setCurrent] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [busy, setBusy] = useState(false);
  return <form className="max-w-md space-y-5" onSubmit={async e => { e.preventDefault(); if (password.length < 8 || password !== confirmPassword || !current) return void toast.error('أدخل كلمة المرور الحالية وكلمة جديدة من 8 أحرف على الأقل مع تأكيد مطابق'); setBusy(true); const { error } = await supabase.auth.updateUser({ password, current_password: current }); setBusy(false); if (error) toast.error('تعذر تغيير كلمة المرور. راجع كلمة المرور الحالية.'); else { setCurrent(''); setPassword(''); setConfirmPassword(''); toast.success('تم تغيير كلمة المرور'); } }}><h3 className="text-xl font-semibold">تغيير كلمة المرور</h3><FormField label="كلمة المرور الحالية"><input className="field" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} /></FormField><FormField label="كلمة المرور الجديدة"><input className="field" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></FormField><FormField label="تأكيد كلمة المرور الجديدة"><input className="field" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></FormField><Button disabled={busy} type="submit">حفظ كلمة المرور</Button></form>;
}