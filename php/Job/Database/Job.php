<?php

namespace Job\Database;

use Exception;
use Tarantool\Client\Client;
use Tarantool\Client\Middleware\AuthenticationMiddleware;
use Tarantool\Mapper\Mapper;

abstract class Job
{
    public $socket;

    public $hostname;
    public $port;
    public $username;
    public $password;

    private $_client;
    private $_mapper;

    public function getClient()
    {
        if (!$this->_client) {
            if (!$this->hostname || !$this->port) {
                if (!$this->socket) {
                    throw new Exception("Invalid params");
                }
            }

            $dsn = $this->socket ?: 'tcp://'.$this->hostname.':'.$this->port;
            $this->_client = Client::fromDsn($dsn)->withMiddleware(
                new AuthenticationMiddleware($this->username ?: 'guest', $this->password),
            );
        }

        return $this->_client;
    }

    public function getMapper()
    {
        if (!$this->_mapper) {
            $this->_mapper = new Mapper($this->getClient());
        }

        return $this->_mapper;
    }
}
