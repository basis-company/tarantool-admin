<?php

namespace Job\Database;

use Exception;
use Tarantool\Client\Client;
use Tarantool\Client\Middleware\AuthenticationMiddleware;
use Tarantool\Mapper\Mapper;

abstract class Job
{
    public ?string $socket = null;
    public ?string $hostname = null;
    public string|int|null $port = null;
    public ?string $username = null;
    public ?string $password = null;

    private Client $client;
    private Mapper $mapper;

    public function getClient(): Client
    {
        if (!isset($this->client)) {
            if (!$this->hostname || !$this->port) {
                if (!$this->socket) {
                    throw new Exception('Invalid connection parameters');
                }
            }

            $dsn = $this->socket ?: 'tcp://'.$this->hostname.':'.$this->port;
            $this->client = Client::fromDsn($dsn)->withMiddleware(
                new AuthenticationMiddleware($this->username ?: 'guest', $this->password),
            );
        }

        return $this->client;
    }

    public function getMapper(): Mapper
    {
        if (!isset($this->mapper)) {
            $this->mapper = new Mapper($this->getClient());
        }

        return $this->mapper;
    }
}
