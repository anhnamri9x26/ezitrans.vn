'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, CreditCard } from 'lucide-react';

export default function BankTransferMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', closeOutside);
    window.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      window.removeEventListener('keydown', closeEscape);
    };
  }, []);

  return <div className="ezi-top-bank" ref={wrapperRef}>
    <button id="top-bank-transfer-toggle" type="button" aria-expanded={open} aria-controls="top-bank-transfer-panel" onClick={() => setOpen(value => !value)}>
      Thông tin CK <ChevronDown size={13} aria-hidden="true" />
    </button>
    <div id="top-bank-transfer-panel" className={`ezi-top-bank-panel ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="ezi-popover-title"><CreditCard size={16}/> Thông tin chuyển khoản</div>
      <div className="ezi-bank-card"><strong>Techcombank</strong><span>Nguyễn Thanh Hoa</span><b>19035085503031</b></div>
      <div className="ezi-bank-card"><strong>Vietcombank</strong><span>Nguyễn Thanh Hoa</span><b>0941000019297</b></div>
      <p className="ezi-bank-note">Vui lòng ghi rõ nội dung thanh toán để Ezitrans xác nhận nhanh chóng.</p>
    </div>
  </div>;
}
