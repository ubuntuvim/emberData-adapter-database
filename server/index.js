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
  const bodyParser = require('body-parser');

  mocks.forEach(function(route) { route(app); });
  proxies.forEach(function(route) { route(app); });

  app.use(bodyParser.urlencoded({ extended: true }));

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
  });


};
