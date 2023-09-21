/*
Copyright 2018 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// importScripts('./sw/workbox-v5.1.4/workbox-sw.js');

// if (workbox) {
//     console.log(`Yay! Workbox is loaded 🎉`);
//     // workbox.setConfig({debug:false})
//     console.log("workbox.strategies",workbox.strategies)
//     console.log("workbox.routing",workbox.routing)
//     console.log("workbox.expiration",workbox.expiration)
// } else {
//     console.log(`Boo! Workbox didn't load 😬`);
// }




// workbox.routing.registerRoute(
//     new RegExp('.*\.js'),
//     new workbox.strategies.StaleWhileRevalidate({
//         // Use a custom cache name.
//         cacheName: 'js-cache',
//     })
// );


// workbox.routing.registerRoute(
//   new RegExp('geoserver'),
//   new workbox.strategies.StaleWhileRevalidate({
//     // Use a custom cache name.
//     cacheName: 'geoserver',
//   })
// );




// workbox.routing.registerRoute(
//     ({request}) => request.destination === 'style',
//     // Use cache but update in the background.
//     new workbox.strategies.StaleWhileRevalidate({
//         // Use a custom cache name.
//         cacheName: 'css-cache',
//     })
// );

// workbox.routing.registerRoute(
//   new RegExp('.*\.b3dm'),
//   new workbox.strategies.CacheFirst({
//     // Use a custom cache name.
//     cacheName: 'b3dm-cache',
//   })
// );


// workbox.routing.registerRoute(
//     // Cache image files
//     /.*\.(?:png|jpg|jpeg|svg|gif)/,
//     // Use the cache if it's available
//     new workbox.strategies.CacheFirst({
//         // Use a custom cache name
//         cacheName: 'image-cache',
//         plugins: [
//             new workbox.expiration.ExpirationPlugin({
//                 // Cache only 20 images
//                 maxEntries: 20,
//                 // Cache for a maximum of a week
//                 maxAgeSeconds: 7 * 24 * 60 * 60,
//             })
//         ],
//     })
// );
