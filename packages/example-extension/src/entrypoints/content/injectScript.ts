import {PublicPath} from 'wxt/browser';

export default function injectScript(src: PublicPath) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = browser.runtime.getURL(src);
    s.type = 'module'; // ESM module support
    s.onload = () => {
      s.remove();
      // Giving the script a little time to execute before resolving
      setTimeout(() => {
        resolve();
      }, 100);
    };
    s.onerror = () => {
      s.remove();
      reject(new Error(`Failed to onject script: ${src}`));
    };
    (document.head || document.documentElement).append(s);
  });
}
