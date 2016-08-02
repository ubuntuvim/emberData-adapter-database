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
ember g route users
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

`auto`改为`hash`。访问Ember项目的URL则需要注意：[http://localhost:4200/users](http://localhost:4200/users)改为[http://localhost:4200/#/users](http://localhost:4200/#/users)。增加一个`#`号。

### 获取数据、显示数据

首先简单列出数据库数据。

```html
<!-- app/templates/users.hbs -->
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
        {{user.email}}
      </td>
    </tr>
    {{/each}}
  </tbody>

</table>
```

```js
// app/routes/users.js
import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return this.store.findAll('user');
  }
});
```

目前项目还没连接到任何数据库，也没有使用自定义的适配器，如果直接执行[http://localhost:4200/#/users](http://localhost:4200/#/users)可以在控制台看到是会报错的。那么下一步该如何处理呢？？

## 加入适配器

### 使用`RESTAdapter`

先从适配器下手！在前面已经创建好了适配器，如果是2.0之后的项目默认会创建`JSONAPIAdapter`这个适配器所接收、发送的数据格式都必须符合jsonapi规范，否则会报错，无法正常完成数据的交互。不过为了简便我们先不使用这个适配器，改用另一个简单的适配器`RESTAdapter`，这个适配器不是需要遵循jsonapi规范，只要自己约定好前后端的数据格式即可。

```js
// app/adapters/application.js

// import JSONAPIAdapter from 'ember-data/adapters/json-api';
import DS from 'ember-data';

export default DS.RESTAdapter.extend({

});
```

手动修改好之后的适配器还不能起作用，这个适配器并没有连接到任何的后端服务，如果你想连接到你的服务上需要使用属性`host`指定。

```js
// app/adapters/application.js

// import JSONAPIAdapter from 'ember-data/adapters/json-api';
import DS from 'ember-data';

export default DS.RESTAdapter.extend({
  host: 'http://localhost:4200'
});
```

等待项目重启完毕，仍然是访问[http://localhost:4200/#/user](http://localhost:4200/#/users)，在控制台仍然看到前面的错误，截图如下：

![无后端服务](http://blog.ddlisting.com/content/images/2016/07/16072601-3.png)

为何还是错误呢？如果能看到错误说明你的程序是正确，到目前为止还没提供任何的后端服务，虽然前面使用`ember g server`创建了node后端服务，但是并没有针对每个请求做处理。当你访问路由`user`在进入回到`model`时候会发送请求获取所有模型`user`数据，请求首选转到Ember Data（store)，但是在store中并没有，然后请求继续转到适配器`RESTAdapter`，适配器会构建URL得到`GET`请求`http://localhost:4200/users`，至于是如何构建URL的请看[build url method](https://github.com/emberjs/data/blob/master/addon/-private/adapters/build-url-mixin.js)。这个请求可以在报错的信息中看到。但是为何会报错呢？很正常，因为我的后端服务并没响应这个请求。下面针对这个请求做处理。

修改`server/index.js`。

```js
/*jshint node:true*/

// To use it create some files under `mocks/`
// e.g. `server/mocks/ember-hamsters.js`
//
// module.exports = function(app) {
//   app.get('/ember-hamsters', function(req, res) {
//     res.send('hello');
//   });
// };

module.exports = function(app) {
  var globSync   = require('glob').sync;
  var mocks      = globSync('./mocks/**/*.js', { cwd: __dirname }).map(require);
  var proxies    = globSync('./proxies/**/*.js', { cwd: __dirname }).map(require);

  // Log proxy requests
  var morgan  = require('morgan');
  app.use(morgan('dev'));

  // 对象转json
  //  const serialise = require('object-tojson')
  const bodyParser = require('body-parser');

  mocks.forEach(function(route) { route(app); });
  proxies.forEach(function(route) { route(app); });

  app.use(bodyParser.urlencoded({ extended: true }));


  // 处理请求 http://localhost:4200/user
  app.get('/users', function(req, res) {
    // 返回三个对象
    res.status(200).send({
        users: [
          {
            id: 1,
            username: 'ubuntuvim',
            email: '123@qq.com'
          },
          {
            id: 2,
            username: 'ddlisting.com',
            email: '3333@qq.com'
          },
          {
            id: 3,
            username: 'www.ddlising.com',
            email: '1527254027@qq.com'
          }
        ]
    });
  });

};
```

在服务端增加了一个node请求处理，拦截`/users`这个请求。对于express不是本文的重点，请自行学习，网址[expressjs.com](http://expressjs.com/zh-cn/)。如果你使用的是其他语言的服务端程序，那么你只需要返回的json格式为：`{"modelName":[{"id":1,"属性名":"属性值","属性名2":"属性值2"},{"id":2,"属性名3":"属性值3","属性名4":"属性4"}]}`，只需要格式正确适配器就能正确解析返回的数据。

另外再多介绍一个属性`namespace`，这个属性是用于定义URL前缀的，比如下面的适配器定义：

```javascript
// app/adapters/application.js

// import JSONAPIAdapter from 'ember-data/adapters/json-api';
import DS from 'ember-data';

export default DS.RESTAdapter.extend({
  namespace: 'api/v1',
  host: 'http://localhost:4200'
});
```

如果是这样定义那么后端处理的URL也需要做相应的处理，需要在拦截的请求上加前缀，比如下面的代码。

```js
// 处理请求 http://localhost:4200/api/v1/user
  app.get('/api/v1/users', function(req, res) {
    // 返回三个对象
    res.status(200).send({
        users: [
          {
            id: 1,
            username: 'ubuntuvim',
            email: '123@qq.com'
          },
          {
            id: 2,
            username: 'ddlisting.com',
            email: '3333@qq.com'
          },
          {
            id: 3,
            username: 'www.ddlising.com',
            email: '1527254027@qq.com'
          }
        ]
    });
  });
```

之前面唯一不同的就是请求的URL不一样了，原来是[http://localhost:4200/users](http://localhost:4200/users)改为[http://localhost:4200/api/v1/users](http://localhost:4200/api/v1/users)。那么这样做的好处是什么呢？当你的后端的API更新的时候这个设置是非常有用的，只需要设置命名前缀就能适应不用版本的API。

项目重启之后，再次进入到路由`users`可以看到返回的3条数据。如下截图：

![结果列表](http://blog.ddlisting.com/content/images/2016/07/16072602.png)

到此，我想你应该知道个大概了吧！！更多有关适配器的介绍请看下面的2篇博文：

1. [adapter与serializer使用示例一](http://blog.ddlisting.com/2016/06/06/adapter-serializer/)
2. [adapter与serializer使用示例二](http://blog.ddlisting.com/2016/06/07/adapter-serializershi2/)


### 使用`JSONAPIAdapter`

使用`JSONAPIAdapter`适配器和使用`RESTAdapter`适配器有何不同呢？我觉得最重要的一点是：数据规范。`JSONAPIAdapter`适配器要求交互的数据格式必须遵循[jsonapi](http://jsonapi.org)规范，否则是不能完成数据交互的。要求高了相应的你的处理代码也相应的要复杂。下面我们改用`JSONAPIAdapter`处理。

```js
// app/adapters/application.js

import JSONAPIAdapter from 'ember-data/adapters/json-api';
import DS from 'ember-data';

// export default DS.RESTAdapter.extend({
export default JSONAPIAdapter.extend({
  namespace: 'api/v1',
  host: 'http://localhost:4200'
});
```

修改适配器为`JSONAPIAdapter`。如果你不修改后端的服务那么控制台可以看到报错信息。

![JSONAPIAdapter报错信息](http://blog.ddlisting.com/content/images/2016/07/16072603.png)

从截图当中可以清楚地看到报错出来的错误，`must return a valid JSON API document`必须是一个有效jsonapi文档。要修复好这个错误也很简单，只需要滚吧后端服务返回的数据格式改成jsonapi的就行了。请看下面的代码：

```js
// 处理请求 http://localhost:4200/user
  app.get('/api/v1/users', function(req, res) {
    // 返回三个对象
    // res.status(200).send({
    //     users: [
    //       {
    //         id: 1,
    //         username: 'ubuntuvim',
    //         email: '123@qq.com'
    //       },
    //       {
    //         id: 2,
    //         username: 'ddlisting.com',
    //         email: '3333@qq.com'
    //       },
    //       {
    //         id: 3,
    //         username: 'www.ddlising.com',
    //         email: '1527254027@qq.com'
    //       }
    //     ]
    // });
  
    // 构建jsonapi对象
    var input = {
        data: [
            {
                id: '1',
                type: 'user',  //对应前端程序中模型的名字
                attributes: {   // 模型中的属性键值对
                    username: 'ubuntuvim', property: true,
                    email: '123@qq.com', property: true
                }
            },
            {
                id: '2',
                type: 'user',  //对应前端程序中模型的名字
                attributes: {   // 模型中的属性键值对
                    username: 'ddlisting.com', property: true,
                    email: '3333@qq.com', property: true
                }
            },
            {
                id: '3',
                type: 'user',  //对应前端程序中模型的名字
                attributes: {   // 模型中的属性键值对
                    username: 'www.ddlising.com', property: true,
                    email: '1527254027@qq.com', property: true
                }
            }
        ]
    };

    res.status(200).send(JSON.stringify(input));
  });
```

注：为了构建jsonapi对象更加简便另外在安装一个插件： `npm install jsonapi-parse`。安装完毕后手动关闭再重启项目。然后再次进入路由`users`可以看到与前面的结果一样，正确了显示后端返回的数据。

到此，我相信读者应该能明白这两个适配器之间的差别了！**需要注意的是Ember.js`2.0`版本之后`JSONAPIAdapter`作为默认的适配器，也就是说平常如果你没有自定义任何适配器那么Ember Data会默认使用的是`JSONAPIAdapter`适配器。所以如果你没有使用其他的适配器那么你的后端返回的数据格式必须是遵循jsonapi规范的。另外在路由`users.js`中使用到Ember Data提供的方法`findAll('modelName')`，我想从中你也应该明白了Ember Data是何等重要了吧**

看到这里不知道读者是否已经明白适配器和后端服务的关联关系？如果有疑问请给我留言。
文中所说的后端就是我的node程序（放在`server`目录下），前端就是我的Ember.js项目。

下面就是再结合数据库。

## 加入数据库

其实到这步加不加数据库已经不那么重要了！重要把服务端返回的数据改成从数据库读取就完了。我就简单讲解了。

### 连接MySQL

连接MySQL的工作交给前面已经安装好的`node-mysql`，如果还没安装请执行命令`npm install mysqljs/mysql`进行安装。继续修改后端服务代码`server/index.js`。

```js

module.exports = function(app) {
  // 与之前的内容不变 
  // 
  // 引入MySQL模块
  var mysql = require('mysql');
  // 获取连接对象
  var conn = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      // 开启debug，可以在启动ember项目的终端看到更多详细的信息
      database: 'test'
  });

  // 处理请求 http://localhost:4200/user
  app.get('/api/v1/users', function(req, res) {

    var jsonArr = new Array();

    // 打开数据库连接
    conn.connect();
    //查询数据
    conn.query('select * from user', function(err, rows, fields) {
        if (err) throw err;

        //遍历返回的数据并设置到返回的json对象中
        for (var i = 0; i < rows.length; i++) {
            
            jsonArr.push({
                id: rows[i].id,
                username: rows[i].username,
                email: rows[i].email
            });
        }

        // 返回前端
        res.status(200).send({
            users: jsonArr
        });

    });
    // 关闭数据库连接
    conn.end();
  });

};
```

相比之前的代码只是引入了mysql，增加连接对象声明，然后在请求处理方法里查询数据，默认在数据库初始化了3条数据，如下截图，另外 **为了简单起见我仍然使用的是`RESTAdapter`适配器，这样处理也相对简单。** 获取连接对象的代码应该不用过多解释了，就是填写你本地连接数据库的对应配置信息就行了。

![数据库数据](http://blog.ddlisting.com/content/images/2016/07/16072604.png)


记得修改适配器为`RESTAdapter`。

重启项目。进入路由`users`可以看到数据库的数据正确显示出来了。

![显示数据库数据](http://blog.ddlisting.com/content/images/2016/07/16072705.png)

## CRUD操作

对于CRUD操作都举一个例子，由于前面已经介绍过`findAll`查询就不在此介绍CRUD中的R了。下面就对另外三个做一个例子：
更多有关数据的操作请看[Ember.js 入门指南——新建、更新、删除记录](http://blog.ddlisting.com/2016/04/16/xin-jian-geng-xin-shan-chu-ji-lu/)。

为了方便演示再增加几个路由和模板。

```bash
ember g template users/index
ember g route users/new
ember g route users/edit
```

上述3个命令创建了三个`users`的子路由和子模板。


### 新增、更新

由于项目使用的是Ember Data，增加数据也是很简单的，直接调用`createRecord()`创建一个`record`之后再调用`save()`方法保存到服务器。
另外新增和更新的处理方式相似，就直接写在一个方法内。

#### Ember前端处理代码

##### component:user-form.js

```js
// app/components/user-form.js
// 新增，修改user
import Ember from 'ember';

export default Ember.Component.extend({
  tipInfo: null,

  actions: {
    saveOrUpdate(id, user) {
      if (id) {  //更新
        let username = this.get('model.username');
        let email = this.get('model.email');
        if (username && email) {
          this.store.findRecord('user', id).then((u) => {
            
            u.set('username', username);
            u.set('email', email);

            u.save().then(() => {
              this.set('tipInfo', "更新成功");
              // this.set('model.username', '');
              // this.set('model.email', '');
            }); 
          });
        } else {
          this.set('tipInfo', "请输入username和email！");
        }

      } else {  //新增

        let username = this.get('model.username');
        let email = this.get('model.email');
        if (username && email) {
          this.get('store').createRecord('user', {
            username: username,
            email: email
          }).save().then(() => {
            this.set('tipInfo', "保存成功");
            this.set('model.username', '');
            this.set('model.email', '');
          }, (err) => {
            this.set('tipInfo', "保存失败"+err);
          }); 
        } else {
          this.set('tipInfo', "请输入username和email！");
        }
    
      }
    }
  }
});
```

新增和修改处理是相似的，根据`id`是否为空判断是否是新增还是更新。

#### hbs:user-form.hbs

```html
{{! 新增、修改都用到的表单，提出为公共部分}}
<div class="container">
  <h1>{{title}}</h1>

  <div class="row bg-info" style="padding: 10px 20px 0 0;">
    <p class="pull-right" style="margin-right: 20px;">
      {{#link-to 'users' class="btn btn-primary"}}返回{{/link-to}}
    </p>
  </div>

  
  <!-- <form {{action 'add' on='submit'}}> -->
  <form>
    <div class="form-group">
      <label for="exampleInputPassword1">username</label>
      {{input type="text" class="form-control" id="usernameId" name='username' placeholder="username" value=model.username}}
    </div>

    <div class="form-group">
      <label for="exampleInputEmail1">Email address</label>
      {{input type="text" class="form-control" id="exampleInputEmail1" placeholder="Email" value=model.email}}
    </div>
    <button type="submit" class="btn btn-primary" {{action 'saveOrUpdate' model.id model}}>保存</button>
  </form>

  {{#if tipInfo}}
    <div class="alert alert-success alert-dismissible" role="alert">
      <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
      {{tipInfo}}
    </div>
  {{/if}}

</div>
```

##### route:edit.js

```js
// app/routes/users/edit.js
import Ember from 'ember';

export default Ember.Route.extend({
  // 根据id获取某个记录
  model(params) {
    return this.store.findRecord('user', params.user_id);
  }
});
```

点击“编辑”的时候需要根据被点击记录的`id`查询数据详情，并返回到编辑页面。

##### new.hbs

```html
{{! 增加数据的表单}}
{{user-form title='新增user' store=store model=model}}
```

##### edit.hbs

```html
{{! 修改数据的表单}}
{{user-form title='修改user' store=store model=model}}
```

提取新增和修改这两个模板的相同代码为一个组件，两个模板都调用组件。


#### 后端处理代码

与前端对应的要有相应的后端处理服务，增加2个路由监听，一个是监听`post`提交（新增），一个是`put`提交（更新）。

```js
// 处理请求 POST http://localhost:4200/users
  app.post('/api/v1/users', function(req, res) {
    
    var username = req.body.user.username;
    console.log("req.body.user.username = " + username);
    var email = req.body.user.email;
    console.log("req.body.user.email = " + email);

    // 打开数据库连接
    pool.getConnection(function(err, conn) {  
      var queryParams = { username: username, email: email };  
      var query = conn.query('insert into user SET ?', queryParams, function(err, result) {  
          if (err) throw err;
          
          console.log('result = ' + result);
          // 返回前端
          if (result) {
            res.status(200).send({
                users: {
                  id: result.insertId,
                  username: username,
                  email: email
                }
            });
          } else {  //没有数据返回一个空的
            // 返回前端
            res.status(200).send({
                users: {
                  id: '',
                  username: '',
                  email: ''
                }
            });
          } 
          
      });
      console.log('sql: ' + query.sql);
      conn.release();  //释放连接，放回到连接池
    });
  });
    


    // 处理请求 POST http://localhost:4200/users/id  根据id更新某个数据
  app.put('/api/v1/users/:id', function(req, res) {

    console.log('更新 POST /api/v1/users/:id');
    console.log('req.params.id = ' + req.params.id);
    console.log('req.body.user.username = ' + req.body.user.username);
    var jsonArr = new Array();
    // 打开数据库连接
    pool.getConnection(function(err, conn) {  
      // 参数的次序要与SQL语句的参数次序一致
      var queryParams = [ req.body.user.username, req.body.user.email, req.params.id ];
      
      var query = conn.query('UPDATE user SET username = ?, email = ? where id = ?', queryParams, function(err, results, fields) {  
          if (err) {
            console.log('更新出错：'+err);
            throw err;
          } 

        //遍历返回的数据并设置到返回的json对象中，通常情况下只有一个数据，直接取第一个数据返回
        if (results && results.length > 0) {
          jsonArr.push({
              id: results[0].id,
              username: results[0].username,
              email: results[0].email
          });

          // 返回前端
          res.status(200).send({
              users: jsonArr
          });
        }
        //  else {  //没有数据返回一个空的
        //   // 返回前端
        //   res.status(200).send({
        //       users: {
        //         id: '',
        //         username: '',
        //         email: ''
        //       }
        //   });
        // } 
        console.log('SQL: ' + query.sql);

      });
      conn.release();  //释放连接，放回到连接池
    });
  });
```

为何新增对应的是`post`方法，更新对应的是`put`方法，请看[the rest adapter](https://guides.emberjs.com/v1.13.0/models/the-rest-adapter/)的详细介绍（主要是第一个表格的内容）。

### 简单测试

点击右上角的新增按钮进入新增界面。

![新增按钮](http://blog.ddlisting.com/content/images/2016/08/16080301.png)

进入新增界面后输入相应信息（我就不做数据的格式校验了，有需要自己校验数据格式）。然后点击“保存”，保存成功会有提示信息。

![](http://blog.ddlisting.com/content/images/2016/08/16080302.png)

![保存成功提示信息](http://blog.ddlisting.com/content/images/2016/08/16080304.png)

点击右上角的“返回”回到主列表页面，查看新增的数据是否保存成功。

![主列表数据](http://blog.ddlisting.com/content/images/2016/08/16080305.png)

可以看到刚刚新增的数据已经显示在列表上，为了进一步验证数据已经保存成功，直接查看数据库。

![数据库数据](http://blog.ddlisting.com/content/images/2016/08/16080306.png)

可以看到数据库也已经成功保存了刚刚新增的数据。

修改的测试方式我就不啰嗦了，点击列表上的修改按钮进入修改页面，修改后保存既可以，请自行测试。

### 删除

删除处理相比新增更加简单，直接发送一个`delete`请求即可。

#### Ember前端处理

```js
// app/routes/user.js
import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return this.store.findAll('user');
  },
  actions: {
    // 删除记录
    del(id) {
      console.log('删除记录：' + id);
      this.get('store').findRecord('user', id).then((u) => {
          u.destroyRecord(); // => DELETE to /users/2
      });
    }
  }
});
```

```html
<!-- app/templates/index.hbs -->

<h1>用户列表</h1>

<div class="row bg-info" style="padding: 10px 20px 0 0;">
  <p class="pull-right" style="margin-right: 20px;">
    {{#link-to 'users.new' class="btn btn-primary"}}新增{{/link-to}}
  </p>
</div>


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
      <th>
      操作
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
        {{user.email}}
      </td>
      <td>
      {{#link-to 'users.edit' user.id}}修改{{/link-to}} | 
      <span {{action 'del' user.id}} style="cursor: pointer; color: #337ab7;">删除</span>
      </td>
    </tr>
    {{/each}}
  </tbody>

</table>
```

这段代码的与前面的代码基本一致，就是增加了删除。

#### 后端处理

在后端增加一个监听删除的路由。

```js
// 处理请求 DELETE http://localhost:4200/users/id 删除记录
  app.delete('/api/v1/users/:id', function(req, res) {

    var jsonArr = new Array();
    var id = req.params.id;
    console.log("删除 req.params.id = " + id);

    // 打开数据库连接
    pool.getConnection(function(err, conn) {  
      var queryParams = [ id ];  
      var query = conn.query('delete from user where id = ?', queryParams, function(err, result) {  
          if (err) throw err;

          // 返回前端
          res.status(200).send({});
      });

      console.log('sql: ' + query.sql);
      conn.release();  //释放连接，放回到连接池
    });
  });
```

#### 测试删除

测试删除很简单，直接在列表上点击“删除”按钮即可删除一条记录。界面和数据库的截图我就不贴出来了，自己动手测试就知道了！！

**数据可以正确删除，但是，删除之后控制台会报如下错误：**

![删除报错](http://blog.ddlisting.com/content/images/2016/08/16080307.png)

找了官网文档[the rest adapter delete record](https://guides.emberjs.com/v1.13.0/models/the-rest-adapter/#toc_json-root)按照官网的文档处理仍然报错！目前还没找到好的处理方法，不知道是哪里出了问题，如果读者知道请告诉我，谢谢。

到此CRUD操作也完成了，不足的就是在处理删除的时候还是有点问题，目前还没找到觉得办法！但是总的来说对于CRUD的操作都是这么处理的，调用的方法也都是上述代码所使用的方法。

**未完待续……还差分页没完成。**


## 总结

文章写到这里已经把我所想的内容介绍完毕了，不知道读者是否看明白了。其中主要理解的知识点是：

1. Ember Data和adapter、record、model的关系
2. 如何自定义适配器
3. 如何根据Ember前端请求编写后端处理
4. CRUD操作
5. 分页处理（目前还没整合进来）

明白了上述几点，本文的目的也达到了！如何有疑问欢迎给我留言，也期待着读者能给我解答删除报错的问题！


## 文章源码

如果有需要欢迎star或者fork学习。下面是源码地址：

[https://github.com/ubuntuvim/emberData-adapter-database](https://github.com/ubuntuvim/emberData-adapter-database)，欢迎follow我，一起学习交流！我在全球最大的[同性交友网站](https://github.com)等你哦！！

## 参考网址

* [ember.js](http://emberjs.com/)
* [ember-cli](http://ember-cli.com/)

**爱心奉献**

写作不易，欢迎提贡献：点击网站右上角“为博主充电”，为博主打打气吧！！你们的支持是我写作最大的动力！！！
O(∩_∩)O哈哈~_)


