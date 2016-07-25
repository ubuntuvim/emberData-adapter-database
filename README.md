<!--
@Author: ubuntuvim
@Date:   2016-07-23T14:45:27+08:00
@Last modified by:   ubuntuvim
@Last modified time: 2016-07-23T17:42:48+08:00
@website: http://blog.ddlisting.com
-->

本项目讲解如何使用adapter、EmberData以及怎么连接到本地数据库。

## 项目简介

### 主要内容

  - 适配器使用
  - 如何持久化数据到本地数据库
  - 简单的后端服务

最近经常有初学的开发者请教有关`Adapter`或者`Ember Data`的问题。官方教程中讲到这两个内容的是[Model](https://guides.emberjs.com/v2.6.0/models/)这一章节。本文中介绍到的内容大部分是由这一章来的，如果有不妥请看原文或者给我留言。

注意：*本文是基于v2.6.0讲解。*

### 软件需求

1. [MySQL](http://www.mysql.com/)
2. [nodejs,express](http:nodejs.org)
3. [body-parser](https://github.com/expressjs/body-parser)
4. [mysql-node](https://github.com/mysqljs/mysql)

### Ember项目常规运行软件

* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) (with NPM)
* [Bower](http://bower.io/)
* [Ember CLI](http://ember-cli.com/)
* [PhantomJS](http://phantomjs.org/)


用到的软件、插件都是有关后端服务的，`mysql-node`用于连接、操作MySQL数据库。后端服务是用node写的所以也用node项目的插件连接、操作数据库了，有关如何使用node操作MySQL的信息请看这篇文章[nodejs连接MySQL，做简单的CRUD
](http://blog.ddlisting.com/2015/11/24/nodejs-dowith-database/)。如果你的后端是其他语言写只需要保证你后端返回的数据格式或者我的后端返回的数据格式一致就行了。目前打算本项目使用2种数据交互方式：一种是jsonapi，一种是restapi。

- [jsonapi](http://jsonapi.org/)
- [rest api](http://www.restapitutorial.com/)

### 项目搭建

项目的搭建就不再费口舌了，[Ember Teach](http://blog.ddlisting.com/2016/07/20/make-emberjs-dev-env/)已经有很多博文介绍过了。

### 运行项目

如果你想运行本项目请按照下面的步骤操作：

#### 安装

* 下载代码到本地 `git clone https://github.com/ubuntuvim/emberData-adapter-database`
* 进入项目目录 `cd emberData-adapter-database`
* 安装npm依赖包 `npm install`
* 安装bower依赖包 `bower install`

#### 运行

* 在项目目录下执行命令 `ember server` 运行项目。
* 待项目启动完毕，在浏览器打开[http://localhost:4200](http://localhost:4200)。


#### 发布到服务器

* 执行命令编译、打包项目 `ember build --environment production`
* 命令执行完毕会在`dist`目录下得到项目打包后的文件。
* 把打包后的`dist`目录下的所有文件复制到服务器应用目录下运行即可（比如tomcat服务器则放到`webapps`目录下）。


### 项目结构

简单起见我就做一个页面就行了，我希望做出的效果是使用自定义的适配器获取到本地MySQL数据库的数据并分页展示。

#### 创建文件

使用[ember-cli](http://ember-cli.com/user-guide)命令创建文件。

```
ember g route user
ember g model user username:string email:string
ember g adapter application
```

目前暂时只用到这几个文件，后续可能还有其他的用到在创建。
`ember g model user username:string email:string`的作用是创建模型的同时创建2个属性，并且属性都指定为`string`类型。

说了一大堆废话下面开始正题。要理解`adapter`、`ember data`、后端服务的关系我们从他们各自的概念入手。首先我们先理清楚他们之间的关系然后在动手实践。理论总是繁琐的但是也是最重要的。

========================= 华丽的分割线 =========================

## 体系结构概述

![体系结构图](https://guides.emberjs.com/v2.6.0/images/guides/models/finding-unloaded-record-step1-diagram.png)

*注：图片来自官方文档*

注意观察上图的结构。

1. APP（一般是从`route`、`controller`或者`component`发请求）请求数据。
2. 请求并没有直接发送到后端服务而是先在`store`(ember data其实就是一个`store`)缓存中查找，ember之所以能实现动态更新模板数据也是因为有了`store`。
3. 如果请求的数据存在在`store`中，则直接返回到`route`、`controller`或者`component`；如果在`store`中没有发现请求的数据，所以请求的数据是首次，数据还未缓存到`store`中，则请求继续往下到了`apdater`层。
4. 在`adapter`中，`adapter`会根据请求的调用方法构建出对应的URL。比如在`route`、`controller`或者`component`中执行方法`findRecord('user', 1)`，此方法作用是查询id为1的user数据。适配器构建出来的URL为: [http://domain/user/1](http://domain/user/1)，然后发请求到后端。
5. 适配器会对比后端接受的数据格式与ember data发送的数据格式，如果不一致需要在适配器的``方法中格式化发送的数据格式。请求经过适配器构建得到URL后发送到后端服务，后端服务根据URL请求查询数据库然后格式化数据格式返回到适配器。
6. 适配器根据得到的数据和ember data所接受的数据格式匹配，如果格式不一致需要在适配器的``方法中格式化后端返回的数据。
7. 经过适配器之后数据转到ember data（`store`）中，首先缓存到`store`中，然后返回到调用处（`route`、`controller`、`component`）
8. 数据请求完毕

注意：`findRecord('user', 1)`方法执行过程，请求的`findRecord('user', 1)`方法会在Ember Data内部解析为`find`方法，`find`方法会首先在`store`缓存中查数据，如果没有则会流转到`adapter`中组装URL并格式化请求数据，然后发送到后端服务。

从图中看到从适配器返回的数据是[promise](http://liubin.github.io/promises-book/)所以调用`findRecord`方法获取数据的时候需要`then()`。同时可见这是个移步请求，只有promises执行成功才能得到数据。也就是说如果考虑周全的话还需要在`findRecord`的时候处理promises执行失败的情况。

另外如果你想跳过`store`不需要这层缓存也是可以的。会可以这样做：`store.findRecord(type, id, { reload: true })`使用`reload`属性设置为`true`让每次请求都跳过`store`直接发送请求到后端，对于实时性要求高的APP则需要这样处理。

介绍完架构之后将追个介绍其中的每个主要的功能特性。
需要说明的是：`Models`, `records`, `adapters`以及`store`都是Ember Data最核心的东西，他们是包含的关系，只要使用了Ember Data才能使用`model`、`store`功能。有些初学者老是问这几个东西的关联，希望看到这里的同学不要在提这样的问题了！！=^=

Ember Data是Ember.js非常重要的一块，提供了几乎所有操作数据的API，详细请看[EMBER-DATA MODULE](http://emberjs.com/api/data/modules/ember-data.html)。当然，如果你不想使用Ember Data也是可以的，那么你的程序直接使用Ajax与后台交互也是可以的，或者说你使用其他类似Ember Data的插件也行。Ember Data在MVC模式中属于M层的东西，没有这层也并不影响到整个APP！

### 补充一下下

如果你不使用Ember Data，在这里提供一个简单的方案供参考。
如果你想获取后端数据并显示数据到组件上（模板调用组件），你可以像下面的代码这样处理：

```js
// app/components/list-of-drafts.js
export default Ember.Component.extend({
  willRender() {
    $.getJSON('/drafts').then(data => {
      this.set('drafts', data);
    });
  }
});
```
这里不同过Ember Data，自然也就没有调用Ember Data提供的方法（比如，findAll、findRecord），而是直接发Ajax请求，得到数据到设置到对象`drafts`中，然后在模板上显示数据。
```html
<!-- app/templates/components/list-of-drafts.hbs -->
<ul>
  {{#each drafts key="id" as |draft|}}
    <li>{{draft.title}}</li>
  {{/each}}
</ul>
```
这样处理是没问题的，但是当数据改变的可能不能立即在模板上更新，因为这里无法使用`store`自然也就无法像计算属性那样当数据有变就立即更新模板。另一个问题是当你的请求很多的时候你需要写很多这样的方法，代码复用性也比较差。

### Models

> In Ember Data, each model is represented by a subclass of Model that defines the attributes, relationships, and behavior of the data that you present to the user.

从使用上讲，model其实就是与后端数据表对应的实体类（借用java中的说法），通常我们的model类的定义是与后端数据表对应的，最常见的就是model属性的定义，建议属性名和数据表字段名一致并且使用驼峰式命名规范。

model之间还可以定义单向或者双向的一对一、一对多和多对多关系，这个与数据表之间的关系定义是相似的。比如下面的model：

#### 简单model定义

```js
//app/models/person.js
import Model from 'ember-data/model';
import attr from 'ember-data/attr';

export default Model.extend({
  firstName: attr('string'),
  birthday:  attr('date')
});
```
model类可以直接使用ember-cli命令创建：
```
ember g model person
```

上面代码创建了一个简单的model，并且包含了3个属性，一个是`string`类型一个是`date`类型，那么第三个属性是什么了？？是`id`，Ember会默认为每个model增加一个属性`id`，开发者不需要手动去定义这个属性，并且如果你是手动在model类中定义这个属性会报错的！！那么对应后端的服务也应该有一个person表，并且表里也有三个字段，它们是`firstName`、`birthday`以及`id`。

更多有关model之间关系的介绍不行本文的重点，请看[第六章 模型](http://blog.ddlisting.com/2016/04/07/modeljian-jie/)的详细介绍。

有了model之后程序要使用model类必须要实例化，实例化的model称为`records`。

### Records

> A record is an instance of a model that contains data loaded from a server. Your application can also create new records and save them back to the server. A record is uniquely identified by its model `type` and `ID`.

简单讲record就是一个包含数据的model实例。说白了就是一个JSON对象（虽然这样的说法不是很正确，但是可以反映出这是一个什么样的对象结构）。

比如下面的代码：
```js
this.get('store').findRecord('person', 1); // => { id: 1, name: 'steve-buscemi' }
```

执行完方法`findRecord`后返回的就是一个model实例也就是一个record。这个record包含了数据`{ id: 1, name: 'steve-buscemi' }`。

### Adapter

> An adapter is an object that translates requests from Ember (such as "find the user with an ID of 123") into requests to a server.

适配器，顾名思义！作用就是做适配工作的，保存转换数据格式、定义交互的URL前缀、构建URL等等。在前面体系结构已经详细介绍过，不在赘述。

### Caching

缓存在Ember中是非常重要的，但是有一点需要注意的是不要把太多数据缓存到store中，数据量太大浏览器受不了！缓存的作用是非常明显的，前面也介绍了他的作用，特别是在请求数据的时候，如果能在缓存中获取的则立即返回到调用处，只有在缓存中查不到的数据才发请求到服务端，通常是第一次获取的数据的时候缓存没有则需要发请求到服务端。也正是有了缓存Ember才能快速把数据的变化响应到模板上。


到此主要核心的概念介绍完毕了，不算多，但是认真看下来还是很有益的！！

下面接着是如何实践了……

## 创建数据库

本例子使用的是MySQL数据库，有关数据库的安装以及使用不在本文讲解范围，请自行学习！

### 建表

怎么建表我也不说了，下面直接贴建表的SQL。

```sql
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

创建一个名为`user`的数据表。

## 创建服务端

如何在ember项目中创建服务端程序呢？ember提供了创建的命令。

```bash
ember g server
```

创建完毕之后再按照开始介绍的依赖插件。

```bash
npm install mysql-node
npm install body-parser
npm install supervisor
```

创建的是一个node服务端程序，运行的端口也是`4200`，不需要另外手动去启动node服务，只要ember项目运行了会自动运行起来的。


到此所有的原料都准备好了，下面验证一下项目是否还能正常运行。启动项目，然后在浏览器打开[http://localhost:4200](http://localhost:4200)。还能看到**Welcome to Ember**说明是成功的！

有了原料开始做菜吧！！！


## 编写user模块

### 更改URL方式

为了不使服务端和Ember请求URL冲突修改了URL的默认方式，修改`config/environment.js`的第8行代码为如下：
```js
locationType: 'hash',
```

`auto`改为`hash`。访问Ember项目的URL则需要注意：[http://localhost:4200/user](http://localhost:4200/user)改为[http://localhost:4200/#/user](http://localhost:4200/#/user)。增加一个`#`号。

### 获取数据、显示数据

首先简单列出数据库数据。

```html
<!-- app/templates/user.hbs -->
<h1>用户列表</h1>

<table class="table table-striped table-hover">
  <thead>
    <tr>
      <th>
        #
      </th>
      <th>
        用户名
      </th>
      <th>
        邮箱
      </th>
    </tr>
  </thead>

  <tbody>
    {{#each model as |user|}}
    <tr>
      <td>
        {{user.id}}
      </td>
      <td>
        {{user.username}}
      </td>
      <td>
        {{usre.email}}
      </td>
    </tr>
    {{/each}}
  </tbody>

</table>
```

```js
// app/routes/user.js
import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return this.store.findAll('user');
  }
});
```

## 文章源码

如果有需要欢迎star或者fork学习。下面是源码地址：

[https://github.com/ubuntuvim/emberData-adapter-database](https://github.com/ubuntuvim/emberData-adapter-database)，欢迎follow我，一起学习交流！我在全球最大的[同性交友网站](https://github.com)等你哦！！

## 参考网址

* [ember.js](http://emberjs.com/)
* [ember-cli](http://ember-cli.com/)

**爱心奉献**

写作不易，欢迎提贡献：点击网站右上角“为博主充电”，为博主打打气吧！！你们的支持是我写作最大的动力！！！
O(∩_∩)O哈哈~_)


