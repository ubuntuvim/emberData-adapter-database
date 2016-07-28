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
  const serialise = require('object-tojson')
  // POST请求参数解析
  var bodyParser = require('body-parser');
  app.use( bodyParser.json() );       // to support JSON-encoded bodies
  app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  }));

  // Enable CORS. Note: if you copy this code into production, you may want to
  // disable this. See https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
  app.use(function(req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Method', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Header', 'X-Requested-With, Content-Type');
    next();
  })

  // 跨域请求问题，否则post请求会转为OPTIONS请求，不能保存数据
  var cors = require('cors');
  app.use(cors());


  mocks.forEach(function(route) { route(app); });
  proxies.forEach(function(route) { route(app); });


  // 引入MySQL模块
  var mysql = require('mysql');
  // 获取连接对象
  // var conn = mysql.createConnection({
  //     host: 'localhost',
  //     user: 'root',
  //     password: '',
  //     // 开启debug，可以在启动ember项目的终端看到更多详细的信息
  //     debug: true,
  //     database: 'test'
  // });
  //  使用连接池
  var pool = mysql.createPool({  
      host: '127.0.0.1',
      user: 'root',
      password: '',
      // debug: true,
      database: 'test'
  });

  // 处理请求 GET http://localhost:4200/users
  app.get('/api/v1/users', function(req, res) {

    var jsonArr = new Array();

    // 打开数据库连接
    pool.getConnection(function(err, conn) {  
      conn.query('select * from user', function(err, rows) {
          if (err) {
            console.log(err);
            throw err;
        } 

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
      conn.release();  //释放连接，放回到连接池
    });
  });

  // 处理请求 GET http://localhost:4200/users/id  根据id查询某个数据
  app.get('/api/v1/users/:id', function(req, res) {

    var jsonArr = new Array();
    console.log('req.params.id = ' + req.params.id);
    // 打开数据库连接
    pool.getConnection(function(err, conn) {  
      // var queryParams = [ req.params.id ];
      
      var query = conn.query('select * from user where id = ?', [ req.params.id ], function(err, results, fields) {  
          if (err) {
            console.log(err);
            throw err;
        } 

        //遍历返回的数据并设置到返回的json对象中，通常情况下只有一个数据，直接取第一个数据返回
        if (results && results.length > 0) {
          jsonArr.push({
              id: results[0].id,
              username: results[0].username,
              email: results[0].email
          });
        }
          
        // 返回前端
        res.status(200).send({
            users: jsonArr
        });

      });
      console.log('sql: ' + query.sql);  //
      conn.release();  //释放连接，放回到连接池
    });
  });

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
        }
        console.log('SQL: ' + query.sql);
        // 返回前端
        res.status(200).send({
            users: jsonArr
        });

      });
      conn.release();  //释放连接，放回到连接池
    });
  });

  // 处理请求 DELETE http://localhost:4200/users/id 删除记录
  app.delete('/api/v1/users/:id', function(req, res) {

    var jsonArr = new Array();
    var id = req.params.id;
    console.log("删除 req.params.id = " + id);

    // 打开数据库连接
    pool.getConnection(function(err, conn) {  
      var queryParams = [ id ];  
      var query = conn.query('select * from user where id = ?', queryParams, function(err, results, fields) {  
          if (err) {
            console.log(err);
            throw err;
        } 

        //遍历返回的数据并设置到返回的json对象中，通常情况下只有一个数据，直接取第一个数据返回
        if (results && results.length > 0) {
          jsonArr.push({
              id: results[0].id,
              username: results[0].username,
              email: results[0].email
          });
        }

      });

      query = conn.query('delete from user where id = ?', queryParams, function(err, result) {  
          if (err) throw err;
      });
      console.log('jsonArr == ' + jsonArr);
      // 删除的数据返回前端
      res.status(200).send({
          users: jsonArr
      });

      console.log('sql: ' + query.sql);
      conn.release();  //释放连接，放回到连接池
    });
  });

    // // 返回三个对象
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
  
    // // 构建jsonapi对象
    // var input = {
    //     data: [
    //         {
    //             id: '1',
    //             type: 'user',  //对应前端程序中模型的名字
    //             attributes: {   // 模型中的属性键值对
    //                 username: 'ubuntuvim', property: true,
    //                 email: '123@qq.com', property: true
    //             }
    //         },
    //         {
    //             id: '2',
    //             type: 'user',  //对应前端程序中模型的名字
    //             attributes: {   // 模型中的属性键值对
    //                 username: 'ddlisting.com', property: true,
    //                 email: '3333@qq.com', property: true
    //             }
    //         },
    //         {
    //             id: '3',
    //             type: 'user',  //对应前端程序中模型的名字
    //             attributes: {   // 模型中的属性键值对
    //                 username: 'www.ddlising.com', property: true,
    //                 email: '1527254027@qq.com', property: true
    //             }
    //         }
    //     ]
    // };

    // res.status(200).send(JSON.stringify(input));
  // });


};
