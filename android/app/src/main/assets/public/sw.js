/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "77800bc9d83b3d3ccdc9f58b332818d7"
  }, {
    "url": "pwa-512x512.png",
    "revision": "f97950586423a022301aac298a6ea4f8"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c2e5bb980cec754521e4382c6513fa29"
  }, {
    "url": "index.html",
    "revision": "8851fa20d3135bc3085b22e00b5bccae"
  }, {
    "url": "icon.svg",
    "revision": "6adc14504ad2b5d6ec8af75d5bba756b"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ba5ef5aa4eb46bda3588ca1e1eddc7db"
  }, {
    "url": "src/assets/images/onboarding_schedule_1795238348212.jpg",
    "revision": "1980a0fe7ae9dbd595de916467ffc92e"
  }, {
    "url": "src/assets/images/onboarding_analytics_1795238347972.jpg",
    "revision": "75bebc46b791692e9a945445a6bb0162"
  }, {
    "url": "src/assets/images/default_avatar_1795238348556.jpg",
    "revision": "b2201b4551645e17d734505790fa40fd"
  }, {
    "url": "assets/index-GfQ6SmiO.css",
    "revision": null
  }, {
    "url": "assets/index-D6LLDf7Z.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ba5ef5aa4eb46bda3588ca1e1eddc7db"
  }, {
    "url": "icon.svg",
    "revision": "6adc14504ad2b5d6ec8af75d5bba756b"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c2e5bb980cec754521e4382c6513fa29"
  }, {
    "url": "pwa-512x512.png",
    "revision": "f97950586423a022301aac298a6ea4f8"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "77800bc9d83b3d3ccdc9f58b332818d7"
  }, {
    "url": "manifest.webmanifest",
    "revision": "4ff83447cae1ac7d1db25576eaf1cc4b"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
