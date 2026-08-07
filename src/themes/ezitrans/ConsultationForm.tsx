'use client';
import { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';

export default function ConsultationForm({ serviceTitle = 'Dịch vụ Ezitrans' }: { serviceTitle?: string }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<'idle'|'success'|'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [startedAt] = useState(() => Date.now());
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setStatus('idle'); setErrorMessage('');
    const form = event.currentTarget;
    const rawFields = Object.fromEntries(new FormData(form).entries());
    const { website, ...formFields } = rawFields;
    const fields = { ...formFields, dich_vu: serviceTitle };
    try {
      const response = await fetch('/api/forms/submit', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ formId: 'ezitrans-service-consultation', pageUrl: window.location.href, fields, website, startedAt }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Gửi chưa thành công.');
      form.reset(); setStatus('success');
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Gửi chưa thành công.'); setStatus('error'); } finally { setPending(false); }
  }
  return <section className="ezi-consultation"><div className="ezi-consultation-copy"><span className="ezi-eyebrow">Tư vấn miễn phí</span><h2>Bạn cần báo giá cho dịch vụ này?</h2><p>Để lại thông tin, chuyên viên Ezitrans sẽ gọi lại và tư vấn phương án tối ưu.</p></div><form className="ezi-consultation-form" onSubmit={submit}><label htmlFor="consult-name">Họ và tên *</label><input id="consult-name" name="ho_ten" required minLength={2} maxLength={120} autoComplete="name" placeholder="Nguyễn Văn A"/><label htmlFor="consult-phone">Số điện thoại *</label><input id="consult-phone" name="so_dien_thoai" required inputMode="tel" pattern="[0-9+ .-]{8,16}" autoComplete="tel" placeholder="0868 375 300"/><label htmlFor="consult-need">Nhu cầu tư vấn</label><select id="consult-need" name="nhu_cau" defaultValue="Báo giá dịch vụ"><option>Báo giá dịch vụ</option><option>Mua hộ hàng hóa</option><option>Vận chuyển quốc tế</option><option>Xuất khẩu hàng hóa</option></select><label htmlFor="consult-message">Ghi chú</label><textarea id="consult-message" name="noi_dung" maxLength={5000} rows={3} placeholder="Quốc gia, loại hàng, số lượng dự kiến..."/><label aria-hidden="true" style={{position:'absolute',left:'-10000px',width:1,height:1,overflow:'hidden'}}>Website<input name="website" tabIndex={-1} autoComplete="off"/></label><button id="consultation-submit" type="submit" className="ezi-btn ezi-btn-orange" disabled={pending} aria-busy={pending}>{pending?<Loader2 className="ezi-spin" size={16}/>:<Send size={16}/>} {pending?'Đang gửi...':'Nhận tư vấn ngay'}</button><div className="ezi-form-status" aria-live="polite">{status==='success'&&<p className="success"><CheckCircle2 size={17}/> Đã gửi yêu cầu. Ezitrans sẽ sớm liên hệ!</p>}{status==='error'&&<p className="error"><AlertCircle size={17}/> {errorMessage || 'Gửi chưa thành công. Vui lòng thử lại.'}</p>}</div></form></section>;
}
