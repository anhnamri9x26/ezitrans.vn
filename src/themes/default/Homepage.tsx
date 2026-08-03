import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle2, Layers3, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import Header from './Header';import Footer from './Footer';import {generatePostUrl,formatDateWordPress} from '@/lib/permalink';import './starter.css';
export default function Homepage({posts=[],settings={},skipHeader=false,skipFooter=false}:{posts:any[];settings:Record<string,string>;skipHeader?:boolean;skipFooter?:boolean}){
 const title=settings.site_title||'Website',tagline=settings.site_tagline||'';
 const primary=settings.theme_default_primary_color||'#6d5dfc',accent=settings.theme_default_accent_color||'#1bc5bd';
 const eyebrow=settings.theme_default_hero_eyebrow||'Nền tảng cho ý tưởng của bạn';
 const heading=settings.theme_default_hero_heading||title;
 const description=settings.theme_default_hero_description||tagline;
 const ctaLabel=settings.theme_default_hero_cta_label||'',ctaUrl=settings.theme_default_hero_cta_url||'/lien-he';
 const secondaryLabel=settings.theme_default_hero_secondary_label||'',secondaryUrl=settings.theme_default_hero_secondary_url||'/bai-viet';
 const features=[
  {icon:<Sparkles size={21}/>,title:settings.theme_default_feature_1_title||'Trải nghiệm rõ ràng',description:settings.theme_default_feature_1_description||'Một giao diện tinh gọn, dễ tiếp cận và sẵn sàng thích nghi với nội dung của bạn.'},
  {icon:<Zap size={21}/>,title:settings.theme_default_feature_2_title||'Hiệu suất tối ưu',description:settings.theme_default_feature_2_description||'Cấu trúc hiện đại giúp nội dung tải nhanh và hoạt động tốt trên mọi thiết bị.'},
  {icon:<ShieldCheck size={21}/>,title:settings.theme_default_feature_3_title||'Nền tảng tin cậy',description:settings.theme_default_feature_3_description||'Identity, SEO và cấu hình được quản lý tập trung, không phụ thuộc dữ liệu mẫu.'},
 ];
 return <div className="starter" style={{'--starter-primary':primary,'--starter-accent':accent} as React.CSSProperties}>
  {!skipHeader&&<Header settings={settings}/>}<main>
   <section className="starter-hero" id="starter-hero"><div className="starter-container starter-hero-grid"><div>
    <span className="starter-eyebrow"><Sparkles size={13}/>{eyebrow}</span><h1>{heading}<br/>{tagline&&heading!==tagline&&<span className="starter-gradient-text">{tagline}</span>}</h1>{description&&<p className="starter-lead">{description}</p>}
    {(ctaLabel||secondaryLabel)&&<div className="starter-actions">{ctaLabel&&<Link className="starter-btn starter-btn-primary" href={ctaUrl}>{ctaLabel}<ArrowRight size={16}/></Link>}{secondaryLabel&&<Link className="starter-btn starter-btn-secondary" href={secondaryUrl}>{secondaryLabel}</Link>}</div>}
   </div><div className="starter-visual" aria-hidden="true"><div className="starter-orb starter-orb-one"/><div className="starter-orb starter-orb-two"/><div className="starter-glass"><div className="starter-glass-top"><span className="starter-dot"/><span className="starter-dot"/><span className="starter-dot"/></div><div className="starter-card-line short"/><div className="starter-card-line"/><div className="starter-card-line"/><div className="starter-metric-grid"><div className="starter-metric"><strong>100%</strong><span>Responsive</span></div><div className="starter-metric"><strong>SEO</strong><span>Ready</span></div></div></div></div>
   </div></section>
   <section className="starter-section" id="starter-features"><div className="starter-container"><div className="starter-section-head"><div><span className="starter-eyebrow"><Layers3 size={13}/>Khởi đầu vững chắc</span><h2>{settings.theme_default_features_title||'Mọi thứ cần thiết để bắt đầu'}</h2></div><p>{settings.theme_default_features_description||'Các thành phần cốt lõi được thiết kế để website có thể phát triển theo thương hiệu và nội dung thực tế của bạn.'}</p></div><div className="starter-feature-grid">{features.map((item,index)=><article className="starter-feature" key={index}><div className="starter-feature-icon">{item.icon}</div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></div></section>
   <section className="starter-section starter-section-alt" id="starter-posts"><div className="starter-container"><div className="starter-section-head"><div><span className="starter-eyebrow"><CheckCircle2 size={13}/>Nội dung mới</span><h2>{settings.theme_default_posts_title||'Bài viết mới nhất'}</h2></div></div>{posts.length?<div className="starter-post-grid">{posts.slice(0,3).map(post=>{const href=generatePostUrl(post,settings.permalink_structure||'/%postname%.html');return <article className="starter-post" key={post.id}><Link href={href} className="starter-post-media">{post.featuredImage?.url&&<img src={post.featuredImage.url} alt={post.title}/>}</Link><div className="starter-post-body"><span className="starter-post-meta"><Calendar size={12} style={{display:'inline',marginRight:5}}/>{formatDateWordPress(post.createdAt,settings.date_format||'d/m/Y',settings.site_language||'vi')}</span><h3><Link href={href}>{post.title}</Link></h3>{post.excerpt&&<p>{post.excerpt}</p>}</div></article>})}</div>:<div className="starter-empty">Nội dung sẽ xuất hiện tại đây sau khi bạn xuất bản bài viết đầu tiên.</div>}</div></section>
  </main>{!skipFooter&&<Footer settings={settings}/>}</div>
}
