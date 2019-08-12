;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../../vendor/js/i18n.js'),
      require('../../_locales/en.js'),
      require('../../_locales/zh-CN.js'),
      require('./ext-api.js')
    );
  } else {
    // browser or other
    root.MxWcI18N = factory(
      root.i18n,
      root.MxWcLocaleEn,
      root.MxWcLocaleZhCN,
      root.MxWcExtApi
    );
  }
})(this, function(i18n, en, zhCN, ExtApi, undefined) {
  "use strict";

  const I18N_DICT = {'en': en, 'zh-CN': zhCN};

  function initTranslator(locale){
    const dict = I18N_DICT[locale]
    if(dict){
      i18n.translator.add(dict);
    }else{
      initTranslator('en');
    }
  }

  //
  // all parts will join by '.'
  //
  // Usage:
  //   t(key)
  //   t(keyPart1, keyPart2, ..keyPartN)
  function translate(...parts) {
    return i18n(parts.join('.'));
  }

  function i18nPage(contextNode){
    const iterate = function(attr, action) {
      [].forEach.call((contextNode || document).querySelectorAll('['+attr+']'), function(elem){
        const value = elem.getAttribute(attr);
        action(elem, value)
      });
    }
    iterate('i18n', function(elem, value) {
      if(elem.innerHTML === '' && value) {
        elem.innerHTML = translate(value);
      }
    });
    iterate('i18n-attr', function(elem, value) {
      const [attr, key] = value.split(':');
      elem.setAttribute(attr, translate(key));
    });
  }

  function listen() {
    try {
      document.addEventListener('___.mx-wc.page.changed', function(e) {
        const detail = JSON.parse(e.detail);
        if(detail.selector !== '') {
          const contextNode = document.querySelector(detail.selector);
          i18nPage(contextNode);
        } else {
          i18nPage();
        }
      });
    } catch(e) {
      // not running in browser;
    }
  }

  function init() {
    const locale = ExtApi.getLocale();
    initTranslator(locale);
    listen();
  }

  init();


  return {
    t: translate,
    i18nPage: i18nPage
  };
});
