
const H = require('./helper.js');
const DOMTool = H.depJs('lib/dom-tool.js');

const stripCssComment = require('strip-css-comments');
const Log         = H.depJs('lib/log.js');
const Tool        = H.depJs('lib/tool.js');
const Asset       = H.depJs('lib/asset.js');
const Task        = H.depJs('lib/task.js');
const CaptureTool = H.depJs('capturer/tool.js');
const ExtMsg      = H.depMockJs('ext-msg.js');

const CapturerFactory = H.depJs('capturer/css.js');

function getCapturer() {
  return CapturerFactory( stripCssComment,
      Log, Tool, Asset, Task, ExtMsg, CaptureTool);
}

function getParams() {
  return {
    docUrl: 'https://a.org/index.html',
    storageInfo: {
      assetFolder: 'category-a/clippings/assets',
      assetRelativePath: 'assets'
    },
    clipId: '001',
    config: {
      saveWebFont: false,
      saveCssImage: false
    }
  }
}

describe("Capturer css", () => {

  it("capture text (@import css)", async () => {
    const params = getParams();
    params.baseUrl = 'https://cdn.a.org/style.css';
    //@import url("chrome://communicator/skin/");
    params.text = `
      @import url("a.css") print;
      @import url("b.css") speech;
      @import 'c.css';
      @import "d.css" screen;
      @import url('e.css') screen and (orientation:landscape);
      @import url('e.css');
    `;
    const linkText = '.CSSTEXT{}';
    ExtMsg.mock('fetch.text', function(msg) {
      return Promise.resolve(linkText);
    });
    const Capturer = getCapturer();
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 5);
    tasks.forEach((it) => {
      H.assertEqual(it.text, linkText);
      H.assertEqual(it.mimeType, 'text/css');
    });
    ExtMsg.clearMocks();
  });

  it("capture link - circle with self", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    params.link = 'style-A.css';
    ExtMsg.mock('fetch.text', function(msg) {
      return Promise.resolve("@import 'style-A.css';");
    })
    const Capturer = getCapturer();
    const tasks = await Capturer.captureLink(params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 1);
    const filename = tasks[0].filename.split('/').pop();
    H.assertTrue(tasks[0].text.indexOf(filename) > -1);
  })

  it("capture link - circle in two style", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    params.link = 'style-A.css';
    ExtMsg.mock('fetch.text', function(msg) {
      const {body} = msg;
      switch(body.url) {
        case 'https://a.org/style-A.css':
          return Promise.resolve("@import 'style-B.css';");
        case 'https://a.org/style-B.css':
          return Promise.resolve("@import 'style-A.css';");
      }
    });
    const Capturer = getCapturer();
    const tasks = await Capturer.captureLink(params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 2);
    const [taskA, taskB] = tasks;
    taskAFilename = taskA.filename.split('/').pop();
    taskBFilename = taskB.filename.split('/').pop();
    H.assertTrue(taskA.text.indexOf(taskBFilename) > -1)
    H.assertTrue(taskB.text.indexOf(taskAFilename) > -1)
  });

  const WEB_FONT_CSS_A = `@font-face {src: url(foo.woff);}`;
  const WEB_FONT_CSS_B = `@font-face {src: url('foo.woff');}`;
  const WEB_FONT_CSS_C = `@font-face {src: url("foo.woff");}`;

  it("capture text (web font) - default config", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    const Capturer = getCapturer();
    const texts = [
      WEB_FONT_CSS_A,
      WEB_FONT_CSS_B,
      WEB_FONT_CSS_C
    ];
    for(let i = 0; i < texts.length; i++) {
      params.text = texts[i];
      var {cssText, tasks} = await Capturer.captureText(params);
      H.assertEqual(tasks.length, 0);
      H.assertMatch(cssText, /url\(""\)/);
    }
  });

  it("capture text (web font) - asset path - text in document", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    params.config.saveWebFont = true;
    const Capturer = getCapturer();
    params.text = WEB_FONT_CSS_A;
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 1);
    H.assertEqual(tasks[0].url, 'https://a.org/foo.woff');
    H.assertMatch(cssText, /url\("assets\/[^\.\/]+.woff"\)/);
  })

  it("capture text (web font) - asset path - text in style", async () => {
    const params = getParams();
    params.text = WEB_FONT_CSS_A;
    params.config.saveWebFont = true;
    params.baseUrl = 'https://a.org/style.css';
    const Capturer = getCapturer();
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 1);
    H.assertMatch(cssText, /url\("[^\.\/]+.woff"\)/);
  });

  it("capture text (web font) - asset path - text in cdn", async () => {
    const params = getParams();
    params.text = WEB_FONT_CSS_A;
    params.config.saveWebFont = true;
    params.baseUrl = 'https://cdn.a.org/style.css';
    const Capturer = getCapturer();
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 1);
    H.assertMatch(cssText, /url\("[^\.\/]+.woff"\)/);
  });

  const IMG_CSS = `
    .t1 { color: red;background: url(bg-a.jpg); }
    .t2 { background-image: url('bg-b.png'); }
    .t3 {
      color: red;
      border-image: url("bg-c.bmp");
      font-size:14pt;
    }
  `;

  it("capture text (css img) - default", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    params.text = IMG_CSS;
    const Capturer = getCapturer();
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 0);
    H.assertEqual(cssText.match(/url\(""\)/mg).length, 3);
  });

  it("capture text (css img) - asset path - text in style", async () => {
    const params = getParams();
    params.text = IMG_CSS;
    params.baseUrl = 'https://a.org/style.css';
    params.config.saveCssImage = true;
    const Capturer = getCapturer();
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 3);
    H.assertMatch(cssText, /url\("[^\.\/]+.jpg"\)/);
    H.assertMatch(cssText, /url\("[^\.\/]+.png"\)/);
    H.assertMatch(cssText, /url\("[^\.\/]+.bmp"\)/);
  });

})




