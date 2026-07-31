import Header from './Header'; import Footer from './Footer'; import ContactForm from './ContactForm'; import Breadcrumbs from '@/components/Breadcrumbs';
import { Mail, MapPin, Phone } from 'lucide-react';
export default function ContactPage({post,settings={}}:{post:any;settings?:Record<string,string>}) {
 const phone=settings.contact_hotline_1 || settings.contact_phone || '0868.375.300';
 const email=settings.admin_email || settings.site_email || 'ezitrans.vn@gmail.com';
 const address=settings.contact_address || settings.footer_address || 'Số 8, Ngõ 79/14 Đường Quảng Khánh, Tây Hồ, Hà Nội';
 return (
  <div className="ezi-theme">
   <Header settings={settings}/>

   <section className="ezi-post-hero ezi-page-hero ezi-contact-hero-simple">
    <div className="ezi-container">
     <div className="ezi-post-hero-breadcrumbs">
      <Breadcrumbs settings={settings} items={[{label: settings.seo_breadcrumbs_home || 'Trang chủ', url:'/'},{label: post?.title || 'Liên hệ'}]}/>
     </div>
     <h1 style={{ marginInline: 'auto' }}>{post?.title || 'Liên hệ'}</h1>
     <div className="ezi-contact-hero-divider" />
    </div>
   </section>

   <main className="ezi-contact-main-simple">
    <div className="ezi-container">
     <div className="ezi-contact-grid-simple">
      {/* Left side: contact details */}
      <section className="ezi-contact-info-simple">
       <h2>Thông tin liên hệ</h2>
       <p className="ezi-contact-intro-text">
        Hãy kết nối với chúng tôi qua các kênh trực tiếp hoặc để lại yêu cầu tư vấn tại form bên cạnh.
       </p>
       <div className="ezi-contact-details-list">
        <div className="ezi-contact-detail-item">
         <div className="ezi-contact-icon-circle"><Phone size={18}/></div>
         <div>
          <span>Hotline & Zalo</span>
          <strong><a href={`tel:${phone.replace(/\D/g,'')}`}>{phone}</a></strong>
         </div>
        </div>
        <div className="ezi-contact-detail-item">
         <div className="ezi-contact-icon-circle"><Mail size={18}/></div>
         <div>
          <span>Email</span>
          <strong><a href={`mailto:${email}`}>{email}</a></strong>
         </div>
        </div>
        <div className="ezi-contact-detail-item">
         <div className="ezi-contact-icon-circle"><MapPin size={18}/></div>
         <div>
          <span>Văn phòng</span>
          <strong>{address}</strong>
          {settings.contact_map && (
           <a className="ezi-contact-map-link" href={settings.contact_map} target="_blank" rel="noreferrer">
            Mở Google Maps →
           </a>
          )}
         </div>
        </div>
       </div>
      </section>

      {/* Right side: form */}
      <div className="ezi-contact-form-wrapper-simple">
       <ContactForm/>
      </div>
     </div>
    </div>
   </main>

   <Footer settings={settings}/>
  </div>
 );
}
