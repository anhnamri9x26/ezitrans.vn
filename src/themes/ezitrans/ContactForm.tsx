'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Send, AlertCircle } from 'lucide-react';

export default function ContactForm() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<'idle'|'success'|'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [request, setRequest] = useState('');
  const [startedAt] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRequest(new URLSearchParams(window.location.search).get('link') || '');
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true); setStatus('idle'); setErrorMessage('');
    const form = e.currentTarget;
    const rawFields = Object.fromEntries(new FormData(form).entries());
    const { website, ...fields } = rawFields;
    try {
      const res = await fetch('/api/forms/submit', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
        formId:'ezitrans-contact', pageUrl:window.location.href, fields, website, startedAt
      })});
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Chưa thể gửi yêu cầu.');
      setStatus('success'); form.reset(); setRequest('');
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Chưa thể gửi yêu cầu.'); setStatus('error'); } finally { setPending(false); }
  }

  return <form className="ezi-contact-form" onSubmit={submit}>
    <div className="ezi-contact-form-head"><span>Gửi yêu cầu tư vấn</span><h2>Chúng tôi sẵn sàng hỗ trợ bạn</h2><p>Điền thông tin, chuyên viên Ezitrans sẽ phản hồi trong thời gian sớm nhất.</p></div>
    <div className="ezi-contact-fields">
      <label>Họ và tên *<input name="ho_ten" required minLength={2} maxLength={120} autoComplete="name" placeholder="Nguyễn Văn A" /></label>
      <label>Số điện thoại *<input name="so_dien_thoai" required pattern="[0-9+ .-]{8,16}" inputMode="tel" autoComplete="tel" placeholder="0868 375 300" /></label>
      <label>Email<input name="email" type="email" maxLength={254} autoComplete="email" placeholder="email@domain.com" /></label>
      <label>Chủ đề<select name="chu_de" defaultValue="Tư vấn dịch vụ"><option>Tư vấn dịch vụ</option><option>Yêu cầu báo giá</option><option>Tra cứu đơn hàng</option><option>Hợp tác doanh nghiệp</option></select></label>
      <label className="ezi-contact-field-wide">Nội dung yêu cầu *<textarea name="noi_dung" required minLength={10} maxLength={5000} rows={5} value={request} onChange={e=>setRequest(e.target.value)} placeholder="Hãy mô tả nhu cầu của bạn..." /></label>
      <label aria-hidden="true" style={{position:'absolute',left:'-10000px',width:1,height:1,overflow:'hidden'}}>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    </div>
    <button id="contact-submit-button" type="submit" className="ezi-btn ezi-btn-primary ezi-contact-submit" disabled={pending} aria-busy={pending}>{pending?<Loader2 className="ezi-spin" size={16}/>:<Send size={16}/>} {pending?'Đang gửi...':'Gửi yêu cầu ngay'}</button>
    <div className="ezi-form-status" aria-live="polite">
      {status==='success'&&<p className="ezi-contact-notice success"><CheckCircle2 size={17}/> Yêu cầu đã được gửi thành công. Chúng tôi sẽ sớm liên hệ!</p>}
      {status==='error'&&<p className="ezi-contact-notice error"><AlertCircle size={17}/> {errorMessage || 'Chưa thể gửi yêu cầu. Vui lòng thử lại hoặc gọi hotline.'}</p>}
    </div>
  </form>;
}
