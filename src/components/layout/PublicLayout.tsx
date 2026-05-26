// ========================================
// PublicLayout — 公开页面布局（登录页、画廊页等）
// ========================================
import { Outlet } from 'react-router-dom';
import SiteFooter from './SiteFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
