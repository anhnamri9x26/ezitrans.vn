import { parsePermalinkStructure, generatePostUrl } from '../src/lib/permalink'; 
console.log('parse /%postname%.html =>', parsePermalinkStructure('/quy-trinh-san-xuat-thep-hop-kim-dat-chuan', '/%postname%.html')); 
console.log('parse /%postname% =>', parsePermalinkStructure('/quy-trinh-san-xuat-thep-hop-kim-dat-chuan', '/%postname%')); 
console.log('generatePostUrl =>', generatePostUrl({ id: 1, slug: 'quy-trinh-san-xuat-thep-hop-kim-dat-chuan', createdAt: new Date(), type: 'PAGE' }, '/%postname%.html', '/san-pham'));
