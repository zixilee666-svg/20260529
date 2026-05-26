// ========================================
// SiteFooter — 网站底部备案信息组件
// ========================================
export default function SiteFooter() {
  return (
    <footer className="border-t border-primary-100 dark:border-primary-700 bg-white/80 dark:bg-primary-800/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-500 dark:text-primary-400">
          <p className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} Academic Hub. All rights reserved.</span>
          </p>
          <div className="flex items-center gap-4">
            <a 
              href="https://beian.miit.gov.cn/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              粤ICP备2026052655号-1
            </a>
            <span className="text-primary-300 dark:text-primary-600">|</span>
            <a 
              href="https://beian.mps.gov.cn/#/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              公安备案
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
