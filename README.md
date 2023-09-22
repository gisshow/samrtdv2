工务署辅助决策系统

# 安装

```sh
yarn --registry=https://registry.npm.taobao.org
```

# 运行

```sh
yarn start
```

# 打包

```sh
yarn build
```

# 在工务署现场布署

## 更新

1. 解压打包的压缩文件：visualization.zip
2. 替换 d:\dist\visualization 文件夹

## nginx 关键配置

目前（2022-07-19 10:02:22）是将 nginx 设置成 Windows 服务，在修改 nginx 配置之后再重启 nginx 配置。

```conf
# 主程序
location /visualization {
    root d:/dist;
}
# 登录接口
location /gongwushu {
    proxy_pass http://192.168.10.41:8081;
}
# 后端接口
location /gws {
    proxy_pass http://192.168.10.41:8081;
}
# 规自局服务
location /gw {
    proxy_pass http://10.253.102.69;
}
# 本地模型数据
location /data {
    root d:/dist;
}
```

# 开发环境配置示例

## 前海高配机开发环境

2022-10-12 09:18:30

Umi 启动开发环境后，Chrome 里的部分请求（后端接口）被 Gooreplacer 拦截并都转发到 Nginx，Nginx 处理相应请求并给予响应：

1. Chrome 浏览器
   - 开发时测试：http://localhost:8000/visualization
   - 打包后测试：http://localhost:18080/visualization
2. Chrome 浏览器扩展 Gooreplacer
3. Nginx
   1. 本地文件
      1. 模型代理服务器
   2. 后端 API 服务器
      - umi 提供的 Mock 模拟 API 服务器
      - 局域网内的后端 API 服务器

### Gooreplacer 配置

```json
{
  "createBy": "http://liujiacai.net/gooreplacer/",
  "version": "3.13.0",
  "createAt": "2022/10/9 10:38:25",
  "redirect-rules": [
    {
      "src": "http://10.253.102.69/gw/*",
      "kind": "wildcard",
      "dst": "http://localhost:18080/services/10.253.102.69/gw/",
      "enable": true
    },
    {
      "src": "http://localhost:8000/data/*",
      "kind": "wildcard",
      "dst": "http://localhost:18080/data/",
      "enable": true
    },
    {
      "src": "http://localhost:8000/gws/*",
      "kind": "wildcard",
      "dst": "http://localhost:18080/gws/",
      "enable": true
    },
    {
      "src": "http://localhost:8000/gongwushu/*",
      "kind": "wildcard",
      "dst": "http://localhost:18080/gongwushu/",
      "enable": true
    },
    {
      "src": "http://192.168.10.41:8080/gw/*",
      "kind": "wildcard",
      "dst": "http://localhost:18080/services/10.253.102.69/gw/",
      "enable": true
    }
  ],
  "cancel-rules": [],
  "request-headers": [],
  "response-headers": []
}
```

### Nginx 配置

```conf
worker_processes 1;
events {
    worker_connections 1024;
}
http {
    include mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;
    server {
        listen 18080;
        server_name localhost;
        error_page 500 502 503 504 /50x.html;
        #
        # 后端API服务器
        #
        set $api_server_jobsimi http://127.0.0.1:8000;
        set $api_server_zhaochao http://192.168.222.66:8081;
        set $api_server $api_server_jobsimi;
        #
        # 跨域CORS配置
        #
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' '*';
        #是否允许cookie传输
        add_header 'Access-Control-Allow-Credentials' 'true';
        add_header 'Access-Control-Allow-Headers' '*';
        #针对浏览器的options预请求直接返回200，否则会被403 forbidden--invalie CORS request
        if ( $request_method = 'OPTIONS' ) {
            return 200;
        }
        #
        # 匹配不同的url请求并响应
        #
        location / {
            root html;
            index index.html index.htm;
        }
        location /data {
            root D:/tuihuiinfo/gws/gws-visualization-front/dist/visualization;
        }
        location /gws {
            proxy_pass $api_server;
        }
        location /gongwushu {
            proxy_pass $api_server;
        }
        location /visualization {
            root c:/Users/jobsimi/Downloads/gws-visualization-front/dist;
            # 旧版本
            # root "c:/Users/jobsimi/Downloads/gws-visualization-front/dist/visualization-v0.0.4-支持.json格式的红线格式、添加模型处使用下拉框、添加模型时也能支持添加服务地址式、模型压平的高度不正确/";
        }
        location /services {
            root D:/tuihuiinfo/jobsimi/2022-06-13-10-35-工务署辅助决策系统/成果/模型代理服务器;
        }
        location /gusu_img_dem {
            root D:/tuihuiinfo/jobsimi/bigModels;
        }
        location = /50x.html {
            root html;
        }
    }
}
```


git add .
git commit -m 'add'
git push
git subtree push --prefix=build origin gh-pages







