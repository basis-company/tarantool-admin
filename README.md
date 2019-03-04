# Tarantool admin
This application can be used to manage schema and data in tarantool database using web gui.  
Feel free to contribute any way.

## Running existing build [![Docker Repository on Quay](https://quay.io/repository/basis-company/tarantool-admin/status "Docker Repository on Quay")](https://quay.io/repository/basis-company/tarantool-admin)
Run `docker run -p 8000:80 quay.io/basis-company/tarantool-admin`
Open [http://localhost:8000](http://localhost:8000) in your browser.

## Configure using env
Application can be configured via environment:
* TARANTOOL_CONNECT_TIMEOUT - connect timeout
* TARANTOOL_SOCKET_TIMEOUT - connection read/write timeout
* TARANTOOL_TCP_NODELAY - disable Nagle TCP algorithm
* TARANTOOL_CONNECTIONS - comma-separated connection strings
* TARANTOOL_CONNECTIONS_READONLY - disable connections editor
* TARANTOOL_DATABASE_QUERY - enable Query database tab

## You can build and run docker image yourself.
* Clone repository: `git clone https://github.com/basis-company/tarantool-admin.git`
* Change current directory: `cd tarantool-admin`
* Build and run `docker-compose up`
* Open [http://localhost:8000](http://localhost:8000) in your browser.
* If you need database, add tarantool instance to docker-compose file.

## Youtube demo
Short demo of ui is available on youtube:

<a href="https://www.youtube.com/watch?v=ApPbFvcozPE" target="_blank"><img src="http://img.youtube.com/vi/ApPbFvcozPE/0.jpg" alt="Short demo" width="240" height="180" border="10" /></a>
