# CornerWidgetUI
A customisable widget that is designed to be attached to any page, and integrates with the Lucep service in order to drive great volumes of leads from websites to sales people!

## Dependencies
*What must be available on page*
The CornerWidgetUI is an extension to Lucep, and requires the [Lucep library](https://www.lucep.com) to be loaded. It uses API methods exposed by that library to provide functionality. 

*Additional dependencies - but will be loaded automatically*
It also depends on [jQuery](https://www.jquery.org), and the jQuery extension [intl-tel-input](https://github.com/Bluefieldscom/intl-tel-input). The widget will attempt to dynamically download these libraries from public secure CDN locations hosted by [Google](https://www.google.com) and [Lucep](https://www.lucep.com).

## How to use
The CornerWidgetUI is the default website UI for Lucep, and is automatically included if an alternative UI is not specified in the Lucep config.

Lucep can be deployed on a page with the following snippet placed before the `</body>` tag:
```
<script type="text/javascript">
window.$gorilla || ( (window._gorilla={
no_ui: false,
domain: <YOUR-LUCEP-DOMAIN-HERE>,
id: 1,
lang: "eng"
}) & ( function ( l, u, c, e, p ){ var g = document.createElement(e); g.src = l; g.onload=u; document.getElementsByTagName(c)[p].appendChild(g);})("https://8d69a4badb4c0e3cd487-efd95a2de0a33cb5b6fcd4ec94d1740c.ssl.cf2.rackcdn.com/js/L.SalesGorilla.bleeding.latest.min.js", null, "head", "script", 0) )
</script>
```
**Warning:** The above snippet is attached to the _bleeding_ channel which may not always be stable. For the stable version, please switch to _L.SalesGorilla.bleeding.latest.min.js_ instead

## How to get a Lucep domain

Visit [https://www.lucep.com/](http://www.lucep.com) and register for a free Lucep account.

## How to test your own updates/variants

The Lucep snippet has support for custom widgets to be loaded in place of the stable default. You can do this by altering the snippet to read as follows:
```
<script type="text/javascript">
window.$gorilla || ( (window._gorilla={
no_ui: false,

load_ui: <PATH-TO-YOUR-CUSTOM-JS-HERE>,

domain: <YOUR-LUCEP-DOMAIN-HERE>,
id: 1,
lang: "eng"
}) & ( function ( l, u, c, e, p ){ var g = document.createElement(e); g.src = l; g.onload=u; document.getElementsByTagName(c)[p].appendChild(g);})("https://8d69a4badb4c0e3cd487-efd95a2de0a33cb5b6fcd4ec94d1740c.ssl.cf2.rackcdn.com/js/L.SalesGorilla.bleeding.latest.min.js", null, "head", "script", 0) )
</script>
```
