<p>
  <img src="https://user-images.githubusercontent.com/10026019/48325653-9fb60800-e671-11e8-9e5f-46e625d8159f.png" width="300"/>
</p>

<p>
	<a href="https://www.npmjs.com/package/@anka-dev/cli">
		<img src="https://badge.fury.io/js/%40anka-dev%2Fcli.svg"/>
	</a>
</p>

> 渐进式小程序开发工具集。提供通用的开发函数库及组件，我们正努力使小程序开发过程变得愉快。

##如何使用

###安装CLI

AnkaCLI 能在原生小程序语法之上提供 npm 包支持、管理页面与组件、在 Parser 的加持下还能在小程序项目中使用 Sass、PostCSS、TypeScript。甚至，你能通过编写插件实现一些特殊功能，关于如何编写插件请看[这里](https://iexception.github.io/anka-doc/book/plugins/)。

通过 npm 安装 AnkaCLI：

```shell
$ npm install @anka-dev/cli -g
```


###文档

- [如何使用 AnkaCLI](https://iexception.github.io/anka-doc/book/cli)
- [功能示例及项目模板](https://github.com/iException/anka-quickstart)

##你可能需要的

- [Canvas操作](https://github.com/iException/anka-brush)
- [小程序打点库](https://github.com/iException/anka-tracker)
- [更多工具](https://github.com/iException?utf8=%E2%9C%93&q=anka&type=&language=)


###问题

####1. Anka 是小程序开发框架吗？

Anka 是小程序开发**工具集**，AnkaCLI 是其中之一。我们可以根据实际需求引入 Anka 集合内的工具，比如 [Canvas库 anka-brush](https://github.com/iException/anka-brush)、[打点工具 anka-tracker](https://github.com/iException/anka-tracker)。

不同于 mpvue、wepy 和 Taro，Anka 不提供任何特殊的小程序开发语法，在保持原生状态的条件下引入所需的工具。当然，通过编写[插件](https://iexception.github.io/anka-doc/book/plugins/)和[解析器](https://iexception.github.io/anka-doc/book/parsers/)也能实现特殊功能。

关于 AnkaCLI 如何工作请看[这里](https://iexception.github.io/anka-doc/book/cli/how-cli-works.html)。

####2. 可以不安装 CLI 而单独使用其他工具吗？

完全可以。Anka 集合下的工具都能单独使用，他们之间没有任何依赖（如果有则会特别指出）。

###问题反馈及建议

我们非常乐意看见你将使用过程中遇见的缺陷[反馈到 issue 区](https://github.com/iException/anka/issues)。也任何新的想法或需求也可以通过相同方式提出并列入讨论。

> Have a nice day ！




