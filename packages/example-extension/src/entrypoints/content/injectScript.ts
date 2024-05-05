import {PublicPath} from 'wxt/browser';

export default function injectScript(src: PublicPath) {
  const s = document.createElement('script');
  s.src = browser.runtime.getURL(src);
  s.type = 'module'; // ESM module support
  s.onload = () => s.remove();
  (document.head || document.documentElement).append(s);
}
