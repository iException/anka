<p align="center">
  <img src="https://user-images.githubusercontent.com/10026019/44260701-d84b6e80-a247-11e8-9d79-5f82be615c84.png" width="300"/>
  <b>&nbsp;&nbsp;&nbsp;CLI</b>
</p>

<p align="center">
	<a href="https://www.npmjs.com/package/@anka-dev/cli">
		<img src="https://badge.fury.io/js/%40anka-dev%2Fcli.svg"/>
	</a>
</p>

WeChat miniprogram helper

- [Document](https://iexception.github.io/anka-quickstart/)
- [Demo](https://github.com/iException/anka-quickstart)
## Install

```
  npm install @anka-dev/cli -g
```

## Usage

```shell

    _     _  _   _  _     _
   /_\   | \| | | |/ /   /_\
  / _ \  | .` | | ' <   / _ \
 /_/ \_\ |_|\_| |_|\_\ /_/ \_\


  Version: 1.0.0

  Usage:  <command> [options]

  Options:

    --debug                             enable debug mode
    --quiet                             hide compile log
    -V, --version                       output the version number
    -h, --help                          output usage information

  Commands:

    prod                                Production mode
    dev [pages...]                      Development Mode
    new-page [options] <pages...>       Create a miniprogram page
    new-cmpt [options] <components...>  Create a miniprogram component
    enroll [options] <components...>    Enroll a miniprogram component
```

## Config

```javascript
  // wxApp/anka.config.json

  {
      "components": "./components",
      "pages": "./pages"
  }
```

## Develope

### Style

```scss
/* pages/test/test.scss */
$color: red;
page {
    color: $color;
}
```

```css
/* pages/test/test.css */
@import "./_var.css";

/* sub.css 不会编译到 test.css 文件中 */
@wximport "./sub.css";

page {
	color: var(--font);
	height: 100%;
	width: 100%;
}
```


### NPM

```javascript
// pages/page/page.js
import qs from 'qs'

Page({
  onLoad() {
    qs.stringify({
      name: 'anka'
    })
  },

  onShow() {
    console.log(this, 'hello')
  }
})

```
