;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcLink', [
      'MxWcExtApi',
      'MxWcExtMsg',
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('./ext-api.js'),
      require('./ext-msg.js')
    );
  } else {
    // browser or other
    root.MxWcLink = factory(
      root.MxWcExtApi,
      root.MxWcExtMsg
    );
  }
})(this, function(ExtApi, ExtMsg, undefined) {
  "use strict";

  const extensionRoot = ExtApi.getURL('/');
  const extensionId = extensionRoot.split('//')[1].replace('/', '');
  const websiteRoot = "https://mika-cn.github.io/maoxian-web-clipper";
  const projectRoot = "https://github.com/mika-cn/maoxian-web-clipper";
  const remotePaths = {
    "en": {
      "home": "/index.html",
      "faq": "/faq.html",
      "faq-allow-access-file-urls": "/faq.html#allow-access-file-urls",
      "native-app": "/native-app/index.html",
      "offline-page": "/offline-page/index.html",
      "project.index": "/",
      "project.issue": "/issues",
    },
    "zh-CN": {
      "home": "/index-zh-CN.html",
      "faq": "/faq-zh-CN.html",
      "faq-allow-access-file-urls": "/faq-zh-CN.html#allow-access-file-urls",
      "native-app": "/native-app/index-zh-CN.html",
      "offline-page": "/offline-page/index-zh-CN.html",
      "project.index": "/",
      "project.issue": "/issues",
    }
  }

  /*
   * @param {String} exp
   *   extension => extPage.$name
   *   remote    => $name
   * @example:
   *   get('extPage.setting#hello');
   */
  function get(exp) {
    const pageName = exp.split(/[?#]/)[0];
    let pageLink;
    if (pageName.startsWith('extPage.')) {
      pageLink = getExtensionPageLink(pageName);
    } else {
      pageLink = getRemoteLink(pageName);
    }
    return exp.replace(pageName, pageLink);
  }

  /*
   * @param {String} pageName
   *   projectPage => project.$name
   *   website => $name
   */
  function getRemoteLink(pageName){
    let dict = remotePaths[ExtApi.locale];
    if (!dict) { dict = remotePaths['en'] }
    const path = dict[pageName];
    if(path) {
      if(pageName.startsWith('project.')){
        return projectRoot + path;
      } else {
        return websiteRoot + path;
      }
    } else {
      throw new Error(`UnknowPage: ${pageName}(name)`);
    }
  }

  /*
   * @private
   */
  function getExtensionPageLink(pageName){
    const name = pageName.split('.')[1];
    const path = getExtensionPagePath(name);
    return ExtApi.getURL(path);
  }

  function getExtensionPagePath(name){
    return `/pages/${name}.html`;
  }

  function isChrome(){
    return !!extensionRoot.match(/^chrome-extension/);
  }

  function isFirefox(){
    return !!extensionRoot.match(/^moz-extension/);
  }

  function listen(contextNode) {
    contextNode.addEventListener('click', function(e) {
      if(e.target.tagName == 'A' && e.target.href.startsWith('go.page:')) {
        const exp = e.target.href.split(':')[1];
        const link = get(exp);
        e.preventDefault();
        if(e.target.target === '_blank') {
          try {
            ExtApi.createTab(link);
          }catch(e) {
            // browser.tabs is not avariable in content script ?
            ExtMsg.sendToBackground({
              type: 'create-tab',
              body: {link: link}
            }).catch((err) => {
              console.warn(err);
              window.location.href = link;
            });
          }
        } else {
          window.location.href = link;
        }
      }
    });
  }


  return {
    get: get,
    extensionRoot: extensionRoot,
    extensionId: extensionId,
    getExtensionPagePath: getExtensionPagePath,
    isChrome: isChrome,
    isFirefox: isFirefox,
    listen: listen
  }
});
