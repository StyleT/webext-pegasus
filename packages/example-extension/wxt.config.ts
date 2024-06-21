import path from 'path';
import {defineConfig, UserManifest} from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  debug: !!process.env.DEBUG_WXT,
  manifest: (configEnv) => {
    const manifestConf: UserManifest = {
      permissions: ['tabs', 'storage'],
      web_accessible_resources: [
        {
          extension_ids: [],
          matches: ['<all_urls>'],
          resources: ['injected.js'],
        },
      ],
    };

    if (configEnv.mode === 'development') {
      // When building the local development version of the
      // extension we want to be able to have a stable extension ID
      // for the local build (in order to be able to reliably detect
      // duplicate installations of DevTools).
      // By specifying a key in the built manifest.json file,
      // we can make it so the generated extension ID is stable.
      // For more details see the docs here: https://developer.chrome.com/docs/extensions/reference/manifest/key
      // Generated via:
      // $ openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem # private key
      // $ openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A # this key below (strip % at the end)
      // $ openssl rsa -in key.pem -pubout -outform DER | shasum -a 256 | head -c32 | tr 0-9a-f a-p # extension ID
      // @ts-expect-error https://github.com/wxt-dev/wxt/issues/521#issuecomment-1978147707
      manifestConf.key =
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsN0MQV8uaoI85w2gAdEW/OH3YmYtCqiQLJA2FVPppDMwwJww7sIv/Yq43n25ngpLq7sV2eGvcKgr4uqfBuTsJ+nJ9pTlc/Er1SN1r151LG8rhm79pvutLFh6ps7OZRMjLR4jQyuEjFTeyc11HV3oFhAkne/L+par8u4KzmZWgCPVMHKZCOe2eSoTgaImd9jDx9vmWQm0qA1RfYs18JBesVVbaLuVyf9s86KujxYsX3VPOWbJbe9ZqxDtNbhf4gOb8+EU0tT6l/9m1BmpeENF9QKwnHPEzJkBtEAGqo47d+QPd2Ha4wHTOLc7pgIX4Ko4j2SupLUZqjoYKOSm2LxghQIDAQAB';
    }

    return manifestConf;
  },
  modules: ['@wxt-dev/module-react'],
  runner: {
    binaries: {
      edge: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    },
    chromiumArgs: [
      '--auto-open-devtools-for-tabs',
      // Open chrome://version to validate it works
      // We use this instead of chromiumProfile because of https://github.com/wxt-dev/wxt/issues/366
      `--user-data-dir=${path.join(__dirname, '.browser-profiles/chromium')}`,
      '--hide-crash-restore-bubble',
      '--enable-extension-activity-logging',
    ],
    startUrls: [
      'https://www.example.com/',
      'about:debugging#/runtime/this-firefox',
      // Doesn't work due to https://github.com/mozilla/web-ext/pull/2774
      // 'chrome://inspect/#service-workers',
    ],
  },
  srcDir: './src',
});
