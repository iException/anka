<p align="center">
  <img src="https://user-images.githubusercontent.com/10026019/44260701-d84b6e80-a247-11e8-9d79-5f82be615c84.png" width="300"/>
</p>

<p align="center">
	<a href="npmjs.com">
		<img src="https://img.shields.io/npm/v/anka.svg?style=flat"/>
	</a>
</p>

WeChat miniprogram helper

## Install

```
  npm install anka -g
```

## Usage

```shell
  Usage: anka [options] [command]

  Options:

    -v, --version                   output the version number
    -h, --help                      output usage information

  Commands:

    init                            initialize WeChat miniprogram project
    page [page-name]                initialize WeChat miniprogram page
    component [component-name]      initialize WeChat miniprogram component
    add [options] [component-name]  page that is going to register component
    rm [options] [component-name]   remove component from page
```

## Config

```javascript
  // wxApp/anka.config.json

  {
      "components": "./components",
      "pages": "./pages"
  }
```
