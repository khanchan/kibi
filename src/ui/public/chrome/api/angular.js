let _ = require('lodash');
import { format as formatUrl, parse as parseUrl } from 'url';

import Notifier from 'ui/notify/notifier';
import { UrlOverflowServiceProvider } from '../../error_url_overflow';

const URL_LIMIT_WARN_WITHIN = 150;

module.exports = function (chrome, internals) {

  chrome.setupAngular = function () {
    let modules = require('ui/modules');
    let kibana = modules.get('kibana');

    _.forOwn(chrome.getInjected(), function (val, name) {
      kibana.value(name, val);
    });

    kibana
    .value('kbnVersion', internals.version)
    .value('kibiVersion', internals.kibiVersion) // kibi: added to manage kibi version
    .value('kibiEnterpriseEnabled', internals.kibiEnterpriseEnabled) // kibi:
    .value('kibiKibanaAnnouncement', internals.kibiKibanaAnnouncement) // kibi:
    .value('buildNum', internals.buildNum)
    .value('buildSha', internals.buildSha)
    .value('sessionId', Date.now())
    .value('esUrl', (function () {
      let a = document.createElement('a');
      a.href = chrome.addBasePath('/elasticsearch');
      return a.href;
    }()))
    // kibi: saved objects API url
    .value('savedObjectsAPIUrl', (function () {
      var a = document.createElement('a');
      a.href = chrome.addBasePath('/api/saved-objects/v1');
      return a.href;
    }()))
    // kibi: end
    .config(chrome.$setupXsrfRequestInterceptor)
    .run(($location, $rootScope, Private) => {
      const notify = new Notifier();
      const urlOverflow = Private(UrlOverflowServiceProvider);
      const check = (event) => {
        if ($location.path() === '/error/url-overflow') return;

        try {
          if (urlOverflow.check($location.absUrl()) <= URL_LIMIT_WARN_WITHIN) {
            notify.warning(`
              The URL has gotten big and may cause Kibana
              to stop working. Please simplify the data on screen.
            `);
          }
        } catch (e) {
          const { host, path, search, protocol } = parseUrl(window.location.href);
          // rewrite the entire url to force the browser to reload and
          // discard any potentially unstable state from before
          window.location.href = formatUrl({ host, path, search, protocol, hash: '#/error/url-overflow' });
        }
      };

      $rootScope.$on('$routeUpdate', check);
      $rootScope.$on('$routeChangeStart', check);
    });

    require('../directives')(chrome, internals);

    modules.link(kibana);
  };

};
