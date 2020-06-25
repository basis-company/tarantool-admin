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

    private $client;
    private $mapper;

    public function getClient()
    {
        if (!$this->client) {
            if (!$this->hostname || !$this->port) {
                if (!$this->socket) {
                    throw new Exception("Invalid params");
                }
            }

            $dsn = $this->socket ?: 'tcp://'.$this->hostname.':'.$this->port;
            $this->client = Client::fromDsn($dsn)->withMiddleware(
                new AuthenticationMiddleware($this->username ?: 'guest', $this->password),
            );
        }

        return $this->client;
    }

    public function getMapper()
    {
        if (!$this->mapper) {
            $this->mapper = new Mapper($this->getClient());
        }

        return $this->mapper;
    }
}
