# Ember-data-adapter-database

本项目讲解如何使用adapter、EmberData以及怎么连接到本地数据库。

### 主要内容

  - 适配器使用
  - 如何持久化数据到本地数据库
  - 简单的后端服务

## 介绍

最近经常有初学的开发者请教有关`Adapter`和`Ember Data`的问题。官方教程中讲到这两个内容的是[Model](https://guides.emberjs.com/v2.6.0/models/)这一章节。本文中介绍到的内容大部分是由这一章来的，如果有不妥请看原文或者给我留言。

注意：*本文是基于v2.6.0讲解。*

### 软件需求

1. [MySQL](http://www.mysql.com/)
2. [nodejs,express](http:nodejs.org)
3. [body-parser](https://github.com/expressjs/body-parser)
4. [mysql-node](https://github.com/mysqljs/mysql)

用到的软件、插件都是有关后端服务的，`mysql-node`用于连接、操作MySQL数据库。后端服务是用node写的所以也用node项目的插件连接、操作数据库了，有关如何使用node操作MySQL的信息请看这篇文章[nodejs连接MySQL，做简单的CRUD
](http://blog.ddlisting.com/2015/11/24/nodejs-dowith-database/)。如果你的后端是其他语言写只需要保证你后端返回的数据格式和我的后端返回的数据格式一致就行了。

### 项目搭建

项目的搭建就不再费口舌了，[Ember Teach](http://blog.ddlisting.com)已经有很多博文介绍过了。

### 项目文件

简单起见我就做一个页面就行了，我希望做出的效果是使用自定义的适配器获取到本地MySQL数据库的数据并分页展示。

#### 创建文件

```
ember g route user
ember g adapter application
```




## Prerequisites

You will need the following things properly installed on your computer.

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [Ember CLI](http://ember-cli.com/)
* [PhantomJS](http://phantomjs.org/)

## Installation

* `git clone <repository-url>` this repository
* change into the new directory
* `npm install`
* `bower install`

## Running / Development

* `ember server`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

Specify what it takes to deploy your app.

## Further Reading / Useful Links

* [ember.js](http://emberjs.com/)
* [ember-cli](http://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)
